import { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type FocusEvent } from 'react';
import type { ToastApi, ToastOptions, ToastProviderProps, ToastType } from './types';

interface ToastRecord {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

// Only the (stable) API goes into context. The toast list lives in provider state and is
// never exposed through context, so consumers of useToast() don't re-render when toasts change.
const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children, max = 3, defaultDuration = 4000 }: ToastProviderProps) {
  // Creation order (oldest first). The first `max` entries are on screen; the rest are queued.
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const prefix = useId();
  const counter = useRef(0);

  // Read the latest default inside a stable `show` without adding it to the deps.
  const defaultDurationRef = useRef(defaultDuration);
  useLayoutEffect(() => {
    defaultDurationRef.current = defaultDuration;
  }, [defaultDuration]);

  const dismiss = useCallback((id: string) => {
    // Return the same array when nothing changes so React can bail out of the render.
    setToasts((prev) => (prev.some((t) => t.id === id) ? prev.filter((t) => t.id !== id) : prev));
  }, []);

  const show = useCallback((message: string, options: ToastOptions = {}) => {
    counter.current += 1;
    const id = `${prefix}toast-${counter.current}`;
    const toast: ToastRecord = {
      id,
      message,
      type: options.type ?? 'info',
      duration: options.duration ?? defaultDurationRef.current,
    };
    setToasts((prev) => [...prev, toast]);
    return id;
  }, [prefix]);

  const api = useMemo<ToastApi>(() => ({ show, dismiss }), [show, dismiss]);

  const limit = Math.max(1, Math.floor(max));
  // Newest first on screen: reverse the visible slice (copy first — never mutate state).
  const visible = toasts.slice(0, limit).reverse();
  const errors = visible.filter((t) => t.type === 'error');
  const others = visible.filter((t) => t.type !== 'error');

  return (
    <ToastContext.Provider value={api}>
      {children}
      <section className="toast-viewport" aria-label="Notifications">
        {/* Errors: each message is its own role="alert" (assertive) when it is inserted. */}
        <div className="toast-stack">
          {errors.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </div>
        {/* Everything else: ONE polite live region that exists before any toast is added.
            role="status" implies aria-atomic="true"; override it so only the new toast is read. */}
        <div className="toast-stack" role="status" aria-live="polite" aria-atomic="false">
          {others.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </div>
      </section>
    </ToastContext.Provider>
  );
}

function isSticky(duration: number) {
  return !Number.isFinite(duration) || duration <= 0;
}

function ToastItem({ toast, onDismiss }: { toast: ToastRecord; onDismiss: (id: string) => void }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const paused = hovered || focused;
  const sticky = isSticky(toast.duration);
  // Time still owed to this toast. Survives re-renders; only the effect cleanup changes it.
  const remaining = useRef(toast.duration);

  useEffect(() => {
    // Never pass Infinity to setTimeout: browsers clamp it and fire almost immediately.
    if (sticky || paused) return;
    const startedAt = Date.now();
    const timer = setTimeout(() => onDismiss(toast.id), remaining.current);
    return () => {
      // Runs on pause, on unmount and before any re-run: bank the elapsed time.
      clearTimeout(timer);
      remaining.current = Math.max(0, remaining.current - (Date.now() - startedAt));
    };
  }, [paused, sticky, toast.id, onDismiss]);

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    // Moving focus between elements inside the same toast is not "leaving" it.
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
  }

  const isError = toast.type === 'error';
  return (
    <div
      className={`toast toast--${toast.type}`}
      data-toast=""
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={handleBlur}
    >
      <p className="toast__message" role={isError ? 'alert' : undefined}>
        {toast.message}
      </p>
      <button type="button" className="toast__close" aria-label="Dismiss notification" onClick={() => onDismiss(toast.id)}>
        ×
      </button>
    </div>
  );
}

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) {
    throw new Error('useToast() must be called inside a <ToastProvider>. Wrap your app (or the component under test) in <ToastProvider>.');
  }
  return api;
}
