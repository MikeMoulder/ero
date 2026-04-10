import { motion } from 'framer-motion';

export function DecomposingOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-bg-secondary border border-accent/30 p-5 mb-3 overflow-hidden"
    >
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 border-[1.5px] border-accent border-t-transparent rounded-full animate-spinner" />
        <span className="text-xs font-mono text-accent uppercase tracking-[0.2em]">
          decomposing task
        </span>
      </div>
      <div className="mt-3 flex gap-2">
        {[1, 2, 3].map(i => (
          <motion.div
            key={i}
            className="flex-1 h-16 bg-bg-tertiary border border-border"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
      <p className="text-[10px] font-mono text-text-tertiary mt-3">
        AI is analyzing your prompt and identifying required APIs and agent roles...
      </p>
    </motion.div>
  );
}
