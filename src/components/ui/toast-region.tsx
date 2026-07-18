"use client";

import {
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { X } from "lucide-react";

import type { ToastMessage } from "@/lib/types";

import { Button } from "./button";
import { IconButton } from "./icon-button";
import { cx } from "./utils";

export interface ToastRegionProps {
  toasts: readonly ToastMessage[];
  onDismiss: (id: ToastMessage["id"]) => void;
  onAction?: (toast: ToastMessage) => void;
  duration?: number;
  politeness?: "polite" | "assertive";
  label?: string;
  className?: string;
}

interface ToastItemProps {
  toast: ToastMessage;
  duration: number;
  onDismiss: (id: ToastMessage["id"]) => void;
  onAction?: (toast: ToastMessage) => void;
}

function ToastItem({ toast, duration, onDismiss, onAction }: ToastItemProps) {
  const [paused, setPaused] = useState(false);
  const onDismissRef = useRef(onDismiss);
  const hasAction = Boolean(toast.actionLabel && onAction);
  const autoDismissDuration = hasAction ? 0 : duration;

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (paused || autoDismissDuration <= 0) {
      return;
    }

    const timer = window.setTimeout(
      () => onDismissRef.current(toast.id),
      autoDismissDuration,
    );
    return () => window.clearTimeout(timer);
  }, [autoDismissDuration, paused, toast.id]);

  function handleMouseEnter(_: MouseEvent<HTMLLIElement>) {
    setPaused(true);
  }

  function handleMouseLeave(_: MouseEvent<HTMLLIElement>) {
    setPaused(false);
  }

  function handleFocus() {
    setPaused(true);
  }

  function handleBlur(event: FocusEvent<HTMLLIElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setPaused(false);
    }
  }

  return (
    <li
      className="ui-toast"
      data-paused={paused || undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocusCapture={handleFocus}
      onBlurCapture={handleBlur}
    >
      <div className="ui-toast__content">
        <strong className="ui-toast__title">{toast.title}</strong>
        <p className="ui-toast__message">{toast.message}</p>
      </div>
      <div className="ui-toast__actions">
        {hasAction && onAction ? (
          <Button variant="quiet" size="sm" onClick={() => onAction(toast)}>
            {toast.actionLabel}
          </Button>
        ) : null}
        <IconButton
          icon={X}
          label={`Dismiss ${toast.title}`}
          onClick={() => onDismiss(toast.id)}
        />
      </div>
    </li>
  );
}

export function ToastRegion({
  toasts,
  onDismiss,
  onAction,
  duration = 6000,
  politeness = "polite",
  label = "Notifications",
  className,
}: ToastRegionProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "Escape" || toasts.length === 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    onDismiss(toasts[toasts.length - 1].id);
  }

  return (
    <section
      className={cx("ui-toast-region", className)}
      aria-label={label}
      aria-live={politeness}
      aria-relevant="additions text"
      onKeyDown={handleKeyDown}
    >
      <ol className="ui-toast-region__list">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            duration={duration}
            onDismiss={onDismiss}
            onAction={onAction}
          />
        ))}
      </ol>
    </section>
  );
}
