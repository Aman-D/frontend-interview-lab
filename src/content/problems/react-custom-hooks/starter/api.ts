// Mock data source for the preview. Every request is logged, so you can see deduplication
// (two panels, one request) and background revalidation in the console.
const PEOPLE = [
  'Ada Lovelace', 'Alan Turing', 'Barbara Liskov', 'Donald Knuth', 'Edsger Dijkstra', 'Frances Allen',
  'Grace Hopper', 'Hedy Lamarr', 'John Backus', 'Ken Thompson', 'Leslie Lamport', 'Margaret Hamilton',
  'Radia Perlman', 'Tim Berners-Lee', 'Tony Hoare',
];

let requestCount = 0;

export function searchPeople(key: string): Promise<string[]> {
  const n = ++requestCount;
  const query = decodeURIComponent(key.split('q=')[1] ?? '').toLowerCase();
  console.log(`request #${n}: ${key}`);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (query === 'error') reject(new Error('Search service unavailable'));
      else resolve(PEOPLE.filter((p) => p.toLowerCase().includes(query)));
    }, 400 + Math.random() * 600);
  });
}
