import {
  forwardRef,
  useId,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { ChevronDown, CircleAlert } from "lucide-react";

import { cx, mergeIds } from "./utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  optional?: boolean;
  options?: readonly SelectOption[];
  placeholder?: string;
  containerClassName?: string;
  selectClassName?: string;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  function SelectField(
    {
      label,
      hint,
      error,
      optional = false,
      options,
      placeholder,
      containerClassName,
      selectClassName,
      className,
      children,
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
    const selectId = id ?? `${generatedId}-select`;
    const hintId = hint ? `${selectId}-hint` : undefined;
    const errorId = error ? `${selectId}-error` : undefined;
    const hasError = Boolean(error);

    return (
      <div
        className={cx(
          "ui-select-field",
          hasError && "ui-select-field--error",
          disabled && "ui-select-field--disabled",
          containerClassName,
        )}
        data-invalid={hasError ? "true" : undefined}
        data-disabled={disabled || undefined}
      >
        <div className="ui-select-field__label-row">
          <label className="ui-select-field__label" htmlFor={selectId}>
            {label}
          </label>
          {required ? (
            <span className="ui-select-field__requirement">Required</span>
          ) : optional ? (
            <span className="ui-select-field__requirement">Optional</span>
          ) : null}
        </div>
        {hint ? (
          <div id={hintId} className="ui-select-field__hint">
            {hint}
          </div>
        ) : null}
        <div className="ui-select-field__control">
          <select
            {...props}
            ref={ref}
            id={selectId}
            className={cx(
              "ui-select-field__select",
              selectClassName,
              className,
            )}
            required={required}
            disabled={disabled}
            aria-invalid={hasError ? true : ariaInvalid}
            aria-errormessage={errorId}
            aria-describedby={mergeIds(ariaDescribedBy, hintId, errorId)}
          >
            {placeholder ? (
              <option value="" disabled={required}>
                {placeholder}
              </option>
            ) : null}
            {options?.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
            {children}
          </select>
          <ChevronDown
            className="ui-select-field__chevron"
            aria-hidden="true"
          />
        </div>
        {error ? (
          <div id={errorId} className="ui-select-field__error" role="alert">
            <CircleAlert aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : null}
      </div>
    );
  },
);
