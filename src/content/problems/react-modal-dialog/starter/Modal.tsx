import type { ReactNode, RefObject } from 'react';

export interface ModalProps {
  /** Whether the dialog is shown. The parent owns this state. */
  open: boolean;
  /** Called when the user asks to close: Escape or a click on the backdrop. */
  onClose: () => void;
  /** Visible heading; also the dialog's accessible name. */
  title: string;
  /** Optional supporting text; referenced by aria-describedby. */
  description?: string;
  /** Element to focus when the dialog opens. Default: the first focusable element inside. */
  initialFocusRef?: RefObject<HTMLElement>;
  children?: ReactNode;
}

// TODO: make this an accessible modal dialog.
// - portal to document.body; backdrop element with data-testid="modal-backdrop"
// - role="dialog", aria-modal="true", aria-labelledby (title), aria-describedby (description)
// - move focus in on open, trap Tab / Shift+Tab, Escape closes, restore focus on close
// - backdrop click closes (but clicks inside the dialog do not)
// - lock background scroll while open
export default function Modal({ open, title, children }: ModalProps) {
  if (!open) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}
