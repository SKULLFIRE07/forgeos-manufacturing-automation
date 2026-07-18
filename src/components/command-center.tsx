"use client";

import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock3,
  ShieldAlert,
  Users,
} from "lucide-react";

import {
  rankProjectsByExposure,
  selectCommandWork,
  selectShiftWorkforce,
} from "@/lib/metrics";
import { employees, projects } from "@/lib/seed";
import type {
  ModuleId,
  WorkItem,
} from "@/lib/types";
import {
  Button,
  MetricStripItem,
  ProgressBar,
  StatusBadge,
} from "@/components/ui";

interface CommandCenterProps {
  items: WorkItem[];
  unit: WorkItem["unit"];
  shift: WorkItem["shift"];
  onCreateWork: () => void;
  onOpenWork: (item: WorkItem) => void;
  onNavigate: (module: ModuleId) => void;
}

function formatDue(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function TrendIcon({ trend }: { trend: "Worsening" | "Flat" | "Improving" }) {
  const Icon = trend === "Worsening" ? ArrowUpRight : trend === "Improving" ? ArrowDownRight : ArrowRight;
  return <Icon aria-label={trend} />;
}

export function CommandCenter({
  items,
  unit,
  shift,
  onCreateWork,
  onOpenWork,
  onNavigate,
}: CommandCenterProps) {
  const command = selectCommandWork(items, unit, shift);
  const workforce = selectShiftWorkforce(employees, unit, shift);
  const priorityItems = command.rankedActiveItems.slice(0, 5);
  const riskProjects = rankProjectsByExposure(projects);
  const scopeLabel = `${unit}, ${shift} shift`;
  const decisionsPending = command.decisionQueue.length;
  const decisionsLabel = decisionsPending === 0
    ? "No decisions pending"
    : `${decisionsPending} ${decisionsPending === 1 ? "decision" : "decisions"} pending`;

  return (
    <div className="page-stack command-center" data-testid="command-center">
      <section className="metric-strip metric-strip--command" aria-label={`Operational pulse for ${scopeLabel}`}>
        <MetricStripItem
          label="Open exceptions"
          value={command.metrics.exceptionCount}
          detail={`${command.metrics.escalationCount} ${command.metrics.escalationCount === 1 ? "needs" : "need"} escalation`}
          icon={AlertTriangle}
          className="command-metric command-metric--primary"
        />
        <MetricStripItem
          label="People on shift"
          value={workforce.present}
          detail={workforce.total === 0 ? "No people rostered" : `${workforce.present} of ${workforce.total} present`}
          icon={Users}
          className="command-metric command-metric--supporting"
        />
        <MetricStripItem
          label="Blocked work"
          value={command.metrics.blockedCount}
          detail={`${command.metrics.overdueBlockedCount} overdue`}
          icon={ShieldAlert}
          className="command-metric command-metric--supporting"
        />
        <MetricStripItem
          label="Active this shift"
          value={command.metrics.activeCount}
          detail={`${command.metrics.awaitingVerificationCount} awaiting verification`}
          icon={Clock3}
          className="command-metric command-metric--supporting"
        />
      </section>

      <div className="command-grid command-grid--distilled">
        <section className="operational-panel live-work-panel live-work-panel--primary" aria-labelledby="live-work-title">
          <div className="section-heading section-heading--live-work">
            <div>
              <p className="eyebrow">Live execution</p>
              <h2 id="live-work-title">Work that needs attention</h2>
            </div>
            <div className="section-actions live-work-actions">
              <Button
                variant="secondary"
                size="sm"
                startIcon={decisionsPending === 0 ? Check : AlertTriangle}
                className="decision-pending-control"
                aria-label={`${decisionsLabel} for ${scopeLabel}. Open work register.`}
                onClick={() => onNavigate("work")}
              >
                <span className="decision-pending-control__count tabular">{decisionsPending}</span>
                <span className="decision-pending-control__label">
                  {decisionsPending === 1 ? "decision pending" : "decisions pending"}
                </span>
              </Button>
              <Button onClick={onCreateWork}>Create work item</Button>
            </div>
          </div>
          <div className="data-table-wrap">
            <table className="data-table work-table work-table--decision-first">
              <thead>
                <tr>
                  <th>Work item</th>
                  <th>Station</th>
                  <th>Owner</th>
                  <th>Due</th>
                  <th>State</th>
                </tr>
              </thead>
              <tbody>
                {priorityItems.length === 0 ? (
                  <tr>
                    <td colSpan={5}>No active work for {scopeLabel}.</td>
                  </tr>
                ) : priorityItems.map((item) => (
                  <tr key={item.id}>
                    <td data-label="Work item">
                      <button className="table-link command-work-link" onClick={() => onOpenWork(item)}>
                        <span className="command-work-link__heading">
                          <StatusBadge status={item.priority} />
                          <strong>{item.title}</strong>
                        </span>
                        <span className="command-work-link__meta">{item.id}{item.project ? ` · ${item.project}` : ""}</span>
                        <span className="command-work-link__mobile-meta">
                          {item.station} · {item.owner} · {formatDue(item.due)}
                        </span>
                      </button>
                    </td>
                    <td data-label="Station">{item.station}</td>
                    <td data-label="Owner">{item.owner}</td>
                    <td data-label="Due" className="tabular">{formatDue(item.due)}</td>
                    <td data-label="State"><StatusBadge status={item.state} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <footer className="panel-footer">
            <span>Showing {priorityItems.length} of {command.activeItems.length} active work items in {scopeLabel}</span>
            <button className="text-action" onClick={() => onNavigate("work")}>Open work register</button>
          </footer>
        </section>

        <section className="operational-panel project-risk-panel project-risk-panel--compact" aria-labelledby="project-risk-title">
          <div className="section-heading section-heading--compact section-heading--plain">
            <h2 id="project-risk-title">Project risk</h2>
            <button className="text-action" onClick={() => onNavigate("projects")}>Open projects</button>
          </div>
          <div className="risk-register risk-register--compact">
            {riskProjects.slice(0, 3).map((project) => (
              <button key={project.id} className="risk-row risk-row--compact" onClick={() => onNavigate("projects")}>
                <span className="risk-row__identity">
                  <strong>{project.id}</strong>
                  <small>{project.name}</small>
                </span>
                <span className="risk-progress risk-progress--compact">
                  <span className="risk-progress__summary">
                    <span className="tabular">{project.completion}% complete</span>
                    <span className="tabular">
                      {project.openActions} open {project.openActions === 1 ? "action" : "actions"}
                    </span>
                  </span>
                  <ProgressBar label={`${project.name} completion`} value={project.completion} showValue={false} />
                  <small>{project.riskDriver}</small>
                </span>
                <StatusBadge status={project.risk} />
                <TrendIcon trend={project.trend} />
              </button>
            ))}
          </div>
        </section>

        <section className="lifecycle-panel state-rail-panel" aria-labelledby="work-state-title">
          <div className="state-rail-panel__heading">
            <div>
              <h2 id="work-state-title">Work states</h2>
              <span className="state-rail-panel__scope">{scopeLabel}</span>
            </div>
            <span className="state-rail-panel__total tabular">
              {command.scopedItems.length} total
            </span>
          </div>
          <ol className="state-rail" aria-label={`Work-state counts for ${scopeLabel}`}>
            {command.stateCounts.map(({ state, count }) => (
              <li
                key={state}
                className="state-rail__item"
                data-state={state.toLowerCase().replace(/\s+/g, "-")}
                aria-label={`${state}: ${count} work ${count === 1 ? "item" : "items"}`}
              >
                <strong className="state-rail__count tabular">{count}</strong>
                <span className="state-rail__label">{state === "Awaiting verification" ? "To verify" : state}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
