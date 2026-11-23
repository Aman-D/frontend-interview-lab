import { useState, type ReactElement, type ReactNode } from 'react';
import type { Placement } from './types';

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

// TODO: make this an accessible, interactive popover (non-modal dialog).
// - clicking the trigger toggles it; trigger has aria-haspopup="dialog", aria-expanded, aria-controls (while open)
// - role="dialog" panel labelled by the trigger, rendered through a portal into document.body
// - on open, focus the first focusable element inside (or the panel itself)
// - Escape and a press outside (trigger and panel excluded) close it and return focus to the trigger
// - positioned next to the trigger with useAnchoredPosition / computePosition
export default function Popover({ trigger, content }: PopoverProps) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <span onClick={() => setOpen((o) => !o)}>{trigger}</span>
      {open && <div className="popover">{content}</div>}
    </div>
  );
}
