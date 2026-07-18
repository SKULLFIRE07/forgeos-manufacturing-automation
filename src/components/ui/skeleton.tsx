import type { CSSProperties } from "react";

import { cx } from "./utils";

export type SkeletonShape = "text" | "block" | "circle";

export interface SkeletonProps {
  shape?: SkeletonShape;
  lines?: number;
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  lineWidths?: Array<CSSProperties["width"]>;
  announce?: string;
  className?: string;
  style?: CSSProperties;
}

export function Skeleton({
  shape = "text",
  lines = 1,
  width,
  height,
  lineWidths,
  announce,
  className,
  style,
}: SkeletonProps) {
  const lineCount = Math.max(1, Math.floor(lines));

  return (
    <span
      className={cx(
        "ui-skeleton-group",
        lineCount > 1 && "ui-skeleton-group--stacked",
        className,
      )}
      role={announce ? "status" : undefined}
      aria-hidden={announce ? undefined : "true"}
    >
      {Array.from({ length: lineCount }, (_, index) => (
        <span
          key={index}
          className={cx("ui-skeleton", `ui-skeleton--${shape}`)}
          aria-hidden="true"
          style={{
            width: lineWidths?.[index] ?? width,
            height,
            ...style,
          }}
        />
      ))}
      {announce ? <span className="ui-sr-only">{announce}</span> : null}
    </span>
  );
}
