import { useState } from 'react';
import Popover from './Popover';
import Tooltip from './Tooltip';
import './styles.css';

export default function App() {
  const [sizes, setSizes] = useState<string[]>(['M']);
  const toggle = (size: string) => setSizes((s) => (s.includes(size) ? s.filter((x) => x !== size) : [...s, size]));

  return (
    <main className="app">
      <h1>Tooltip &amp; Popover</h1>
      <p className="hint">Hover or Tab to the toolbar buttons. Move the pointer onto a tooltip — it stays. Press Escape to dismiss.</p>

      <div className="toolbar" role="toolbar" aria-label="Formatting">
        <Tooltip content="Bold (Ctrl+B)">
          <button type="button" aria-label="Bold">
            <b>B</b>
          </button>
        </Tooltip>
        <Tooltip content="Italic (Ctrl+I)">
          <button type="button" aria-label="Italic">
            <i>I</i>
          </button>
        </Tooltip>
        <Tooltip content="Inserts a link to another page. Select some text first." placement="right">
          <button type="button">Link</button>
        </Tooltip>
      </div>

      <h2>Popover</h2>
      <Popover
        trigger={<button type="button">Filters ({sizes.length})</button>}
        content={
          <fieldset className="filters">
            <legend>Size</legend>
            {['S', 'M', 'L'].map((size) => (
              <label key={size}>
                <input type="checkbox" checked={sizes.includes(size)} onChange={() => toggle(size)} /> {size}
              </label>
            ))}
          </fieldset>
        }
      />

      {/* Pinned to the top-right corner: "top" has no room (flip) and centring would overflow (shift). */}
      <div className="corner">
        <Tooltip content="Notifications are paused until tomorrow morning" placement="top">
          <button type="button">Edge</button>
        </Tooltip>
      </div>
      <div className="corner corner--bottom">
        <Popover trigger={<button type="button">Help</button>} content={<p className="help">Popovers flip above the trigger near the bottom edge.</p>} />
      </div>
    </main>
  );
}
