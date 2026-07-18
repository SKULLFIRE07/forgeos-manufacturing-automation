import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { LoaderCircle, type LucideIcon } from "lucide-react";

import { cx } from "./utils";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";
export type ButtonSize = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingLabel?: string;
  startIcon?: LucideIcon;
  endIcon?: LucideIcon;
  fullWidth?: boolean;
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      loading = false,
      loadingLabel = "Working",
      startIcon: StartIcon,
      endIcon: EndIcon,
      fullWidth = false,
      className,
      children,
      disabled,
      type = "button",
      "aria-label": ariaLabel,
      ...props
    },
    ref,
  ) {
    const isDisabled = disabled || loading;

    return (
      <button
        {...props}
        ref={ref}
        type={type}
        className={cx(
          "ui-button",
          `ui-button--${variant}`,
          `ui-button--${size}`,
          fullWidth && "ui-button--full-width",
          loading && "is-loading",
          className,
        )}
        data-variant={variant}
        data-size={size}
        data-loading={loading || undefined}
        aria-busy={loading || undefined}
        aria-label={loading ? loadingLabel : ariaLabel}
        disabled={isDisabled}
      >
        <span className="ui-button__content" aria-hidden={loading || undefined}>
          {StartIcon ? (
            <StartIcon className="ui-button__icon" aria-hidden="true" />
          ) : null}
          <span className="ui-button__label">{children}</span>
          {EndIcon ? (
            <EndIcon className="ui-button__icon" aria-hidden="true" />
          ) : null}
        </span>
        {loading ? (
          <span className="ui-button__loading">
            <LoaderCircle className="ui-button__spinner" aria-hidden="true" />
            <span className="ui-sr-only">{loadingLabel}</span>
          </span>
        ) : null}
      </button>
    );
  },
);
