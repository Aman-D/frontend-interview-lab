import { cloneElement, useEffect, useId, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactElement, type ReactNode, type Ref } from 'react';
import { createPortal } from 'react-dom';
import type { Placement } from './types';
import { useAnchoredPosition } from './useAnchoredPosition';

export interface PopoverProps {
  /** A single button element. It gets aria-haspopup/aria-expanded/aria-controls and toggles the popover. */
  trigger: ReactElement;
  /** Interactive content (links, form controls, buttons). */
  content: ReactNode;
  /** Preferred side; flips when there is no room. Default 'bottom'. */
  placement?: Placement;
  /** Notified whenever the popover opens or closes. */
  onOpenChange?: (open: boolean) => void;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function setRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as { current: T | null }).current = value;
}

export default function Popover({ trigger, content, placement = 'bottom', onOpenChange }: PopoverProps) {
  const popoverId = useId();
  const fallbackTriggerId = useId();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Latest callback without re-running the "while open" effect when the parent passes a new function.
  const onOpenChangeRef = useRef(onOpenChange);
  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  });

  const openRef = useRef(open);
  openRef.current = open;
  const setOpenState = (next: boolean) => {
    if (openRef.current === next) return;
    openRef.current = next;
    setOpen(next);
    onOpenChangeRef.current?.(next);
  };
  const close = (returnFocus: boolean) => {
    setOpenState(false);
    // Focus the trigger before the panel unmounts, so focus is never dropped on <body>.
    if (returnFocus) triggerRef.current?.focus();
  };

  // While open: move focus in, close on Escape and on a pointer press outside trigger + panel.
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.isComposing) return;
      close(true);
    };
    // mousedown (not click): reacts before focus moves, and a drag that starts inside and ends outside
    // does not count as an outside press. If the press lands on another focusable control, the browser's
    // default focus change runs after this handler, so returning focus to the trigger here is harmless.
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      close(true);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onMouseDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, [open]);

  const position = useAnchoredPosition(open, () => triggerRef.current, panelRef, placement);

  const triggerProps = trigger.props as { id?: string; onClick?: (e: ReactMouseEvent<HTMLElement>) => void };
  const triggerId = triggerProps.id ?? fallbackTriggerId;
  const originalRef = (trigger as unknown as { ref?: Ref<HTMLElement> }).ref;

  const triggerElement = cloneElement(trigger, {
    id: triggerId,
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
      setRef(originalRef, node);
    },
    'aria-haspopup': 'dialog',
    'aria-expanded': open,
    // Only reference the panel while it exists.
    'aria-controls': open ? popoverId : undefined,
    onClick: (e: ReactMouseEvent<HTMLElement>) => {
      triggerProps.onClick?.(e);
      if (e.defaultPrevented) return;
      // Toggle. Clicking the trigger while open closes it; focus is already on the trigger.
      setOpenState(!openRef.current);
    },
  });

  return (
    <>
      {triggerElement}
      {open &&
        createPortal(
          <div
            ref={panelRef}
            id={popoverId}
            role="dialog"
            aria-labelledby={triggerId}
            tabIndex={-1}
            className="popover"
            data-placement={position?.placement ?? placement}
            style={{ position: 'fixed', top: position?.top ?? 0, left: position?.left ?? 0, zIndex: 1000 }}
            onBlur={(e) => {
              // Tabbing out of a non-modal popover closes it, without pulling focus back.
              const next = e.relatedTarget as Node | null;
              if (next && !panelRef.current?.contains(next) && !triggerRef.current?.contains(next)) close(false);
            }}
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  );
}
