import { useRef, useState } from 'react';
import Modal from './Modal';
import './styles.css';

export default function App() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [status, setStatus] = useState('Signed in as Ada.');
  const [name, setName] = useState('Ada');
  const [draft, setDraft] = useState(name);
  const stayRef = useRef<HTMLButtonElement>(null);

  return (
    <main className="app">
      <h1>Account</h1>
      <p role="status">{status}</p>
      <div className="actions">
        <button
          type="button"
          onClick={() => {
            setDraft(name);
            setProfileOpen(true);
          }}
        >
          Edit profile
        </button>
        <button type="button" className="danger" onClick={() => setConfirmOpen(true)}>
          Sign out
        </button>
      </div>

      {/* Long content so you can check that the page behind the modal does not scroll. */}
      {Array.from({ length: 30 }, (_, i) => (
        <p key={i} className="filler">
          Activity log entry #{30 - i}: dashboard viewed.
        </p>
      ))}

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Sign out?"
        description="You will need to sign in again to see your dashboards."
        initialFocusRef={stayRef}
      >
        <div className="modal-actions">
          <button type="button" ref={stayRef} onClick={() => setConfirmOpen(false)}>
            Stay signed in
          </button>
          <button
            type="button"
            className="danger"
            onClick={() => {
              setConfirmOpen(false);
              setStatus('You have been signed out (demo).');
            }}
          >
            Sign out
          </button>
        </div>
      </Modal>

      <Modal open={profileOpen} onClose={() => setProfileOpen(false)} title="Edit profile">
        <form
          className="profile-form"
          onSubmit={(e) => {
            e.preventDefault();
            setName(draft.trim() || name);
            setStatus(`Saved. Signed in as ${draft.trim() || name}.`);
            setProfileOpen(false);
          }}
        >
          <label>
            Display name
            <input value={draft} onChange={(e) => setDraft(e.target.value)} />
          </label>
          <div className="modal-actions">
            <button type="button" onClick={() => setProfileOpen(false)}>
              Cancel
            </button>
            <button type="submit">Save</button>
          </div>
        </form>
      </Modal>
    </main>
  );
}
