"use client";

import { useId, type ReactNode, type RefObject } from "react";
import { X } from "lucide-react";

import { IconButton } from "./icon-button";
import {
  useControlledDialog,
  type DialogOpenChangeHandler,
} from "./use-controlled-dialog";
import { cx } from "./utils";

export type DialogSize = "sm" | "md" | "lg";

export interface DialogProps {
  open: boolean;
  onOpenChange: DialogOpenChangeHandler;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: DialogSize;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  closeLabel?: string;
  initialFocusRef?: RefObject<HTMLElement | null>;
  className?: string;
  surfaceClassName?: string;
  bodyClassName?: string;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
  closeLabel = "Close dialog",
  initialFocusRef,
  className,
  surfaceClassName,
  bodyClassName,
}: DialogProps) {
  const generatedId = useId();
  const titleId = `${generatedId}-title`;
  const descriptionId = description ? `${generatedId}-description` : undefined;
  const {
    dialogRef,
    handleBackdropClick,
    handleCancel,
    handleNativeClose,
    requestClose,
  } = useControlledDialog({
    open,
    onOpenChange,
    closeOnBackdrop,
    closeOnEscape,
    initialFocusRef,
  });

  return (
    <dialog
      ref={dialogRef}
      className={cx("ui-dialog", className)}
      data-open={open || undefined}
      data-size={size}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={handleCancel}
      onClose={handleNativeClose}
      onClick={handleBackdropClick}
    >
      <div
        className={cx(
          "ui-dialog__surface",
          `ui-dialog__surface--${size}`,
          surfaceClassName,
        )}
      >
        <header className="ui-dialog__header">
          <div className="ui-dialog__heading">
            <h2 id={titleId} className="ui-dialog__title">
              {title}
            </h2>
            {description ? (
              <div id={descriptionId} className="ui-dialog__description">
                {description}
              </div>
            ) : null}
          </div>
          {showCloseButton ? (
            <IconButton
              icon={X}
              label={closeLabel}
              onClick={() => requestClose("close-button")}
            />
          ) : null}
        </header>
        <div className={cx("ui-dialog__body", bodyClassName)}>{children}</div>
        {footer ? (
          <footer className="ui-dialog__footer">{footer}</footer>
        ) : null}
      </div>
    </dialog>
  );
}
