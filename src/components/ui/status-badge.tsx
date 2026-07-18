import {
  CheckCircle2,
  Circle,
  CircleDotDashed,
  Info,
  OctagonAlert,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

import type {
  AssetRecord,
  DocumentRecord,
  EmployeeRecord,
  KpiRecord,
  Priority,
  RiskLevel,
  Trend,
  WorkState,
} from "@/lib/types";

import { cx } from "./utils";

export type StatusTone =
  | "neutral"
  | "progress"
  | "info"
  | "success"
  | "warning"
  | "danger";

export type ForgeStatus =
  | WorkState
  | Priority
  | RiskLevel
  | Trend
  | EmployeeRecord["status"]
  | AssetRecord["health"]
  | KpiRecord["state"]
  | DocumentRecord["state"];

export interface StatusBadgeProps {
  status: ForgeStatus | (string & {});
  label?: string;
  tone?: StatusTone;
  icon?: LucideIcon | null;
  className?: string;
}

const toneIcons: Record<StatusTone, LucideIcon> = {
  neutral: Circle,
  progress: CircleDotDashed,
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  danger: OctagonAlert,
};

const statusTones: Record<string, StatusTone> = {
  absent: "danger",
  attention: "warning",
  "at risk": "warning",
  available: "success",
  "awaiting verification": "warning",
  blocked: "danger",
  "calibration hold": "warning",
  closed: "success",
  critical: "danger",
  down: "danger",
  draft: "neutral",
  effective: "success",
  flat: "neutral",
  high: "danger",
  improving: "success",
  "in progress": "progress",
  low: "neutral",
  medium: "warning",
  "missing update": "danger",
  "not started": "neutral",
  "off target": "danger",
  "on leave": "warning",
  "on target": "success",
  present: "success",
  "review due": "warning",
  superseded: "neutral",
  training: "info",
  worsening: "danger",
};

export function StatusBadge({
  status,
  label,
  tone,
  icon,
  className,
}: StatusBadgeProps) {
  const resolvedTone =
    tone ?? statusTones[status.trim().toLowerCase()] ?? "neutral";
  const Icon = icon === null ? null : (icon ?? toneIcons[resolvedTone]);

  return (
    <span
      className={cx(
        "ui-status-badge",
        `ui-status-badge--${resolvedTone}`,
        className,
      )}
      data-tone={resolvedTone}
      data-status={status}
    >
      {Icon ? (
        <Icon className="ui-status-badge__icon" aria-hidden="true" />
      ) : null}
      <span className="ui-status-badge__label">{label ?? status}</span>
    </span>
  );
}
