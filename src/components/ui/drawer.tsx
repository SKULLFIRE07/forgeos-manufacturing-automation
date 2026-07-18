"use client";

import { useId, type ReactNode, type RefObject } from "react";
import { X } from "lucide-react";

import { IconButton } from "./icon-button";
import {
  useControlledDialog,
  type DialogOpenChangeHandler,
} from "./use-controlled-dialog";
import { cx } from "./utils";

export type DrawerSide = "left" | "right";
export type DrawerSize = "sm" | "md" | "lg";

export interface DrawerProps {
  open: boolean;
  onOpenChange: DialogOpenChangeHandler;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  side?: DrawerSide;
  size?: DrawerSize;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  closeLabel?: string;
  initialFocusRef?: RefObject<HTMLElement | null>;
  className?: string;
  panelClassName?: string;
  bodyClassName?: string;
}

export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  side = "right",
  size = "md",
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
  closeLabel = "Close drawer",
  initialFocusRef,
  className,
  panelClassName,
  bodyClassName,
}: DrawerProps) {
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
      className={cx("ui-drawer", className)}
      data-open={open || undefined}
      data-side={side}
      data-size={size}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={handleCancel}
      onClose={handleNativeClose}
      onClick={handleBackdropClick}
    >
      <div
        className={cx(
          "ui-drawer__panel",
          `ui-drawer__panel--${side}`,
          `ui-drawer__panel--${size}`,
          panelClassName,
        )}
      >
        <header className="ui-drawer__header">
          <div className="ui-drawer__heading">
            <h2 id={titleId} className="ui-drawer__title">
              {title}
            </h2>
            {description ? (
              <div id={descriptionId} className="ui-drawer__description">
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
        <div className={cx("ui-drawer__body", bodyClassName)}>{children}</div>
        {footer ? (
          <footer className="ui-drawer__footer">{footer}</footer>
        ) : null}
      </div>
    </dialog>
  );
}
