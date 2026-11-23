// Mock search API used by the preview. Latency is random on purpose so that
// out-of-order responses (race conditions) are visible while you type.
const WORDS = [
  'apple', 'apricot', 'avocado', 'banana', 'blackberry', 'blueberry', 'boysenberry', 'cantaloupe', 'cherry',
  'clementine', 'coconut', 'cranberry', 'currant', 'date', 'dragonfruit', 'durian', 'elderberry', 'feijoa', 'fig',
  'gooseberry', 'grape', 'grapefruit', 'guava', 'honeydew', 'jackfruit', 'jujube', 'kiwi', 'kumquat', 'lemon', 'lime',
  'lychee', 'mandarin', 'mango', 'mangosteen', 'melon', 'mulberry', 'nectarine', 'olive', 'orange', 'papaya',
  'passionfruit', 'peach', 'pear', 'persimmon', 'pineapple', 'plantain', 'plum', 'pomegranate', 'pomelo', 'quince',
  'raspberry', 'redcurrant', 'salak', 'satsuma', 'starfruit', 'strawberry', 'tamarind', 'tangerine', 'watermelon',
];

export function searchFruits(query: string, signal: AbortSignal): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const latency = 150 + Math.random() * 650;
    const timer = setTimeout(() => {
      if (query.toLowerCase() === 'error') {
        reject(new Error('Search service unavailable'));
        return;
      }
      const q = query.toLowerCase();
      resolve(WORDS.filter((w) => w.includes(q)).slice(0, 8));
    }, latency);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('The request was aborted', 'AbortError'));
    });
  });
}
