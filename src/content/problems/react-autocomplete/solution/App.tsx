import Autocomplete from './Autocomplete';
import { searchFruits } from './api';
import './styles.css';

export default function App() {
  return (
    <main className="app">
      <h1>Fruit search</h1>
      <p className="hint">Try typing "an", "berry" or "error". Responses arrive with random latency.</p>
      <Autocomplete label="Search fruits" fetchSuggestions={searchFruits} onSelect={(v) => console.log('selected', v)} />
    </main>
  );
}
