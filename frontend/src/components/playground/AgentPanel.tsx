import { Agent } from '../../types';
import { Badge } from '../shared/Badge';

interface AgentPanelProps {
  agents: Agent[];
}

export function AgentPanel({ agents }: AgentPanelProps) {
  return (
    <div className="lg:col-span-2 bg-bg-secondary border border-border overflow-hidden flex flex-col">
      <div className="px-5 py-2.5 border-b border-border">
        <h2 className="text-[9px] font-mono font-medium text-text-secondary uppercase tracking-[0.2em]">Agents</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {agents.length === 0 ? (
          <p className="text-text-tertiary text-xs text-center py-8 font-mono">No agents active</p>
        ) : (
          agents.map((agent) => (
            <div key={agent.id} className="bg-bg-tertiary border border-border p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-medium text-text-primary">{agent.name}</span>
                  <Badge variant="info">{agent.role.replace('_', ' ')}</Badge>
                </div>
                <Badge variant={
                  agent.status === 'done' ? 'success' :
                  agent.status === 'working' ? 'info' :
                  agent.status === 'failed' ? 'error' : 'pending'
                }>
                  {agent.status}
                </Badge>
              </div>
              <div className="flex gap-4 text-[10px] font-mono">
                <div>
                  <span className="text-text-tertiary">Balance: </span>
                  <span className="text-text-secondary">{agent.walletBalance.toFixed(2)} USDC</span>
                </div>
                <div>
                  <span className="text-text-tertiary">Spent: </span>
                  <span className="text-accent">{agent.totalSpent.toFixed(4)} USDC</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
