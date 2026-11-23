import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { rankCommands } from './rank';
import type { Command } from './types';

export interface CommandPaletteProps {
  commands: Command[];
  /** Most recent first. Default: none. */
  initialRecentIds?: string[];
  /** How many recent commands to remember. Default: 5. */
  maxRecent?: number;
}

const RECENT_GROUP = 'Recent';
const NON_TEXT_INPUT_TYPES = new Set(['button', 'checkbox', 'radio', 'submit', 'reset', 'range', 'color', 'file', 'image', 'hidden']);

/** True when a key press here is the user typing text (so a global shortcut must not steal it). */
function isTextEntry(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true;
  if (target instanceof HTMLInputElement) return !NON_TEXT_INPUT_TYPES.has(target.type);
  return false;
}

function isPaletteShortcut(e: KeyboardEvent): boolean {
  return (e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && (e.key ?? '').toLowerCase() === 'k';
}

export default function CommandPalette({ commands, initialRecentIds = [], maxRecent = 5 }: CommandPaletteProps) {
  const baseId = useId();
  const listboxId = `${baseId}-listbox`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [recentIds, setRecentIds] = useState<string[]>(() => initialRecentIds.slice(0, maxRecent));

  const inputRef = useRef<HTMLInputElement>(null);
  // Mirrors `open` synchronously so the document listener (registered once) and back-to-back
  // events in the same tick see the current value without re-subscribing.
  const openRef = useRef(false);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const openPalette = useCallback(() => {
    if (openRef.current) return;
    openRef.current = true;
    // Capture BEFORE focus moves into the palette.
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setQuery('');
    setActiveId(null);
    setOpen(true);
  }, []);

  /** Closes and restores focus synchronously, so a command run right after can move focus itself. */
  const closePalette = useCallback(() => {
    if (!openRef.current) return;
    openRef.current = false;
    setOpen(false);
    const target = returnFocusRef.current;
    returnFocusRef.current = null;
    if (target && target.isConnected) target.focus();
  }, []);

  // Global shortcut: one listener for the component's lifetime.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!isPaletteShortcut(e) || e.isComposing) return;
      const fromPalette = inputRef.current !== null && e.target === inputRef.current;
      if (!fromPalette && isTextEntry(e.target)) return; // the user is typing somewhere else
      e.preventDefault(); // browsers bind Ctrl/Cmd+K to the address/search bar
      if (openRef.current) closePalette();
      else openPalette();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [openPalette, closePalette]);

  // Unmounted while open (e.g. route change): don't strand keyboard users on <body>.
  useEffect(
    () => () => {
      if (!openRef.current) return;
      openRef.current = false;
      const target = returnFocusRef.current;
      if (target && target.isConnected) target.focus();
    },
    [],
  );

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const ranked = useMemo(() => (open ? rankCommands(query, commands, recentIds) : []), [open, query, commands, recentIds]);

  // Group by section in order of first appearance in the ranked list. With an empty query, recents get
  // their own group (they are ranked first, so it comes first). Visual order == keyboard order.
  const groups = useMemo(() => {
    const showRecent = query.trim() === '';
    const recent = new Set(recentIds);
    const byName = new Map<string, Command[]>();
    for (const c of ranked) {
      const name = showRecent && recent.has(c.id) ? RECENT_GROUP : c.section;
      const items = byName.get(name);
      if (items) items.push(c);
      else byName.set(name, [c]);
    }
    return Array.from(byName, ([name, items]) => ({ name, items }));
  }, [ranked, query, recentIds]);

  const visible = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const enabled = useMemo(() => visible.filter((c) => !c.disabled), [visible]);
  // Derived: if the remembered id is gone (filtered out / disabled), fall back to the first enabled option.
  const active = enabled.find((c) => c.id === activeId) ?? enabled[0] ?? null;

  const optionIds = useMemo(() => new Map(visible.map((c, i) => [c.id, `${baseId}-option-${i}`])), [visible, baseId]);
  const activeOptionId = active ? optionIds.get(active.id) : undefined;

  useEffect(() => {
    if (!activeOptionId) return;
    const el = document.getElementById(activeOptionId);
    el?.scrollIntoView?.({ block: 'nearest' });
  }, [activeOptionId]);

  function runCommand(command: Command) {
    if (command.disabled) return;
    closePalette(); // focus is back on the invoker before the command runs
    setRecentIds((prev) => [command.id, ...prev.filter((id) => id !== command.id)].slice(0, maxRecent));
    command.run();
  }

  function onInputKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing) return; // Enter/arrows belong to the IME while composing
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        e.preventDefault(); // keep the caret where it is
        if (enabled.length === 0) return;
        const step = e.key === 'ArrowDown' ? 1 : -1;
        const current = active ? enabled.indexOf(active) : -1;
        const next = current === -1 ? (step === 1 ? 0 : enabled.length - 1) : (current + step + enabled.length) % enabled.length;
        setActiveId(enabled[next].id);
        return;
      }
      case 'Enter':
        e.preventDefault();
        if (active) runCommand(active);
        return;
      case 'Escape':
        e.preventDefault();
        closePalette();
        return;
      case 'Tab':
        // The input is the only focusable element in the modal; keep focus inside.
        e.preventDefault();
        return;
    }
  }

  const expanded = visible.length > 0;
  const hasQuery = query.trim() !== '';

  return (
    <>
      <button type="button" className="cp-trigger" aria-haspopup="dialog" aria-keyshortcuts="Control+K Meta+K" onClick={openPalette}>
        Open command palette
      </button>
      <kbd className="cp-trigger-hint" aria-hidden="true">
        Ctrl / ⌘ K
      </kbd>
      {open &&
        createPortal(
          <div
            className="cp-backdrop"
            data-testid="palette-backdrop"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closePalette();
            }}
          >
            <div role="dialog" aria-modal="true" aria-label="Command palette" className="cp-dialog">
              <input
                ref={inputRef}
                className="cp-input"
                role="combobox"
                aria-label="Search commands"
                aria-autocomplete="list"
                aria-expanded={expanded}
                aria-controls={expanded ? listboxId : undefined}
                aria-activedescendant={activeOptionId}
                autoComplete="off"
                spellCheck={false}
                placeholder="Type a command or search…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveId(null); // new results → highlight the best match
                }}
                onKeyDown={onInputKeyDown}
              />
              {expanded && (
                <div role="listbox" id={listboxId} aria-label="Commands" className="cp-listbox">
                  {groups.map((group, gi) => {
                    const labelId = `${baseId}-group-${gi}`;
                    return (
                      <div role="group" aria-labelledby={labelId} key={group.name} className="cp-group">
                        <div role="presentation" id={labelId} className="cp-group-label">
                          {group.name}
                        </div>
                        {group.items.map((c) => {
                          const isActive = active?.id === c.id;
                          return (
                            <div
                              key={c.id}
                              id={optionIds.get(c.id)}
                              role="option"
                              aria-selected={isActive}
                              aria-disabled={c.disabled ? true : undefined}
                              className={'cp-option' + (isActive ? ' is-active' : '')}
                              // Options are not focusable; don't let a click blur the input.
                              onMouseDown={(e) => e.preventDefault()}
                              onMouseMove={() => {
                                if (!c.disabled && c.id !== active?.id) setActiveId(c.id);
                              }}
                              onClick={() => runCommand(c)}
                            >
                              <span className="cp-title">{c.title}</span>
                              {c.shortcut && <kbd className="cp-shortcut">{c.shortcut}</kbd>}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
              <div role="status" className="cp-status">
                {!expanded ? 'No commands found' : hasQuery ? <span className="sr-only">{`${visible.length} ${visible.length === 1 ? 'command' : 'commands'}`}</span> : null}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
