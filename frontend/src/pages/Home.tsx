import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '../components/shared/Button';
import { DemoTerminal } from '../components/shared/DemoTerminal';

const Home: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
    },
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary overflow-hidden">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative pt-32 pb-24 px-6 sm:px-10 md:px-16 max-w-7xl mx-auto"
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-12 gap-8 lg:gap-16 items-start"
        >
          {/* Left — massive brand type */}
          <div className="col-span-12 lg:col-span-7">
            <motion.div variants={itemVariants}>
              <span className="section-num-sm">001</span>
              <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-text-tertiary ml-3">
                Payment-Native Agent Infrastructure
              </span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-hero font-display font-bold mt-6 mb-6 tracking-tight leading-[0.9]"
            >
              ero<span className="text-accent">.</span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-sm text-text-secondary max-w-md mb-10 leading-relaxed font-mono"
            >
              Autonomous agents that discover APIs, pay for access, and collaborate on complex tasks — without human intervention. Built on Stellar x402.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-wrap gap-3">
              <Link to="/dashboard">
                <Button variant="primary" size="lg">
                  Get Started <ArrowRight className="w-4 h-4 ml-1 inline-block" />
                </Button>
              </Link>
              <Link to="/product">
                <Button variant="secondary" size="lg">
                  How It Works
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Right — auto-playing demo terminal */}
          <motion.div
            variants={itemVariants}
            className="col-span-12 lg:col-span-5 mt-4"
          >
            <DemoTerminal />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 md:px-16">
        <div className="border-t border-border" />
      </div>

      {/* Products Section — the two offerings */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, amount: 0.2 }}
        className="py-24 px-6 sm:px-10 md:px-16 max-w-7xl mx-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <span className="section-num">02</span>
          <h2 className="text-3xl md:text-4xl font-display font-bold mt-4 mb-3 tracking-tight">
            Two Products, One Protocol
          </h2>
          <p className="text-sm text-text-secondary max-w-lg font-mono">
            Everything you need to build and interact with payment-native APIs on Stellar.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="grid grid-cols-12 gap-4"
        >
          {/* Product 1: API Wrapper Gateway */}
          <motion.div
            variants={itemVariants}
            className="col-span-12 lg:col-span-6 border border-border bg-bg-secondary p-8 group hover:border-accent/40 transition-colors duration-[80ms]"
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <span className="text-[9px] font-mono text-accent uppercase tracking-[0.2em]">Product 01</span>
                <h3 className="text-xl font-display font-bold mt-2 tracking-tight">
                  x402 API Gateway
                </h3>
              </div>
              <Link to="/gateway" className="text-accent hover:text-accent-hover transition-colors duration-[80ms]">
                <ArrowRight size={18} />
              </Link>
            </div>

            <p className="text-xs text-text-secondary font-mono leading-relaxed mb-8">
              Take any REST API and wrap it into a payment-required x402 endpoint. Every call requires a micropayment on Stellar before access is granted — turning any API into a monetizable, machine-payable service.
            </p>

            {/* Illustration: API wrapping flow */}
            <div className="border border-border bg-bg-primary p-6">
              <svg viewBox="0 0 480 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
                {/* REST API box */}
                <rect x="8" y="48" width="120" height="64" rx="0" stroke="currentColor" strokeWidth="1" className="text-text-tertiary" />
                <text x="68" y="74" textAnchor="middle" className="text-text-secondary" fill="currentColor" fontSize="10" fontFamily="monospace">REST API</text>
                <text x="68" y="92" textAnchor="middle" className="text-text-tertiary" fill="currentColor" fontSize="8" fontFamily="monospace">GET /v2/news</text>

                {/* Arrow 1 */}
                <line x1="128" y1="80" x2="172" y2="80" stroke="currentColor" strokeWidth="1" className="text-text-tertiary" strokeDasharray="4 3" />
                <polygon points="172,76 180,80 172,84" className="text-text-tertiary" fill="currentColor" />

                {/* ero. Gateway box */}
                <rect x="180" y="36" width="120" height="88" rx="0" className="text-accent" stroke="currentColor" strokeWidth="1.5" />
                <text x="240" y="60" textAnchor="middle" fill="currentColor" className="text-accent" fontSize="11" fontFamily="monospace" fontWeight="600">ero. gateway</text>
                <line x1="196" y1="70" x2="284" y2="70" stroke="currentColor" strokeWidth="0.5" className="text-accent" opacity="0.3" />
                <text x="240" y="86" textAnchor="middle" fill="currentColor" className="text-text-secondary" fontSize="8" fontFamily="monospace">wrap endpoint</text>
                <text x="240" y="100" textAnchor="middle" fill="currentColor" className="text-text-secondary" fontSize="8" fontFamily="monospace">set price</text>
                <text x="240" y="114" textAnchor="middle" fill="currentColor" className="text-text-secondary" fontSize="8" fontFamily="monospace">verify payments</text>

                {/* Arrow 2 */}
                <line x1="300" y1="80" x2="344" y2="80" stroke="currentColor" strokeWidth="1" className="text-accent" strokeDasharray="4 3" />
                <polygon points="344,76 352,80 344,84" className="text-accent" fill="currentColor" />

                {/* x402 API box */}
                <rect x="352" y="48" width="120" height="64" rx="0" stroke="currentColor" strokeWidth="1" className="text-status-success" />
                <text x="412" y="74" textAnchor="middle" className="text-status-success" fill="currentColor" fontSize="10" fontFamily="monospace">x402 API</text>
                <text x="412" y="92" textAnchor="middle" className="text-text-tertiary" fill="currentColor" fontSize="8" fontFamily="monospace">/x402/v2/news</text>

                {/* Price tag */}
                <rect x="372" y="104" width="80" height="18" rx="0" className="text-accent" fill="currentColor" opacity="0.1" />
                <rect x="372" y="104" width="80" height="18" rx="0" className="text-accent" stroke="currentColor" strokeWidth="0.5" />
                <text x="412" y="117" textAnchor="middle" className="text-accent" fill="currentColor" fontSize="8" fontFamily="monospace">0.05 USDC/call</text>
              </svg>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {['Any REST API', 'Set Your Price', 'Instant Verification'].map((item) => (
                <div key={item} className="text-center py-3 border border-border">
                  <span className="text-[10px] font-mono text-text-secondary">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Product 2: Agentic Playground */}
          <motion.div
            variants={itemVariants}
            className="col-span-12 lg:col-span-6 border border-border bg-bg-secondary p-8 group hover:border-accent/40 transition-colors duration-[80ms]"
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <span className="text-[9px] font-mono text-accent uppercase tracking-[0.2em]">Product 02</span>
                <h3 className="text-xl font-display font-bold mt-2 tracking-tight">
                  Agent Playground
                </h3>
              </div>
              <Link to="/playground" className="text-accent hover:text-accent-hover transition-colors duration-[80ms]">
                <ArrowRight size={18} />
              </Link>
            </div>

            <p className="text-xs text-text-secondary font-mono leading-relaxed mb-8">
              A live agentic workflow engine. Describe a task in plain language and watch as autonomous agents decompose it, discover x402 APIs, pay for access, and collaboratively execute — all in real-time.
            </p>

            {/* Illustration: Multi-agent workflow */}
            <div className="border border-border bg-bg-primary p-6">
              <svg viewBox="0 0 480 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
                {/* User task */}
                <rect x="8" y="56" width="100" height="48" rx="0" stroke="currentColor" strokeWidth="1" className="text-text-tertiary" />
                <text x="58" y="76" textAnchor="middle" className="text-text-primary" fill="currentColor" fontSize="9" fontFamily="monospace">"Fetch news</text>
                <text x="58" y="90" textAnchor="middle" className="text-text-primary" fill="currentColor" fontSize="9" fontFamily="monospace">& summarize"</text>

                {/* Arrow to orchestrator */}
                <line x1="108" y1="80" x2="138" y2="80" stroke="currentColor" strokeWidth="1" className="text-text-tertiary" />
                <polygon points="138,76 146,80 138,84" className="text-text-tertiary" fill="currentColor" />

                {/* Orchestrator */}
                <rect x="146" y="48" width="80" height="64" rx="0" className="text-accent" stroke="currentColor" strokeWidth="1.5" />
                <text x="186" y="72" textAnchor="middle" fill="currentColor" className="text-accent" fontSize="8" fontFamily="monospace" fontWeight="600">ORCHESTRATOR</text>
                <text x="186" y="86" textAnchor="middle" fill="currentColor" className="text-text-tertiary" fontSize="7" fontFamily="monospace">decompose</text>
                <text x="186" y="98" textAnchor="middle" fill="currentColor" className="text-text-tertiary" fontSize="7" fontFamily="monospace">& assign</text>

                {/* Branch to Agent A */}
                <line x1="226" y1="68" x2="270" y2="36" stroke="currentColor" strokeWidth="1" className="text-accent" strokeDasharray="3 3" />
                <polygon points="268,32 276,36 268,40" className="text-accent" fill="currentColor" />

                {/* Agent A */}
                <rect x="276" y="12" width="88" height="48" rx="0" stroke="currentColor" strokeWidth="1" className="text-status-success" />
                <text x="320" y="32" textAnchor="middle" className="text-status-success" fill="currentColor" fontSize="8" fontFamily="monospace" fontWeight="600">Agent-A</text>
                <text x="320" y="46" textAnchor="middle" className="text-text-tertiary" fill="currentColor" fontSize="7" fontFamily="monospace">data retrieval</text>

                {/* 402 payment from Agent A */}
                <rect x="370" y="18" width="56" height="16" rx="0" className="text-accent" fill="currentColor" opacity="0.12" />
                <rect x="370" y="18" width="56" height="16" rx="0" className="text-accent" stroke="currentColor" strokeWidth="0.5" />
                <text x="398" y="30" textAnchor="middle" className="text-accent" fill="currentColor" fontSize="7" fontFamily="monospace">402 → pay</text>

                {/* Branch to Agent B */}
                <line x1="226" y1="92" x2="270" y2="124" stroke="currentColor" strokeWidth="1" className="text-accent" strokeDasharray="3 3" />
                <polygon points="268,120 276,124 268,128" className="text-accent" fill="currentColor" />

                {/* Agent B */}
                <rect x="276" y="100" width="88" height="48" rx="0" stroke="currentColor" strokeWidth="1" className="text-status-success" />
                <text x="320" y="120" textAnchor="middle" className="text-status-success" fill="currentColor" fontSize="8" fontFamily="monospace" fontWeight="600">Agent-B</text>
                <text x="320" y="134" textAnchor="middle" className="text-text-tertiary" fill="currentColor" fontSize="7" fontFamily="monospace">summarizer</text>

                {/* Chain arrow A → B */}
                <line x1="320" y1="60" x2="320" y2="100" stroke="currentColor" strokeWidth="1" className="text-text-tertiary" strokeDasharray="3 3" />
                <polygon points="316,94 320,102 324,94" className="text-text-tertiary" fill="currentColor" />

                {/* Result arrow */}
                <line x1="364" y1="124" x2="408" y2="124" stroke="currentColor" strokeWidth="1" className="text-status-success" />
                <polygon points="408,120 416,124 408,128" className="text-status-success" fill="currentColor" />

                {/* Result */}
                <rect x="416" y="104" width="56" height="40" rx="0" stroke="currentColor" strokeWidth="1" className="text-status-success" />
                <text x="444" y="120" textAnchor="middle" className="text-status-success" fill="currentColor" fontSize="8" fontFamily="monospace" fontWeight="600">Result</text>
                <text x="444" y="134" textAnchor="middle" className="text-text-tertiary" fill="currentColor" fontSize="7" fontFamily="monospace">✓ done</text>
              </svg>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {['Natural Language', 'Auto-Pay x402', 'Real-Time Logs'].map((item) => (
                <div key={item} className="text-center py-3 border border-border">
                  <span className="text-[10px] font-mono text-text-secondary">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 md:px-16">
        <div className="border-t border-border" />
      </div>

      {/* The Agent Economy */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, amount: 0.2 }}
        className="py-24 px-6 sm:px-10 md:px-16 max-w-7xl mx-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <span className="section-num">03</span>
          <h2 className="text-3xl md:text-4xl font-display font-bold mt-4 mb-3 tracking-tight">
            The Agent Economy
          </h2>
          <p className="text-sm text-text-secondary max-w-lg font-mono">
            APIs become machine-payable services. Agents operate as independent economic actors.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-12 gap-3"
        >
          {[
            {
              title: 'Payment-Native APIs',
              desc: 'APIs that require payment before access. Powered by the Stellar x402 standard.',
              span: 'col-span-12 md:col-span-7',
            },
            {
              title: 'Autonomous Agents',
              desc: 'Agents that discover, pay for, and autonomously call APIs without human intervention.',
              span: 'col-span-12 md:col-span-5',
            },
            {
              title: 'Economic Transactions',
              desc: 'Agents operate as economic actors with their own wallets and spending budgets.',
              span: 'col-span-12 md:col-span-5',
            },
            {
              title: 'Multi-Agent Workflows',
              desc: 'Orchestrate complex multi-step tasks with multiple agents collaborating seamlessly.',
              span: 'col-span-12 md:col-span-7',
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className={`${feature.span} p-6 border border-border bg-bg-secondary hover:border-accent/40 transition-colors duration-[80ms] group`}
            >
              <h3 className="text-sm font-mono font-medium mb-2 text-text-primary group-hover:text-accent transition-colors duration-[80ms]">
                {feature.title}
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed font-mono">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 md:px-16">
        <div className="border-t border-border" />
      </div>

      {/* The System in Action */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, amount: 0.2 }}
        className="py-24 px-6 sm:px-10 md:px-16 max-w-7xl mx-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <span className="section-num">04</span>
          <h2 className="text-3xl md:text-4xl font-display font-bold mt-4 mb-3 tracking-tight">
            The System in Action
          </h2>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {[
            { num: '01', title: 'Agent Receives Task', desc: 'Natural language instructions parsed into executable steps' },
            { num: '02', title: 'API Discovery & Payment', desc: 'Agent finds wrapped APIs, handles 402, pays via Stellar' },
            { num: '03', title: 'Execution & Output', desc: 'Multi-agent workflows execute autonomously, results returned' },
          ].map((step, index) => (
            <motion.div key={index} variants={itemVariants} className="p-8 bg-bg-primary">
              <div className="text-2xl font-display font-bold text-accent mb-4">
                {step.num}
              </div>
              <h3 className="text-sm font-mono font-medium mb-2">{step.title}</h3>
              <p className="text-xs text-text-secondary font-mono leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 md:px-16">
        <div className="border-t border-border" />
      </div>

      {/* How It Works — x402 payment flow */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, amount: 0.2 }}
        className="py-24 px-6 sm:px-10 md:px-16 max-w-7xl mx-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <span className="section-num">05</span>
          <h2 className="text-3xl md:text-4xl font-display font-bold mt-4 mb-3 tracking-tight">
            The x402 Payment Flow
          </h2>
          <p className="text-sm text-text-secondary max-w-lg font-mono">
            How a single API call becomes a verified, paid transaction on Stellar.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-px bg-border"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {[
            { num: '01', title: 'Request', desc: 'Client calls an API endpoint wrapped by ero.' },
            { num: '02', title: '402 Response', desc: 'Gateway returns payment amount, address, and memo' },
            { num: '03', title: 'Pay on Stellar', desc: 'Agent signs and submits a Stellar transaction' },
            { num: '04', title: 'Access Granted', desc: 'Payment verified via Horizon, API response returned' },
          ].map((step, index) => (
            <motion.div key={index} variants={itemVariants} className="p-8 bg-bg-primary">
              <div className="text-2xl font-display font-bold text-accent mb-4">
                {step.num}
              </div>
              <h3 className="text-sm font-mono font-medium mb-2">{step.title}</h3>
              <p className="text-xs text-text-secondary font-mono leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* CTA */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, amount: 0.3 }}
        className="py-24 px-6 sm:px-10 md:px-16 max-w-4xl mx-auto mb-20"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="p-10 border border-border bg-bg-secondary"
        >
          <h3 className="text-2xl md:text-3xl font-display font-bold mb-4 tracking-tight">
            Ready to explore?
          </h3>
          <p className="text-sm text-text-secondary mb-8 font-mono">
            Wrap your first API or run an agentic task — all on Stellar testnet.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/gateway">
              <Button variant="primary" size="lg">
                Wrap an API <ArrowRight className="w-4 h-4 ml-2 inline-block" />
              </Button>
            </Link>
            <Link to="/playground">
              <Button variant="secondary" size="lg">
                Try the Playground
              </Button>
            </Link>
          </div>
        </motion.div>
      </motion.section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 md:px-16 py-16">
          <div className="grid grid-cols-12 gap-8">
            {/* Brand */}
            <div className="col-span-12 md:col-span-4">
              <div className="flex items-baseline gap-0.5 mb-3">
                <span className="text-xl font-display font-bold text-text-primary tracking-tight">ero</span>
                <span className="text-xl font-display font-bold text-accent">.</span>
              </div>
              <p className="text-xs text-text-tertiary font-mono leading-relaxed max-w-xs">
                Payment-native agent infrastructure built on the Stellar network. Powering the machine economy with x402.
              </p>
            </div>

            {/* Product links */}
            <div className="col-span-6 md:col-span-2">
              <h4 className="text-[9px] font-mono text-text-secondary uppercase tracking-[0.2em] mb-4">Product</h4>
              <ul className="space-y-2.5">
                <li><Link to="/gateway" className="text-xs font-mono text-text-tertiary hover:text-accent transition-colors duration-[80ms]">API Gateway</Link></li>
                <li><Link to="/playground" className="text-xs font-mono text-text-tertiary hover:text-accent transition-colors duration-[80ms]">Playground</Link></li>
                <li><Link to="/dashboard" className="text-xs font-mono text-text-tertiary hover:text-accent transition-colors duration-[80ms]">Dashboard</Link></li>
                <li><Link to="/payments" className="text-xs font-mono text-text-tertiary hover:text-accent transition-colors duration-[80ms]">Payments</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div className="col-span-6 md:col-span-2">
              <h4 className="text-[9px] font-mono text-text-secondary uppercase tracking-[0.2em] mb-4">Resources</h4>
              <ul className="space-y-2.5">
                <li><Link to="/product" className="text-xs font-mono text-text-tertiary hover:text-accent transition-colors duration-[80ms]">Documentation</Link></li>
                <li><a href="https://stellar.org" target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-text-tertiary hover:text-accent transition-colors duration-[80ms]">Stellar Network</a></li>
                <li><a href="https://laboratory.stellar.org" target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-text-tertiary hover:text-accent transition-colors duration-[80ms]">Stellar Lab</a></li>
              </ul>
            </div>

            {/* Protocol */}
            <div className="col-span-12 md:col-span-4">
              <h4 className="text-[9px] font-mono text-text-secondary uppercase tracking-[0.2em] mb-4">Protocol</h4>
              <p className="text-xs text-text-tertiary font-mono leading-relaxed mb-4">
                x402 extends HTTP 402 Payment Required for machine-to-machine micropayments. Every API call is a verified Stellar transaction.
              </p>
              <div className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-status-success" />
                <span className="text-[10px] font-mono text-text-tertiary">Stellar Testnet</span>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-border mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-[10px] font-mono text-text-tertiary">
              &copy; {new Date().getFullYear()} ero. — Built for the Stellar x402 Hackathon
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-text-tertiary uppercase tracking-[0.15em]">Powered by</span>
              <span className="text-[9px] font-mono text-accent font-medium">Stellar x402</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
