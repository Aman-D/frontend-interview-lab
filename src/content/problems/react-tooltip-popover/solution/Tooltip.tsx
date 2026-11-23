import { Children, cloneElement, useEffect, useId, useRef, useState, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { Placement } from './types';
import { useAnchoredPosition } from './useAnchoredPosition';

export interface TooltipProps {
  /** Short, non-interactive description of the trigger. */
  content: ReactNode;
  /** Exactly one focusable element (usually a button). It keeps its own accessible name. */
  children: ReactElement;
  /** Preferred side; flips to the opposite side when there is no room. Default 'top'. */
  placement?: Placement;
  /** Milliseconds of hover or focus before the tooltip appears. Default 300. */
  delay?: number;
  /** Grace period after the pointer leaves, so it can travel onto the tooltip. Default 100. */
  hideDelay?: number;
}

export default function Tooltip({ content, children, placement = 'top', delay = 300, hideDelay = 100 }: TooltipProps) {
  const tooltipId = useId();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  // Why it is shown. Refs, not state: they are read inside timers and never rendered.
  const hovered = useRef(false);
  const focused = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  const clearTimer = () => {
    window.clearTimeout(timer.current);
    timer.current = undefined;
  };
  const show = () => {
    clearTimer();
    if (open) return;
    timer.current = window.setTimeout(() => setOpen(true), delay);
  };
  /** Hide unless something still holds the tooltip open (pointer over trigger/tooltip, or focus). */
  const hide = (after: number) => {
    clearTimer();
    if (hovered.current || focused.current) return;
    if (after <= 0) setOpen(false);
    else timer.current = window.setTimeout(() => setOpen(false), after);
  };
  const dismiss = () => {
    clearTimer();
    setOpen(false);
  };

  // Dismissible (WCAG 1.4.13): Escape closes it without moving the pointer or focus.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  // Never fire a timer after unmount.
  useEffect(() => clearTimer, []);

  // The wrapper uses `display: contents`, so it has no box: measure the child element instead.
  const position = useAnchoredPosition(open, () => wrapperRef.current?.firstElementChild ?? null, tooltipRef, placement);

  const child = Children.only(children);
  const ownDescribedBy: string | undefined = child.props['aria-describedby'];
  const trigger = cloneElement(child, {
    // Description, not label: the trigger keeps its own name and the tooltip is read as extra info.
    'aria-describedby': ownDescribedBy ? `${ownDescribedBy} ${tooltipId}` : tooltipId,
  });

  const style: CSSProperties = {
    position: 'fixed',
    top: position?.top ?? 0,
    left: position?.left ?? 0,
    zIndex: 1000,
  };

  return (
    <>
      <span
        ref={wrapperRef}
        style={{ display: 'contents' }}
        onMouseEnter={() => {
          hovered.current = true;
          show();
        }}
        onMouseLeave={() => {
          hovered.current = false;
          hide(hideDelay);
        }}
        onFocus={() => {
          focused.current = true;
          show();
        }}
        onBlur={() => {
          focused.current = false;
          hide(0);
        }}
        onKeyDown={(e) => {
          // Escape before the delay elapsed: cancel the pending show.
          if (e.key === 'Escape' && !open) clearTimer();
        }}
      >
        {trigger}
      </span>
      {createPortal(
        // Always rendered (hidden while closed) so aria-describedby never points at a missing element
        // and screen readers can read the description as soon as the trigger is focused.
        <div
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          className="tooltip"
          data-placement={position?.placement ?? placement}
          hidden={!open}
          style={style}
          // Hoverable (WCAG 1.4.13): moving onto the tooltip keeps it open.
          onMouseEnter={() => {
            hovered.current = true;
            clearTimer();
          }}
          onMouseLeave={() => {
            hovered.current = false;
            hide(hideDelay);
          }}
        >
          {content}
        </div>,
        document.body,
      )}
    </>
  );
}
