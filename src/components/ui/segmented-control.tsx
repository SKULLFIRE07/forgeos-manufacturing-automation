"use client";

import { useId, type FieldsetHTMLAttributes, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cx, mergeIds } from "./utils";

export interface SegmentOption<Value extends string = string> {
  value: Value;
  label: ReactNode;
  accessibleLabel?: string;
  icon?: LucideIcon;
  disabled?: boolean;
}

export interface SegmentedControlProps<
  Value extends string = string,
> extends Omit<
  FieldsetHTMLAttributes<HTMLFieldSetElement>,
  "children" | "onChange"
> {
  legend: string;
  hideLegend?: boolean;
  options: readonly SegmentOption<Value>[];
  value: Value;
  onValueChange: (value: Value) => void;
  name?: string;
  description?: ReactNode;
}

export function SegmentedControl<Value extends string = string>({
  legend,
  hideLegend = false,
  options,
  value,
  onValueChange,
  name,
  description,
  className,
  disabled,
  "aria-describedby": ariaDescribedBy,
  ...props
}: SegmentedControlProps<Value>) {
  const generatedId = useId();
  const groupName = name ?? `${generatedId}-segments`;
  const descriptionId = description ? `${generatedId}-description` : undefined;

  return (
    <fieldset
      {...props}
      className={cx("ui-segmented-control", className)}
      disabled={disabled}
      aria-describedby={mergeIds(ariaDescribedBy, descriptionId)}
    >
      <legend
        className={cx(
          "ui-segmented-control__legend",
          hideLegend && "ui-sr-only",
        )}
      >
        {legend}
      </legend>
      {description ? (
        <div id={descriptionId} className="ui-segmented-control__description">
          {description}
        </div>
      ) : null}
      <div className="ui-segmented-control__options">
        {options.map((option, index) => {
          const optionId = `${generatedId}-option-${index}`;
          const Icon = option.icon;

          return (
            <label
              key={option.value}
              className={cx(
                "ui-segmented-control__option",
                option.value === value && "is-selected",
                option.disabled && "is-disabled",
              )}
              htmlFor={optionId}
              data-selected={option.value === value || undefined}
            >
              <input
                id={optionId}
                className="ui-segmented-control__input"
                type="radio"
                name={groupName}
                value={option.value}
                checked={option.value === value}
                disabled={option.disabled}
                aria-label={option.accessibleLabel}
                onChange={() => onValueChange(option.value)}
              />
              {Icon ? (
                <Icon
                  className="ui-segmented-control__icon"
                  aria-hidden="true"
                />
              ) : null}
              <span className="ui-segmented-control__label">
                {option.label}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
