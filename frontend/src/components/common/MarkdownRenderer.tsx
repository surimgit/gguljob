import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MermaidBlock from './MermaidBlock';

const components = {
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="overflow-x-auto mb-3">
      <table className="w-full text-base border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => <thead style={{ background: 'var(--color-background)' }}>{children}</thead>,
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="px-4 py-2 text-left text-sm font-bold border border-border" style={{ color: 'var(--color-text-primary)' }}>{children}</th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="px-4 py-2 text-sm border border-border" style={{ color: 'var(--color-text-secondary)' }}>{children}</td>
  ),
  h1: ({ children }: { children?: React.ReactNode }) => <h1 className="text-2xl font-bold mt-4 mb-3" style={{ color: 'var(--color-text-primary)' }}>{children}</h1>,
  h2: ({ children }: { children?: React.ReactNode }) => <h2 className="text-xl font-bold mt-4 mb-2" style={{ color: 'var(--color-text-primary)' }}>{children}</h2>,
  h3: ({ children }: { children?: React.ReactNode }) => <h3 className="text-base font-bold mt-3 mb-1.5" style={{ color: 'var(--color-text-primary)' }}>{children}</h3>,
  p: ({ children }: { children?: React.ReactNode }) => <p className="text-base leading-relaxed mb-3" style={{ color: 'var(--color-text-secondary)' }}>{children}</p>,
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc pl-5 mb-3 text-base" style={{ color: 'var(--color-text-secondary)' }}>{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-decimal pl-5 mb-3 text-base" style={{ color: 'var(--color-text-secondary)' }}>{children}</ol>,
  li: ({ children }: { children?: React.ReactNode }) => <li className="mb-1">{children}</li>,
  code: ({ className, children }: { className?: string; children?: React.ReactNode }) => {
    const match = /language-(\w+)/.exec(className ?? '');
    if (match?.[1] === 'mermaid') {
      return <MermaidBlock chart={String(children).replace(/\n$/, '')} />;
    }
    return (
      <code className="px-1.5 py-0.5 rounded text-sm font-mono" style={{ background: 'var(--color-background)', color: 'var(--color-primary-hover)' }}>
        {children}
      </code>
    );
  },
  pre: ({ children }: { children?: React.ReactNode }) => {
    // mermaid 블록이면 pre 래핑 없이 바로 렌더
    const child = children as React.ReactElement<{ className?: string }>;
    if (child?.props?.className?.includes('language-mermaid')) {
      return <>{children}</>;
    }
    return (
      <pre className="rounded-xl p-4 overflow-x-auto mb-3 text-sm font-mono" style={{ background: 'var(--color-background)' }}>
        {children}
      </pre>
    );
  },
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--color-blue)' }}>{children}</a>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{children}</strong>,
  hr: () => <hr className="my-4 border-border" />,
};

interface MarkdownRendererProps {
  children: string;
  className?: string;
}

const MarkdownRenderer = ({ children, className }: MarkdownRendererProps) => (
  <div className={className}>
    <Markdown remarkPlugins={[remarkGfm]} components={components}>
      {children}
    </Markdown>
  </div>
);

export default MarkdownRenderer;
