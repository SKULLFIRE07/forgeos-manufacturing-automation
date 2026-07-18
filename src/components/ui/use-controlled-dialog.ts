"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type MouseEvent,
  type RefObject,
  type SyntheticEvent,
} from "react";

export type DialogCloseReason =
  | "backdrop"
  | "close-button"
  | "escape"
  | "native";

export type DialogOpenChangeHandler = (
  open: boolean,
  reason?: DialogCloseReason,
) => void;

interface UseControlledDialogOptions {
  open: boolean;
  onOpenChange: DialogOpenChangeHandler;
  closeOnBackdrop: boolean;
  closeOnEscape: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
}

export function useControlledDialog({
  open,
  onOpenChange,
  closeOnBackdrop,
  closeOnEscape,
  initialFocusRef,
}: UseControlledDialogOptions) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    let focusTimer: number | undefined;

    if (open && !dialog.open) {
      previousFocusRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;

      if (typeof dialog.showModal === "function") {
        try {
          dialog.showModal();
        } catch {
          dialog.setAttribute("open", "");
        }
      } else {
        dialog.setAttribute("open", "");
      }

      if (!dialog.open) {
        dialog.setAttribute("open", "");
      }

      if (initialFocusRef?.current) {
        focusTimer = window.setTimeout(() => {
          initialFocusRef.current?.focus({ preventScroll: true });
        }, 0);
      }
    } else if (!open && dialog.open) {
      if (typeof dialog.close === "function") {
        try {
          dialog.close();
        } catch {
          dialog.removeAttribute("open");
        }
      } else {
        dialog.removeAttribute("open");
      }

      if (dialog.open) {
        dialog.removeAttribute("open");
      }

      const previousFocus = previousFocusRef.current;
      if (previousFocus?.isConnected) {
        focusTimer = window.setTimeout(() => {
          previousFocus.focus({ preventScroll: true });
        }, 0);
      }
    }

    return () => {
      if (focusTimer !== undefined) {
        window.clearTimeout(focusTimer);
      }
    };
  }, [initialFocusRef, open]);

  const requestClose = useCallback(
    (reason: DialogCloseReason) => onOpenChange(false, reason),
    [onOpenChange],
  );

  const handleCancel = useCallback(
    (event: SyntheticEvent<HTMLDialogElement>) => {
      event.preventDefault();
      if (closeOnEscape) {
        requestClose("escape");
      }
    },
    [closeOnEscape, requestClose],
  );

  const handleBackdropClick = useCallback(
    (event: MouseEvent<HTMLDialogElement>) => {
      if (closeOnBackdrop && event.target === event.currentTarget) {
        requestClose("backdrop");
      }
    },
    [closeOnBackdrop, requestClose],
  );

  const handleNativeClose = useCallback(() => {
    if (open) {
      requestClose("native");
    }
  }, [open, requestClose]);

  return {
    dialogRef,
    handleBackdropClick,
    handleCancel,
    handleNativeClose,
    requestClose,
  };
}
