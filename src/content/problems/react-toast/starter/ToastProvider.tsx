import { createContext, useContext, useState } from 'react';
import type { ToastApi, ToastOptions, ToastProviderProps, ToastType } from './types';

interface ToastRecord {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

const ToastContext = createContext<ToastApi>({
  show: () => '',
  dismiss: () => {},
});

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  // TODO:
  // - stable show/dismiss (same identity on every render); show returns the new toast's id
  // - auto-dismiss after `duration` (provider default 4000 ms); 0 / Infinity = sticky
  // - pause on hover/focus, resume with the REMAINING time; close button
  // - at most `max` toasts visible, the rest queued (FIFO); newest first on screen
  // - error toasts: role="alert"; others inside a persistent role="status" polite region
  // - clear every timer on unmount; useToast() outside a provider must throw
  const show = (message: string, options: ToastOptions = {}) => {
    const id = String(Date.now());
    setToasts([...toasts, { id, message, type: options.type ?? 'info', duration: options.duration ?? 4000 }]);
    return id;
  };
  const dismiss = (_id: string) => {};

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}
      <section className="toast-viewport">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.type}`} data-toast="">
            <p className="toast__message">{t.message}</p>
          </div>
        ))}
      </section>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  return useContext(ToastContext);
}
