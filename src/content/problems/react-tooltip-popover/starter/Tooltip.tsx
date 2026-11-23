import { useState, type ReactElement, type ReactNode } from 'react';
import type { Placement } from './types';

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

// TODO: make this an accessible tooltip (WAI-ARIA tooltip pattern + WCAG 1.4.13).
// - role="tooltip" element with an id, rendered through a portal into document.body
// - the trigger references it with aria-describedby (keep any aria-describedby it already has)
// - show after `delay` on hover AND on keyboard focus; hide on blur, on mouseleave (after hideDelay) and on Escape
// - stays open while the pointer is over the tooltip itself
// - positioned next to the trigger with useAnchoredPosition / computePosition
export default function Tooltip({ content, children }: TooltipProps) {
  const [open, setOpen] = useState(false);
  return (
    <span onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      {children}
      {open && <span className="tooltip">{content}</span>}
    </span>
  );
}
