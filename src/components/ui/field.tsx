import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { CircleAlert } from "lucide-react";

import { cx, mergeIds } from "./utils";

export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  optional?: boolean;
  containerClassName?: string;
  inputClassName?: string;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  {
    label,
    hint,
    error,
    optional = false,
    containerClassName,
    inputClassName,
    className,
    id,
    required,
    disabled,
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? `${generatedId}-input`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const hasError = Boolean(error);

  return (
    <div
      className={cx(
        "ui-field",
        hasError && "ui-field--error",
        disabled && "ui-field--disabled",
        containerClassName,
      )}
      data-invalid={hasError ? "true" : undefined}
      data-disabled={disabled || undefined}
    >
      <div className="ui-field__label-row">
        <label className="ui-field__label" htmlFor={inputId}>
          {label}
        </label>
        {required ? (
          <span className="ui-field__requirement">Required</span>
        ) : optional ? (
          <span className="ui-field__requirement">Optional</span>
        ) : null}
      </div>
      {hint ? (
        <div id={hintId} className="ui-field__hint">
          {hint}
        </div>
      ) : null}
      <input
        {...props}
        ref={ref}
        id={inputId}
        className={cx("ui-field__input", inputClassName, className)}
        required={required}
        disabled={disabled}
        aria-invalid={hasError ? true : ariaInvalid}
        aria-errormessage={errorId}
        aria-describedby={mergeIds(ariaDescribedBy, hintId, errorId)}
      />
      {error ? (
        <div id={errorId} className="ui-field__error" role="alert">
          <CircleAlert aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}
    </div>
  );
});
