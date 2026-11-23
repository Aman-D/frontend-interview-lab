import { useState, type ReactNode } from 'react';

export interface TabItem {
  /** Stable, unique id. Used as the selection value and as the React key. */
  id: string;
  /** Content of the tab button. */
  label: ReactNode;
  /** Content of the tab panel. */
  content: ReactNode;
  /** Disabled tabs cannot be selected and are skipped by keyboard navigation. */
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  /** Accessible name of the tablist (e.g. "Account settings"). */
  label: string;
  /** Controlled selected id. When defined, the parent owns the selection. */
  value?: string;
  /** Initial selected id for uncontrolled usage. Default: the first enabled tab. */
  defaultValue?: string;
  /** Called with the id of the newly selected tab (only when the selection changes). */
  onChange?: (id: string) => void;
  /** automatic: arrow keys move focus AND select. manual: arrows move focus, Enter/Space select. Default: automatic. */
  activation?: 'automatic' | 'manual';
  /** Keep inactive panels' content mounted (hidden) so their state survives switching. Default: false. */
  keepMounted?: boolean;
}

export default function Tabs({ items }: TabsProps) {
  const [selectedId, setSelectedId] = useState(items[0]?.id);

  // TODO:
  // - tablist / tab / tabpanel roles, aria-selected, aria-controls, aria-labelledby (ids from useId)
  // - controlled (value + onChange) and uncontrolled (defaultValue) selection; skip disabled tabs
  // - roving tabindex: only the selected tab has tabIndex=0
  // - ArrowLeft / ArrowRight (wrapping), Home / End; automatic vs manual activation
  // - hide inactive panels; keepMounted keeps their content mounted
  const selected = items.find((item) => item.id === selectedId);
  return (
    <div className="tabs">
      <div className="tabs__list">
        {items.map((item) => (
          <button key={item.id} type="button" className="tabs__tab" onClick={() => setSelectedId(item.id)}>
            {item.label}
          </button>
        ))}
      </div>
      <div className="tabs__panel">{selected?.content}</div>
    </div>
  );
}
