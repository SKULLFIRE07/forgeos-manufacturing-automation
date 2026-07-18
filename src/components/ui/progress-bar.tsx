import { useId, type ReactNode } from "react";

import { cx, mergeIds } from "./utils";

export interface ProgressBarProps {
  label: string;
  value?: number;
  max?: number;
  showValue?: boolean;
  valueText?: string;
  description?: ReactNode;
  formatValue?: (value: number, max: number) => string;
  className?: string;
  progressClassName?: string;
  id?: string;
  "aria-describedby"?: string;
}

function defaultFormatValue(value: number, max: number): string {
  return `${Math.round((value / max) * 100)}%`;
}

export function ProgressBar({
  label,
  value,
  max = 100,
  showValue = true,
  valueText,
  description,
  formatValue = defaultFormatValue,
  className,
  progressClassName,
  id,
  "aria-describedby": ariaDescribedBy,
}: ProgressBarProps) {
  const generatedId = useId();
  const progressId = id ?? `${generatedId}-progress`;
  const safeMax = Number.isFinite(max) && max > 0 ? max : 100;
  const isDeterminate = typeof value === "number" && Number.isFinite(value);
  const safeValue = isDeterminate
    ? Math.min(Math.max(value, 0), safeMax)
    : undefined;
  const displayValue =
    valueText ??
    (safeValue === undefined ? "In progress" : formatValue(safeValue, safeMax));
  const descriptionId = description ? `${progressId}-description` : undefined;

  return (
    <div
      className={cx("ui-progress-bar", className)}
      data-state={isDeterminate ? "determinate" : "indeterminate"}
    >
      <div className="ui-progress-bar__header">
        <span className="ui-progress-bar__label">{label}</span>
        {showValue ? (
          <span className="ui-progress-bar__value" aria-hidden="true">
            {displayValue}
          </span>
        ) : null}
      </div>
      <progress
        id={progressId}
        className={cx("ui-progress-bar__track", progressClassName)}
        max={safeMax}
        value={safeValue}
        aria-label={label}
        aria-valuetext={displayValue}
        aria-describedby={mergeIds(ariaDescribedBy, descriptionId)}
      />
      {description ? (
        <div id={descriptionId} className="ui-progress-bar__description">
          {description}
        </div>
      ) : null}
    </div>
  );
}
