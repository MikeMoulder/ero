import React from 'react';
import { Highlight, PrismTheme } from 'prism-react-renderer';
import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  showLineNumbers?: boolean;
}

const syntaxTheme: PrismTheme = {
  plain: {
    color: '#DCDCDC',
    backgroundColor: '#08080A',
  },
  styles: [
    { types: ['keyword', 'tag'], style: { color: '#FF4F00' } },
    { types: ['string', 'attr-value'], style: { color: '#34D399' } },
    { types: ['function', 'class-name'], style: { color: '#DCDCDC', fontWeight: 'bold' } },
    { types: ['number', 'boolean'], style: { color: '#FBBF24' } },
    { types: ['comment'], style: { color: '#3E3E4A', fontStyle: 'italic' } },
    { types: ['operator', 'punctuation'], style: { color: '#6E6E7A' } },
    { types: ['property', 'attr-name'], style: { color: '#FF4F00' } },
  ],
};

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = 'javascript',
  title,
  showLineNumbers = true,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const CopyBtn = () => (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono text-text-tertiary hover:text-accent transition-colors duration-[80ms] uppercase tracking-[0.15em]"
    >
      {copied ? <><Check className="w-3 h-3" /> copied</> : <><Copy className="w-3 h-3" /> copy</>}
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      viewport={{ once: true }}
      className="overflow-hidden border border-border bg-bg-primary"
    >
      {title && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <span className="font-mono text-[9px] text-accent uppercase tracking-[0.2em] font-medium">{title}</span>
          <CopyBtn />
        </div>
      )}

      <Highlight code={code} language={language as any} theme={syntaxTheme}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={`${className} p-4 overflow-x-auto text-xs leading-relaxed font-mono`}
            style={{ ...style, backgroundColor: 'transparent' }}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line, key: i })} className="flex">
                {showLineNumbers && (
                  <span className="inline-block w-6 text-right pr-3 text-text-tertiary select-none text-[10px]">
                    {i + 1}
                  </span>
                )}
                <span>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token, key })} />
                  ))}
                </span>
              </div>
            ))}
          </pre>
        )}
      </Highlight>

      {!title && (
        <div className="px-4 py-1.5 border-t border-border flex justify-end">
          <CopyBtn />
        </div>
      )}
    </motion.div>
  );
};
