import { useId, type ElementType, type ReactNode } from "react";
import { Inbox, type LucideIcon } from "lucide-react";

import { cx } from "./utils";

export interface EmptyStateProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  headingLevel?: 2 | 3 | 4;
  compact?: boolean;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  secondaryAction,
  headingLevel = 2,
  compact = false,
  className,
}: EmptyStateProps) {
  const generatedId = useId();
  const titleId = `${generatedId}-title`;
  const descriptionId = description ? `${generatedId}-description` : undefined;
  const Heading = `h${headingLevel}` as ElementType;

  return (
    <section
      className={cx(
        "ui-empty-state",
        compact && "ui-empty-state--compact",
        className,
      )}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <Icon className="ui-empty-state__icon" aria-hidden="true" />
      <Heading id={titleId} className="ui-empty-state__title">
        {title}
      </Heading>
      {description ? (
        <div id={descriptionId} className="ui-empty-state__description">
          {description}
        </div>
      ) : null}
      {action || secondaryAction ? (
        <div className="ui-empty-state__actions">
          {action}
          {secondaryAction}
        </div>
      ) : null}
    </section>
  );
}
