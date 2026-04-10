import { Router } from 'express';
import { agentService } from '../services/agent.service';
import { store } from '../store/memory.store';
import { sensitiveLimiter } from '../middleware/rateLimiter';
import { safeErrorMessage } from '../middleware/errorHandler';

export const tasksRouter = Router();

const MAX_PROMPT_LENGTH = 2000;

tasksRouter.post('/', sensitiveLimiter, (req, res) => {
  try {
    const { prompt, userPublicKey } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'prompt is required' });
    }
    if (prompt.length > MAX_PROMPT_LENGTH) {
      return res.status(400).json({ error: `prompt must be ${MAX_PROMPT_LENGTH} characters or fewer` });
    }
    if (!userPublicKey || typeof userPublicKey !== 'string') {
      return res.status(400).json({ error: 'userPublicKey is required' });
    }
    const task = agentService.createTask(prompt, userPublicKey);
    res.status(201).json(task);
  } catch (err: any) {
    res.status(400).json({ error: safeErrorMessage(err) });
  }
});

tasksRouter.get('/', (req, res) => {
  const userPublicKey = req.query.userPublicKey as string | undefined;
  if (userPublicKey) {
    return res.json(store.getTasksByUser(userPublicKey));
  }
  res.json(store.getAllTasks());
});

tasksRouter.get('/:id', (req, res) => {
  const task = store.getTask(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json(task);
});

tasksRouter.post('/:id/execute', sensitiveLimiter, (req, res) => {
  const task = store.getTask(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  // Fire and forget - respond immediately
  res.status(202).json({ message: 'Task decomposition started', taskId: task.id });

  // Decompose asynchronously — will pause at awaiting_approval
  agentService.decomposeOnly(task.id).catch((err) => {
    console.error(`[Task ${task.id}] Decomposition error:`, err.message);
  });
});

tasksRouter.post('/:id/approve', sensitiveLimiter, (req, res) => {
  const task = store.getTask(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  if (task.status !== 'awaiting_approval') {
    return res.status(400).json({ error: 'Task is not awaiting approval' });
  }

  const { decision } = req.body;
  if (!['approve', 'deny', 'approve_always'].includes(decision)) {
    return res.status(400).json({ error: 'decision must be approve, deny, or approve_always' });
  }

  res.status(202).json({ message: `Task ${decision}d`, taskId: task.id });

  agentService.approveTask(task.id, decision).catch((err) => {
    console.error(`[Task ${task.id}] Approval error:`, err.message);
  });
});
