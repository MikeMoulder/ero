import { v4 as uuid } from 'uuid';
import { Task, TaskStep, Agent, LogEntry } from '../types';
import { store } from '../store/memory.store';
import { events } from './events.service';
import { decomposeTask, executeAgentStep, patchStepWithData } from './openai.service';
import { gatewayService } from './gateway.service';
import { stellarService } from './stellar.service';
import { agentWalletService } from './agent-wallet.service';
import { config } from '../config';

const ROLE_NAMES: Record<string, string> = {
  data_retrieval: 'DataFetcher',
  summarization: 'Summarizer',
  verification: 'Verifier',
  analysis: 'Analyst',
};

class AgentService {
  private executionQueue: Promise<void> = Promise.resolve();
  private isExecuting = false;
  private approvedUsers: Set<string> = new Set();

  createTask(prompt: string, userPublicKey: string): Task {
    const task: Task = {
      id: uuid(),
      prompt,
      userPublicKey,
      status: 'pending',
      steps: [],
      agents: [],
      totalSpent: 0,
      result: null,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    store.addTask(task);
    events.log('info', 'Orchestrator', `Task created: "${prompt}"`);
    events.broadcast({ type: 'task_update', payload: task });
    return task;
  }

  async decomposeOnly(taskId: string): Promise<void> {
    const task = store.getTask(taskId);
    if (!task) throw new Error('Task not found');

    try {
      // Phase 1: Decompose
      task.status = 'decomposing';
      store.updateTask(taskId, { status: 'decomposing' });
      events.broadcast({ type: 'task_update', payload: task });
      events.log('agent', 'Orchestrator', 'Decomposing task into steps...');

      const apis = store.getAllApis();
      const stepDescriptors = await decomposeTask(task.prompt, apis);

      // Fetch real agent wallet balance before creating agents
      let agentBalance = config.agent.defaultBalance;
      try {
        const wallet = await agentWalletService.getWallet(task.userPublicKey);
        if (wallet) agentBalance = wallet.balance;
      } catch {}

      // Create agents for unique roles
      const rolesNeeded = [...new Set(stepDescriptors.map(s => s.agentRole))];
      task.agents = rolesNeeded.map(role => ({
        id: uuid(),
        name: ROLE_NAMES[role] || role,
        role: role as Agent['role'],
        walletBalance: agentBalance,
        maxSpendPerTask: config.agent.defaultMaxSpend,
        totalSpent: 0,
        status: 'idle' as const,
      }));

      // Create steps
      task.steps = stepDescriptors.map((desc, index) => {
        const agent = task.agents.find(a => a.role === desc.agentRole)!;
        return {
          id: uuid(),
          index,
          description: desc.description,
          agentId: agent.id,
          agentName: agent.name,
          status: 'pending' as const,
          requiresApi: desc.requiresApi,
          apiEndpoint: desc.apiEndpoint,
          queryParams: desc.queryParams || null,
          estimatedCost: desc.estimatedCost ?? 0,
          paymentId: null,
          input: null,
          output: null,
          logs: [],
          startedAt: null,
          completedAt: null,
        };
      });

      const totalEstimatedCost = task.steps.reduce((sum, s) => sum + s.estimatedCost, 0);

      store.updateTask(taskId, { agents: task.agents, steps: task.steps });

      events.log('agent', 'Orchestrator', `Task decomposed into ${task.steps.length} steps with ${task.agents.length} agents. Estimated cost: ${totalEstimatedCost.toFixed(4)} USDC`);

      // If approveAlways is set for this user, skip approval gate
      if (this.approvedUsers.has(task.userPublicKey)) {
        events.log('info', 'Orchestrator', 'Auto-approved (Approve Always is active)');
        task.status = 'executing';
        store.updateTask(taskId, { status: 'executing' });
        events.broadcast({ type: 'task_update', payload: task });
        // Fire-and-forget execution
        this.runExecution(taskId).catch(err => {
          console.error(`[Task ${taskId}] Execution error:`, err.message);
        });
        return;
      }

      // Wait for user approval
      task.status = 'awaiting_approval';
      store.updateTask(taskId, { status: 'awaiting_approval' });
      events.broadcast({ type: 'task_update', payload: task });

      events.broadcast({
        type: 'approval_required',
        payload: {
          taskId,
          steps: task.steps,
          totalEstimatedCost,
          agentBalance,
        },
      });
    } catch (err: any) {
      task.status = 'failed';
      store.updateTask(taskId, { status: 'failed' });
      events.log('error', 'Orchestrator', `Decomposition failed: ${err.message}`);
      events.broadcast({ type: 'task_update', payload: task });
    }
  }

  async approveTask(taskId: string, decision: 'approve' | 'deny' | 'approve_always'): Promise<void> {
    const task = store.getTask(taskId);
    if (!task) throw new Error('Task not found');
    if (task.status !== 'awaiting_approval') throw new Error('Task is not awaiting approval');

    if (decision === 'deny') {
      task.status = 'failed';
      store.updateTask(taskId, { status: 'failed' });
      events.log('info', 'Orchestrator', 'Task denied by user');
      events.broadcast({ type: 'task_update', payload: task });
      return;
    }

    if (decision === 'approve_always') {
      this.approvedUsers.add(task.userPublicKey);
      events.log('info', 'Orchestrator', 'Approve Always activated for this user — future tasks will auto-approve');
    }

    events.log('info', 'Orchestrator', 'Task approved — starting execution');
    task.status = 'executing';
    store.updateTask(taskId, { status: 'executing' });
    events.broadcast({ type: 'task_update', payload: task });
    await this.runExecution(taskId);
  }

  private async runExecution(taskId: string): Promise<void> {
    // Queue execution — only one task runs at a time
    this.executionQueue = this.executionQueue.then(() => this._executeTask(taskId)).catch(() => {});
    return this.executionQueue;
  }

  private async _executeTask(taskId: string): Promise<void> {
    if (this.isExecuting) {
      throw new Error('Another task is already executing');
    }

    const task = store.getTask(taskId);
    if (!task) throw new Error('Task not found');

    this.isExecuting = true;

    try {
      let previousOutput: any = null;

      for (const step of task.steps) {
        step.status = 'in_progress';
        step.startedAt = new Date().toISOString();
        events.broadcast({ type: 'step_update', payload: { taskId, step, agents: task.agents } });

        const agent = task.agents.find(a => a.id === step.agentId)!;
        agent.status = 'working';
        store.updateTask(taskId, { steps: task.steps, agents: task.agents });
        events.log('agent', agent.name, `Starting: ${step.description}`);

        let apiData: any = null;

        // If step requires API, handle payment flow
        if (step.requiresApi && step.apiEndpoint) {
          try {
            apiData = await this.handleApiPayment(step, agent, task);
          } catch (err: any) {
            step.status = 'failed';
            step.completedAt = new Date().toISOString();
            agent.status = 'failed';
            task.status = 'failed';
            store.updateTask(taskId, { status: 'failed', steps: task.steps, agents: task.agents });
            events.log('error', agent.name, `Step failed: ${err.message}`);
            events.broadcast({ type: 'step_update', payload: { taskId, step, agents: task.agents } });
            events.broadcast({ type: 'task_update', payload: task });
            return;
          }
        }

        // Execute agent reasoning
        const input = apiData || previousOutput || task.prompt;
        step.input = input;

        events.log('agent', agent.name, 'Processing...');
        const output = await executeAgentStep(agent.role, step.description, input);

        step.output = output;
        step.status = 'completed';
        step.completedAt = new Date().toISOString();
        agent.status = 'done';

        previousOutput = output;

        store.updateTask(taskId, { steps: task.steps, agents: task.agents });
        events.log('agent', agent.name, `Completed: ${step.description}`);
        events.broadcast({ type: 'step_update', payload: { taskId, step, agents: task.agents } });
      }

      // Task complete
      task.status = 'completed';
      task.result = previousOutput;
      task.completedAt = new Date().toISOString();
      store.updateTask(taskId, { status: 'completed', result: task.result, completedAt: task.completedAt, totalSpent: task.totalSpent });
      events.log('info', 'Orchestrator', `Task completed. Total spent: ${task.totalSpent.toFixed(4)} USDC`);
      events.broadcast({ type: 'task_update', payload: task });
    } catch (err: any) {
      task.status = 'failed';
      store.updateTask(taskId, { status: 'failed' });
      events.log('error', 'Orchestrator', `Task failed: ${err.message}`);
      events.broadcast({ type: 'task_update', payload: task });
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * Try to fix a bad endpoint by matching the path against known API slugs.
   * e.g. "/timezone/America/New_York" → "/worldtime/timezone/America/New_York"
   */
  private tryFixEndpoint(endpoint: string): string | null {
    const allApis = store.getAllApis();
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    for (const api of allApis) {
      const catalog = (require('../config/api-catalog') as any).getCatalogEntry(api.slug);
      if (!catalog) continue;
      for (const example of catalog.examplePaths || []) {
        // Strip query params from example for comparison
        const examplePath = example.split('?')[0];
        if (path.startsWith(examplePath) || path === examplePath) {
          return `/${api.slug}${path}`;
        }
      }
      // Also check if the first segment of path partially matches a known sub-path
      const baseUrlPath = new URL(api.baseUrl).pathname;
      if (baseUrlPath !== '/' && path.startsWith(baseUrlPath)) {
        return `/${api.slug}${path}`;
      }
    }
    return null;
  }

  /**
   * Resolve {{stepN.path}} placeholders in a string using previous step outputs.
   * Supports: {{step1.results[0].latitude}}, {{step1.name}}, etc.
   */
  private resolveTemplate(value: string, steps: TaskStep[]): string {
    return value.replace(/\{\{step(\d+)\.([^}]+)\}\}/g, (_match, stepNum, path) => {
      const idx = parseInt(stepNum, 10) - 1;
      const step = steps[idx];
      if (!step) return _match;

      // Try raw API data (step.input) first, then LLM output (step.output)
      const sources = [step.input, step.output].filter(Boolean);
      for (let data of sources) {
        if (typeof data === 'string') {
          try { data = JSON.parse(data); } catch { continue; }
        }
        if (typeof data !== 'object' || data === null) continue;

        // Navigate the dot-path: e.g. "results[0].latitude"
        const segments = path.split(/\.|\[(\d+)\]/).filter(Boolean);
        let current: any = data;
        for (const seg of segments) {
          if (current == null) break;
          current = current[seg];
        }

        if (current != null) return String(current);
      }

      return _match;
    });
  }

  /**
   * Resolve all {{stepN.x}} references in endpoint and query params.
   */
  private resolveStepReferences(endpoint: string, query: Record<string, any>, allSteps: TaskStep[]): { endpoint: string; query: Record<string, any> } {
    const resolved = this.resolveTemplate(endpoint, allSteps);
    const resolvedQuery: Record<string, any> = {};
    for (const [k, v] of Object.entries(query)) {
      resolvedQuery[k] = typeof v === 'string' ? this.resolveTemplate(v, allSteps) : v;
    }
    return { endpoint: resolved, query: resolvedQuery };
  }

  private async handleApiPayment(step: TaskStep, agent: Agent, task: Task): Promise<any> {
    let endpoint = step.apiEndpoint!;
    let query = step.queryParams || {};

    // Resolve any {{stepN.path}} template references from previous step outputs
    const resolved = this.resolveStepReferences(endpoint, query, task.steps);
    endpoint = resolved.endpoint;
    query = resolved.query;

    // Check for unresolved placeholders — if any remain, ask LLM to patch with concrete values
    const allValues = [endpoint, ...Object.values(query).map(String)].join(' ');
    if (/\{\{step\d+/.test(allValues)) {
      events.log('info', agent.name, 'Resolving cross-step references via LLM...');
      try {
        const previousData = task.steps
          .filter(s => s.status === 'completed' && s.input != null)
          .map(s => ({ index: s.index, data: s.input }));

        const patched = await patchStepWithData(
          { description: step.description, apiEndpoint: endpoint, queryParams: query as Record<string, string> },
          previousData
        );
        endpoint = patched.apiEndpoint;
        query = patched.queryParams || {};
        step.apiEndpoint = endpoint;
        step.queryParams = query;
        store.updateTask(task.id, { steps: task.steps });
        events.log('info', agent.name, `Patched endpoint: /x402${endpoint}`);
      } catch (err: any) {
        events.log('warn', agent.name, `LLM patch failed: ${err.message} — proceeding with unresolved templates`);
      }
    }

    events.log('agent', agent.name, `Calling /x402${endpoint}...`);

    // First call - expect 402
    let firstResponse = await gatewayService.handleWrappedRequest(endpoint, undefined, query);

    // If 404, the LLM may have omitted the slug — try to fix
    if (firstResponse.status === 404) {
      const fixed = this.tryFixEndpoint(endpoint);
      if (fixed && fixed !== endpoint) {
        events.log('info', agent.name, `Slug correction: ${endpoint} → ${fixed}`);
        endpoint = fixed;
        step.apiEndpoint = fixed;
        store.updateTask(task.id, { steps: task.steps });
        firstResponse = await gatewayService.handleWrappedRequest(endpoint, undefined, query);
      }
    }

    if (firstResponse.status !== 402) {
      throw new Error(`Unexpected response: ${firstResponse.status}`);
    }

    const paymentInfo = firstResponse.body;
    events.log('payment', agent.name, `Received 402 Payment Required. Amount: ${paymentInfo.amount} USDC`);

    // Check budget
    if (agent.walletBalance < paymentInfo.amount) {
      throw new Error(`Insufficient balance: ${agent.walletBalance} USDC < ${paymentInfo.amount} USDC`);
    }
    if (agent.totalSpent + paymentInfo.amount > agent.maxSpendPerTask) {
      throw new Error(`Would exceed max spend per task (${agent.maxSpendPerTask} USDC)`);
    }

    // Send payment
    events.log('payment', agent.name, `Sending payment of ${paymentInfo.amount} USDC...`);
    step.paymentId = paymentInfo.paymentId;
    store.updateTask(task.id, { steps: task.steps });

    // Use per-user agent wallet if available, fall back to shared server wallet
    let txHash: string;
    try {
      const keypair = agentWalletService.getKeypair(task.userPublicKey);
      txHash = await stellarService.sendPaymentFromKeypair(
        keypair,
        paymentInfo.address,
        paymentInfo.amount,
        paymentInfo.memo,
        paymentInfo.paymentId,
        agent.id,
        task.id
      );
    } catch (err: any) {
      // If user wallet not found, fall back to shared agent wallet
      if (err.message.includes('Agent wallet not found')) {
        txHash = await stellarService.sendAgentPayment(
          paymentInfo.address,
          paymentInfo.amount,
          paymentInfo.memo,
          paymentInfo.paymentId,
          agent.id,
          task.id
        );
      } else {
        throw err;
      }
    }
    events.log('payment', agent.name, `Payment sent. TxHash: ${txHash}`);

    // Verify payment
    await stellarService.verifyPayment(paymentInfo.paymentId);
    events.log('payment', agent.name, 'Payment verified. Forwarding request...');

    // Retry with payment
    agent.walletBalance -= paymentInfo.amount;
    agent.totalSpent += paymentInfo.amount;
    task.totalSpent += paymentInfo.amount;
    store.updateTask(task.id, { agents: task.agents, totalSpent: task.totalSpent });

    const apiResponse = await gatewayService.handleWrappedRequest(endpoint, paymentInfo.paymentId, query);
    if (apiResponse.status === 200) {
      events.log('agent', agent.name, `API data received from /x402${endpoint}`);
      return apiResponse.body;
    }

    // Upstream 4xx — bad request (wrong params, missing fields, etc.)
    if (apiResponse.status >= 400 && apiResponse.status < 500) {
      const upstreamMsg = apiResponse.body?.upstreamResponse
        ? (typeof apiResponse.body.upstreamResponse === 'string' ? apiResponse.body.upstreamResponse : JSON.stringify(apiResponse.body.upstreamResponse).slice(0, 300))
        : apiResponse.body?.message || '';
      throw new Error(`Upstream API returned ${apiResponse.status}: ${upstreamMsg}`);
    }

    // 502 with retryable flag — upstream failure, payment was restored
    if (apiResponse.body?.retryable) {
      throw new Error(`API returned ${apiResponse.status} after payment (retryable — payment preserved): ${apiResponse.body.message}`);
    }

    throw new Error(`API returned ${apiResponse.status} after payment`);
  }
}

export const agentService = new AgentService();
