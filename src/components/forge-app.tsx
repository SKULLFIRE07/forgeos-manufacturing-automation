"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Bell,
  Building2,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  CircleGauge,
  ClipboardList,
  Command,
  FileText,
  FolderKanban,
  HardHat,
  LayoutDashboard,
  Menu,
  PanelLeft,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
  Wifi,
  WifiOff,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";

import {
  activity,
  assets,
  documents,
  employees,
  kpis,
  projects,
  qualityRecords,
  safetyRecords,
  suppliers,
  workItems as seedWorkItems,
} from "@/lib/seed";
import type {
  CreateWorkInput,
  ModuleId,
  NavigationItem,
  ToastMessage,
  UserRole,
  WorkItem,
  WorkState,
} from "@/lib/types";
import { CommandCenter } from "@/components/command-center";
import {
  Button,
  Dialog,
  Drawer,
  Field,
  IconButton,
  Skeleton,
  ToastRegion,
} from "@/components/ui";
import {
  DocumentsView,
  KpisView,
  MaintenanceView,
  ProjectsView,
  QualityView,
  SafetyView,
  SettingsView,
  SuppliersView,
  WorkforceView,
  type CreateActionContext,
} from "@/components/views/secondary-views";
import { WorkView } from "@/components/work-view";
import {
  CreateWorkDialog,
  RecordDrawer,
  WorkDetailDrawer,
} from "@/components/work-dialogs";

const STORAGE_KEY = "forgeos-work-v1";

const navigation: Array<NavigationItem & { icon: LucideIcon; group: string }> = [
  { id: "command", label: "Command Center", icon: LayoutDashboard, group: "Execution", badge: 14 },
  { id: "work", label: "Work", icon: ClipboardList, group: "Execution" },
  { id: "projects", label: "Projects", icon: FolderKanban, group: "Execution" },
  { id: "quality", label: "Quality", icon: ShieldCheck, group: "Assurance", badge: 22 },
  { id: "maintenance", label: "Maintenance", icon: Wrench, group: "Assurance" },
  { id: "safety", label: "Safety", icon: HardHat, group: "Assurance" },
  { id: "workforce", label: "Workforce", icon: Users, group: "Intelligence", badge: 9 },
  { id: "kpis", label: "KPIs", icon: ChartNoAxesCombined, group: "Intelligence", badge: 5 },
  { id: "documents", label: "Documents", icon: FileText, group: "Intelligence" },
  { id: "suppliers", label: "Suppliers", icon: Truck, group: "Intelligence" },
  { id: "settings", label: "Settings", icon: Settings, group: "System" },
];

const roleAccess: Record<UserRole, ModuleId[]> = {
  Operator: ["command", "work", "safety", "documents"],
  Supervisor: ["command", "work", "projects", "quality", "maintenance", "safety", "workforce", "documents"],
  HOD: ["command", "work", "projects", "quality", "maintenance", "safety", "workforce", "kpis", "documents", "suppliers"],
  Executive: ["command", "work", "projects", "quality", "safety", "workforce", "kpis", "suppliers"],
  Admin: navigation.map((item) => item.id),
};

const rolePeople: Record<UserRole, string> = {
  Operator: "Arjun Kulkarni",
  Supervisor: "Arjun Patil",
  HOD: "Farhan Patil",
  Executive: "Ganesh Badgujar",
  Admin: "System Admin",
};

const pageMeta: Record<ModuleId, { title: string; description: string }> = {
  command: { title: "Command Center", description: "Exceptions, ownership, and decisions across the factory" },
  work: { title: "Work", description: "Plan, execute, verify, and close accountable work" },
  projects: { title: "Projects", description: "Delivery risk, milestones, kit readiness, and action closure" },
  quality: { title: "Quality", description: "Findings, holds, CAPA, evidence, and verified closure" },
  maintenance: { title: "Maintenance", description: "Asset availability, service, breakdowns, and calibration" },
  safety: { title: "Safety", description: "Incidents, near misses, permits, and unsafe conditions" },
  workforce: { title: "Workforce", description: "Availability, reporting lines, skills, and shift coverage" },
  kpis: { title: "KPIs", description: "Trusted actuals, targets, actions, and scorecard governance" },
  documents: { title: "Documents", description: "Controlled revisions, access, and acknowledgement" },
  suppliers: { title: "Suppliers", description: "Commitments, delivery, quality, and issue ownership" },
  settings: { title: "Settings", description: "Roles, workflow rules, integrations, and governance" },
};

interface SearchResult {
  id: string;
  title: string;
  detail: string;
  module: ModuleId;
  work?: WorkItem;
}

function ForgeMark() {
  return (
    <span className="forge-mark" aria-hidden="true">
      <i /><i /><i /><i />
    </span>
  );
}

function LoadingShell() {
  return (
    <div className="loading-shell" role="status" aria-label="Preparing the operations workspace">
      <aside><ForgeMark /><Skeleton shape="block" height="2rem" width="7rem" /><Skeleton lines={9} height="2.75rem" /></aside>
      <main>
        <header><Skeleton shape="block" height="2.5rem" width="18rem" /><Skeleton shape="block" height="2.75rem" width="22rem" /></header>
        <div className="loading-content"><Skeleton shape="block" height="8rem" /><Skeleton shape="block" height="30rem" /><Skeleton shape="block" height="16rem" /></div>
      </main>
      <span className="ui-sr-only">Preparing operational data and role access</span>
    </div>
  );
}

interface SidebarNavigationProps {
  active: ModuleId;
  role: UserRole;
  items: WorkItem[];
  onNavigate: (id: ModuleId) => void;
}

function SidebarNavigation({ active, role, items, onNavigate }: SidebarNavigationProps) {
  const allowed = roleAccess[role];
  const groups = ["Execution", "Assurance", "Intelligence", "System"];
  return (
    <nav className="sidebar-nav" aria-label="Primary navigation">
      {groups.map((group) => {
        const groupItems = navigation.filter((item) => item.group === group && allowed.includes(item.id));
        if (!groupItems.length) return null;
        return (
          <div className="nav-group" key={group}>
            <p>{group}</p>
            {groupItems.map(({ id, label, icon: Icon, badge }) => {
              const resolvedBadge = id === "work" ? items.filter((item) => item.state !== "Closed").length : badge;
              return (
                <button key={id} className="nav-item" data-active={active === id || undefined} aria-current={active === id ? "page" : undefined} onClick={() => onNavigate(id)}>
                  <Icon aria-hidden="true" />
                  <span>{label}</span>
                  {resolvedBadge ? <b>{resolvedBadge}</b> : null}
                </button>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}

export function ForgeApp() {
  const [activeModule, setActiveModule] = useState<ModuleId>("command");
  const [role, setRole] = useState<UserRole>("Supervisor");
  const [unit, setUnit] = useState<"Unit 1" | "Unit 2">("Unit 2");
  const [shift, setShift] = useState<"Day" | "Night">("Day");
  const [items, setItems] = useState<WorkItem[]>(seedWorkItems);
  const [selectedWork, setSelectedWork] = useState<WorkItem | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [online, setOnline] = useState(true);
  const [booting, setBooting] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const hydrated = useRef(false);
  const toastId = useRef(1);
  const notificationTriggerRef = useRef<HTMLButtonElement>(null);
  const notificationPanelRef = useRef<HTMLElement>(null);

  const currentPerson = rolePeople[role];
  const meta = pageMeta[activeModule];

  useEffect(() => {
    const timer = window.setTimeout(() => setBooting(false), 450);
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setItems(JSON.parse(saved) as WorkItem[]);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    hydrated.current = true;
    setOnline(window.navigator.onLine);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      pushToast("Back online", "Queued shop floor updates are ready to sync.");
    };
    const handleOffline = () => setOnline(false);
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") setNotificationsOpen(false);
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!roleAccess[role].includes(activeModule)) setActiveModule("command");
  }, [activeModule, role]);

  useEffect(() => {
    if (!notificationsOpen) return;
    const trigger = notificationTriggerRef.current;
    const panel = notificationPanelRef.current;
    panel?.querySelector<HTMLButtonElement>("button")?.focus();

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!panel?.contains(target) && !trigger?.contains(target)) setNotificationsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      trigger?.focus({ preventScroll: true });
    };
  }, [notificationsOpen]);

  function pushToast(title: string, message: string, actionLabel?: string) {
    setToasts((current) => [...current, { id: toastId.current++, title, message, actionLabel }]);
  }

  function navigate(module: ModuleId) {
    if (!roleAccess[role].includes(module)) {
      pushToast("Access is role based", `${role} access does not include ${pageMeta[module].title}.`);
      return;
    }
    setActiveModule(module);
    setMobileMenuOpen(false);
    setNotificationsOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.getElementById("main-content")?.focus({ preventScroll: true });
  }

  function createWork(input: CreateWorkInput) {
    const employee = employees.find((person) => person.name === input.owner);
    const nextNumber = Math.max(...items.map((item) => Number(item.id.replace("WK-", "")) || 0)) + 1;
    const item: WorkItem = {
      id: `WK-${String(nextNumber).padStart(3, "0")}`,
      title: input.title,
      type: input.type,
      priority: input.priority,
      state: "Not started",
      owner: input.owner,
      ownerRole: employee?.role ?? "Assigned owner",
      supervisor: employee?.supervisor ?? "Farhan Patil",
      station: input.station,
      unit,
      shift,
      due: new Date(input.due).toISOString(),
      project: input.project || undefined,
      evidenceCount: 0,
      checklistDone: 0,
      checklistTotal: 4,
      updatedAt: new Date().toISOString(),
    };
    setItems((current) => [item, ...current]);
    setSelectedWork(item);
    pushToast("Work item created", `${item.id} is assigned to ${item.owner}.`);
  }

  function transitionWork(item: WorkItem, state: WorkState, note: string) {
    const updated: WorkItem = {
      ...item,
      state,
      blocker: state === "Blocked" ? note.trim() || "Owner reported a blocker" : undefined,
      checklistDone: state === "Awaiting verification" || state === "Closed" ? item.checklistTotal : item.checklistDone,
      evidenceCount: state === "Awaiting verification" && item.evidenceCount === 0 ? 1 : item.evidenceCount,
      overdueMinutes: state === "Closed" ? undefined : item.overdueMinutes,
      updatedAt: new Date().toISOString(),
    };
    setItems((current) => current.map((currentItem) => currentItem.id === item.id ? updated : currentItem));
    setSelectedWork(updated);
    pushToast("Work state updated", `${item.id} is now ${state.toLowerCase()}.`);
  }

  const searchResults = useMemo<SearchResult[]>(() => {
    const records: SearchResult[] = [
      ...items.map((item) => ({ id: item.id, title: item.title, detail: `${item.owner} · ${item.state}`, module: "work" as const, work: item })),
      ...projects.map((project) => ({ id: project.id, title: project.name, detail: `${project.customer} · ${project.risk} risk`, module: "projects" as const })),
      ...documents.map((document) => ({ id: document.id, title: document.title, detail: `${document.code} · ${document.revision}`, module: "documents" as const })),
      ...employees.map((employee) => ({ id: employee.id, title: employee.name, detail: `${employee.role} · ${employee.department}`, module: "workforce" as const })),
      ...assets.map((asset) => ({ id: asset.id, title: asset.name, detail: `${asset.area} · ${asset.health}`, module: "maintenance" as const })),
    ];
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return records.slice(0, 6);
    return records.filter((record) => [record.id, record.title, record.detail].some((value) => value.toLowerCase().includes(normalized))).slice(0, 12);
  }, [items, searchQuery]);

  const record = useMemo<Record<string, unknown> | null>(() => {
    if (!selectedRecordId) return null;
    const sources: unknown[] = [...projects, ...qualityRecords, ...assets, ...safetyRecords, ...employees, ...kpis, ...documents, ...suppliers];
    return sources.find((candidate) => typeof candidate === "object" && candidate !== null && "id" in candidate && (candidate as { id: string }).id === selectedRecordId) as Record<string, unknown> | undefined ?? {
      id: selectedRecordId,
      title: "Operational configuration",
      state: "Review due",
      owner: "System administrator",
      source: "ForgeOS",
    };
  }, [selectedRecordId]);

  function openSearchResult(result: SearchResult) {
    setSearchOpen(false);
    setSearchQuery("");
    navigate(result.module);
    if (result.work) setSelectedWork(result.work);
    else setSelectedRecordId(result.id);
  }

  function handleSecondaryAction(context: CreateActionContext) {
    if (context.intent.toLowerCase().includes("work") || context.intent.toLowerCase().includes("action")) {
      setCreateOpen(true);
    }
    pushToast("Action started", `${context.intent} is linked to ${context.recordId ?? pageMeta[context.module].title}.`);
  }

  function renderModule() {
    const shared = { onOpenRecord: setSelectedRecordId, onCreateAction: handleSecondaryAction };
    switch (activeModule) {
      case "command": return <CommandCenter items={items} unit={unit} shift={shift} onCreateWork={() => setCreateOpen(true)} onOpenWork={setSelectedWork} onNavigate={navigate} />;
      case "work": return <WorkView items={items} role={role} currentPerson={currentPerson} onCreateWork={() => setCreateOpen(true)} onOpenWork={setSelectedWork} />;
      case "projects": return <ProjectsView {...shared} />;
      case "quality": return <QualityView {...shared} />;
      case "maintenance": return <MaintenanceView {...shared} />;
      case "safety": return <SafetyView {...shared} />;
      case "workforce": return <WorkforceView {...shared} />;
      case "kpis": return <KpisView {...shared} />;
      case "documents": return <DocumentsView {...shared} />;
      case "suppliers": return <SuppliersView {...shared} />;
      case "settings": return <SettingsView {...shared} />;
    }
  }

  if (booting) return <LoadingShell />;

  return (
    <div className="forge-app" data-role={role.toLowerCase()}>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <aside className="app-sidebar">
        <div className="brand-lockup"><ForgeMark /><span><strong>ForgeOS</strong><small>Manufacturing system</small></span></div>
        <div className="site-context">
          <label>
            <span>Site</span>
            <select value={unit} onChange={(event) => { setUnit(event.target.value as typeof unit); pushToast("Site context changed", `${event.target.value} data is now in view.`); }}>
              <option>Unit 1</option><option>Unit 2</option>
            </select>
          </label>
          <label>
            <span>Shift</span>
            <select value={shift} onChange={(event) => setShift(event.target.value as typeof shift)}>
              <option>Day</option><option>Night</option>
            </select>
          </label>
        </div>
        <SidebarNavigation active={activeModule} role={role} items={items} onNavigate={navigate} />
        <div className="sidebar-foot">
          <span className="sync-mark" data-online={online || undefined}>{online ? <Wifi aria-hidden="true" /> : <WifiOff aria-hidden="true" />}{online ? "Live sync" : "Offline queue"}</span>
          <small>Plant time · 18 Jul 2026 · 20:42</small>
        </div>
      </aside>

      <div className="app-body">
        {!online ? <div className="offline-banner" role="status"><WifiOff aria-hidden="true" /><span><strong>You are offline.</strong> Work updates stay on this device and sync when the connection returns.</span></div> : null}
        <header className="app-header">
          <IconButton className="mobile-menu-button" icon={PanelLeft} label="Open navigation" onClick={() => setMobileMenuOpen(true)} />
          <div className="page-identity"><p>{unit} · {shift} shift</p><h1>{meta.title}</h1><span>{meta.description}</span></div>
          <button className="global-search-trigger" onClick={() => setSearchOpen(true)} aria-label="Search ForgeOS">
            <Search aria-hidden="true" /><span>Search work, projects, people, documents</span><kbd><Command aria-hidden="true" />K</kbd>
          </button>
          <div className="header-actions">
            <span className="header-sync" data-online={online || undefined}>{online ? <Wifi aria-hidden="true" /> : <WifiOff aria-hidden="true" />}<span>{online ? "Synced 08:57" : "3 queued"}</span></span>
            <div className="notification-anchor">
              <IconButton ref={notificationTriggerRef} icon={Bell} label="Open notifications, 3 unread" onClick={() => setNotificationsOpen((current) => !current)} aria-expanded={notificationsOpen} aria-controls="notification-panel" aria-haspopup="dialog" />
              <b className="notification-count">3</b>
              {notificationsOpen ? (
                <section ref={notificationPanelRef} id="notification-panel" className="notification-panel" role="dialog" aria-label="Notifications">
                  <header><div><p className="eyebrow">Action center</p><h2>Notifications</h2></div><IconButton icon={X} label="Close notifications" onClick={() => setNotificationsOpen(false)} /></header>
                  <ol>
                    {activity.slice(0, 5).map((event) => <li key={event.id}><span className="activity-icon"><Activity aria-hidden="true" /></span><p><strong>{event.actor}</strong> {event.action}<small>{event.target} · {event.time}</small></p></li>)}
                  </ol>
                  <Button variant="secondary" fullWidth onClick={() => { setNotificationsOpen(false); navigate("work"); }}>Open accountability queue</Button>
                </section>
              ) : null}
            </div>
            <label className="role-switcher">
              <span className="ui-sr-only">View the application as</span>
              <span className="profile-mark">{currentPerson.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>
              <span className="profile-copy"><strong>{currentPerson}</strong><small>{role}</small></span>
              <select value={role} onChange={(event) => { const nextRole = event.target.value as UserRole; setRole(nextRole); pushToast("Role view changed", `You are viewing ForgeOS as ${nextRole}.`); }} aria-label="View the application as">
                {(["Operator", "Supervisor", "HOD", "Executive", "Admin"] as UserRole[]).map((value) => <option key={value}>{value}</option>)}
              </select>
              <ChevronDown aria-hidden="true" />
            </label>
          </div>
        </header>

        <main id="main-content" className="app-main" tabIndex={-1}>{renderModule()}</main>
      </div>

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {["command", "work", "projects", "safety"].map((id) => {
          const item = navigation.find((candidate) => candidate.id === id)!;
          const Icon = item.icon;
          const allowed = roleAccess[role].includes(item.id);
          if (!allowed) return null;
          return <button key={id} data-active={activeModule === id || undefined} aria-current={activeModule === id ? "page" : undefined} onClick={() => navigate(item.id)}><Icon aria-hidden="true" /><span>{item.label === "Command Center" ? "Command" : item.label}</span></button>;
        })}
        <button onClick={() => setMobileMenuOpen(true)}><Menu aria-hidden="true" /><span>More</span></button>
      </nav>

      <Drawer open={mobileMenuOpen} onOpenChange={(nextOpen) => setMobileMenuOpen(nextOpen)} side="left" title="ForgeOS navigation" description={`${currentPerson} · ${role}`} size="sm">
        <div className="mobile-context"><strong>{unit}</strong><span>{shift} shift · {online ? "Live sync" : "Offline queue"}</span></div>
        <SidebarNavigation active={activeModule} role={role} items={items} onNavigate={navigate} />
      </Drawer>

      <Dialog open={searchOpen} onOpenChange={(nextOpen) => setSearchOpen(nextOpen)} title="Search ForgeOS" description="Find work, projects, people, machines, and controlled documents." size="lg" surfaceClassName="search-dialog">
        <Field label="Search all operations" autoFocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Type a name, ID, station, or document code" />
        <div className="search-result-meta"><span>{searchResults.length} results</span><kbd>Esc to close</kbd></div>
        <ol className="search-results">
          {searchResults.map((result) => {
            const Icon = navigation.find((item) => item.id === result.module)?.icon ?? CircleGauge;
            return <li key={`${result.module}-${result.id}`}><button onClick={() => openSearchResult(result)}><Icon aria-hidden="true" /><span><strong>{result.title}</strong><small>{result.id} · {result.detail}</small></span><em>{pageMeta[result.module].title}</em></button></li>;
          })}
        </ol>
      </Dialog>

      <CreateWorkDialog open={createOpen} onOpenChange={setCreateOpen} onCreate={createWork} />
      <WorkDetailDrawer item={selectedWork} role={role} onClose={() => setSelectedWork(null)} onTransition={transitionWork} />
      <RecordDrawer recordId={selectedRecordId} record={record} onClose={() => setSelectedRecordId(null)} onCreateAction={() => { setCreateOpen(true); pushToast("Linked action", `New work will link to ${selectedRecordId}.`); }} />
      <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} onAction={() => navigate("work")} />
      {activeModule !== "command" && activeModule !== "work" ? (
        <button className="floating-create" onClick={() => setCreateOpen(true)} aria-label="Create work item"><Plus aria-hidden="true" /></button>
      ) : null}
    </div>
  );
}
