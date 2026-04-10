import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface DemoLine {
  type: 'input' | 'output' | 'status' | 'payment';
  content: string;
  delay: number; // ms before this line appears
}

const DEMO_SCRIPT: DemoLine[] = [
  { type: 'output', content: 'ero. gateway v1.0 — connected to stellar testnet', delay: 400 },
  { type: 'input', content: '> ero wrap --api https://newsapi.org --endpoint /v2/top-headlines --price 0.05', delay: 1200 },
  { type: 'output', content: 'wrapping REST endpoint as x402 payable...', delay: 800 },
  { type: 'status', content: '✓ registered /x402/v2/top-headlines (0.05 USDC/call)', delay: 1000 },
  { type: 'input', content: '> ero task "Fetch latest crypto news and summarize top 3 stories"', delay: 1800 },
  { type: 'output', content: 'decomposing task into agent steps...', delay: 600 },
  { type: 'output', content: '[orchestrator] spawning Agent-A (data_retrieval)', delay: 500 },
  { type: 'output', content: '[orchestrator] spawning Agent-B (summarizer)', delay: 300 },
  { type: 'output', content: '[Agent-A] calling GET /x402/v2/top-headlines', delay: 900 },
  { type: 'payment', content: '[Agent-A] 402 Payment Required → paying 0.05 USDC', delay: 700 },
  { type: 'output', content: '[Agent-A] signing tx via agent wallet...', delay: 500 },
  { type: 'status', content: '[Agent-A] ✓ payment verified (tx: 8f3a...c2d1)', delay: 800 },
  { type: 'output', content: '[Agent-A] received 5 articles, forwarding to Agent-B', delay: 600 },
  { type: 'output', content: '[Agent-B] summarizing 5 articles...', delay: 1000 },
  { type: 'status', content: '[Agent-B] ✓ summary complete', delay: 800 },
  { type: 'output', content: '', delay: 200 },
  { type: 'output', content: '── result ──────────────────────────────', delay: 200 },
  { type: 'output', content: '1. Bitcoin surges past $100k on ETF inflows', delay: 300 },
  { type: 'output', content: '2. Stellar x402 protocol gains traction', delay: 300 },
  { type: 'output', content: '3. AI agents now handle 12% of API traffic', delay: 300 },
  { type: 'output', content: '────────────────────────────────────────', delay: 200 },
  { type: 'status', content: '✓ task complete — 0.05 USDC spent', delay: 600 },
];

export const DemoTerminal: React.FC = () => {
  const [lines, setLines] = useState<DemoLine[]>([]);
  const [cursorVisible, setCursorVisible] = useState(true);
  const terminalRef = useRef<HTMLDivElement>(null);
  const timeoutRefs = useRef<number[]>([]);

  useEffect(() => {
    function runScript() {
      setLines([]);
      timeoutRefs.current.forEach(clearTimeout);
      timeoutRefs.current = [];

      let cumulative = 800;
      DEMO_SCRIPT.forEach((line) => {
        cumulative += line.delay;
        const id = window.setTimeout(() => {
          setLines(prev => [...prev, line]);
        }, cumulative);
        timeoutRefs.current.push(id);
      });

      // Loop: restart after script finishes + pause
      const restartId = window.setTimeout(() => {
        runScript();
      }, cumulative + 4000);
      timeoutRefs.current.push(restartId);
    }

    runScript();
    return () => timeoutRefs.current.forEach(clearTimeout);
  }, []);

  // Cursor blink
  useEffect(() => {
    const interval = setInterval(() => setCursorVisible(v => !v), 530);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  const lineColor = (type: DemoLine['type']) => {
    switch (type) {
      case 'input': return 'text-text-primary';
      case 'status': return 'text-status-success';
      case 'payment': return 'text-accent';
      default: return 'text-text-secondary';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full border border-border bg-bg-primary overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-border">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          <span className="text-[9px] font-mono text-text-tertiary uppercase tracking-[0.2em]">ero. live demo</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1 h-1 rounded-full bg-status-success animate-pulse" />
          <span className="text-[9px] font-mono text-text-tertiary">running</span>
        </div>
      </div>

      {/* Terminal body */}
      <div
        ref={terminalRef}
        className="p-4 h-[280px] overflow-y-auto font-mono text-[11px] leading-relaxed space-y-0.5"
      >
        {lines.map((line, idx) => (
          <div key={idx} className={`${lineColor(line.type)} ${line.type === 'output' ? 'font-light' : ''}`}>
            {line.content}
          </div>
        ))}
        <div className="text-text-tertiary">
          <span className="text-accent">{'>'}</span>{' '}
          <span className={`text-accent ${cursorVisible ? 'opacity-100' : 'opacity-0'}`}>_</span>
        </div>
      </div>
    </motion.div>
  );
};
