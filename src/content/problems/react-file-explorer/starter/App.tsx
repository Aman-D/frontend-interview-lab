import FileExplorer from './FileExplorer';
import { sampleTree } from './data';
import './styles.css';

export default function App() {
  return (
    <main className="app">
      <h1>File explorer</h1>
      <FileExplorer initialTree={sampleTree} onOpenFile={(f) => console.log('open', f.id)} />
    </main>
  );
}
