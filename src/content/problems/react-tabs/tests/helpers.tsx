import type { TabItem } from '../Tabs';

// Shared fixture: four tabs, the third one disabled.
export const fruits: TabItem[] = [
  { id: 'apple', label: 'Apple', content: <p>Apples are crisp.</p> },
  { id: 'banana', label: 'Banana', content: <p>Bananas are soft.</p> },
  { id: 'cherry', label: 'Cherry', content: <p>Cherries are seasonal.</p>, disabled: true },
  { id: 'date', label: 'Date', content: <p>Dates are sweet.</p> },
];

export const tab = (name: string) => screen.getByRole('tab', { name });

export function press(el: HTMLElement, key: string) {
  fireEvent.keyDown(el, { key });
}

/** The single visible tabpanel (hidden panels are excluded from role queries). */
export const visiblePanel = () => screen.getByRole('tabpanel');
