"use client";

import { useMemo, useState } from "react";
import { Columns3, List, Plus, Search, SlidersHorizontal } from "lucide-react";

import type { UserRole, WorkItem, WorkState } from "@/lib/types";
import {
  Button,
  EmptyState,
  Field,
  ProgressBar,
  SegmentedControl,
  SelectField,
  StatusBadge,
} from "@/components/ui";

interface WorkViewProps {
  items: WorkItem[];
  role: UserRole;
  currentPerson: string;
  onCreateWork: () => void;
  onOpenWork: (item: WorkItem) => void;
}

type ViewMode = "list" | "board";
type WorkScope = "all" | "mine" | "verification";

const states: WorkState[] = [
  "Not started",
  "In progress",
  "Blocked",
  "Awaiting verification",
  "Closed",
];

function formatDue(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function WorkView({
  items,
  role,
  currentPerson,
  onCreateWork,
  onOpenWork,
}: WorkViewProps) {
  const [view, setView] = useState<ViewMode>("list");
  const [scope, setScope] = useState<WorkScope>(role === "Operator" ? "mine" : "all");
  const [query, setQuery] = useState("");
  const [state, setState] = useState("Active");
  const [priority, setPriority] = useState("All priorities");
  const [type, setType] = useState("All types");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((item) => {
      const scopeMatch =
        scope === "all" ||
        (scope === "mine" && item.owner === currentPerson) ||
        (scope === "verification" && item.state === "Awaiting verification");
      const stateMatch =
        state === "All states" ||
        (state === "Active" && item.state !== "Closed") ||
        item.state === state;
      const priorityMatch = priority === "All priorities" || item.priority === priority;
      const typeMatch = type === "All types" || item.type === type;
      const queryMatch =
        !normalized ||
        [item.id, item.title, item.owner, item.station, item.project, item.asset]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(normalized));
      return scopeMatch && stateMatch && priorityMatch && typeMatch && queryMatch;
    });
  }, [currentPerson, items, priority, query, scope, state, type]);

  const activeFilters = [query, state !== "Active", priority !== "All priorities", type !== "All types"].filter(Boolean).length;
  const resetFilters = () => {
    setQuery("");
    setState("Active");
    setPriority("All priorities");
    setType("All types");
  };

  return (
    <div className="page-stack work-register" data-testid="work-view">
      <section className="work-control-band" aria-label="Work register controls">
        <SegmentedControl
          legend="Work scope"
          hideLegend
          value={scope}
          onValueChange={setScope}
          options={[
            { value: "all", label: "All work" },
            { value: "mine", label: "My work" },
            { value: "verification", label: "Awaiting me" },
          ]}
        />
        <div className="work-control-actions">
          <SegmentedControl
            legend="Work view"
            hideLegend
            value={view}
            onValueChange={setView}
            options={[
              { value: "list", label: "List", icon: List },
              { value: "board", label: "Board", icon: Columns3 },
            ]}
          />
          <Button startIcon={Plus} onClick={onCreateWork}>Create work item</Button>
        </div>
      </section>

      <section className="filter-band" aria-labelledby="work-filters-title">
        <div className="filter-title">
          <SlidersHorizontal aria-hidden="true" />
          <div>
            <strong id="work-filters-title">Filter work</strong>
            <span>{filtered.length} of {items.length} records</span>
          </div>
        </div>
        <Field
          label="Search work"
          className="filter-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="ID, work, owner, station"
        />
        <SelectField
          label="State"
          value={state}
          onChange={(event) => setState(event.target.value)}
          options={["Active", "All states", ...states].map((value) => ({ value, label: value }))}
        />
        <SelectField
          label="Priority"
          value={priority}
          onChange={(event) => setPriority(event.target.value)}
          options={["All priorities", "Critical", "High", "Medium", "Low"].map((value) => ({ value, label: value }))}
        />
        <SelectField
          label="Type"
          value={type}
          onChange={(event) => setType(event.target.value)}
          options={["All types", "Production", "Quality", "Maintenance", "Safety", "Project", "Document"].map((value) => ({ value, label: value }))}
        />
        <Button variant="quiet" disabled={activeFilters === 0} onClick={resetFilters}>Reset filters</Button>
      </section>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No work matches these filters"
          description="Reset the filters or create a work item for work that is not yet in the register."
          action={<Button onClick={resetFilters}>Show all work</Button>}
          secondaryAction={<Button variant="secondary" onClick={onCreateWork}>Create work item</Button>}
        />
      ) : view === "list" ? (
        <section className="operational-panel work-register-panel" aria-label="Work register">
          <div className="data-table-wrap">
            <table className="data-table work-register-table" aria-label="Work register">
              <thead>
                <tr>
                  <th>Work item</th>
                  <th>Type</th>
                  <th>Owner</th>
                  <th>Location</th>
                  <th>Due</th>
                  <th>Progress</th>
                  <th>State</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td data-label="Work item">
                      <button className="table-link" onClick={() => onOpenWork(item)}>
                        <strong>{item.title}</strong>
                        <span>{item.id} · <StatusBadge status={item.priority} /></span>
                      </button>
                    </td>
                    <td data-label="Type">{item.type}</td>
                    <td data-label="Owner"><strong>{item.owner}</strong><small>{item.ownerRole}</small></td>
                    <td data-label="Location">{item.station}<small>{item.unit} · {item.shift} shift</small></td>
                    <td data-label="Due" className="tabular">{formatDue(item.due)}{item.overdueMinutes ? <small>{item.overdueMinutes} minutes late</small> : null}</td>
                    <td data-label="Progress">
                      <ProgressBar label={`${item.title} checklist`} value={item.checklistDone} max={item.checklistTotal} valueText={`${item.checklistDone}/${item.checklistTotal}`} />
                    </td>
                    <td data-label="State"><StatusBadge status={item.state} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <footer className="panel-footer">
            <span>{filtered.filter((item) => item.state === "Blocked").length} blocked</span>
            <span>{filtered.filter((item) => item.state === "Awaiting verification").length} awaiting verification</span>
            <span>{filtered.filter((item) => item.state === "Closed").length} closed</span>
          </footer>
        </section>
      ) : (
        <section className="work-board" aria-label="Work by state">
          {states.filter((columnState) => columnState !== "Closed").map((columnState) => {
            const columnItems = filtered.filter((item) => item.state === columnState);
            return (
              <div className="board-column" key={columnState}>
                <header>
                  <StatusBadge status={columnState} />
                  <span>{columnItems.length}</span>
                </header>
                <div className="board-column__items">
                  {columnItems.length ? columnItems.map((item) => (
                    <button key={item.id} className="board-item" onClick={() => onOpenWork(item)}>
                      <span className="board-item__meta"><strong>{item.id}</strong><StatusBadge status={item.priority} /></span>
                      <strong>{item.title}</strong>
                      <span>{item.owner} · {formatDue(item.due)}</span>
                      <ProgressBar label={`${item.title} checklist`} value={item.checklistDone} max={item.checklistTotal} valueText={`${item.checklistDone}/${item.checklistTotal}`} />
                    </button>
                  )) : <p className="board-empty">No work in this state</p>}
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
