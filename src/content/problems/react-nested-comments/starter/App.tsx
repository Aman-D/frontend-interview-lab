import { useState } from 'react';
import CommentThread from './CommentThread';
import { sampleStore } from './data';
import './styles.css';

export default function App() {
  const [changes, setChanges] = useState(0);
  return (
    <main className="app">
      <h1>Discussion</h1>
      <p className="hint">
        Signed in as <strong>You</strong>. Reply to any comment; edit or delete your own. Deleting a comment that has replies leaves a
        "[deleted]" placeholder so the conversation below it survives.
      </p>
      <CommentThread initialStore={sampleStore} currentUser="You" onChange={() => setChanges((n) => n + 1)} />
      <p className="hint">Committed changes: {changes}</p>
    </main>
  );
}
