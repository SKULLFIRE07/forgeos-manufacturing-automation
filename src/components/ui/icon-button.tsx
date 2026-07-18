import { forwardRef, type ButtonHTMLAttributes } from "react";
import { LoaderCircle, type LucideIcon } from "lucide-react";

import type { ButtonVariant } from "./button";
import { cx } from "./utils";

export interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "aria-label"
> {
  icon: LucideIcon;
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    {
      icon: Icon,
      label,
      variant = "quiet",
      loading = false,
      className,
      disabled,
      title,
      type = "button",
      ...props
    },
    ref,
  ) {
    return (
      <button
        {...props}
        ref={ref}
        type={type}
        className={cx(
          "ui-icon-button",
          `ui-icon-button--${variant}`,
          loading && "is-loading",
          className,
        )}
        data-variant={variant}
        data-loading={loading || undefined}
        aria-label={label}
        aria-busy={loading || undefined}
        title={title ?? label}
        disabled={disabled || loading}
      >
        {loading ? (
          <LoaderCircle
            className="ui-icon-button__icon ui-icon-button__spinner"
            aria-hidden="true"
          />
        ) : (
          <Icon className="ui-icon-button__icon" aria-hidden="true" />
        )}
      </button>
    );
  },
);
