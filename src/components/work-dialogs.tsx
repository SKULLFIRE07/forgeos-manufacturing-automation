"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  Check,
  CircleDot,
  FileCheck2,
  Link2,
  MessageSquareText,
  Paperclip,
  PauseOctagon,
  Play,
  RotateCcw,
} from "lucide-react";

import { employees, projects } from "@/lib/seed";
import type { CreateWorkInput, UserRole, WorkItem, WorkState } from "@/lib/types";
import {
  Button,
  Dialog,
  Drawer,
  Field,
  ProgressBar,
  SelectField,
  StatusBadge,
} from "@/components/ui";

interface CreateWorkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: CreateWorkInput) => void;
}

const initialInput: CreateWorkInput = {
  title: "",
  type: "Production",
  priority: "High",
  owner: "",
  station: "",
  due: "2026-07-19T10:00",
  project: "",
};

export function CreateWorkDialog({ open, onOpenChange, onCreate }: CreateWorkDialogProps) {
  const formId = useId();
  const titleRef = useRef<HTMLInputElement>(null);
  const ownerRef = useRef<HTMLSelectElement>(null);
  const dueRef = useRef<HTMLInputElement>(null);
  const stationRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState<CreateWorkInput>(initialInput);
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    if (!open) {
      setAttempted(false);
    }
  }, [open]);

  const errors = {
    title: !input.title.trim() ? "Enter the work that must be completed." : "",
    owner: !input.owner ? "Choose one accountable owner." : "",
    station: !input.station.trim() ? "Enter the station, machine, or work area." : "",
    due: !input.due ? "Choose when this work is due." : "",
  };
  const isValid = !Object.values(errors).some(Boolean);

  function update<Key extends keyof CreateWorkInput>(key: Key, value: CreateWorkInput[Key]) {
    setInput((current) => ({ ...current, [key]: value }));
  }

  function handleCreate() {
    setAttempted(true);
    if (!isValid) {
      if (errors.title) {
        titleRef.current?.focus();
      } else if (errors.owner) {
        ownerRef.current?.focus();
      } else if (errors.due) {
        dueRef.current?.focus();
      } else if (errors.station) {
        stationRef.current?.focus();
      }
      return;
    }

    onCreate({ ...input, title: input.title.trim(), station: input.station.trim() });
    setInput(initialInput);
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => onOpenChange(nextOpen)}
      title="Create work item"
      description="Give this work one owner, one due time, and the context needed to act."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Keep without creating</Button>
          <Button type="submit" form={formId}>Create work item</Button>
        </>
      }
    >
      <form id={formId} className="work-form" onSubmit={(event) => { event.preventDefault(); handleCreate(); }} noValidate>
        <Field
          ref={titleRef}
          label="Work to complete"
          required
          autoFocus
          value={input.title}
          onChange={(event) => update("title", event.target.value)}
          placeholder="Example: Verify RT repair on hull frame"
          error={attempted ? errors.title : undefined}
        />
        <div className="form-grid">
          <SelectField
            label="Work type"
            required
            value={input.type}
            onChange={(event) => update("type", event.target.value as CreateWorkInput["type"])}
            options={["Production", "Quality", "Maintenance", "Safety", "Project", "Document"].map((value) => ({ value, label: value }))}
          />
          <SelectField
            label="Priority"
            required
            value={input.priority}
            onChange={(event) => update("priority", event.target.value as CreateWorkInput["priority"])}
            options={["Critical", "High", "Medium", "Low"].map((value) => ({ value, label: value }))}
          />
          <SelectField
            ref={ownerRef}
            label="Accountable owner"
            required
            value={input.owner}
            onChange={(event) => update("owner", event.target.value)}
            placeholder="Choose an owner"
            error={attempted ? errors.owner : undefined}
            options={employees.slice(0, 36).map((employee) => ({ value: employee.name, label: `${employee.name} · ${employee.role}` }))}
          />
          <Field
            ref={dueRef}
            label="Due date and time"
            type="datetime-local"
            required
            value={input.due}
            onChange={(event) => update("due", event.target.value)}
            error={attempted ? errors.due : undefined}
          />
          <Field
            ref={stationRef}
            label="Station, machine, or area"
            required
            value={input.station}
            onChange={(event) => update("station", event.target.value)}
            placeholder="Example: Welding Bay 4"
            error={attempted ? errors.station : undefined}
          />
          <SelectField
            label="Project"
            optional
            value={input.project}
            onChange={(event) => update("project", event.target.value)}
            placeholder="No linked project"
            options={projects.map((project) => ({ value: project.id, label: `${project.id} · ${project.name}` }))}
          />
        </div>
        <div className="form-guidance">
          <FileCheck2 aria-hidden="true" />
          <p><strong>Closure needs evidence.</strong> The owner records execution and a supervisor independently verifies the result.</p>
        </div>
      </form>
    </Dialog>
  );
}

interface WorkDetailDrawerProps {
  item: WorkItem | null;
  role: UserRole;
  onClose: () => void;
  onTransition: (item: WorkItem, state: WorkState, note: string) => void;
}

const workflowStates: WorkState[] = ["Not started", "In progress", "Awaiting verification", "Closed"];

export function WorkDetailDrawer({ item, role, onClose, onTransition }: WorkDetailDrawerProps) {
  const [note, setNote] = useState("");

  useEffect(() => setNote(""), [item?.id]);

  const actions = useMemo<Array<{
    state: WorkState;
    label: string;
    icon: typeof Play;
    variant?: "primary" | "secondary";
  }>>(() => {
    if (!item) return [];
    if (item.state === "Not started") return [{ state: "In progress" as const, label: "Accept work", icon: Play }];
    if (item.state === "In progress") return [
      { state: "Blocked" as const, label: "Mark blocked", icon: PauseOctagon, variant: "secondary" as const },
      { state: "Awaiting verification" as const, label: "Send for verification", icon: FileCheck2 },
    ];
    if (item.state === "Blocked") return [{ state: "In progress" as const, label: "Resume work", icon: RotateCcw }];
    if (item.state === "Awaiting verification") {
      return role === "Operator"
        ? []
        : [
            { state: "In progress" as const, label: "Return for correction", icon: RotateCcw, variant: "secondary" as const },
            { state: "Closed" as const, label: "Verify and close", icon: Check },
          ];
    }
    return role === "Admin" ? [{ state: "In progress" as const, label: "Reopen work", icon: RotateCcw, variant: "secondary" as const }] : [];
  }, [item, role]);

  if (!item) return null;

  const currentIndex = item.state === "Blocked" ? 1 : workflowStates.indexOf(item.state);

  return (
    <Drawer
      open={Boolean(item)}
      onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}
      title={item.title}
      description={`${item.id} · ${item.type}`}
      size="lg"
      footer={
        actions.length ? (
          <>
            {actions.map(({ state, label, icon, variant }) => (
              <Button
                key={state}
                startIcon={icon}
                variant={variant}
                onClick={() => {
                  onTransition(item, state, note);
                  setNote("");
                }}
              >
                {label}
              </Button>
            ))}
          </>
        ) : <span className="drawer-footer-note">{item.state === "Closed" ? "Closed work is read only." : "A supervisor must verify this work."}</span>
      }
    >
      <div className="work-detail">
        <div className="work-detail__status">
          <StatusBadge status={item.state} />
          <StatusBadge status={item.priority} />
          {item.overdueMinutes ? <span className="overdue-copy">{item.overdueMinutes} minutes overdue</span> : null}
        </div>

        {item.blocker ? (
          <section className="blocker-callout" aria-labelledby="blocker-title">
            <PauseOctagon aria-hidden="true" />
            <div><strong id="blocker-title">Current blocker</strong><p>{item.blocker}</p></div>
          </section>
        ) : null}

        <dl className="detail-grid">
          <div><dt>Owner</dt><dd>{item.owner}<small>{item.ownerRole}</small></dd></div>
          <div><dt>Supervisor</dt><dd>{item.supervisor}</dd></div>
          <div><dt>Location</dt><dd>{item.station}<small>{item.unit} · {item.shift} shift</small></dd></div>
          <div><dt>Due</dt><dd>{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.due))}</dd></div>
          {item.project ? <div><dt>Project</dt><dd><Link2 aria-hidden="true" /> {item.project}</dd></div> : null}
          {item.asset ? <div><dt>Asset</dt><dd><Link2 aria-hidden="true" /> {item.asset}</dd></div> : null}
        </dl>

        <section className="detail-section" aria-labelledby="checklist-title">
          <div className="detail-section__heading"><h3 id="checklist-title">Execution checklist</h3><span>{item.checklistDone} of {item.checklistTotal}</span></div>
          <ProgressBar label="Checklist completion" value={item.checklistDone} max={item.checklistTotal} />
          <ul className="evidence-list">
            {Array.from({ length: Math.min(item.checklistTotal, 5) }, (_, index) => (
              <li key={index} data-complete={index < item.checklistDone || undefined}>
                {index < item.checklistDone ? <Check aria-hidden="true" /> : <CircleDot aria-hidden="true" />}
                <span>{index < item.checklistDone ? "Step recorded with timestamp" : "Execution step pending"}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="detail-section" aria-labelledby="evidence-title">
          <div className="detail-section__heading"><h3 id="evidence-title">Evidence</h3><span>{item.evidenceCount} files</span></div>
          {item.evidenceCount ? (
            <ul className="attachment-list">
              {Array.from({ length: item.evidenceCount }, (_, index) => (
                <li key={index}><Paperclip aria-hidden="true" /><span>Execution evidence {index + 1}</span><button>View file</button></li>
              ))}
            </ul>
          ) : <p className="muted-copy">No evidence attached yet. Evidence is required before verification.</p>}
          <Button variant="secondary" startIcon={Paperclip}>Attach evidence</Button>
        </section>

        <section className="detail-section" aria-labelledby="history-title">
          <div className="detail-section__heading"><h3 id="history-title">Lifecycle</h3><span>Updated {new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(-1, "hour")}</span></div>
          <ol className="drawer-timeline">
            {workflowStates.map((state, index) => (
              <li key={state} data-complete={index <= currentIndex || undefined} data-current={index === currentIndex || undefined}>
                <span>{index <= currentIndex ? <Check aria-hidden="true" /> : index + 1}</span>
                <div><strong>{state}</strong><small>{index <= currentIndex ? "Recorded in audit history" : "Pending"}</small></div>
              </li>
            ))}
          </ol>
        </section>

        {actions.length ? (
          <Field
            label="Update note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Record what changed, what remains, or why work is blocked"
            hint="This note becomes part of the permanent work history."
          />
        ) : null}

        <div className="audit-note"><MessageSquareText aria-hidden="true" /><span>Every state change records the actor, time, note, and evidence.</span></div>
      </div>
    </Drawer>
  );
}

interface RecordDrawerProps {
  recordId: string | null;
  record: Record<string, unknown> | null;
  onClose: () => void;
  onCreateAction: () => void;
}

function titleCase(value: string) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (character) => character.toUpperCase());
}

export function RecordDrawer({ recordId, record, onClose, onCreateAction }: RecordDrawerProps) {
  if (!recordId || !record) return null;
  const title = String(record.name ?? record.title ?? recordId);
  const entries = Object.entries(record).filter(([key]) => !["id", "name", "title"].includes(key));
  return (
    <Drawer
      open
      onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}
      title={title}
      description={recordId}
      size="md"
      footer={<Button onClick={onCreateAction}>Create linked action</Button>}
    >
      <div className="record-inspector">
        <div className="record-summary-mark"><FileCheck2 aria-hidden="true" /><span>Live operational record</span></div>
        <dl className="record-fields">
          {entries.map(([key, value]) => (
            <div key={key}>
              <dt>{titleCase(key)}</dt>
              <dd>{typeof value === "number" && key.toLowerCase().includes("score") ? `${value}%` : String(value ?? "Not recorded")}</dd>
            </div>
          ))}
        </dl>
        <section className="detail-section">
          <div className="detail-section__heading"><h3>Accountability history</h3><span>Immutable</span></div>
          <ol className="mini-history">
            <li><strong>Record synced</strong><span>Today, 08:57</span></li>
            <li><strong>Owner confirmed</strong><span>Yesterday, 17:20</span></li>
            <li><strong>Source imported</strong><span>18 Jul 2026</span></li>
          </ol>
        </section>
      </div>
    </Drawer>
  );
}
