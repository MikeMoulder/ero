import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CodeBlock } from '../components/shared/CodeBlock';

const ProductDetails: React.FC = () => {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
    },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary overflow-hidden">
      {/* Back nav */}
      <div className="pt-8 px-6 sm:px-10 md:px-16 max-w-6xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-[10px] text-text-tertiary hover:text-accent transition-colors duration-[80ms] uppercase tracking-[0.15em] font-mono">
          <ArrowLeft size={12} />
          Back
        </Link>
      </div>

      {/* Header */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="pt-12 pb-16 px-6 sm:px-10 md:px-16 max-w-6xl mx-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="section-num-sm">DOC</span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mt-4 mb-6 tracking-tight">
            How <span className="text-accent">ero.</span> Works
          </h1>
          <p className="text-sm text-text-secondary max-w-xl leading-relaxed font-mono">
            A deep dive into the payment-native infrastructure that powers autonomous agent APIs and multi-step workflows on Stellar.
          </p>
        </motion.div>
      </motion.section>

      {/* X402 Payment Model */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, amount: 0.2 }}
        className="py-16 px-6 sm:px-10 md:px-16 max-w-6xl mx-auto border-t border-border"
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.div variants={itemVariants} className="mb-8">
            <span className="section-num">01</span>
            <h2 className="text-2xl md:text-3xl font-display font-bold mt-4 tracking-tight">
              X402: Payment Required Standard
            </h2>
          </motion.div>

          <motion.div variants={itemVariants} className="mb-8">
            <p className="text-xs text-text-secondary leading-relaxed mb-6 font-mono max-w-lg">
              The X402 standard builds on HTTP 402 Payment Required, extending it for machine-payable APIs:
            </p>
            <CodeBlock
              title="x402 payment flow"
              language="bash"
              code={`# 1. Request
GET /x402/news

# 2. Response
HTTP/1.1 402 Payment Required

# 3. Payload
{ "amount": "0.10", "address": "G...", "memo": "req_abc123" }

# 4. Pay & Retry
X-Payment-Proof: tx_hash_abc...
GET /x402/news`}
              showLineNumbers={false}
            />
          </motion.div>

          <motion.p
            variants={itemVariants}
            className="text-xs text-text-secondary leading-relaxed font-mono max-w-lg"
          >
            Agents parse the 402 response, initiate payment on Stellar, and retry the request with proof of payment. The system verifies the transaction via Horizon API and grants access.
          </motion.p>
        </motion.div>
      </motion.section>

      {/* Architecture */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, amount: 0.2 }}
        className="py-16 px-6 sm:px-10 md:px-16 max-w-6xl mx-auto border-t border-border"
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.div variants={itemVariants} className="mb-8">
            <span className="section-num">02</span>
            <h2 className="text-2xl md:text-3xl font-display font-bold mt-4 tracking-tight">
              System Architecture
            </h2>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="grid grid-cols-12 gap-3 mb-8"
          >
            {[
              {
                title: 'API Wrapper Gateway',
                points: [
                  'Accepts any REST API and wraps endpoints',
                  'Enforces payment before access',
                  'Integrates with Stellar for verification',
                  'Returns wrapped /x402/* endpoints',
                ],
                span: 'col-span-12 md:col-span-7',
              },
              {
                title: 'Agent Orchestrator',
                points: [
                  'Parses natural language tasks',
                  'Decomposes into sequential steps',
                  'Assigns steps to agents',
                  'Manages execution state and budgets',
                ],
                span: 'col-span-12 md:col-span-5',
              },
            ].map((component, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className={`${component.span} p-6 border border-border bg-bg-secondary hover:border-accent/40 transition-colors duration-[80ms]`}
              >
                <h3 className="text-xs font-mono font-medium mb-4 text-accent uppercase tracking-[0.1em]">
                  {component.title}
                </h3>
                <ul className="space-y-2.5">
                  {component.points.map((point, i) => (
                    <li key={i} className="flex gap-3 text-xs text-text-secondary font-mono">
                      <ChevronRight className="w-3 h-3 flex-shrink-0 text-accent mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Agent Workflow */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, amount: 0.2 }}
        className="py-16 px-6 sm:px-10 md:px-16 max-w-6xl mx-auto border-t border-border"
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.div variants={itemVariants} className="mb-8">
            <span className="section-num">03</span>
            <h2 className="text-2xl md:text-3xl font-display font-bold mt-4 tracking-tight">
              Multi-Agent Execution
            </h2>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-2">
            {[
              { num: '1', title: 'Task Decomposition', content: 'User provides: "Fetch 5 crypto news and summarize"' },
              { num: '2', title: 'Agent Assignment', content: 'Agent A → Data retrieval | Agent B → Summarization | Agent C → Verification' },
              { num: '3', title: 'API Interaction', content: 'Agents call wrapped /x402/* endpoints, handle 402 responses, and pay autonomously' },
              { num: '4', title: 'Budget Management', content: 'Each agent maintains a wallet with max_spend_per_task limits' },
              { num: '5', title: 'Validation & Output', content: 'Results chain through agents, final output returned to user' },
            ].map((step, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="flex gap-5 p-5 border border-border bg-bg-surface hover:border-accent/40 transition-colors duration-[80ms]"
              >
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-7 h-7 bg-accent text-text-inverse text-[10px] font-mono font-bold">
                    {step.num}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xs font-mono font-medium mb-1 text-text-primary">
                    {step.title}
                  </h3>
                  <p className="text-xs text-text-secondary font-mono">{step.content}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Stellar Integration */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, amount: 0.2 }}
        className="py-16 px-6 sm:px-10 md:px-16 max-w-6xl mx-auto border-t border-border mb-20"
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.div variants={itemVariants} className="mb-8">
            <span className="section-num">04</span>
            <h2 className="text-2xl md:text-3xl font-display font-bold mt-4 tracking-tight">
              Built on Stellar
            </h2>
          </motion.div>

          <motion.p
            variants={itemVariants}
            className="text-xs text-text-secondary leading-relaxed mb-8 max-w-lg font-mono"
          >
            Leveraging Stellar Testnet for transaction verification, ensuring transparent, trustless payment handling between agents and APIs.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="p-6 border border-border bg-bg-secondary"
          >
            <h3 className="text-xs font-mono font-medium mb-4 text-accent uppercase tracking-[0.1em]">
              Payment Verification Flow
            </h3>
            <ol className="space-y-3 text-xs text-text-secondary font-mono">
              {[
                'Generate unique request_id as transaction memo',
                'Agent signs and submits Stellar transaction matching memo + amount',
                'System polls Stellar Horizon API for transaction confirmation',
                'Upon validation, API request is forwarded and response returned',
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-accent font-medium">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </motion.div>
        </motion.div>
      </motion.section>
    </div>
  );
};

export default ProductDetails;
