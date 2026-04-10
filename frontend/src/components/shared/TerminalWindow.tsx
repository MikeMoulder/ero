import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

interface TerminalWindowProps {
  title?: string;
  onExecuteCommand?: (command: string) => Promise<string>;
  isLoading?: boolean;
}

export const TerminalWindow: React.FC<TerminalWindowProps> = ({
  title = 'terminal',
  onExecuteCommand,
  isLoading = false,
}) => {
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState<{ type: 'input' | 'output'; content: string }[]>([
    { type: 'output', content: 'ero. terminal v1.0 — ready' },
  ]);
  const [loading, setLoading] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const typingRef = useRef<number | null>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output, typingText]);

  const typewriterEffect = useCallback((text: string, onComplete: () => void) => {
    setIsTyping(true);
    setTypingText('');
    let idx = 0;
    const step = () => {
      if (idx < text.length) {
        setTypingText(text.slice(0, idx + 4));
        idx += 4;
        typingRef.current = window.requestAnimationFrame(() => setTimeout(step, 15));
      } else {
        setTypingText('');
        setIsTyping(false);
        onComplete();
      }
    };
    step();
  }, []);

  useEffect(() => {
    return () => { if (typingRef.current) cancelAnimationFrame(typingRef.current); };
  }, []);

  const handleExecute = async () => {
    if (!command.trim()) return;
    const newOutput = [...output, { type: 'input' as const, content: `> ${command}` }];
    setOutput(newOutput);
    setCommand('');
    setLoading(true);

    try {
      const result = onExecuteCommand
        ? await onExecuteCommand(command)
        : 'ok';

      typewriterEffect(result, () => {
        setOutput(prev => [...prev, { type: 'output' as const, content: result }]);
        setLoading(false);
      });
    } catch (error) {
      const msg = `err: ${error instanceof Error ? error.message : 'unknown'}`;
      setOutput(prev => [...prev, { type: 'output' as const, content: msg }]);
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full border border-border bg-bg-primary overflow-hidden"
    >
      {/* Header — flat, minimal */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-border">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          <span className="text-[9px] font-mono text-text-tertiary uppercase tracking-[0.2em]">{title}</span>
        </div>
        <span className="text-[9px] font-mono text-text-tertiary">bash</span>
      </div>

      {/* Output area */}
      <div className="p-4 min-h-[240px] max-h-80 overflow-y-auto font-mono text-xs leading-relaxed">
        <div ref={terminalRef} className="space-y-0.5">
          {output.map((line, idx) => (
            <div
              key={idx}
              className={line.type === 'input' ? 'text-text-primary' : 'text-text-secondary font-light'}
            >
              {line.content}
            </div>
          ))}

          {isTyping && (
            <div className="text-text-secondary font-light">
              {typingText}<span className="text-accent animate-pulse">_</span>
            </div>
          )}

          {!isTyping && !loading && (
            <div className="text-text-tertiary">
              <span className="text-accent">{'>'}</span> _
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border px-4 py-2">
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-accent font-medium">{'>'}</span>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleExecute()}
            placeholder="enter command..."
            className="flex-1 bg-transparent outline-none text-text-primary placeholder-text-tertiary"
            disabled={loading || isLoading || isTyping}
          />
          {loading || isLoading ? (
            <div className="w-3 h-3 border-[1.5px] border-accent border-t-transparent rounded-full animate-spinner" />
          ) : (
            <button
              onClick={handleExecute}
              disabled={!command.trim() || isTyping}
              className="px-3 py-1 text-[9px] font-mono font-medium uppercase tracking-[0.2em] text-accent border border-accent/30 hover:border-accent hover:bg-accent/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-[80ms] active:scale-[0.97]"
            >
              Exec
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
