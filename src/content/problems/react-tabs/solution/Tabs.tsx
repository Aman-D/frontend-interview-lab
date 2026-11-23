import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

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

function firstEnabledId(items: TabItem[]) {
  return items.find((item) => !item.disabled)?.id;
}

function isSelectable(items: TabItem[], id: string | undefined) {
  return id !== undefined && items.some((item) => item.id === id && !item.disabled);
}

export default function Tabs({ items, label, value, defaultValue, onChange, activation = 'automatic', keepMounted = false }: TabsProps) {
  const baseId = useId();
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(() => (isSelectable(items, defaultValue) ? defaultValue : firstEnabledId(items)));

  // Derived, not synced with an effect: if the uncontrolled selection disappears or
  // becomes disabled (items changed), fall back to the first enabled tab.
  const selectedId = isControlled ? value : isSelectable(items, internalValue) ? internalValue : firstEnabledId(items);
  const selectedIndex = items.findIndex((item) => item.id === selectedId);

  // Roving tabindex: exactly one tab is in the page Tab order. Normally the selected one;
  // if nothing selectable is selected, the first enabled tab so the tablist stays reachable.
  const tabbableIndex =
    selectedIndex !== -1 && !items[selectedIndex].disabled ? selectedIndex : items.findIndex((item) => !item.disabled);

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tabId = (index: number) => `${baseId}-tab-${index}`;
  const panelId = (index: number) => `${baseId}-panel-${index}`;

  function select(id: string) {
    if (id === selectedId) return;
    if (!isControlled) setInternalValue(id);
    onChange?.(id);
  }

  /** Next enabled index from `from` (exclusive) in direction `step`, wrapping around. */
  function findEnabled(from: number, step: 1 | -1) {
    const n = items.length;
    for (let i = 1; i <= n; i++) {
      const index = (((from + step * i) % n) + n) % n;
      if (!items[index].disabled) return index;
    }
    return -1;
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let target = -1;
    switch (event.key) {
      case 'ArrowRight':
        target = findEnabled(index, 1);
        break;
      case 'ArrowLeft':
        target = findEnabled(index, -1);
        break;
      case 'Home':
        target = findEnabled(-1, 1);
        break;
      case 'End':
        target = findEnabled(items.length, -1);
        break;
      case 'Enter':
      case ' ':
        // Native buttons would also click on Enter/Space; handle it here so manual
        // activation does not depend on that, and avoid a second synthetic click.
        event.preventDefault();
        select(items[index].id);
        return;
      default:
        return; // leave Tab, Shift+Tab, etc. alone
    }
    event.preventDefault(); // stop Home/End/arrows from scrolling the page
    if (target === -1) return;
    tabRefs.current[target]?.focus();
    if (activation === 'automatic') select(items[target].id);
  }

  return (
    <div className="tabs">
      <div role="tablist" aria-label={label} aria-orientation="horizontal" className="tabs__list">
        {items.map((item, index) => {
          const selected = index === selectedIndex;
          return (
            <button
              key={item.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              type="button"
              role="tab"
              id={tabId(index)}
              aria-selected={selected}
              aria-controls={panelId(index)}
              tabIndex={index === tabbableIndex ? 0 : -1}
              disabled={item.disabled}
              className="tabs__tab"
              onClick={() => select(item.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {items.map((item, index) => {
        const selected = index === selectedIndex;
        // Every panel element is always rendered so each tab's aria-controls resolves;
        // only the *content* of inactive panels is unmounted unless keepMounted is set.
        return (
          <div
            key={item.id}
            role="tabpanel"
            id={panelId(index)}
            aria-labelledby={tabId(index)}
            tabIndex={0}
            hidden={!selected}
            className="tabs__panel"
          >
            {selected || keepMounted ? item.content : null}
          </div>
        );
      })}
    </div>
  );
}
