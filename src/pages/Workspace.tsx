import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { QUESTION_BY_ID } from '@/content';
import CodingWorkspace from '@/workspace/CodingWorkspace';
import OutputWorkspace from '@/workspace/OutputWorkspace';
import NotFound from './NotFound';

export default function Workspace() {
  const { id = '' } = useParams();
  const q = QUESTION_BY_ID[id];
  useEffect(() => {
    if (q) document.title = `${q.title} · Practice · Frontend Interview Lab`;
  }, [q]);
  if (!q) return <NotFound />;
  return q.kind === 'coding' ? <CodingWorkspace key={q.id} problem={q} /> : <OutputWorkspace key={q.id} question={q} />;
}
