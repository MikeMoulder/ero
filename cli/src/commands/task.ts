import { Command } from 'commander';
import ora from 'ora';
import Table from 'cli-table3';
import * as api from '../lib/api-client';
import { connectTaskStream } from '../lib/ws-client';
import { requirePublicKey } from '../lib/config-store';
import { accent, success, error, warning, dim, header, kv, logLine, taskResult } from '../lib/output';

export function registerTaskCommand(program: Command) {
  const task = program.command('task').description('Agent task operations');

  // ero task run "<prompt>" (default subcommand)
  task
    .command('run <prompt>')
    .description('Create and execute an agent task')
    .option('--no-auto-approve', 'Require manual approval before execution')
    .action(async (prompt: string, opts) => {
      const pk = requirePublicKey();

      console.log(`${accent('>')} ero task "${prompt}"`);
      const spinner = ora('decomposing task into agent steps...').start();

      try {
        const created = await api.createTask(prompt, pk);
        spinner.text = `Task ${dim(created.id)} created, executing...`;

        // Connect WebSocket for live streaming
        let taskDone = false;
        const stream = connectTaskStream(pk, {
          onLog: (entry) => {
            if (spinner.isSpinning) spinner.stop();
            logLine(entry.level, entry.source, entry.message);
          },
          onTaskUpdate: (t) => {
            if (t.status === 'awaiting_approval') {
              if (opts.autoApprove !== false) {
                console.log(warning('\n[gate] Auto-approving task execution...'));
                api.approveTask(t.id, 'approve').catch(() => {});
              } else {
                console.log(warning('\n[gate] Approval required — approve in the web UI or run:'));
                console.log(`  ero task approve ${t.id}\n`);
              }
            }
            if (t.status === 'completed') {
              taskDone = true;
              console.log('');
              if (t.result) {
                const lines = typeof t.result === 'string'
                  ? t.result.split('\n')
                  : [JSON.stringify(t.result, null, 2)];
                taskResult(lines);
              }
              console.log(success(`✓ task complete — ${(t.totalSpent || 0).toFixed(2)} USDC spent`));
              stream.close();
            }
            if (t.status === 'failed') {
              taskDone = true;
              console.log(error(`\n✗ task failed`));
              stream.close();
            }
          },
          onStepUpdate: (data) => {
            const step = data.step;
            if (step.status === 'in_progress') {
              console.log(`${dim('>')} ${step.description || `Step ${step.id}`}`);
            }
            if (step.status === 'completed') {
              console.log(success(`  ✓ step complete`));
            }
          },
          onApprovalRequired: (data) => {
            if (opts.autoApprove !== false) {
              // auto-approve handled in onTaskUpdate
            } else {
              console.log(warning(`\n[gate] Estimated cost: ${data.totalEstimatedCost} USDC | Balance: ${data.agentBalance} USDC`));
            }
          },
        });

        await api.executeTask(created.id);
        if (spinner.isSpinning) spinner.stop();

        // Wait for task to complete (max 5 min)
        await new Promise<void>((resolve) => {
          const check = setInterval(() => {
            if (taskDone) {
              clearInterval(check);
              resolve();
            }
          }, 500);
          setTimeout(() => {
            clearInterval(check);
            if (!taskDone) {
              stream.close();
              console.log(warning('\nTimeout — task still running. Check with: ero task show ' + created.id));
            }
            resolve();
          }, 300000);
        });
      } catch (err: any) {
        spinner.fail(err.message);
      }
    });

  // ero task list
  task
    .command('list')
    .description('List tasks')
    .action(async () => {
      const pk = requirePublicKey();
      const spinner = ora('Fetching tasks...').start();
      try {
        const tasks = await api.getTasks(pk);
        spinner.stop();
        header('tasks');

        if (tasks.length === 0) {
          console.log(dim('  No tasks found.'));
          return;
        }

        const table = new Table({
          head: ['ID', 'Status', 'Steps', 'Spent', 'Prompt'],
          style: { head: ['white'], border: ['gray'] },
        });

        tasks.slice(0, 20).forEach((t: any) => {
          const statusColor = t.status === 'completed' ? success : t.status === 'failed' ? error : dim;
          table.push([
            dim(t.id.slice(0, 8)),
            statusColor(t.status),
            String(t.steps?.length || 0),
            `${(t.totalSpent || 0).toFixed(2)}`,
            t.prompt.length > 40 ? t.prompt.slice(0, 37) + '...' : t.prompt,
          ]);
        });

        console.log(table.toString());
      } catch (err: any) {
        spinner.fail(err.message);
      }
    });

  // ero task show <id>
  task
    .command('show <id>')
    .description('Show task details')
    .action(async (id: string) => {
      const spinner = ora('Fetching task...').start();
      try {
        const t = await api.getTask(id);
        spinner.stop();
        header(`task ${id.slice(0, 8)}`);
        kv('status', t.status);
        kv('prompt', t.prompt);
        kv('total spent', `${(t.totalSpent || 0).toFixed(2)} USDC`);

        if (t.steps?.length) {
          console.log(`\n  ${dim('Steps:')}`);
          t.steps.forEach((s: any, i: number) => {
            const icon = s.status === 'completed' ? success('✓') : s.status === 'failed' ? error('✗') : dim('○');
            console.log(`    ${icon} ${s.description || `Step ${i + 1}`}`);
          });
        }

        if (t.result) {
          taskResult(typeof t.result === 'string' ? t.result.split('\n') : [JSON.stringify(t.result, null, 2)]);
        }
      } catch (err: any) {
        spinner.fail(err.message);
      }
    });

  // ero task approve <id>
  task
    .command('approve <id>')
    .description('Approve a pending task')
    .option('--deny', 'Deny instead of approve')
    .action(async (id: string, opts) => {
      const decision = opts.deny ? 'deny' : 'approve';
      const spinner = ora(`${decision === 'approve' ? 'Approving' : 'Denying'} task...`).start();
      try {
        await api.approveTask(id, decision);
        spinner.succeed(`Task ${decision}d`);
      } catch (err: any) {
        spinner.fail(err.message);
      }
    });
}
