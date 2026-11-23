import { ToastProvider, useToast } from '../ToastProvider';
import type { ToastApi, ToastOptions, ToastProviderProps } from '../types';

/** Renders a provider with a consumer that captures the API, plus act-wrapped show/dismiss helpers. */
export function setup(props: Omit<ToastProviderProps, 'children'> = {}) {
  const captured: { api: ToastApi | null; renders: number } = { api: null, renders: 0 };
  function Consumer() {
    captured.renders += 1;
    captured.api = useToast();
    return null;
  }
  const utils = render(
    <ToastProvider {...props}>
      <Consumer />
    </ToastProvider>,
  );
  const show = (message: string, options?: ToastOptions) => {
    let id = '';
    act(() => {
      id = (captured.api as ToastApi).show(message, options);
    });
    return id;
  };
  const dismiss = (id: string) => {
    act(() => {
      (captured.api as ToastApi).dismiss(id);
    });
  };
  return { ...utils, captured, show, dismiss };
}

/** The root element of the toast that displays `text` (every toast root carries data-toast). */
export function toastFor(text: string) {
  const el = screen.getByText(text).closest('[data-toast]');
  if (!el) throw new Error(`No [data-toast] element contains "${text}"`);
  return el as HTMLElement;
}
