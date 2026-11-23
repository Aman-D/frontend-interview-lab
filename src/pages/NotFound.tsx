import { Link } from 'react-router-dom';
import { Page } from '@/components/Layout';

export default function NotFound() {
  return (
    <Page title="Not found">
      <p className="text-sm">That page or question does not exist. <Link className="text-accent underline" to="/library">Back to the library</Link>.</p>
    </Page>
  );
}
