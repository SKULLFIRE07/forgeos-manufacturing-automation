"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  CircleDot,
  Clock3,
  Database,
  LockKeyhole,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  UserRound,
} from "lucide-react";
import {
  assets,
  documents,
  employees,
  kpis,
  projects,
  qualityRecords,
  safetyRecords,
  suppliers,
} from "@/lib/seed";
import type {
  AssetRecord,
  DocumentRecord,
  EmployeeRecord,
  KpiRecord,
  ModuleId,
  Project,
  QualityRecord,
  SafetyRecord,
  SupplierRecord,
} from "@/lib/types";

type SecondaryModuleId = Exclude<ModuleId, "command" | "work">;

export interface CreateActionContext {
  module: SecondaryModuleId;
  recordId?: string;
  intent: string;
}

export interface SecondaryViewProps {
  onOpenRecord: (recordId: string) => void;
  onCreateAction: (context: CreateActionContext) => void;
}

interface SummaryStat {
  label: string;
  value: string | number;
  detail?: string;
}

interface ExceptionSummaryProps {
  id: string;
  count: number;
  label: string;
  detail: string;
  stats: SummaryStat[];
}

interface ViewFrameProps {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  children: ReactNode;
}

interface FilterBarProps {
  label: string;
  query: string;
  onQueryChange: (value: string) => void;
  count: number;
  total: number;
  isFiltered: boolean;
  onReset: () => void;
  children: ReactNode;
}

interface FilterSelectProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

interface EmptyTableRowProps {
  colSpan: number;
  noun: string;
}

interface SettingsRecord {
  id: string;
  name: string;
  area: "Access" | "Workflow" | "Integration" | "Notification" | "Governance";
  value: string;
  owner: string;
  source: string;
  lastReview: string;
  state: "Healthy" | "Review due" | "Action required";
}

const settingsRecords: SettingsRecord[] = [
  {
    id: "SET-ACCESS-01",
    name: "Role access matrix",
    area: "Access",
    value: "Operator, Supervisor, HOD, Executive, Admin",
    owner: "IT Administration",
    source: "ForgeOS",
    lastReview: "2026-07-12",
    state: "Review due",
  },
  {
    id: "SET-SAP-01",
    name: "SAP operational sync",
    area: "Integration",
    value: "Projects, purchase orders, inventory",
    owner: "ERP Team",
    source: "SAP S/4HANA",
    lastReview: "2026-07-18",
    state: "Action required",
  },
  {
    id: "SET-HRMS-01",
    name: "Employee and shift sync",
    area: "Integration",
    value: "Employees, supervisors, shifts, attendance",
    owner: "HR Operations",
    source: "HRMS",
    lastReview: "2026-07-17",
    state: "Healthy",
  },
  {
    id: "SET-CLOSE-01",
    name: "Verified closure rule",
    area: "Workflow",
    value: "Owner submission plus independent verification",
    owner: "Quality Head",
    source: "ForgeOS",
    lastReview: "2026-07-15",
    state: "Healthy",
  },
  {
    id: "SET-ESC-01",
    name: "Overdue escalation",
    area: "Notification",
    value: "Supervisor at 30 min, HOD at 4 hr",
    owner: "Plant Operations",
    source: "ForgeOS",
    lastReview: "2026-07-10",
    state: "Review due",
  },
  {
    id: "SET-DOC-01",
    name: "Defence document retention",
    area: "Governance",
    value: "7 years with download and access logging",
    owner: "Document Control",
    source: "Policy DOC-SEC-04",
    lastReview: "2026-06-30",
    state: "Healthy",
  },
  {
    id: "SET-OFFLINE-01",
    name: "Shop floor offline queue",
    area: "Workflow",
    value: "Evidence and completion sync on reconnect",
    owner: "IT Administration",
    source: "ForgeOS",
    lastReview: "2026-07-08",
    state: "Action required",
  },
];

const riskRank: Record<string, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function matchesQuery(query: string, values: Array<string | number | undefined>): boolean {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return true;
  return values.some((value) => String(value ?? "").toLocaleLowerCase().includes(normalized));
}

function formatDate(value: string): string {
  const isoDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!isoDate) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function isOverdue(value: string, isClosed = false): boolean {
  if (isClosed || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const due = new Date(`${value}T23:59:59Z`).getTime();
  return due < Date.now();
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? singular : plural;
}

function toneFor(value: string): "critical" | "warning" | "positive" | "active" | "neutral" {
  const normalized = value.toLocaleLowerCase();

  if (
    normalized.includes("high") ||
    normalized.includes("critical") ||
    normalized.includes("major") ||
    normalized.includes("blocked") ||
    normalized.includes("off target") ||
    normalized.includes("down") ||
    normalized.includes("action required")
  ) {
    return "critical";
  }

  if (
    normalized.includes("medium") ||
    normalized.includes("attention") ||
    normalized.includes("review due") ||
    normalized.includes("at risk") ||
    normalized.includes("missing") ||
    normalized.includes("hold") ||
    normalized.includes("absent") ||
    normalized.includes("overdue")
  ) {
    return "warning";
  }

  if (
    normalized.includes("closed") ||
    normalized.includes("available") ||
    normalized.includes("effective") ||
    normalized.includes("on target") ||
    normalized.includes("present") ||
    normalized.includes("healthy") ||
    normalized.includes("improving")
  ) {
    return "positive";
  }

  if (
    normalized.includes("progress") ||
    normalized.includes("verification") ||
    normalized.includes("training") ||
    normalized.includes("draft")
  ) {
    return "active";
  }

  return "neutral";
}

function StateLabel({ value }: { value: string }) {
  const tone = toneFor(value);
  const Icon = tone === "critical" ? AlertTriangle : tone === "warning" ? Clock3 : tone === "positive" ? CheckCircle2 : tone === "active" ? CircleDot : CircleDot;

  return (
    <span className="sv-status" data-tone={tone}>
      <Icon aria-hidden="true" size={14} strokeWidth={2} />
      <span>{value}</span>
    </span>
  );
}

function ProgressMeter({ value, label }: { value: number; label: string }) {
  const boundedValue = Math.max(0, Math.min(100, value));

  return (
    <div className="sv-progress-wrap">
      <span className="sv-tabular">{boundedValue}%</span>
      <span
        aria-label={`${label}: ${boundedValue}%`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={boundedValue}
        className="sv-progress"
        role="progressbar"
      >
        <span style={{ width: `${boundedValue}%` }} />
      </span>
    </div>
  );
}

function ExceptionSummary({ id, count, label, detail, stats }: ExceptionSummaryProps) {
  return (
    <section aria-labelledby={id} className="sv-summary">
      <div className="sv-summary-exception">
        <div className="sv-summary-title-line">
          <AlertTriangle aria-hidden="true" size={18} />
          <h3 id={id}>Needs attention</h3>
        </div>
        <p>
          <strong>{count}</strong> {label}
        </p>
        <span>{detail}</span>
      </div>
      <dl className="sv-summary-stats">
        {stats.map((stat) => (
          <div key={stat.label}>
            <dt>{stat.label}</dt>
            <dd>
              {stat.value}
              {stat.detail ? <span>{stat.detail}</span> : null}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  return (
    <label className="sv-filter-select">
      <span>{label}</span>
      <select aria-label={label} onChange={(event) => onChange(event.target.value)} value={value}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function FilterBar({ label, query, onQueryChange, count, total, isFiltered, onReset, children }: FilterBarProps) {
  return (
    <form className="sv-filterbar" onSubmit={(event) => event.preventDefault()} role="search">
      <label className="sv-query">
        <span className="sv-visually-hidden">{label}</span>
        <Search aria-hidden="true" size={18} />
        <input
          aria-label={label}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={label}
          type="search"
          value={query}
        />
      </label>
      <div className="sv-filter-controls">
        {children}
      </div>
      <div aria-live="polite" className="sv-result-count">
        {count} of {total}
      </div>
      {isFiltered ? (
        <button className="sv-reset" onClick={onReset} type="button">
          Reset filters
        </button>
      ) : null}
    </form>
  );
}

function EmptyTableRow({ colSpan, noun }: EmptyTableRowProps) {
  return (
    <tr className="sv-empty-row">
      <td colSpan={colSpan} data-label="No results">
        <strong>No {noun} match these filters.</strong>
        <span>Reset the filters or search with a broader term.</span>
      </td>
    </tr>
  );
}

function ViewFrame({ title, description, actionLabel, onAction, children }: ViewFrameProps) {
  const headingId = `sv-${title.toLocaleLowerCase().replaceAll(" ", "-")}`;

  return (
    <section aria-describedby={`${headingId}-description`} aria-labelledby={headingId} className="sv-secondary-view">
      <style>{secondaryViewStyles}</style>
      <header className="sv-header">
        <h2 className="sv-visually-hidden" id={headingId}>{title}</h2>
        <p className="sv-visually-hidden" id={`${headingId}-description`}>{description}</p>
        <button className="sv-primary-action" onClick={onAction} type="button">
          <Plus aria-hidden="true" size={18} />
          <span>{actionLabel}</span>
        </button>
      </header>
      {children}
    </section>
  );
}

export function ProjectsView({ onOpenRecord, onCreateAction }: SecondaryViewProps) {
  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState("All risks");
  const [stage, setStage] = useState("All stages");

  const filtered = useMemo(
    () =>
      projects
        .filter(
          (project: Project) =>
            matchesQuery(query, [project.id, project.name, project.customer, project.owner, project.riskDriver]) &&
            (risk === "All risks" || project.risk === risk) &&
            (stage === "All stages" || project.stage === stage),
        )
        .sort((a: Project, b: Project) => riskRank[b.risk] - riskRank[a.risk] || b.openActions - a.openActions),
    [query, risk, stage],
  );

  const highRisk = projects.filter((project: Project) => project.risk === "High");
  const openActions = projects.reduce((sum: number, project: Project) => sum + project.openActions, 0);

  const reset = () => {
    setQuery("");
    setRisk("All risks");
    setStage("All stages");
  };

  return (
    <ViewFrame
      actionLabel="Create project action"
      description="Customer commitments, milestone risk and accountable recovery work."
      onAction={() => onCreateAction({ module: "projects", intent: "create-project-action" })}
      title="Projects"
    >
      <ExceptionSummary
        count={highRisk.length}
        detail={highRisk[0]?.riskDriver ?? "No high-risk driver is currently recorded."}
        id="projects-exceptions"
        label={`high-risk ${pluralize(highRisk.length, "project")}`}
        stats={[
          { label: "Open actions", value: openActions, detail: "Across active projects" },
          { label: "Average completion", value: `${average(projects.map((project: Project) => project.completion))}%` },
          { label: "Portfolio", value: projects.length, detail: "Customer projects" },
        ]}
      />
      <FilterBar
        count={filtered.length}
        isFiltered={Boolean(query) || risk !== "All risks" || stage !== "All stages"}
        label="Search project, customer, owner or risk"
        onQueryChange={setQuery}
        onReset={reset}
        query={query}
        total={projects.length}
      >
        <FilterSelect label="Risk" onChange={setRisk} options={["All risks", "High", "Medium", "Low"]} value={risk} />
        <FilterSelect
          label="Stage"
          onChange={setStage}
          options={["All stages", ...uniqueValues(projects.map((project: Project) => project.stage))]}
          value={stage}
        />
      </FilterBar>
      <div className="sv-table-wrap">
        <table className="sv-table">
          <caption className="sv-visually-hidden">Project delivery and risk register</caption>
          <thead>
            <tr>
              <th scope="col">Project</th>
              <th scope="col">Customer</th>
              <th scope="col">Stage</th>
              <th scope="col">Completion</th>
              <th scope="col">Risk and driver</th>
              <th scope="col">Next milestone</th>
              <th scope="col">Due</th>
              <th scope="col">Owner</th>
              <th scope="col">Open actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length ? (
              filtered.map((project: Project) => (
                <tr key={project.id}>
                  <td data-label="Project">
                    <button className="sv-record-title" onClick={() => onOpenRecord(project.id)} type="button">
                      {project.name}
                    </button>
                    <span className="sv-record-id">{project.id}</span>
                  </td>
                  <td data-label="Customer">{project.customer}</td>
                  <td data-label="Stage">{project.stage}</td>
                  <td data-label="Completion"><ProgressMeter label={`${project.name} completion`} value={project.completion} /></td>
                  <td data-label="Risk and driver">
                    <StateLabel value={project.risk} />
                    <span className="sv-cell-note">{project.riskDriver}</span>
                  </td>
                  <td data-label="Next milestone">{project.nextMilestone}</td>
                  <td data-label="Due"><span className="sv-tabular">{formatDate(project.due)}</span></td>
                  <td data-label="Owner">{project.owner}</td>
                  <td data-label="Open actions"><strong className="sv-tabular">{project.openActions}</strong></td>
                </tr>
              ))
            ) : (
              <EmptyTableRow colSpan={9} noun="projects" />
            )}
          </tbody>
        </table>
      </div>
    </ViewFrame>
  );
}

export function QualityView({ onOpenRecord, onCreateAction }: SecondaryViewProps) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("All types");
  const [state, setState] = useState("All states");

  const filtered = useMemo(
    () =>
      qualityRecords
        .filter(
          (record: QualityRecord) =>
            matchesQuery(query, [record.id, record.title, record.source, record.owner, record.project]) &&
            (kind === "All types" || record.kind === kind) &&
            (state === "All states" || record.state === state),
        )
        .sort((a: QualityRecord, b: QualityRecord) => {
          const aScore = (a.kind === "Major NC" || a.kind === "Hold" ? 100 : 0) + a.ageDays;
          const bScore = (b.kind === "Major NC" || b.kind === "Hold" ? 100 : 0) + b.ageDays;
          return bScore - aScore;
        }),
    [kind, query, state],
  );

  const exceptions = qualityRecords.filter(
    (record: QualityRecord) => record.state !== "Closed" && (record.kind === "Major NC" || record.kind === "Hold" || record.state === "Blocked"),
  );
  const overdue = qualityRecords.filter((record: QualityRecord) => isOverdue(record.due, record.state === "Closed")).length;
  const awaiting = qualityRecords.filter((record: QualityRecord) => record.state === "Awaiting verification").length;

  const reset = () => {
    setQuery("");
    setKind("All types");
    setState("All states");
  };

  return (
    <ViewFrame
      actionLabel="Log quality record"
      description="Nonconformities, holds and corrective action through verified closure."
      onAction={() => onCreateAction({ module: "quality", intent: "log-quality-record" })}
      title="Quality"
    >
      <ExceptionSummary
        count={exceptions.length}
        detail={exceptions[0]?.title ?? "No major nonconformity, hold or blocked record is open."}
        id="quality-exceptions"
        label={`critical ${pluralize(exceptions.length, "record")}`}
        stats={[
          { label: "Overdue", value: overdue, detail: "Not closed by due date" },
          { label: "Awaiting verification", value: awaiting },
          { label: "Average age", value: `${average(qualityRecords.map((record: QualityRecord) => record.ageDays))} days` },
        ]}
      />
      <FilterBar
        count={filtered.length}
        isFiltered={Boolean(query) || kind !== "All types" || state !== "All states"}
        label="Search finding, source, project or owner"
        onQueryChange={setQuery}
        onReset={reset}
        query={query}
        total={qualityRecords.length}
      >
        <FilterSelect
          label="Record type"
          onChange={setKind}
          options={["All types", ...uniqueValues(qualityRecords.map((record: QualityRecord) => record.kind))]}
          value={kind}
        />
        <FilterSelect
          label="State"
          onChange={setState}
          options={["All states", ...uniqueValues(qualityRecords.map((record: QualityRecord) => record.state))]}
          value={state}
        />
      </FilterBar>
      <div className="sv-table-wrap">
        <table className="sv-table">
          <caption className="sv-visually-hidden">Quality issue and corrective action register</caption>
          <thead>
            <tr>
              <th scope="col">Record</th>
              <th scope="col">Type</th>
              <th scope="col">Source</th>
              <th scope="col">Project</th>
              <th scope="col">Owner</th>
              <th scope="col">Due</th>
              <th scope="col">Age</th>
              <th scope="col">State</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length ? (
              filtered.map((record: QualityRecord) => (
                <tr key={record.id}>
                  <td data-label="Record">
                    <button className="sv-record-title" onClick={() => onOpenRecord(record.id)} type="button">{record.title}</button>
                    <span className="sv-record-id">{record.id}</span>
                  </td>
                  <td data-label="Type"><StateLabel value={record.kind} /></td>
                  <td data-label="Source">{record.source}</td>
                  <td data-label="Project">{record.project ?? "Not linked"}</td>
                  <td data-label="Owner">{record.owner}</td>
                  <td data-label="Due">
                    <span className="sv-tabular">{formatDate(record.due)}</span>
                    {isOverdue(record.due, record.state === "Closed") ? <span className="sv-overdue">Overdue</span> : null}
                  </td>
                  <td data-label="Age"><span className="sv-tabular">{record.ageDays} days</span></td>
                  <td data-label="State"><StateLabel value={record.state} /></td>
                </tr>
              ))
            ) : (
              <EmptyTableRow colSpan={8} noun="quality records" />
            )}
          </tbody>
        </table>
      </div>
    </ViewFrame>
  );
}

export function MaintenanceView({ onOpenRecord, onCreateAction }: SecondaryViewProps) {
  const [query, setQuery] = useState("");
  const [health, setHealth] = useState("All conditions");
  const [area, setArea] = useState("All areas");

  const filtered = useMemo(
    () =>
      assets
        .filter(
          (asset: AssetRecord) =>
            matchesQuery(query, [asset.id, asset.name, asset.area, asset.owner]) &&
            (health === "All conditions" || asset.health === health) &&
            (area === "All areas" || asset.area === area),
        )
        .sort((a: AssetRecord, b: AssetRecord) => {
          const order: Record<AssetRecord["health"], number> = { Down: 4, "Calibration hold": 3, Attention: 2, Available: 1 };
          return order[b.health] - order[a.health] || b.openWork - a.openWork;
        }),
    [area, health, query],
  );

  const unavailable = assets.filter((asset: AssetRecord) => asset.health === "Down" || asset.health === "Calibration hold");
  const attention = assets.filter((asset: AssetRecord) => asset.health === "Attention").length;
  const openWork = assets.reduce((sum: number, asset: AssetRecord) => sum + asset.openWork, 0);

  const reset = () => {
    setQuery("");
    setHealth("All conditions");
    setArea("All areas");
  };

  return (
    <ViewFrame
      actionLabel="Raise work order"
      description="Machine availability, calibration holds and maintenance commitments."
      onAction={() => onCreateAction({ module: "maintenance", intent: "raise-work-order" })}
      title="Maintenance"
    >
      <ExceptionSummary
        count={unavailable.length}
        detail={unavailable[0] ? `${unavailable[0].name} is ${unavailable[0].health.toLocaleLowerCase()}.` : "Every registered asset is available for use."}
        id="maintenance-exceptions"
        label={`unavailable ${pluralize(unavailable.length, "asset")}`}
        stats={[
          { label: "Needs attention", value: attention },
          { label: "Open work orders", value: openWork },
          { label: "Runtime captured", value: `${assets.reduce((sum: number, asset: AssetRecord) => sum + asset.runtimeHours, 0).toLocaleString("en-IN")} hr` },
        ]}
      />
      <FilterBar
        count={filtered.length}
        isFiltered={Boolean(query) || health !== "All conditions" || area !== "All areas"}
        label="Search asset, area or custodian"
        onQueryChange={setQuery}
        onReset={reset}
        query={query}
        total={assets.length}
      >
        <FilterSelect
          label="Condition"
          onChange={setHealth}
          options={["All conditions", "Down", "Calibration hold", "Attention", "Available"]}
          value={health}
        />
        <FilterSelect
          label="Area"
          onChange={setArea}
          options={["All areas", ...uniqueValues(assets.map((asset: AssetRecord) => asset.area))]}
          value={area}
        />
      </FilterBar>
      <div className="sv-table-wrap">
        <table className="sv-table">
          <caption className="sv-visually-hidden">Machine, instrument and lifting asset maintenance register</caption>
          <thead>
            <tr>
              <th scope="col">Asset</th>
              <th scope="col">Area</th>
              <th scope="col">Condition</th>
              <th scope="col">Custodian</th>
              <th scope="col">Next service</th>
              <th scope="col">Runtime</th>
              <th scope="col">Open work</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length ? (
              filtered.map((asset: AssetRecord) => (
                <tr key={asset.id}>
                  <td data-label="Asset">
                    <button className="sv-record-title" onClick={() => onOpenRecord(asset.id)} type="button">{asset.name}</button>
                    <span className="sv-record-id">{asset.id}</span>
                  </td>
                  <td data-label="Area">{asset.area}</td>
                  <td data-label="Condition"><StateLabel value={asset.health} /></td>
                  <td data-label="Custodian">{asset.owner}</td>
                  <td data-label="Next service"><span className="sv-tabular">{formatDate(asset.nextService)}</span></td>
                  <td data-label="Runtime"><span className="sv-tabular">{asset.runtimeHours.toLocaleString("en-IN")} hr</span></td>
                  <td data-label="Open work"><strong className="sv-tabular">{asset.openWork}</strong></td>
                </tr>
              ))
            ) : (
              <EmptyTableRow colSpan={7} noun="assets" />
            )}
          </tbody>
        </table>
      </div>
    </ViewFrame>
  );
}

export function SafetyView({ onOpenRecord, onCreateAction }: SecondaryViewProps) {
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState("All severities");
  const [kind, setKind] = useState("All types");

  const filtered = useMemo(
    () =>
      safetyRecords
        .filter(
          (record: SafetyRecord) =>
            matchesQuery(query, [record.id, record.title, record.area, record.owner]) &&
            (severity === "All severities" || record.severity === severity) &&
            (kind === "All types" || record.kind === kind),
        )
        .sort((a: SafetyRecord, b: SafetyRecord) => riskRank[b.severity] - riskRank[a.severity] || Number(a.state === "Closed") - Number(b.state === "Closed")),
    [kind, query, severity],
  );

  const highOpen = safetyRecords.filter((record: SafetyRecord) => record.severity === "High" && record.state !== "Closed");
  const blocked = safetyRecords.filter((record: SafetyRecord) => record.state === "Blocked").length;
  const toolboxTalks = safetyRecords.filter((record: SafetyRecord) => record.kind === "Toolbox talk").length;

  const reset = () => {
    setQuery("");
    setSeverity("All severities");
    setKind("All types");
  };

  return (
    <ViewFrame
      actionLabel="Report safety issue"
      description="Incidents, unsafe conditions, permits and toolbox compliance."
      onAction={() => onCreateAction({ module: "safety", intent: "report-safety-issue" })}
      title="Safety"
    >
      <ExceptionSummary
        count={highOpen.length}
        detail={highOpen[0]?.title ?? "No high-severity safety record remains open."}
        id="safety-exceptions"
        label={`high-severity open ${pluralize(highOpen.length, "record")}`}
        stats={[
          { label: "Blocked", value: blocked, detail: "Needs escalation" },
          { label: "Toolbox records", value: toolboxTalks },
          { label: "Open total", value: safetyRecords.filter((record: SafetyRecord) => record.state !== "Closed").length },
        ]}
      />
      <FilterBar
        count={filtered.length}
        isFiltered={Boolean(query) || severity !== "All severities" || kind !== "All types"}
        label="Search incident, area or owner"
        onQueryChange={setQuery}
        onReset={reset}
        query={query}
        total={safetyRecords.length}
      >
        <FilterSelect label="Severity" onChange={setSeverity} options={["All severities", "High", "Medium", "Low"]} value={severity} />
        <FilterSelect
          label="Record type"
          onChange={setKind}
          options={["All types", ...uniqueValues(safetyRecords.map((record: SafetyRecord) => record.kind))]}
          value={kind}
        />
      </FilterBar>
      <div className="sv-table-wrap">
        <table className="sv-table">
          <caption className="sv-visually-hidden">Safety incident, hazard and toolbox register</caption>
          <thead>
            <tr>
              <th scope="col">Safety record</th>
              <th scope="col">Type</th>
              <th scope="col">Area</th>
              <th scope="col">Severity</th>
              <th scope="col">Owner</th>
              <th scope="col">Due</th>
              <th scope="col">State</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length ? (
              filtered.map((record: SafetyRecord) => (
                <tr key={record.id}>
                  <td data-label="Safety record">
                    <button className="sv-record-title" onClick={() => onOpenRecord(record.id)} type="button">{record.title}</button>
                    <span className="sv-record-id">{record.id}</span>
                  </td>
                  <td data-label="Type">{record.kind}</td>
                  <td data-label="Area">{record.area}</td>
                  <td data-label="Severity"><StateLabel value={record.severity} /></td>
                  <td data-label="Owner">{record.owner}</td>
                  <td data-label="Due">
                    <span className="sv-tabular">{formatDate(record.due)}</span>
                    {isOverdue(record.due, record.state === "Closed") ? <span className="sv-overdue">Overdue</span> : null}
                  </td>
                  <td data-label="State"><StateLabel value={record.state} /></td>
                </tr>
              ))
            ) : (
              <EmptyTableRow colSpan={7} noun="safety records" />
            )}
          </tbody>
        </table>
      </div>
    </ViewFrame>
  );
}

export function WorkforceView({ onOpenRecord, onCreateAction }: SecondaryViewProps) {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("All departments");
  const [status, setStatus] = useState("All attendance");

  const filtered = useMemo(
    () =>
      employees
        .filter(
          (employee: EmployeeRecord) =>
            matchesQuery(query, [employee.id, employee.name, employee.role, employee.department, employee.supervisor]) &&
            (department === "All departments" || employee.department === department) &&
            (status === "All attendance" || employee.status === status),
        )
        .sort((a: EmployeeRecord, b: EmployeeRecord) => {
          const aException = Number(a.status === "Absent") * 100 + Number(a.skillCoverage < 70) * 10 + a.assignedWork;
          const bException = Number(b.status === "Absent") * 100 + Number(b.skillCoverage < 70) * 10 + b.assignedWork;
          return bException - aException;
        }),
    [department, query, status],
  );

  const coverageRisks = employees.filter((employee: EmployeeRecord) => employee.skillCoverage < 70 || (employee.status === "Absent" && employee.assignedWork > 0));
  const absent = employees.filter((employee: EmployeeRecord) => employee.status === "Absent").length;
  const training = employees.filter((employee: EmployeeRecord) => employee.status === "Training").length;

  const reset = () => {
    setQuery("");
    setDepartment("All departments");
    setStatus("All attendance");
  };

  return (
    <ViewFrame
      actionLabel="Plan workforce action"
      description="Attendance, supervision, skill coverage and assigned operational load."
      onAction={() => onCreateAction({ module: "workforce", intent: "plan-workforce-action" })}
      title="Workforce"
    >
      <ExceptionSummary
        count={coverageRisks.length}
        detail={coverageRisks[0] ? `${coverageRisks[0].name} needs attendance or skill coverage attention.` : "Every active assignment has adequate coverage."}
        id="workforce-exceptions"
        label={`coverage ${pluralize(coverageRisks.length, "risk")}`}
        stats={[
          { label: "Absent", value: absent },
          { label: "In training", value: training },
          { label: "Assigned work", value: employees.reduce((sum: number, employee: EmployeeRecord) => sum + employee.assignedWork, 0) },
        ]}
      />
      <FilterBar
        count={filtered.length}
        isFiltered={Boolean(query) || department !== "All departments" || status !== "All attendance"}
        label="Search employee, role, department or supervisor"
        onQueryChange={setQuery}
        onReset={reset}
        query={query}
        total={employees.length}
      >
        <FilterSelect
          label="Department"
          onChange={setDepartment}
          options={["All departments", ...uniqueValues(employees.map((employee: EmployeeRecord) => employee.department))]}
          value={department}
        />
        <FilterSelect
          label="Attendance"
          onChange={setStatus}
          options={["All attendance", ...uniqueValues(employees.map((employee: EmployeeRecord) => employee.status))]}
          value={status}
        />
      </FilterBar>
      <div className="sv-table-wrap">
        <table className="sv-table">
          <caption className="sv-visually-hidden">Employee attendance, skill and work allocation register</caption>
          <thead>
            <tr>
              <th scope="col">Employee</th>
              <th scope="col">Role and department</th>
              <th scope="col">Unit and shift</th>
              <th scope="col">Supervisor</th>
              <th scope="col">Attendance</th>
              <th scope="col">Skill coverage</th>
              <th scope="col">Assigned work</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length ? (
              filtered.map((employee: EmployeeRecord) => (
                <tr key={employee.id}>
                  <td data-label="Employee">
                    <button className="sv-record-title sv-person" onClick={() => onOpenRecord(employee.id)} type="button">
                      <UserRound aria-hidden="true" size={17} />
                      {employee.name}
                    </button>
                    <span className="sv-record-id">{employee.id}</span>
                  </td>
                  <td data-label="Role and department">
                    {employee.role}
                    <span className="sv-cell-note">{employee.department}</span>
                  </td>
                  <td data-label="Unit and shift">
                    {employee.unit}
                    <span className="sv-cell-note">{employee.shift} shift</span>
                  </td>
                  <td data-label="Supervisor">{employee.supervisor}</td>
                  <td data-label="Attendance"><StateLabel value={employee.status} /></td>
                  <td data-label="Skill coverage"><ProgressMeter label={`${employee.name} skill coverage`} value={employee.skillCoverage} /></td>
                  <td data-label="Assigned work"><strong className="sv-tabular">{employee.assignedWork}</strong></td>
                </tr>
              ))
            ) : (
              <EmptyTableRow colSpan={7} noun="employees" />
            )}
          </tbody>
        </table>
      </div>
    </ViewFrame>
  );
}

export function KpisView({ onOpenRecord, onCreateAction }: SecondaryViewProps) {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("All departments");
  const [state, setState] = useState("All states");

  const filtered = useMemo(
    () =>
      kpis
        .filter(
          (kpi: KpiRecord) =>
            matchesQuery(query, [kpi.id, kpi.name, kpi.department, kpi.owner, kpi.target, kpi.actual]) &&
            (department === "All departments" || kpi.department === department) &&
            (state === "All states" || kpi.state === state),
        )
        .sort((a: KpiRecord, b: KpiRecord) => {
          const order: Record<KpiRecord["state"], number> = { "Off target": 4, "Missing update": 3, "At risk": 2, "On target": 1 };
          return order[b.state] - order[a.state] || b.actionCount - a.actionCount;
        }),
    [department, query, state],
  );

  const exceptions = kpis.filter((kpi: KpiRecord) => kpi.state === "Off target" || kpi.state === "Missing update");
  const atRisk = kpis.filter((kpi: KpiRecord) => kpi.state === "At risk").length;
  const recoveryActions = kpis.reduce((sum: number, kpi: KpiRecord) => sum + kpi.actionCount, 0);

  const reset = () => {
    setQuery("");
    setDepartment("All departments");
    setState("All states");
  };

  return (
    <ViewFrame
      actionLabel="Create recovery action"
      description="Department measures with targets, owners, evidence and recovery work."
      onAction={() => onCreateAction({ module: "kpis", intent: "create-kpi-recovery-action" })}
      title="KPIs"
    >
      <ExceptionSummary
        count={exceptions.length}
        detail={exceptions[0] ? `${exceptions[0].name}: ${exceptions[0].actual} against ${exceptions[0].target}.` : "Every KPI is updated and within its operating threshold."}
        id="kpi-exceptions"
        label={`off-target or missing ${pluralize(exceptions.length, "measure")}`}
        stats={[
          { label: "At risk", value: atRisk },
          { label: "Recovery actions", value: recoveryActions },
          { label: "On target", value: kpis.filter((kpi: KpiRecord) => kpi.state === "On target").length },
        ]}
      />
      <FilterBar
        count={filtered.length}
        isFiltered={Boolean(query) || department !== "All departments" || state !== "All states"}
        label="Search KPI, department or owner"
        onQueryChange={setQuery}
        onReset={reset}
        query={query}
        total={kpis.length}
      >
        <FilterSelect
          label="Department"
          onChange={setDepartment}
          options={["All departments", ...uniqueValues(kpis.map((kpi: KpiRecord) => kpi.department))]}
          value={department}
        />
        <FilterSelect
          label="State"
          onChange={setState}
          options={["All states", "Off target", "Missing update", "At risk", "On target"]}
          value={state}
        />
      </FilterBar>
      <div className="sv-table-wrap">
        <table className="sv-table">
          <caption className="sv-visually-hidden">Department objective and KPI performance register</caption>
          <thead>
            <tr>
              <th scope="col">Measure</th>
              <th scope="col">Department</th>
              <th scope="col">Owner</th>
              <th scope="col">Target</th>
              <th scope="col">Actual</th>
              <th scope="col">Frequency</th>
              <th scope="col">Trend</th>
              <th scope="col">State</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length ? (
              filtered.map((kpi: KpiRecord) => (
                <tr key={kpi.id}>
                  <td data-label="Measure">
                    <button className="sv-record-title" onClick={() => onOpenRecord(kpi.id)} type="button">{kpi.name}</button>
                    <span className="sv-record-id">{kpi.id}</span>
                  </td>
                  <td data-label="Department">{kpi.department}</td>
                  <td data-label="Owner">{kpi.owner}</td>
                  <td data-label="Target"><strong>{kpi.target}</strong></td>
                  <td data-label="Actual"><span className="sv-tabular">{kpi.actual}</span></td>
                  <td data-label="Frequency">{kpi.frequency}</td>
                  <td data-label="Trend"><StateLabel value={kpi.trend} /></td>
                  <td data-label="State"><StateLabel value={kpi.state} /></td>
                  <td data-label="Actions"><strong className="sv-tabular">{kpi.actionCount}</strong></td>
                </tr>
              ))
            ) : (
              <EmptyTableRow colSpan={9} noun="KPIs" />
            )}
          </tbody>
        </table>
      </div>
    </ViewFrame>
  );
}

export function DocumentsView({ onOpenRecord, onCreateAction }: SecondaryViewProps) {
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("All areas");
  const [state, setState] = useState("All states");

  const filtered = useMemo(
    () =>
      documents
        .filter(
          (document: DocumentRecord) =>
            matchesQuery(query, [document.id, document.title, document.code, document.owner, document.area]) &&
            (area === "All areas" || document.area === area) &&
            (state === "All states" || document.state === state),
        )
        .sort((a: DocumentRecord, b: DocumentRecord) => {
          const order: Record<DocumentRecord["state"], number> = { "Review due": 4, Draft: 3, Superseded: 2, Effective: 1 };
          return order[b.state] - order[a.state];
        }),
    [area, query, state],
  );

  const exceptions = documents.filter((document: DocumentRecord) => document.state === "Review due" || document.state === "Draft");
  const acknowledgementGap = documents.reduce((sum: number, document: DocumentRecord) => {
    const match = /^(\d+)\s*\/\s*(\d+)$/.exec(document.acknowledgements);
    return match ? sum + Math.max(0, Number(match[2]) - Number(match[1])) : sum;
  }, 0);

  const reset = () => {
    setQuery("");
    setArea("All areas");
    setState("All states");
  };

  return (
    <ViewFrame
      actionLabel="Start document review"
      description="Controlled procedures, drawings, revisions and workforce acknowledgement."
      onAction={() => onCreateAction({ module: "documents", intent: "start-document-review" })}
      title="Documents"
    >
      <ExceptionSummary
        count={exceptions.length}
        detail={exceptions[0] ? `${exceptions[0].code} is ${exceptions[0].state.toLocaleLowerCase()}.` : "Every controlled document is effective and current."}
        id="document-exceptions"
        label={`review or draft ${pluralize(exceptions.length, "document")}`}
        stats={[
          { label: "Acknowledgements due", value: acknowledgementGap },
          { label: "Effective", value: documents.filter((document: DocumentRecord) => document.state === "Effective").length },
          { label: "Controlled total", value: documents.length },
        ]}
      />
      <FilterBar
        count={filtered.length}
        isFiltered={Boolean(query) || area !== "All areas" || state !== "All states"}
        label="Search title, code, area or owner"
        onQueryChange={setQuery}
        onReset={reset}
        query={query}
        total={documents.length}
      >
        <FilterSelect
          label="Area"
          onChange={setArea}
          options={["All areas", ...uniqueValues(documents.map((document: DocumentRecord) => document.area))]}
          value={area}
        />
        <FilterSelect
          label="State"
          onChange={setState}
          options={["All states", "Review due", "Draft", "Effective", "Superseded"]}
          value={state}
        />
      </FilterBar>
      <div className="sv-table-wrap">
        <table className="sv-table">
          <caption className="sv-visually-hidden">Controlled document and acknowledgement register</caption>
          <thead>
            <tr>
              <th scope="col">Document</th>
              <th scope="col">Revision</th>
              <th scope="col">Area</th>
              <th scope="col">Owner</th>
              <th scope="col">State</th>
              <th scope="col">Effective date</th>
              <th scope="col">Acknowledged</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length ? (
              filtered.map((document: DocumentRecord) => (
                <tr key={document.id}>
                  <td data-label="Document">
                    <button className="sv-record-title" onClick={() => onOpenRecord(document.id)} type="button">{document.title}</button>
                    <span className="sv-record-id">{document.code}</span>
                  </td>
                  <td data-label="Revision"><span className="sv-tabular">{document.revision}</span></td>
                  <td data-label="Area">{document.area}</td>
                  <td data-label="Owner">{document.owner}</td>
                  <td data-label="State"><StateLabel value={document.state} /></td>
                  <td data-label="Effective date"><span className="sv-tabular">{formatDate(document.effectiveDate)}</span></td>
                  <td data-label="Acknowledged"><strong className="sv-tabular">{document.acknowledgements}</strong></td>
                </tr>
              ))
            ) : (
              <EmptyTableRow colSpan={7} noun="documents" />
            )}
          </tbody>
        </table>
      </div>
    </ViewFrame>
  );
}

export function SuppliersView({ onOpenRecord, onCreateAction }: SecondaryViewProps) {
  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState("All risks");
  const [category, setCategory] = useState("All categories");

  const filtered = useMemo(
    () =>
      suppliers
        .filter(
          (supplier: SupplierRecord) =>
            matchesQuery(query, [supplier.id, supplier.name, supplier.category, supplier.owner, supplier.nextCommitment]) &&
            (risk === "All risks" || supplier.risk === risk) &&
            (category === "All categories" || supplier.category === category),
        )
        .sort((a: SupplierRecord, b: SupplierRecord) => riskRank[b.risk] - riskRank[a.risk] || b.openIssues - a.openIssues),
    [category, query, risk],
  );

  const highRisk = suppliers.filter((supplier: SupplierRecord) => supplier.risk === "High");
  const openIssues = suppliers.reduce((sum: number, supplier: SupplierRecord) => sum + supplier.openIssues, 0);

  const reset = () => {
    setQuery("");
    setRisk("All risks");
    setCategory("All categories");
  };

  return (
    <ViewFrame
      actionLabel="Create supplier action"
      description="Quality, delivery, commitments and risk across the supply base."
      onAction={() => onCreateAction({ module: "suppliers", intent: "create-supplier-action" })}
      title="Suppliers"
    >
      <ExceptionSummary
        count={highRisk.length}
        detail={highRisk[0] ? `${highRisk[0].name} has ${highRisk[0].openIssues} open ${pluralize(highRisk[0].openIssues, "issue")}.` : "No supplier is currently classified high risk."}
        id="supplier-exceptions"
        label={`high-risk ${pluralize(highRisk.length, "supplier")}`}
        stats={[
          { label: "Open issues", value: openIssues },
          { label: "Average quality", value: `${average(suppliers.map((supplier: SupplierRecord) => supplier.qualityScore))}%` },
          { label: "Average delivery", value: `${average(suppliers.map((supplier: SupplierRecord) => supplier.deliveryScore))}%` },
        ]}
      />
      <FilterBar
        count={filtered.length}
        isFiltered={Boolean(query) || risk !== "All risks" || category !== "All categories"}
        label="Search supplier, category, owner or commitment"
        onQueryChange={setQuery}
        onReset={reset}
        query={query}
        total={suppliers.length}
      >
        <FilterSelect label="Risk" onChange={setRisk} options={["All risks", "High", "Medium", "Low"]} value={risk} />
        <FilterSelect
          label="Category"
          onChange={setCategory}
          options={["All categories", ...uniqueValues(suppliers.map((supplier: SupplierRecord) => supplier.category))]}
          value={category}
        />
      </FilterBar>
      <div className="sv-table-wrap">
        <table className="sv-table">
          <caption className="sv-visually-hidden">Supplier quality, delivery and action register</caption>
          <thead>
            <tr>
              <th scope="col">Supplier</th>
              <th scope="col">Category</th>
              <th scope="col">Owner</th>
              <th scope="col">Quality</th>
              <th scope="col">Delivery</th>
              <th scope="col">Open issues</th>
              <th scope="col">Next commitment</th>
              <th scope="col">Risk</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length ? (
              filtered.map((supplier: SupplierRecord) => (
                <tr key={supplier.id}>
                  <td data-label="Supplier">
                    <button className="sv-record-title" onClick={() => onOpenRecord(supplier.id)} type="button">{supplier.name}</button>
                    <span className="sv-record-id">{supplier.id}</span>
                  </td>
                  <td data-label="Category">{supplier.category}</td>
                  <td data-label="Owner">{supplier.owner}</td>
                  <td data-label="Quality"><span className="sv-score">{supplier.qualityScore}%</span></td>
                  <td data-label="Delivery"><span className="sv-score">{supplier.deliveryScore}%</span></td>
                  <td data-label="Open issues"><strong className="sv-tabular">{supplier.openIssues}</strong></td>
                  <td data-label="Next commitment">{supplier.nextCommitment}</td>
                  <td data-label="Risk"><StateLabel value={supplier.risk} /></td>
                </tr>
              ))
            ) : (
              <EmptyTableRow colSpan={8} noun="suppliers" />
            )}
          </tbody>
        </table>
      </div>
    </ViewFrame>
  );
}

export function SettingsView({ onOpenRecord, onCreateAction }: SecondaryViewProps) {
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("All areas");
  const [state, setState] = useState("All states");

  const filtered = useMemo(
    () =>
      settingsRecords
        .filter(
          (setting) =>
            matchesQuery(query, [setting.id, setting.name, setting.area, setting.value, setting.owner, setting.source]) &&
            (area === "All areas" || setting.area === area) &&
            (state === "All states" || setting.state === state),
        )
        .sort((a, b) => {
          const order: Record<SettingsRecord["state"], number> = { "Action required": 3, "Review due": 2, Healthy: 1 };
          return order[b.state] - order[a.state];
        }),
    [area, query, state],
  );

  const exceptions = settingsRecords.filter((setting) => setting.state === "Action required");

  const reset = () => {
    setQuery("");
    setArea("All areas");
    setState("All states");
  };

  return (
    <ViewFrame
      actionLabel="Create configuration review"
      description="Access, workflow, integrations and governance that control operational truth."
      onAction={() => onCreateAction({ module: "settings", intent: "create-configuration-review" })}
      title="Settings"
    >
      <ExceptionSummary
        count={exceptions.length}
        detail={exceptions[0]?.name ?? "No configuration currently requires intervention."}
        id="settings-exceptions"
        label={`configuration ${pluralize(exceptions.length, "issue")}`}
        stats={[
          { label: "Review due", value: settingsRecords.filter((setting) => setting.state === "Review due").length },
          { label: "Integrations", value: settingsRecords.filter((setting) => setting.area === "Integration").length },
          { label: "Healthy controls", value: settingsRecords.filter((setting) => setting.state === "Healthy").length },
        ]}
      />
      <FilterBar
        count={filtered.length}
        isFiltered={Boolean(query) || area !== "All areas" || state !== "All states"}
        label="Search setting, owner, source or configured value"
        onQueryChange={setQuery}
        onReset={reset}
        query={query}
        total={settingsRecords.length}
      >
        <FilterSelect
          label="Area"
          onChange={setArea}
          options={["All areas", ...uniqueValues(settingsRecords.map((setting) => setting.area))]}
          value={area}
        />
        <FilterSelect
          label="State"
          onChange={setState}
          options={["All states", "Action required", "Review due", "Healthy"]}
          value={state}
        />
      </FilterBar>
      <div className="sv-table-wrap">
        <table className="sv-table">
          <caption className="sv-visually-hidden">Operational platform configuration register</caption>
          <thead>
            <tr>
              <th scope="col">Setting</th>
              <th scope="col">Area</th>
              <th scope="col">Configured value</th>
              <th scope="col">Owner</th>
              <th scope="col">Source</th>
              <th scope="col">Last review</th>
              <th scope="col">State</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length ? (
              filtered.map((setting) => (
                <tr key={setting.id}>
                  <td data-label="Setting">
                    <button className="sv-record-title" onClick={() => onOpenRecord(setting.id)} type="button">{setting.name}</button>
                    <span className="sv-record-id">{setting.id}</span>
                  </td>
                  <td data-label="Area">{setting.area}</td>
                  <td data-label="Configured value">{setting.value}</td>
                  <td data-label="Owner">{setting.owner}</td>
                  <td data-label="Source"><SettingSourceIcon area={setting.area} />{setting.source}</td>
                  <td data-label="Last review"><span className="sv-tabular">{formatDate(setting.lastReview)}</span></td>
                  <td data-label="State"><StateLabel value={setting.state} /></td>
                </tr>
              ))
            ) : (
              <EmptyTableRow colSpan={7} noun="settings" />
            )}
          </tbody>
        </table>
      </div>
    </ViewFrame>
  );
}

function SettingSourceIcon({ area }: { area: SettingsRecord["area"] }) {
  const Icon = area === "Integration" ? Database : area === "Access" ? LockKeyhole : area === "Notification" ? BellRing : area === "Workflow" ? RefreshCw : Settings2;
  return <Icon aria-hidden="true" className="sv-inline-icon" size={16} />;
}

const secondaryViewStyles = `
  .sv-secondary-view {
    --sv-ink: #000000;
    --sv-subtle-ink: #3f3f3f;
    --sv-muted-ink: #666666;
    --sv-rule: #dedede;
    --sv-rule-strong: #9c9c9c;
    --sv-focus: #000000;
    width: 100%;
    background: #ffffff;
    color: var(--sv-ink);
    font-family: inherit;
  }

  .sv-secondary-view *,
  .sv-secondary-view *::before,
  .sv-secondary-view *::after {
    box-sizing: border-box;
  }

  .sv-header {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    min-height: 40px;
    padding: 0 0 12px;
  }

  .sv-primary-action,
  .sv-reset,
  .sv-record-title {
    font: inherit;
  }

  .sv-primary-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 40px;
    padding: 0 14px;
    gap: 6px;
    flex: 0 0 auto;
    border: 1px solid var(--sv-ink);
    border-radius: 0;
    background: var(--sv-ink);
    color: #ffffff;
    font-size: 0.8125rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 160ms ease-out, color 160ms ease-out;
  }

  .sv-primary-action:hover {
    background: #222222;
  }

  .sv-primary-action:active {
    background: #000000;
  }

  .sv-summary {
    display: grid;
    grid-template-columns: minmax(220px, 1fr) minmax(0, 2fr);
    margin-top: 0;
    border-top: 1px solid var(--sv-rule-strong);
    border-bottom: 1px solid var(--sv-rule-strong);
    border-radius: 0;
    background: #ffffff;
  }

  .sv-summary-exception {
    min-width: 0;
    padding: 12px 14px 12px 0;
    border-right: 1px solid var(--sv-rule);
    background: #ffffff;
    color: var(--sv-ink);
  }

  .sv-summary-title-line {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .sv-summary-title-line h3 {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 600;
    line-height: 1.25;
  }

  .sv-summary-exception p {
    margin: 6px 0 2px;
    font-size: 0.8125rem;
    line-height: 1.35;
  }

  .sv-summary-exception p strong {
    margin-right: 3px;
    font-size: 1rem;
    font-variant-numeric: tabular-nums;
  }

  .sv-summary-exception > span {
    display: block;
    color: var(--sv-muted-ink);
    font-size: 0.75rem;
    line-height: 1.35;
  }

  .sv-summary-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    min-width: 0;
    margin: 0;
    background: #ffffff;
  }

  .sv-summary-stats > div {
    min-width: 0;
    padding: 12px;
  }

  .sv-summary-stats > div + div {
    border-left: 1px solid var(--sv-rule);
  }

  .sv-summary-stats dt {
    color: var(--sv-subtle-ink);
    font-size: 0.75rem;
    line-height: 1.3;
  }

  .sv-summary-stats dd {
    margin: 4px 0 0;
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.2;
    font-variant-numeric: tabular-nums;
  }

  .sv-summary-stats span {
    display: block;
    margin-top: 4px;
    color: var(--sv-muted-ink);
    font-size: 0.75rem;
    line-height: 1.4;
  }

  .sv-filterbar {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    padding: 16px 0 8px;
  }

  .sv-query {
    display: flex;
    align-items: center;
    gap: 6px;
    width: min(100%, 320px);
    min-height: 40px;
    padding: 0 10px;
    border: 1px solid var(--sv-rule-strong);
    border-radius: 0;
    background: #ffffff;
    color: var(--sv-subtle-ink);
  }

  .sv-query:focus-within,
  .sv-filter-select:focus-within {
    border-color: var(--sv-focus);
    outline: 2px solid var(--sv-focus);
    outline-offset: 1px;
  }

  .sv-query input {
    width: 100%;
    min-width: 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--sv-ink);
    font: inherit;
    font-size: 0.8125rem;
  }

  .sv-query input::placeholder {
    color: var(--sv-muted-ink);
    opacity: 1;
  }

  .sv-filter-controls {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .sv-filter-select {
    position: relative;
    display: inline-flex;
    min-height: 40px;
    border: 1px solid var(--sv-rule-strong);
    border-radius: 0;
    background: #ffffff;
  }

  .sv-filter-select > span {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .sv-filter-select select {
    min-width: 138px;
    min-height: 38px;
    padding: 0 30px 0 10px;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--sv-ink);
    font: inherit;
    font-size: 0.8125rem;
    cursor: pointer;
  }

  .sv-result-count {
    margin-left: auto;
    color: var(--sv-subtle-ink);
    font-size: 0.75rem;
    font-variant-numeric: tabular-nums;
  }

  .sv-reset {
    min-height: 40px;
    padding: 0 8px;
    border: 0;
    background: transparent;
    color: var(--sv-ink);
    font-size: 0.75rem;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }

  .sv-table-wrap {
    width: 100%;
    overflow-x: auto;
    scrollbar-gutter: stable;
  }

  .sv-table {
    width: 100%;
    min-width: 860px;
    border-collapse: collapse;
    table-layout: auto;
    color: #000000;
    font-size: 0.8125rem;
    font-weight: 400;
    line-height: 1.35;
  }

  .sv-table th {
    padding: 7px 10px;
    border-top: 1px solid var(--sv-rule-strong);
    border-bottom: 1px solid var(--sv-rule-strong);
    background: #ffffff;
    color: #000000;
    font-size: 0.75rem;
    font-weight: 600;
    text-align: left;
    white-space: nowrap;
  }

  .sv-table td {
    max-width: 280px;
    padding: 8px 10px;
    border-bottom: 1px solid var(--sv-rule);
    vertical-align: top;
  }

  .sv-table tbody tr:last-child td {
    border-bottom: 0;
  }

  .sv-table tbody tr:hover {
    background: #f6f6f6;
  }

  .sv-record-title {
    display: block;
    max-width: 260px;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--sv-ink);
    font-size: 0.8125rem;
    font-weight: 600;
    line-height: 1.35;
    text-align: left;
    text-decoration: underline;
    text-decoration-color: transparent;
    text-underline-offset: 3px;
    cursor: pointer;
  }

  .sv-record-title:hover {
    text-decoration-color: currentColor;
  }

  .sv-record-title.sv-person {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .sv-record-id,
  .sv-cell-note,
  .sv-overdue {
    display: block;
    margin-top: 4px;
    color: var(--sv-muted-ink);
    font-size: 0.75rem;
    font-weight: 500;
    line-height: 1.35;
  }

  .sv-record-id {
    font-variant-numeric: tabular-nums;
  }

  .sv-overdue {
    color: #000000;
    font-weight: 700;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .sv-status {
    display: inline-flex;
    align-items: center;
    min-height: 22px;
    gap: 4px;
    padding: 2px 5px;
    border: 1px solid var(--sv-rule-strong);
    border-radius: 0;
    background: #ffffff;
    color: var(--sv-subtle-ink);
    font-size: 0.75rem;
    font-weight: 600;
    line-height: 1.2;
    white-space: nowrap;
  }

  .sv-status[data-tone="critical"] {
    border-color: #000000;
    background: #000000;
    color: #ffffff;
  }

  .sv-status[data-tone="warning"] {
    border-color: #000000;
    background: #d8d8d8;
    color: #000000;
  }

  .sv-status[data-tone="positive"] {
    border-color: #8a8a8a;
    background: #ffffff;
    color: #333333;
  }

  .sv-status[data-tone="active"] {
    border-color: #000000;
    border-style: dashed;
    background: #ffffff;
    color: #000000;
  }

  .sv-progress-wrap {
    display: grid;
    grid-template-columns: 32px minmax(70px, 1fr);
    align-items: center;
    gap: 6px;
    min-width: 110px;
  }

  .sv-progress {
    display: block;
    width: 100%;
    height: 4px;
    overflow: hidden;
    background: #d2d2d2;
    border-radius: 0;
  }

  .sv-progress > span {
    display: block;
    height: 100%;
    background: var(--sv-ink);
  }

  .sv-tabular,
  .sv-score {
    font-variant-numeric: tabular-nums;
  }

  .sv-score {
    display: inline;
    color: #000000;
    font-weight: 600;
  }

  .sv-inline-icon {
    margin-right: 6px;
    vertical-align: -3px;
  }

  .sv-empty-row td {
    padding: 24px 12px;
    text-align: center;
  }

  .sv-empty-row strong,
  .sv-empty-row span {
    display: block;
  }

  .sv-empty-row span {
    margin-top: 6px;
    color: var(--sv-subtle-ink);
  }

  .sv-primary-action:focus-visible,
  .sv-reset:focus-visible,
  .sv-record-title:focus-visible {
    outline: 2px solid var(--sv-focus);
    outline-offset: 2px;
  }

  .sv-visually-hidden {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
  }

  @media (max-width: 980px) {
    .sv-summary {
      grid-template-columns: 1fr;
    }

    .sv-summary-exception {
      border-right: 0;
      border-bottom: 1px solid var(--sv-rule);
    }

    .sv-result-count {
      margin-left: 0;
    }
  }

  @media (max-width: 720px) {
    .sv-header {
      display: block;
      min-height: 0;
      padding-bottom: 10px;
    }

    .sv-primary-action {
      width: 100%;
    }

    .sv-summary-exception {
      padding: 10px 0;
    }

    .sv-summary-exception p {
      margin-top: 8px;
    }

    .sv-summary-exception > span {
      display: -webkit-box;
      overflow: hidden;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }

    .sv-summary-stats {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .sv-summary-stats > div {
      padding: 8px 6px;
      border-top: 0;
    }

    .sv-summary-stats dt {
      font-size: 0.75rem;
    }

    .sv-summary-stats dd {
      margin-top: 4px;
      font-size: 1rem;
    }

    .sv-summary-stats dd span {
      display: none;
    }

    .forge-app:has(.sv-secondary-view) .floating-create {
      display: none;
    }

    .sv-filterbar,
    .sv-filter-controls {
      align-items: stretch;
      flex-direction: column;
      width: 100%;
    }

    .sv-query,
    .sv-filter-select,
    .sv-filter-select select {
      width: 100%;
    }

    .sv-result-count {
      padding: 4px 0;
    }

    .sv-reset {
      align-self: flex-start;
    }

    .sv-table-wrap {
      overflow: visible;
    }

    .sv-table {
      min-width: 0;
    }

    .sv-table thead {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    .sv-table,
    .sv-table tbody,
    .sv-table tr,
    .sv-table td {
      display: block;
      width: 100%;
    }

    .sv-table tr {
      padding: 6px 0;
      border-bottom: 1px solid var(--sv-rule-strong);
    }

    .sv-table tbody tr:last-child {
      border-bottom: 0;
    }

    .sv-table td {
      display: grid;
      grid-template-columns: minmax(104px, 32%) minmax(0, 1fr);
      gap: 10px;
      max-width: none;
      padding: 6px 0;
      border: 0;
    }

    .sv-table td::before {
      content: attr(data-label);
      color: var(--sv-subtle-ink);
      font-size: 0.75rem;
      font-weight: 600;
    }

    .sv-table .sv-empty-row td {
      display: block;
      padding: 24px 0;
    }

    .sv-table .sv-empty-row td::before {
      display: none;
    }

    .sv-record-title {
      max-width: none;
    }

  }

  @media (pointer: coarse) {
    .sv-primary-action,
    .sv-query,
    .sv-filter-select,
    .sv-filter-select select,
    .sv-reset {
      min-height: 44px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .sv-primary-action {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    .sv-status,
    .sv-summary,
    .sv-primary-action {
      border-color: CanvasText;
    }

    .sv-primary-action,
    .sv-status[data-tone="critical"] {
      background: CanvasText;
      color: Canvas;
    }
  }
`;
