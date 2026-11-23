import { useEffect, useId, useRef, type MouseEvent, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  initialFocusRef?: RefObject<HTMLElement>;
  children?: ReactNode;
}

const FOCUSABLE = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** Tabbable elements inside `root`, in DOM order, skipping ones that are not rendered. */
function getFocusable(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.getClientRects().length > 0 && !el.closest('[inert]'),
  );
}

// Open modals, oldest first. Only the top one reacts to keys, and body scroll is
// locked while the stack is non-empty. Module scope = shared by every Modal instance.
const openStack: object[] = [];
let overflowBeforeLock = '';

export default function Modal({ open, onClose, title, description, initialFocusRef, children }: ModalProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const dialogRef = useRef<HTMLDivElement>(null);

  // Latest onClose without re-running the open/close effect when the parent passes a
  // new inline function on every render (that would steal focus back to the first field).
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const token = {};
    const returnFocusTo = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    if (openStack.length === 0) {
      overflowBeforeLock = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    openStack.push(token);

    // Move focus inside: designated element → first tabbable → the dialog itself (tabIndex=-1).
    (initialFocusRef?.current ?? getFocusable(dialog)[0] ?? dialog).focus();

    function onKeyDown(e: KeyboardEvent) {
      if (openStack[openStack.length - 1] !== token) return; // a modal stacked above us handles it
      if (e.key === 'Escape') {
        if (e.isComposing) return; // Escape cancels IME composition first
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !dialog) return;

      const items = getFocusable(dialog);
      if (items.length === 0) {
        e.preventDefault();
        dialog.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!dialog.contains(active)) {
        // Focus escaped somehow (e.g. programmatic focus elsewhere): pull it back in.
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && (active === first || active === dialog)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
      // Otherwise let the browser move focus normally between the inner elements.
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      const index = openStack.indexOf(token);
      if (index !== -1) openStack.splice(index, 1);
      if (openStack.length === 0) document.body.style.overflow = overflowBeforeLock;
      // Return focus to whatever opened us, if it still exists.
      if (returnFocusTo && returnFocusTo.isConnected) returnFocusTo.focus();
    };
    // initialFocusRef is read once, when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  function handleBackdropClick(e: MouseEvent<HTMLDivElement>) {
    // Clicks inside the dialog bubble up to the backdrop too; only react to the backdrop itself.
    if (e.target === e.currentTarget) onCloseRef.current();
  }

  return createPortal(
    <div className="modal-backdrop" data-testid="modal-backdrop" onClick={handleBackdropClick}>
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
      >
        <h2 id={titleId}>{title}</h2>
        {description && <p id={descriptionId}>{description}</p>}
        {children}
      </div>
    </div>,
    document.body,
  );
}
