import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Terminal, Key, Wallet, Cpu, BarChart3, Globe, Copy, Check } from 'lucide-react';
import { CodeBlock } from '../components/shared/CodeBlock';

const CopyText: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="inline-flex items-center gap-1.5 text-[9px] font-mono text-text-tertiary hover:text-accent transition-colors duration-[80ms]"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
    </button>
  );
};

const CLI: React.FC = () => {
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
    <div className="flex flex-col gap-0">
      {/* Header */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="pb-10"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="section-num-sm">CLI</span>
          <h1 className="text-xl font-display font-bold mt-2 mb-4 tracking-tight">
            <span className="text-accent">ero</span> CLI
          </h1>
          <p className="text-sm text-text-secondary max-w-xl leading-relaxed font-mono">
            The command-line companion for ero. — manage agents, wallets, and API gateways from your terminal. Same backend, same power, no browser needed.
          </p>

          <div className="flex items-center gap-4 mt-8">
            <div className="flex items-center gap-2 px-4 py-2.5 border border-accent/40 bg-bg-secondary">
              <span className="text-xs font-mono text-text-secondary">$</span>
              <span className="text-xs font-mono text-accent">npm install -g ero-x402</span>
              <CopyText text="npm install -g ero-x402" />
            </div>
            <a
              href="https://www.npmjs.com/package/ero-x402"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-mono text-text-tertiary hover:text-accent transition-colors duration-[80ms] uppercase tracking-[0.15em]"
            >
              View on npm →
            </a>
          </div>
        </motion.div>
      </motion.section>

      {/* Quick Start */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, amount: 0.2 }}
        className="py-10 border-t border-border"
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
              Quick Start
            </h2>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-4">
            {[
              { num: '1', title: 'Install globally', desc: 'Requires Node.js 18+', code: 'npm install -g ero-x402' },
              { num: '2', title: 'Initialize your wallet', desc: 'Connects your Stellar secret key (encrypted locally)', code: 'ero init' },
              { num: '3', title: 'Get testnet USDC', desc: 'Request free USDC from the faucet (sets up trustline automatically)', code: 'ero user wallet faucet' },
              { num: '4', title: 'Activate your agent wallet', desc: 'Creates an on-chain agent wallet (costs 5 XLM)', code: 'ero agent wallet activate' },
              { num: '5', title: 'Fund your agent', desc: 'Transfer USDC from your wallet to the agent wallet', code: 'ero agent wallet fund 10' },
              { num: '6', title: 'Run your first task', desc: 'Agents decompose, pay APIs, and stream results live', code: 'ero agent task run "Fetch latest crypto news and summarize top 3 stories"' },
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
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-mono font-medium mb-0.5 text-text-primary">{step.title}</h3>
                  <p className="text-xs text-text-tertiary font-mono mb-2">{step.desc}</p>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-primary border border-border w-fit max-w-full">
                    <span className="text-[10px] font-mono text-text-tertiary">$</span>
                    <code className="text-[11px] font-mono text-accent truncate">{step.code}</code>
                    <CopyText text={step.code} />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Initialization */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, amount: 0.2 }}
        className="py-10 border-t border-border"
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
              Initialization & Security
            </h2>
          </motion.div>

          <motion.div variants={itemVariants} className="mb-8">
            <p className="text-xs text-text-secondary leading-relaxed mb-6 font-mono max-w-lg">
              Running <span className="text-accent">ero init</span> prompts for your Stellar secret key. The key is AES-256-GCM encrypted and stored locally at <span className="text-text-primary">~/.ero/config.json</span> — it never leaves your machine.
            </p>
            <CodeBlock
              title="ero init"
              language="bash"
              code={`$ ero init

  ero. — x402 Agent Gateway CLI
  ─────────────────────────────────

  Your Stellar secret key is used to sign transactions locally.
  It will be encrypted and stored at ~/.ero/config.json
  It never leaves this machine.

  Stellar secret key (S...): ****************************

  ✓ Initialized

  public key: GABCDEF...XYZ
  secret: encrypted at ~/.ero/config.json`}
              showLineNumbers={false}
            />
          </motion.div>

          <motion.div variants={itemVariants} className="grid grid-cols-12 gap-3">
            {[
              { icon: <Key size={14} />, title: 'AES-256-GCM Encryption', desc: 'Secret key encrypted at rest with a machine-derived key' },
              { icon: <Globe size={14} />, title: 'No Server Storage', desc: 'Private key stays on your device — backend only sees your public key' },
              { icon: <Terminal size={14} />, title: 'Masked Input', desc: 'Secret key input is hidden during entry, never echoed to terminal' },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="col-span-12 md:col-span-4 p-5 border border-border bg-bg-secondary hover:border-accent/40 transition-colors duration-[80ms]"
              >
                <div className="text-accent mb-3">{item.icon}</div>
                <h3 className="text-xs font-mono font-medium mb-1 text-text-primary">{item.title}</h3>
                <p className="text-[11px] text-text-tertiary font-mono leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Commands Reference */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, amount: 0.2 }}
        className="py-10 border-t border-border"
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
              Command Reference
            </h2>
          </motion.div>

          {/* User Wallet */}
          <motion.div variants={itemVariants} className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Wallet size={14} className="text-accent" />
              <h3 className="text-xs font-mono font-medium text-accent uppercase tracking-[0.1em]">User Wallet</h3>
            </div>
            <div className="border border-border overflow-hidden">
              {[
                { cmd: 'ero user wallet balance', desc: 'Check your USDC balance on Stellar Testnet' },
                { cmd: 'ero user wallet faucet', desc: 'Request free testnet USDC (auto-signs trustline, max 10,000)' },
                { cmd: 'ero user wallet faucet --amount 5000', desc: 'Request a specific amount of USDC' },
              ].map((row, idx) => (
                <div key={idx} className={`flex items-start gap-4 px-4 py-3 ${idx !== 0 ? 'border-t border-border' : ''} hover:bg-bg-surface transition-colors duration-[80ms]`}>
                  <code className="text-[11px] font-mono text-accent shrink-0 min-w-[280px]">{row.cmd}</code>
                  <span className="text-[11px] font-mono text-text-tertiary">{row.desc}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Agent Wallet */}
          <motion.div variants={itemVariants} className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Wallet size={14} className="text-accent" />
              <h3 className="text-xs font-mono font-medium text-accent uppercase tracking-[0.1em]">Agent Wallet</h3>
            </div>
            <div className="border border-border overflow-hidden">
              {[
                { cmd: 'ero agent wallet status', desc: 'Show wallet status, balances, and activation state' },
                { cmd: 'ero agent wallet activate', desc: 'Activate agent wallet on Stellar (auto-signs, costs 5 XLM)' },
                { cmd: 'ero agent wallet fund <amount>', desc: 'Fund agent wallet with USDC (auto-signs the transaction)' },
                { cmd: 'ero agent wallet withdraw <amount>', desc: 'Withdraw USDC from agent wallet back to your wallet' },
                { cmd: 'ero agent wallet balance', desc: 'Quick one-line balance check' },
              ].map((row, idx) => (
                <div key={idx} className={`flex items-start gap-4 px-4 py-3 ${idx !== 0 ? 'border-t border-border' : ''} hover:bg-bg-surface transition-colors duration-[80ms]`}>
                  <code className="text-[11px] font-mono text-accent shrink-0 min-w-[280px]">{row.cmd}</code>
                  <span className="text-[11px] font-mono text-text-tertiary">{row.desc}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Agent Tasks */}
          <motion.div variants={itemVariants} className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Cpu size={14} className="text-accent" />
              <h3 className="text-xs font-mono font-medium text-accent uppercase tracking-[0.1em]">Agent Tasks</h3>
            </div>
            <div className="border border-border overflow-hidden">
              {[
                { cmd: 'ero agent task run "<prompt>"', desc: 'Create and execute an agent task with real-time log streaming' },
                { cmd: 'ero agent task run "..." --no-auto-approve', desc: 'Require manual approval before execution begins' },
                { cmd: 'ero agent task list', desc: 'List all tasks with status, steps, and spend' },
                { cmd: 'ero agent task show <id>', desc: 'Show full task details, steps, and result' },
                { cmd: 'ero agent task approve <id>', desc: 'Approve a pending task for execution' },
                { cmd: 'ero agent task approve <id> --deny', desc: 'Deny a pending task' },
              ].map((row, idx) => (
                <div key={idx} className={`flex items-start gap-4 px-4 py-3 ${idx !== 0 ? 'border-t border-border' : ''} hover:bg-bg-surface transition-colors duration-[80ms]`}>
                  <code className="text-[11px] font-mono text-accent shrink-0 min-w-[280px]">{row.cmd}</code>
                  <span className="text-[11px] font-mono text-text-tertiary">{row.desc}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Gateway */}
          <motion.div variants={itemVariants} className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Globe size={14} className="text-accent" />
              <h3 className="text-xs font-mono font-medium text-accent uppercase tracking-[0.1em]">API Gateway</h3>
            </div>
            <div className="border border-border overflow-hidden">
              {[
                { cmd: 'ero wrap --base-url <url> --slug <slug> --price <usdc>', desc: 'Register a REST API as x402 payable' },
                { cmd: 'ero wrap ... --wallet <address>', desc: 'Specify a receiver wallet (defaults to yours)' },
                { cmd: 'ero gateway list', desc: 'List all registered APIs with call counts and revenue' },
                { cmd: 'ero gateway list --mine', desc: 'List only your registered APIs' },
                { cmd: 'ero gateway test <slug>', desc: 'Test an x402 wrapped endpoint' },
                { cmd: 'ero gateway remove <id>', desc: 'Remove a registered API' },
              ].map((row, idx) => (
                <div key={idx} className={`flex items-start gap-4 px-4 py-3 ${idx !== 0 ? 'border-t border-border' : ''} hover:bg-bg-surface transition-colors duration-[80ms]`}>
                  <code className="text-[11px] font-mono text-accent shrink-0 min-w-[280px]">{row.cmd}</code>
                  <span className="text-[11px] font-mono text-text-tertiary">{row.desc}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Other */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={14} className="text-accent" />
              <h3 className="text-xs font-mono font-medium text-accent uppercase tracking-[0.1em]">Other</h3>
            </div>
            <div className="border border-border overflow-hidden">
              {[
                { cmd: 'ero dashboard', desc: 'Show overview stats — USDC flow, API calls, task metrics' },
                { cmd: 'ero config show', desc: 'Show current CLI configuration' },
                { cmd: 'ero config set api-url <url>', desc: 'Override backend URL (for local dev)' },
                { cmd: 'ero init --reset', desc: 'Reconfigure wallet and connection' },
              ].map((row, idx) => (
                <div key={idx} className={`flex items-start gap-4 px-4 py-3 ${idx !== 0 ? 'border-t border-border' : ''} hover:bg-bg-surface transition-colors duration-[80ms]`}>
                  <code className="text-[11px] font-mono text-accent shrink-0 min-w-[280px]">{row.cmd}</code>
                  <span className="text-[11px] font-mono text-text-tertiary">{row.desc}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Live Example */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, amount: 0.2 }}
        className="py-10 border-t border-border"
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
              Live Example
            </h2>
          </motion.div>

          <motion.div variants={itemVariants} className="mb-6">
            <p className="text-xs text-text-secondary leading-relaxed mb-6 font-mono max-w-lg">
              Running an agent task streams real-time logs directly to your terminal — the same output you see in the web playground.
            </p>
            <CodeBlock
              title="agent task execution"
              language="bash"
              code={`$ ero agent task run "Fetch latest crypto news and summarize top 3 stories"

> ero agent task run "Fetch latest crypto news and summarize top 3 stories"
⠋ decomposing task into agent steps...
[orchestrator] spawning Agent-A (data_retrieval)
[orchestrator] spawning Agent-B (summarizer)

[gate] Auto-approving task execution...

[Agent-A] calling GET /x402/v2/top-headlines
[Agent-A] 402 Payment Required → paying 0.05 USDC
[Agent-A] signing tx via agent wallet...
[Agent-A] ✓ payment verified (tx: 8f3a...c2d1)
[Agent-A] received 5 articles, forwarding to Agent-B

[Agent-B] summarizing 5 articles...
[Agent-B] ✓ summary complete

── result ──────────────────────────────
1. Bitcoin surges past $100k on ETF inflows
2. Stellar x402 protocol gains traction
3. AI agents now handle 12% of API traffic
────────────────────────────────────────

✓ task complete — 0.05 USDC spent`}
              showLineNumbers={false}
            />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* CLI vs Web */}
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
            <span className="section-num">05</span>
            <h2 className="text-2xl md:text-3xl font-display font-bold mt-4 tracking-tight">
              CLI + Web — Same Backend
            </h2>
          </motion.div>

          <motion.p
            variants={itemVariants}
            className="text-xs text-text-secondary leading-relaxed mb-8 max-w-lg font-mono"
          >
            The CLI and web UI are two interfaces to the same ero. backend. Tasks created in one appear in the other. Wallets, APIs, and payments are fully shared.
          </motion.p>

          <motion.div variants={itemVariants} className="grid grid-cols-12 gap-3">
            {[
              {
                title: 'Web UI',
                points: [
                  'Visual step pipeline & payment flow animations',
                  'Freighter browser wallet for signing',
                  'Dashboard with charts and visualizations',
                  'Interactive API testing terminal',
                ],
                span: 'col-span-12 md:col-span-6',
              },
              {
                title: 'CLI',
                points: [
                  'Real-time log streaming in terminal',
                  'Local secret key for programmatic signing',
                  'Scriptable — pipe output, chain commands',
                  'Works over SSH, CI/CD, headless servers',
                ],
                span: 'col-span-12 md:col-span-6',
              },
            ].map((card, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className={`${card.span} p-6 border border-border bg-bg-secondary hover:border-accent/40 transition-colors duration-[80ms]`}
              >
                <h3 className="text-xs font-mono font-medium mb-4 text-accent uppercase tracking-[0.1em]">
                  {card.title}
                </h3>
                <ul className="space-y-2.5">
                  {card.points.map((point, i) => (
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
    </div>
  );
};

export default CLI;
