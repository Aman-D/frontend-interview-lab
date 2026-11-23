import type { ReactNode } from 'react';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastOptions {
  /** Visual + semantic type. Default: 'info'. `error` toasts are announced assertively (role="alert"). */
  type?: ToastType;
  /** Milliseconds before auto-dismiss. Default: the provider's `defaultDuration`. 0 or Infinity = sticky. */
  duration?: number;
}

export interface ToastApi {
  /** Shows (or queues) a toast and returns its id. */
  show: (message: string, options?: ToastOptions) => string;
  /** Removes a visible or queued toast. Unknown ids are ignored. */
  dismiss: (id: string) => void;
}

export interface ToastProviderProps {
  children?: ReactNode;
  /** Maximum number of toasts on screen; extra toasts wait in a FIFO queue. Default: 3. */
  max?: number;
  /** Default auto-dismiss delay in ms. Default: 4000. */
  defaultDuration?: number;
}
