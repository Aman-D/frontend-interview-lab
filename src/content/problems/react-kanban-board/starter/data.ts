import type { Board } from './types';

export const initialBoard: Board = {
  cards: {
    'c-1': { id: 'c-1', title: 'Write the API contract' },
    'c-2': { id: 'c-2', title: 'Design empty states' },
    'c-3': { id: 'c-3', title: 'Set up error reporting' },
    'c-4': { id: 'c-4', title: 'Migrate settings page' },
    'c-5': { id: 'c-5', title: 'Fix date rounding bug' },
    'c-6': { id: 'c-6', title: 'Release notes for v2.3' },
  },
  columns: [
    { id: 'todo', title: 'To do', cardIds: ['c-1', 'c-2', 'c-3'] },
    { id: 'doing', title: 'In progress', cardIds: ['c-4', 'c-5'], limit: 3 },
    { id: 'done', title: 'Done', cardIds: ['c-6'] },
  ],
};
