import { useState } from 'react';
import { rankCommands } from './rank';
import type { Command } from './types';

export interface CommandPaletteProps {
  commands: Command[];
  /** Most recent first. Default: none. */
  initialRecentIds?: string[];
  /** How many recent commands to remember. Default: 5. */
  maxRecent?: number;
}

export default function CommandPalette({ commands }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const results = rankCommands(query, commands, []);

  // TODO:
  // - Ctrl+K / Cmd+K anywhere opens (and, inside the palette input, closes) the palette,
  //   but NOT while the user is typing in another text field
  // - modal dialog labelled "Command palette"; focus the input on open
  // - combobox input + listbox of options grouped by section (role="group" labelled by its heading)
  // - ArrowUp/ArrowDown (wrapping, skipping disabled) via aria-activedescendant
  // - Enter runs the active command and closes; Escape closes
  // - on close, return focus to whatever was focused before opening
  // - "No commands found" in a polite status region; remember recent commands
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open command palette
      </button>
      {open && (
        <div role="dialog" aria-label="Command palette">
          <input value={query} onChange={(e) => setQuery(e.target.value)} />
          <ul>
            {results.map((c) => (
              <li key={c.id}>{c.title}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
