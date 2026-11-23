import { useState } from 'react';
import StarRating from './StarRating';
import './styles.css';

export default function App() {
  const [score, setScore] = useState(3);
  return (
    <main className="app">
      <h1>Star rating</h1>

      <section>
        <h2>Controlled (parent owns the value)</h2>
        <StarRating label="Rate this recipe" value={score} onChange={setScore} allowClear />
        <p className="hint">
          Current value: <output>{score}</output> — click the same star again to clear.
        </p>
      </section>

      <section>
        <h2>Uncontrolled, 10 stars</h2>
        <StarRating label="Rate the venue" max={10} defaultValue={7} onChange={(v) => console.log('venue', v)} />
      </section>

      <section>
        <h2>Read-only</h2>
        <StarRating label="Average rating" value={score} readOnly />
      </section>
    </main>
  );
}
