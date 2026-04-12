import { Command } from 'commander';
import ora from 'ora';
import Table from 'cli-table3';
import { requirePublicKey } from '../lib/config-store';
import { signTransactionXdr } from '../lib/signer';
import * as api from '../lib/api-client';
import { connectTaskStream } from '../lib/ws-client';
import { accent, success, error, warning, dim, header, kv, logLine, taskResult } from '../lib/output';

export function registerAgentCommand(program: Command) {
  const agent = program.command('agent').description('Agent wallet & task operations');

  // ── ero agent wallet ──────────────────────────

  const wallet = agent.command('wallet').description('Agent wallet operations');

  wallet
    .command('status')
    .description('Show agent wallet status and balance')
    .action(async () => {
      const pk = requirePublicKey();
      const spinner = ora('Fetching wallet status...').start();
      try {
        const w = await api.getAgentWallet(pk);
        spinner.stop();
        header('agent wallet');
        kv('public key', w.agentPublicKey);
        kv('activated', w.activated ? success('yes') : warning('no'));
        if (w.activated) {
          kv('USDC balance', accent(`${w.balance.toFixed(2)} USDC`));
          kv('XLM balance', `${w.xlmBalance.toFixed(2)} XLM`);
        } else {
          console.log(`\n  Run ${accent('ero agent wallet activate')} to activate.\n`);
        }
      } catch (err: any) {
        spinner.fail(err.message);
      }
    });

  wallet
    .command('activate')
    .description('Activate agent wallet (costs 5 XLM from your wallet, auto-signs)')
    .option('--xlm <amount>', 'XLM to fund activation', '5')
    .action(async (opts) => {
      const pk = requirePublicKey();
      const xlmCost = parseFloat(opts.xlm);

      console.log('');
      console.log(warning(`  This will deduct ${xlmCost} XLM from your Stellar wallet to create the agent account.`));
      console.log(dim(`  Make sure your wallet has at least ${xlmCost} XLM on Stellar Testnet.`));
      console.log(dim(`  Get free testnet XLM at: ${accent('https://friendbot.stellar.org?addr=YOUR_PUBLIC_KEY')}`));
      console.log('');

      // Check XLM balance first
      const spinner = ora('Checking wallet balance...').start();
      try {
        const balanceInfo = await api.getBalance(pk).catch(() => null);
        // If we can't fetch balance, proceed anyway — the TX will fail if insufficient
      } catch {}

      spinner.text = 'Preparing activation transaction...';
      try {
        const { unsignedTxXdr } = await api.activateWallet(pk, xlmCost);
        spinner.text = 'Signing transaction...';
        const signedTxXdr = signTransactionXdr(unsignedTxXdr);
        spinner.text = 'Submitting activation...';
        const result = await api.submitActivation(pk, signedTxXdr);
        spinner.succeed(`Wallet activated! Agent key: ${dim(result.agentPublicKey)}`);
      } catch (err: any) {
        spinner.fail('Activation failed');
        console.log('');
        const msg = (err.message || '').toLowerCase();
        if (msg.includes('underfunded') || msg.includes('insufficient') || msg.includes('balance') || msg.includes('not found') || msg.includes('account')) {
          console.log(error('  Insufficient XLM balance to activate the agent wallet.'));
          console.log('');
          console.log(dim('  Your wallet needs at least 5 XLM on Stellar Testnet.'));
          console.log(dim('  To get free testnet XLM, visit:'));
          console.log(`  ${accent(`https://friendbot.stellar.org?addr=${pk}`)}`);
          console.log('');
          console.log(dim('  After funding, retry:'));
          console.log(`  ${accent('ero agent wallet activate')}`);
        } else {
          console.log(error(`  ${err.message}`));
        }
        console.log('');
      }
    });

  wallet
    .command('fund <amount>')
    .description('Fund agent wallet with USDC (auto-signs)')
    .action(async (amount: string) => {
      const pk = requirePublicKey();
      const spinner = ora(`Preparing funding transaction for ${amount} USDC...`).start();
      try {
        const result = await api.fundAgent(pk, parseFloat(amount), pk);
        spinner.text = 'Signing transaction...';
        const signedTxXdr = signTransactionXdr(result.unsignedTxXdr);
        spinner.text = 'Submitting funding...';
        const submit = await api.submitFunding(signedTxXdr, pk);
        spinner.succeed(`Funded! New balance: ${accent(submit.newBalance.toFixed(2) + ' USDC')} (tx: ${dim(submit.txHash.slice(0, 8))}...)`);
      } catch (err: any) {
        spinner.fail('Funding failed');
        console.log('');
        const msg = (err.message || '').toLowerCase();
        if (msg.includes('trustline') || msg.includes('usdc') || msg.includes('asset')) {
          console.log(error('  Your wallet does not have a USDC trustline or has insufficient USDC.'));
          console.log('');
          console.log(dim('  To get free testnet USDC, run:'));
          console.log(`  ${accent('ero user wallet faucet')}`);
          console.log('');
          console.log(dim('  Then retry funding:'));
          console.log(`  ${accent(`ero agent wallet fund ${amount}`)}`);
        } else if (msg.includes('not activated') || msg.includes('not found') || msg.includes('account')) {
          console.log(error('  Agent wallet is not activated yet.'));
          console.log('');
          console.log(dim('  Activate it first:'));
          console.log(`  ${accent('ero agent wallet activate')}`);
        } else if (msg.includes('underfunded') || msg.includes('insufficient') || msg.includes('balance')) {
          console.log(error(`  Insufficient USDC balance to fund ${amount} USDC.`));
          console.log('');
          console.log(dim('  Check your balance:'));
          console.log(`  ${accent('ero user wallet balance')}`);
          console.log('');
          console.log(dim('  Request more from the faucet:'));
          console.log(`  ${accent('ero user wallet faucet')}`);
        } else {
          console.log(error(`  ${err.message}`));
        }
        console.log('');
      }
    });

  wallet
    .command('withdraw <amount>')
    .description('Withdraw USDC from agent wallet to your wallet')
    .action(async (amount: string) => {
      const pk = requirePublicKey();
      const spinner = ora(`Withdrawing ${amount} USDC...`).start();
      try {
        const result = await api.withdrawFromAgent(pk, parseFloat(amount));
        spinner.succeed(`Withdrawn! New balance: ${accent(result.newBalance.toFixed(2) + ' USDC')} (tx: ${dim(result.txHash.slice(0, 8))}...)`);
      } catch (err: any) {
        spinner.fail('Withdrawal failed');
        console.log('');
        const msg = (err.message || '').toLowerCase();
        if (msg.includes('insufficient') || msg.includes('balance')) {
          console.log(error('  Insufficient USDC balance in agent wallet.'));
          console.log(dim(`  Check your balance with: ${accent('ero agent wallet balance')}`));
        } else {
          console.log(error(`  ${err.message}`));
        }
        console.log('');
      }
    });

  wallet
    .command('balance')
    .description('Quick balance check')
    .action(async () => {
      const pk = requirePublicKey();
      try {
        const w = await api.getAgentWallet(pk);
        if (w.activated) {
          console.log(`${accent(w.balance.toFixed(2))} USDC`);
        } else {
          console.log(warning('Wallet not activated'));
        }
      } catch (err: any) {
        console.error(error(err.message));
      }
    });

  // ── ero agent task ────────────────────────────

  const task = agent.command('task').description('Agent task operations');

  task
    .command('run <prompt>')
    .description('Create and execute an agent task')
    .option('--no-auto-approve', 'Require manual approval before execution')
    .action(async (prompt: string, opts) => {
      const pk = requirePublicKey();

      console.log(`${accent('>')} ero agent task run "${prompt}"`);
      const spinner = ora('decomposing task into agent steps...').start();

      try {
        const created = await api.createTask(prompt, pk);
        spinner.text = `Task ${dim(created.id)} created, executing...`;

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
                console.log(`  ero agent task approve ${t.id}\n`);
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
            if (opts.autoApprove === false) {
              console.log(warning(`\n[gate] Estimated cost: ${data.totalEstimatedCost} USDC | Balance: ${data.agentBalance} USDC`));
            }
          },
        });

        await api.executeTask(created.id);
        if (spinner.isSpinning) spinner.stop();

        await new Promise<void>((resolve) => {
          const check = setInterval(() => {
            if (taskDone) { clearInterval(check); resolve(); }
          }, 500);
          setTimeout(() => {
            clearInterval(check);
            if (!taskDone) {
              stream.close();
              console.log(warning('\nTimeout — task still running. Check with: ero agent task show ' + created.id));
            }
            resolve();
          }, 300000);
        });
      } catch (err: any) {
        spinner.fail(err.message);
      }
    });

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
