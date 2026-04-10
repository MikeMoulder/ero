import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import { Task } from '../../types';
import { Badge } from '../shared/Badge';
import { CodeBlock } from '../shared/CodeBlock';

interface TaskResultProps {
  task: Task;
}

function formatDuration(startIso: string, endIso: string | null): string {
  if (!endIso) return '--';
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rem = seconds % 60;
  return `${minutes}m ${rem}s`;
}

function getResultMarkdown(result: any): string {
  if (typeof result === 'string') return result;
  return '```json\n' + JSON.stringify(result, null, 2) + '\n```';
}

const markdownComponents = {
  h1: ({ children }: any) => (
    <h1 className="font-display font-bold text-lg text-text-primary mt-5 mb-2 pb-1 border-b border-border">{children}</h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="font-display font-bold text-base text-text-primary mt-4 mb-2 pb-1 border-b border-border">{children}</h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="font-display font-semibold text-sm text-text-primary mt-3 mb-1.5">{children}</h3>
  ),
  h4: ({ children }: any) => (
    <h4 className="font-display font-semibold text-xs text-text-primary mt-3 mb-1">{children}</h4>
  ),
  p: ({ children }: any) => (
    <p className="text-xs text-text-secondary font-mono leading-relaxed mb-3">{children}</p>
  ),
  strong: ({ children }: any) => (
    <strong className="text-text-primary font-semibold">{children}</strong>
  ),
  em: ({ children }: any) => (
    <em className="italic text-text-secondary">{children}</em>
  ),
  a: ({ href, children }: any) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-hover underline transition-colors duration-[80ms]">{children}</a>
  ),
  ul: ({ children }: any) => (
    <ul className="list-disc list-inside space-y-1 mb-3 text-xs text-text-secondary font-mono">{children}</ul>
  ),
  ol: ({ children }: any) => (
    <ol className="list-decimal list-inside space-y-1 mb-3 text-xs text-text-secondary font-mono">{children}</ol>
  ),
  li: ({ children }: any) => (
    <li className="leading-relaxed marker:text-accent">{children}</li>
  ),
  table: ({ children }: any) => (
    <div className="overflow-x-auto mb-3">
      <table className="w-full text-[10px] font-mono border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }: any) => (
    <thead className="border-b border-accent/30">{children}</thead>
  ),
  th: ({ children }: any) => (
    <th className="text-left px-3 py-2 text-[9px] text-text-tertiary uppercase tracking-[0.15em] font-medium">{children}</th>
  ),
  td: ({ children }: any) => (
    <td className="px-3 py-2 text-text-secondary border-b border-border">{children}</td>
  ),
  tr: ({ children }: any) => (
    <tr className="even:bg-bg-tertiary/50">{children}</tr>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-2 border-accent pl-3 my-3 text-text-secondary italic">{children}</blockquote>
  ),
  hr: () => <hr className="border-t border-border my-4" />,
  code: ({ className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const isBlock = props.node?.position?.start?.line !== props.node?.position?.end?.line
      || String(children).includes('\n');

    if (match || isBlock) {
      return (
        <CodeBlock
          code={String(children).replace(/\n$/, '')}
          language={match ? match[1] : 'text'}
          showLineNumbers={false}
        />
      );
    }

    return (
      <code className="bg-bg-primary border border-border px-1.5 py-0.5 text-[10px] font-mono text-accent">{children}</code>
    );
  },
  pre: ({ children }: any) => <>{children}</>,
};

export function TaskResult({ task }: TaskResultProps) {
  const content = getResultMarkdown(task.result);

  const metrics = [
    { label: 'Total Cost', value: `${task.totalSpent.toFixed(4)} USDC`, accent: true },
    { label: 'Duration', value: formatDuration(task.createdAt, task.completedAt), accent: false },
    { label: 'Steps', value: String(task.steps.length), accent: false },
    { label: 'Agents', value: String(task.agents.length), accent: false },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-bg-secondary border border-status-success/20 overflow-hidden mb-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-border">
        <h3 className="text-[9px] font-mono font-medium text-status-success uppercase tracking-[0.15em]">
          Task Result
        </h3>
        <Badge variant="success">completed</Badge>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border border-b border-border">
        {metrics.map((m) => (
          <div key={m.label} className="bg-bg-secondary px-4 py-3">
            <div className="text-[9px] font-mono text-text-tertiary uppercase tracking-[0.2em] mb-1">{m.label}</div>
            <div className={`text-sm font-mono font-medium ${m.accent ? 'text-accent' : 'text-text-primary'}`}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* Markdown Body */}
      <div className="px-5 py-4 overflow-y-auto max-h-[600px]">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {content}
        </ReactMarkdown>
      </div>
    </motion.div>
  );
}
