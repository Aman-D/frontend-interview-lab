import DataTable from './DataTable';
import { employeeColumns, employees } from './data';
import './styles.css';

export default function App() {
  return (
    <main className="app">
      <h1>Team directory</h1>
      <p className="hint">Sort by clicking a header (ascending → descending → off). Try filtering for "platform" or "berlin".</p>
      <DataTable
        caption="Employees"
        rows={employees}
        columns={employeeColumns}
        getRowId={(e) => e.id}
        filterKeys={['name', 'team', 'level', 'location']}
      />
    </main>
  );
}
