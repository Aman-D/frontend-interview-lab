import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from './ui';

/** Renders Markdown safely (raw HTML is not rendered). */
export function Markdown({ children, className, inline }: { children: string; className?: string; inline?: boolean }) {
  if (inline) {
    // For short labels (list items, checkbox text): no block wrapper, code spans still styled.
    return (
      <span className={cn('prose-lab', className)}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: ({ children: c }) => <>{c}</> }}>
          {children}
        </ReactMarkdown>
      </span>
    );
  }
  return (
    <div className={cn('prose-lab', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children: c }) => (
            <a href={href} target="_blank" rel="noreferrer noopener">
              {c}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
