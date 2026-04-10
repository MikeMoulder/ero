import { useState, useCallback } from 'react';
import { api } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { useWallet } from '../context/WalletContext';
import * as freighter from '../services/freighter';
import { Task, LogEntry, WSEvent, PaymentFlowState } from '../types';
import { Button } from '../components/shared/Button';
import { AnimatePresence } from 'framer-motion';
import { TaskTemplates } from '../components/playground/TaskTemplates';
import { PromptInput } from '../components/playground/PromptInput';
import { DecomposingOverlay } from '../components/playground/DecomposingOverlay';
import { ApprovalGate } from '../components/playground/ApprovalGate';
import { StepPipeline } from '../components/playground/StepPipeline';
import { LogTerminal } from '../components/playground/LogTerminal';
import { AgentPanel } from '../components/playground/AgentPanel';
import { TaskResult } from '../components/playground/TaskResult';

export default function Playground() {
  const wallet = useWallet();
  const [prompt, setPrompt] = useState('');
  const [task, setTask] = useState<Task | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [executing, setExecuting] = useState(false);
  const [activePayment, setActivePayment] = useState<PaymentFlowState | null>(null);

  const [fundAmount, setFundAmount] = useState('10');
  const [funding, setFunding] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [activating, setActivating] = useState(false);

  // Approval gate state
  const [approvalData, setApprovalData] = useState<{
    totalEstimatedCost: number;
    agentBalance: number;
  } | null>(null);
  const [approving, setApproving] = useState(false);

  const handleActivateWallet = async () => {
    if (!wallet.publicKey) return;
    setActivating(true);
    try {
      const { unsignedTxXdr } = await api.activateAgentWallet(wallet.publicKey, 5);
      const signedTxXdr = await freighter.signTx(unsignedTxXdr);
      await api.submitActivation(wallet.publicKey, signedTxXdr);
      await wallet.refreshAgentWallet();
    } catch (err: any) {
      console.error('Activation failed:', err);
    }
    setActivating(false);
  };

  const handleFundAgent = async () => {
    if (!wallet.publicKey || !fundAmount) return;
    setFunding(true);
    try {
      const { unsignedTxXdr } = await api.fundAgent(wallet.publicKey, parseFloat(fundAmount), wallet.publicKey);
      const signedTxXdr = await freighter.signTx(unsignedTxXdr);
      await api.submitAgentFunding(signedTxXdr, wallet.publicKey);
      await wallet.refreshAgentWallet();
    } catch (err: any) {
      console.error('Fund agent failed:', err);
    }
    setFunding(false);
  };

  const handleWithdraw = async () => {
    if (!wallet.publicKey || !withdrawAmount) return;
    setWithdrawing(true);
    try {
      await api.withdrawFromAgent(wallet.publicKey, parseFloat(withdrawAmount));
      setWithdrawAmount('');
      await wallet.refreshAgentWallet();
    } catch (err: any) {
      console.error('Withdraw failed:', err);
    }
    setWithdrawing(false);
  };

  const handleWS = useCallback((event: WSEvent) => {
    if (event.type === 'log') {
      setLogs(prev => [...prev, event.payload]);

      // Detect payment flow phases from log messages
      if (event.payload.level === 'payment') {
        const msg = event.payload.message;

        if (msg.includes('402 Payment Required')) {
          const amountMatch = msg.match(/Amount: ([\d.]+) USDC/);
          setTask(prev => {
            const activeStep = prev?.steps.find(s => s.status === 'in_progress');
            if (activeStep) {
              setActivePayment({
                stepId: activeStep.id,
                agentName: event.payload.source,
                amount: amountMatch ? parseFloat(amountMatch[1]) : 0,
                phase: 'challenge',
                txHash: null,
                apiEndpoint: activeStep.apiEndpoint,
              });
              // Auto-advance to budget_check after 500ms
              setTimeout(() => {
                setActivePayment(p => p?.phase === 'challenge' ? { ...p, phase: 'budget_check' } : p);
              }, 500);
            }
            return prev;
          });
        } else if (msg.includes('Sending payment')) {
          setActivePayment(p => p ? { ...p, phase: 'sending' } : p);
        } else if (msg.includes('TxHash:')) {
          const hashMatch = msg.match(/TxHash: (\S+)/);
          setActivePayment(p => p ? {
            ...p,
            phase: 'verifying',
            txHash: hashMatch ? hashMatch[1] : null,
          } : p);
        } else if (msg.includes('Payment verified')) {
          setActivePayment(p => p ? { ...p, phase: 'unlocked' } : p);
          setTimeout(() => setActivePayment(null), 2000);
        }
      }
    }

    if (event.type === 'task_update') {
      setTask(event.payload);
      if (event.payload.status === 'executing') {
        setApprovalData(null);
      }
      if (event.payload.status === 'completed' || event.payload.status === 'failed') {
        setExecuting(false);
        setActivePayment(null);
        setApprovalData(null);
        wallet.refreshAgentWallet();
      }
    }

    if (event.type === 'step_update') {
      setTask(prev => {
        if (!prev) return prev;
        const steps = prev.steps.map(s =>
          s.id === event.payload.step.id ? event.payload.step : s
        );
        const agents = event.payload.agents || prev.agents;
        return { ...prev, steps, agents };
      });
    }

    if (event.type === 'approval_required') {
      setApprovalData({
        totalEstimatedCost: event.payload.totalEstimatedCost,
        agentBalance: event.payload.agentBalance,
      });
    }
  }, []);

  useWebSocket(handleWS, wallet.publicKey);

  const handleExecute = async () => {
    if (!prompt.trim() || !wallet.publicKey) return;
    setExecuting(true);
    setLogs([]);
    setTask(null);
    setActivePayment(null);
    setApprovalData(null);

    try {
      const created: any = await api.createTask(prompt, wallet.publicKey);
      setTask(created);
      await api.executeTask(created.id);
    } catch (err: any) {
      setExecuting(false);
      setLogs(prev => [...prev, {
        timestamp: new Date().toISOString(),
        level: 'error',
        source: 'System',
        message: err.message || 'Failed to start task',
      }]);
    }
  };

  const handleApproval = async (decision: 'approve' | 'deny' | 'approve_always') => {
    if (!task) return;
    setApproving(true);
    try {
      await api.approveTask(task.id, decision);
      if (decision === 'deny') {
        setExecuting(false);
        setApprovalData(null);
      }
    } catch (err: any) {
      console.error('Approval failed:', err);
    }
    setApproving(false);
  };

  const agentWallet = wallet.agentWallet;

  return (
    <div className="flex flex-col gap-0">
      <h1 className="text-xl font-display font-bold mb-6 tracking-tight">Agent Playground</h1>

      {/* Agent Wallet */}
      <div className="bg-bg-secondary border border-border p-5 mb-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[9px] font-mono font-medium text-text-secondary uppercase tracking-[0.2em]">Agent Wallet</h2>
            {agentWallet && (
              <div className="flex items-center gap-4 mt-1.5">
                <span className="text-[10px] text-text-tertiary font-mono">
                  {agentWallet.agentPublicKey.slice(0, 8)}...{agentWallet.agentPublicKey.slice(-4)}
                </span>
                {agentWallet.activated ? (
                  <span className="text-sm font-mono text-accent font-medium">
                    {agentWallet.balance.toFixed(2)} USDC
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-status-warning">Not activated</span>
                )}
              </div>
            )}
            {wallet.agentWalletLoading && !agentWallet && (
              <span className="text-[10px] text-text-tertiary font-mono mt-1.5 block">Loading...</span>
            )}
          </div>

          {wallet.connected && agentWallet && (
            <div className="flex items-center gap-2">
              {!agentWallet.activated ? (
                /* Activation button */
                <Button size="sm" onClick={handleActivateWallet} loading={activating}>
                  Activate (5 XLM)
                </Button>
              ) : (
                /* Fund + Withdraw controls */
                <>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    className="w-20 bg-bg-primary border border-border px-2 py-1.5 text-xs text-text-primary font-mono focus:outline-none focus:border-accent transition-colors duration-[80ms]"
                    placeholder="Amount"
                  />
                  <Button size="sm" onClick={handleFundAgent} loading={funding}>
                    Fund
                  </Button>
                  <div className="w-px h-6 bg-border mx-1" />
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-20 bg-bg-primary border border-border px-2 py-1.5 text-xs text-text-primary font-mono focus:outline-none focus:border-accent transition-colors duration-[80ms]"
                    placeholder="Amount"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleWithdraw}
                    loading={withdrawing}
                    disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0}
                  >
                    Withdraw
                  </Button>
                </>
              )}
            </div>
          )}
          {!wallet.connected && (
            <Button size="sm" variant="secondary" onClick={() => wallet.connect()}>
              Connect to Fund
            </Button>
          )}
        </div>
        {agentWallet && agentWallet.activated && agentWallet.balance < 1 && (
          <p className="text-[10px] text-status-warning mt-2 font-mono">
            Low balance — fund the agent wallet before executing tasks that require API payments.
          </p>
        )}
        {agentWallet && !agentWallet.activated && (
          <p className="text-[10px] text-status-warning mt-2 font-mono">
            Activate your agent wallet to start using it. This transfers 5 XLM from your connected wallet to create the account on Stellar.
          </p>
        )}
      </div>

      {/* Task Templates — visible when no active task */}
      {!task && (
        <TaskTemplates onSelect={(p) => setPrompt(p)} />
      )}

      {/* Prompt Input */}
      <PromptInput
        prompt={prompt}
        onPromptChange={setPrompt}
        onExecute={handleExecute}
        executing={executing}
        task={task}
      />

      {/* Decomposing Overlay */}
      <AnimatePresence>
        {task?.status === 'decomposing' && (
          <DecomposingOverlay />
        )}
      </AnimatePresence>

      {/* Approval Gate */}
      <AnimatePresence>
        {task?.status === 'awaiting_approval' && approvalData && (
          <ApprovalGate
            steps={task.steps}
            totalEstimatedCost={approvalData.totalEstimatedCost}
            agentBalance={approvalData.agentBalance}
            onDecision={handleApproval}
            loading={approving}
          />
        )}
      </AnimatePresence>

      {/* Step Pipeline */}
      {task && task.steps.length > 0 && (
        <StepPipeline
          steps={task.steps}
          activePayment={activePayment}
        />
      )}

      {/* Task Result */}
      {task?.status === 'completed' && task.result && (
        <TaskResult task={task} />
      )}

      {/* Bottom: Logs + Agents */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 h-[360px]">
        <LogTerminal logs={logs} />
        <AgentPanel
          agents={task?.agents || []}
        />
      </div>
    </div>
  );
}
