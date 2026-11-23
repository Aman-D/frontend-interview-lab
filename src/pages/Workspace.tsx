import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { QUESTION_BY_ID } from '@/content';
import CodingWorkspace from '@/workspace/CodingWorkspace';
import OutputWorkspace from '@/workspace/OutputWorkspace';
import DesignWorkspace from '@/workspace/DesignWorkspace';
import NotFound from './NotFound';

export default function Workspace() {
  const { id = '' } = useParams();
  const q = QUESTION_BY_ID[id];
  useEffect(() => {
    if (q) document.title = `${q.title} · Practice · Frontend Interview Lab`;
  }, [q]);
  if (!q) return <NotFound />;
  if (q.kind === 'coding') return <CodingWorkspace key={q.id} problem={q} />;
  if (q.kind === 'design') return <DesignWorkspace key={q.id} question={q} />;
  return <OutputWorkspace key={q.id} question={q} />;
}
