import { Task } from '../../types';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';

interface PromptInputProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onExecute: () => void;
  executing: boolean;
  task: Task | null;
}

export function PromptInput({ prompt, onPromptChange, onExecute, executing, task }: PromptInputProps) {
  return (
    <div className="bg-bg-secondary border border-border p-5 mb-3">
      <div className="flex gap-4">
        <textarea
          className="flex-1 bg-bg-primary border border-border px-4 py-3 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent transition-colors duration-[80ms] resize-none font-mono"
          rows={3}
          placeholder='Describe a task for the agents... e.g. "Fetch crypto news and summarize the top stories"'
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          disabled={executing}
        />
        <div className="flex flex-col justify-end">
          <Button onClick={onExecute} loading={executing} disabled={!prompt.trim()}>
            Execute
          </Button>
        </div>
      </div>
      {task && (
        <div className="mt-3 flex items-center gap-3 text-xs">
          <span className="text-text-tertiary font-mono">Status:</span>
          <Badge variant={
            task.status === 'completed' ? 'success' :
            task.status === 'failed' ? 'error' :
            task.status === 'executing' ? 'info' :
            task.status === 'awaiting_approval' ? 'warning' :
            task.status === 'decomposing' ? 'warning' : 'pending'
          }>
            {task.status === 'awaiting_approval' ? 'awaiting approval' : task.status}
          </Badge>
          {task.totalSpent > 0 && (
            <span className="text-text-secondary font-mono">Spent: {task.totalSpent.toFixed(4)} USDC</span>
          )}
        </div>
      )}
    </div>
  );
}
