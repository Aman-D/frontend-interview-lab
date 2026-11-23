import { clsx } from 'clsx';
import { forwardRef, useEffect, useRef, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

export const cn = clsx;

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' }>(
  ({ className, variant = 'secondary', size = 'md', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'btn inline-flex select-none items-center justify-center gap-1.5 whitespace-nowrap rounded font-medium disabled:cursor-not-allowed disabled:opacity-45',
        size === 'sm' ? 'h-7 px-2.5 text-[13px]' : 'h-9 px-3.5 text-sm',
        variant === 'primary' && 'btn--primary bg-accent text-accent-ink',
        variant === 'secondary' && 'border border-border bg-panel text-fg hover:border-subtle/50 hover:bg-muted/60',
        variant === 'ghost' && 'text-subtle hover:bg-muted hover:text-fg',
        variant === 'danger' && 'border border-bad/40 bg-panel text-bad hover:bg-bad/10',
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';

export function Badge({ className, tone = 'neutral', ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: 'neutral' | 'accent' | 'ok' | 'warn' | 'bad' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded px-1.5 py-[3px] text-[12px] font-medium leading-none',
        tone === 'neutral' && 'bg-muted text-subtle',
        tone === 'accent' && 'bg-accent/10 text-accent-text',
        tone === 'ok' && 'bg-ok/15 text-ok',
        tone === 'warn' && 'bg-warn/15 text-warn',
        tone === 'bad' && 'bg-bad/15 text-bad',
        className,
      )}
      {...props}
    />
  );
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-lg border border-border bg-panel', className)} {...props} />;
}

export function CardHeader({ title, action, className }: { title: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between gap-2 border-b border-border px-4 py-3', className)}>
      <h2 className="text-[15px] font-semibold">{title}</h2>
      {action}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn('h-9 rounded border border-border bg-panel px-2.5 text-sm placeholder:text-subtle/80 transition-[border-color,box-shadow] duration-150 hover:border-subtle/50 focus-visible:border-accent', className)} {...props} />
));
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn('w-full rounded border border-border bg-panel p-2.5 text-sm leading-relaxed placeholder:text-subtle/80 hover:border-subtle/50', className)} {...props} />
));
Textarea.displayName = 'Textarea';

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn('h-9 rounded border border-border bg-panel px-2 text-sm hover:border-subtle/50', className)} {...props} />;
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-8 text-center">
      <p className="font-medium">{title}</p>
      {children && <div className="mt-1 text-sm text-subtle">{children}</div>}
    </div>
  );
}

export interface TabItem<T extends string> {
  id: T;
  label: ReactNode;
  hidden?: boolean;
}

/** Accessible tabs (APG: automatic activation, arrow-key navigation). */
export function Tabs<T extends string>({ tabs, value, onChange, label, className, size = 'md' }: { tabs: TabItem<T>[]; value: T; onChange: (v: T) => void; label: string; className?: string; size?: 'sm' | 'md' }) {
  const visible = tabs.filter((t) => !t.hidden);
  const refs = useRef(new Map<T, HTMLButtonElement>());
  return (
    <div role="tablist" aria-label={label} className={cn('flex items-center gap-0.5 overflow-x-auto', className)}>
      {visible.map((t, i) => (
        <button
          key={t.id}
          ref={(el) => {
            if (el) refs.current.set(t.id, el);
          }}
          role="tab"
          type="button"
          id={`tab-${label}-${t.id}`}
          aria-selected={value === t.id}
          tabIndex={value === t.id ? 0 : -1}
          onClick={() => onChange(t.id)}
          onKeyDown={(e) => {
            let next = -1;
            if (e.key === 'ArrowRight') next = (i + 1) % visible.length;
            if (e.key === 'ArrowLeft') next = (i - 1 + visible.length) % visible.length;
            if (e.key === 'Home') next = 0;
            if (e.key === 'End') next = visible.length - 1;
            if (next >= 0) {
              e.preventDefault();
              onChange(visible[next].id);
              refs.current.get(visible[next].id)?.focus();
            }
          }}
          className={cn(
            'whitespace-nowrap rounded font-medium transition-colors duration-150',
            size === 'sm' ? 'px-2 py-1 text-[13px]' : 'px-2.5 py-1.5 text-sm',
            value === t.id ? 'bg-fg text-bg' : 'text-subtle hover:bg-muted hover:text-fg',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/** Modal dialog built on native <dialog> (focus trapping, Escape, inert background). */
export function Dialog({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="dialog-title"
      className={cn('rounded-lg border border-border bg-panel p-0 text-fg shadow-2xl backdrop:bg-black/50', wide ? 'w-[min(720px,95vw)]' : 'w-[min(480px,95vw)]')}
    >
      {open && (
        <div className="flex max-h-[85vh] flex-col">
          <div className="border-b border-border px-5 py-3">
            <h2 id="dialog-title" className="font-semibold">{title}</h2>
          </div>
          <div className="overflow-y-auto px-5 py-4">{children}</div>
          {footer && <div className="flex justify-end gap-2 border-t border-border px-5 py-3">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="px-4 py-3.5">
      <div className="text-[13px] font-medium text-subtle">{label}</div>
      <div className="mt-1.5 text-[26px] font-medium leading-none tracking-tight tabular-nums">{value}</div>
      {hint && <div className="mt-1.5 text-[13px] text-subtle">{hint}</div>}
    </div>
  );
}

export function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} className="h-1.5 w-full overflow-hidden rounded bg-muted">
      <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
    </div>
  );
}
