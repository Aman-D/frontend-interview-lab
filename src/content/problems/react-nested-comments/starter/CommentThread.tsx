import { useState } from 'react';
import type { CommentStore } from './types';

export interface CommentThreadProps {
  initialStore: CommentStore;
  /** Author name used for new comments; only this user's comments show Edit and Delete. */
  currentUser: string;
  /** Called with the new store after every change that actually changed something. */
  onChange?: (store: CommentStore) => void;
  /** Injectable for tests. */
  generateId?: () => string;
  /** Injectable clock (epoch ms) for tests. */
  now?: () => number;
}

export default function CommentThread({ initialStore }: CommentThreadProps) {
  const [store] = useState(initialStore);
  // TODO: render replies recursively, the composer, sorting, reply / edit / delete / upvote,
  // collapse / expand with reply counts, and focus management — see the description.
  return (
    <section className="thread">
      <h2>Comments</h2>
      <ul className="comments">
        {store.rootIds.map((id) => (
          <li key={id} className="comment">
            <article className="comment__body">
              <span className="comment__author">{store.byId[id].author}</span>
              <p className="comment__text">{store.byId[id].text}</p>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
