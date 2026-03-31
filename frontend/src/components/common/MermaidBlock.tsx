import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

let mermaidCounter = 0;

const MermaidBlock = ({ chart }: { chart: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const idRef = useRef(`mermaid-${++mermaidCounter}`);

  useEffect(() => {
    if (!containerRef.current || !chart.trim()) return;

    let cancelled = false;

    (async () => {
      try {
        const { svg } = await mermaid.render(idRef.current, chart.trim());
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    })();

    return () => { cancelled = true; };
  }, [chart]);

  if (error) {
    return (
      <pre className="rounded-xl p-4 overflow-x-auto mb-3 text-sm font-mono" style={{ background: 'var(--color-background)' }}>
        <code>{chart}</code>
      </pre>
    );
  }

  return <div ref={containerRef} className="flex justify-center my-4 overflow-x-auto" />;
};

export default MermaidBlock;
