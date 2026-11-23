import type { FolderNode } from './types';

export const sampleTree: FolderNode = {
  kind: 'folder',
  id: 'root',
  name: 'project',
  children: [
    { kind: 'file', id: 'root/README.md', name: 'README.md' },
    { kind: 'file', id: 'root/package.json', name: 'package.json' },
    {
      kind: 'folder',
      id: 'root/src',
      name: 'src',
      children: [
        { kind: 'file', id: 'root/src/main.tsx', name: 'main.tsx' },
        { kind: 'file', id: 'root/src/App.tsx', name: 'App.tsx' },
        {
          kind: 'folder',
          id: 'root/src/components',
          name: 'components',
          children: [{ kind: 'file', id: 'root/src/components/Button.tsx', name: 'Button.tsx' }],
        },
      ],
    },
    { kind: 'folder', id: 'root/public', name: 'public', children: [] },
  ],
};
