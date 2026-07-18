import type { ReactNode } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";

import type { Trend } from "@/lib/types";

import { cx } from "./utils";

export interface MetricStripItemProps {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  trend?: Trend;
  icon?: LucideIcon;
  className?: string;
}

const trendIcons: Record<Trend, LucideIcon> = {
  Improving: ArrowUpRight,
  Flat: ArrowRight,
  Worsening: ArrowDownRight,
};

export function MetricStripItem({
  label,
  value,
  detail,
  trend,
  icon: Icon,
  className,
}: MetricStripItemProps) {
  const TrendIcon = trend ? trendIcons[trend] : null;

  return (
    <div
      className={cx("ui-metric-strip-item", className)}
      data-trend={trend?.toLowerCase()}
      role="group"
      aria-label={label}
    >
      <div className="ui-metric-strip-item__label-row">
        {Icon ? (
          <Icon className="ui-metric-strip-item__icon" aria-hidden="true" />
        ) : null}
        <span className="ui-metric-strip-item__label">{label}</span>
      </div>
      <div className="ui-metric-strip-item__value-row">
        <strong className="ui-metric-strip-item__value">{value}</strong>
        {trend && TrendIcon ? (
          <span
            className="ui-metric-strip-item__trend"
            data-trend={trend.toLowerCase()}
            aria-label={`Trend: ${trend}`}
          >
            <TrendIcon aria-hidden="true" />
            <span>{trend}</span>
          </span>
        ) : null}
      </div>
      {detail ? (
        <div className="ui-metric-strip-item__detail">{detail}</div>
      ) : null}
    </div>
  );
}
