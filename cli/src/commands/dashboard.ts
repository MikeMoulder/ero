import { Command } from 'commander';
import ora from 'ora';
import * as api from '../lib/api-client';
import { loadConfig, requirePublicKey } from '../lib/config-store';
import { accent, success, dim, warning, header, kv } from '../lib/output';

export function registerDashboardCommand(program: Command) {
  program
    .command('dashboard')
    .description('Show dashboard stats overview')
    .action(async () => {
      const cfg = loadConfig();
      const pk = cfg.publicKey || undefined;
      const spinner = ora('Fetching dashboard stats...').start();

      try {
        const stats = await api.getStats(pk);
        spinner.stop();
        header('dashboard');

        // Overview
        console.log(accent('  Overview'));
        kv('  USDC in', `${(stats.overview?.totalUsdcIn || 0).toFixed(2)} USDC`);
        kv('  USDC out', `${(stats.overview?.totalUsdcOut || 0).toFixed(2)} USDC`);
        kv('  payment success', `${(stats.overview?.paymentSuccessRate || 0).toFixed(0)}%`);

        // Gateway
        console.log(`\n${accent('  Gateway')}`);
        kv('  APIs registered', stats.gateway?.apiCount || 0);
        kv('  total calls', stats.gateway?.totalCalls || 0);
        kv('  total revenue', `${(stats.gateway?.totalRevenue || 0).toFixed(2)} USDC`);

        if (stats.gateway?.topApis?.length) {
          console.log(dim('  top APIs:'));
          stats.gateway.topApis.slice(0, 5).forEach((a: any) => {
            console.log(`    ${accent(a.slug || a.name)} — ${a.calls || a.callCount} calls`);
          });
        }

        // Playground
        console.log(`\n${accent('  Playground')}`);
        kv('  total tasks', stats.playground?.totalTasks || 0);
        kv('  completion rate', `${(stats.playground?.completionRate || 0).toFixed(0)}%`);
        kv('  avg cost', `${(stats.playground?.avgCost || 0).toFixed(2)} USDC`);
        kv('  avg steps', stats.playground?.avgSteps || 0);

        console.log('');
      } catch (err: any) {
        spinner.fail(err.message);
      }
    });
}
