import { useRef, useState } from 'react';
import Modal from '../Modal';

export interface HarnessProps {
  onCloseSpy?: () => void;
  description?: string;
  /** Focus the "Save" button on open instead of the first focusable element. */
  focusSave?: boolean;
  /** Render a dialog with no focusable content. */
  empty?: boolean;
}

/** A trigger button + a Settings modal whose open state is owned by this parent. */
export function Harness({ onCloseSpy, description, focusSave = false, empty = false }: HarnessProps) {
  const [open, setOpen] = useState(false);
  const saveRef = useRef<HTMLButtonElement>(null);
  const close = () => {
    onCloseSpy?.();
    setOpen(false);
  };
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        Open settings
      </button>
      <button type="button">Unrelated</button>
      <Modal open={open} onClose={close} title="Settings" description={description} initialFocusRef={focusSave ? saveRef : undefined}>
        {empty ? (
          <p>Nothing to configure yet.</p>
        ) : (
          <>
            <input aria-label="Display name" defaultValue="Ada" />
            <button type="button" ref={saveRef}>
              Save
            </button>
            <button type="button" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="button" disabled>
              Reset
            </button>
          </>
        )}
      </Modal>
    </div>
  );
}

/** Focuses the trigger (fireEvent.click does not move focus) and clicks it. */
export function openSettings(): HTMLElement {
  const trigger = screen.getByRole('button', { name: 'Open settings' });
  trigger.focus();
  fireEvent.click(trigger);
  return trigger;
}

export function pressKey(key: string, init: Record<string, unknown> = {}): boolean {
  const target = (document.activeElement as HTMLElement | null) ?? document.body;
  return fireEvent.keyDown(target, { key, ...init });
}

/**
 * Records keydown listeners added to document/window so a test can check that none are
 * left behind. Call restore() when done.
 */
export function trackGlobalKeyListeners() {
  const live = new Set<unknown>();
  const targets: EventTarget[] = [document, window];
  targets.forEach((t) => {
    const add = t.addEventListener;
    const remove = t.removeEventListener;
    (t as any).addEventListener = function (this: EventTarget, type: string, l: any, o?: any) {
      if (type === 'keydown') live.add(l);
      return add.call(this, type, l, o);
    };
    (t as any).removeEventListener = function (this: EventTarget, type: string, l: any, o?: any) {
      if (type === 'keydown') live.delete(l);
      return remove.call(this, type, l, o);
    };
  });
  return {
    count: () => live.size,
    restore: () => targets.forEach((t) => {
      delete (t as any).addEventListener;
      delete (t as any).removeEventListener;
    }),
  };
}
