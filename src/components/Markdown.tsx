import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from './ui';

/** Renders Markdown safely (raw HTML is not rendered). */
export function Markdown({ children, className }: { children: string; className?: string }) {
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
