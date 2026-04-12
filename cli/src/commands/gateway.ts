import { Command } from 'commander';
import ora from 'ora';
import Table from 'cli-table3';
import * as api from '../lib/api-client';
import { requirePublicKey } from '../lib/config-store';
import { accent, success, error, dim, header } from '../lib/output';

export function registerGatewayCommand(program: Command) {
  const gateway = program.command('gateway').description('API gateway operations');

  gateway
    .command('list')
    .description('List registered APIs')
    .option('--mine', 'Only show your APIs')
    .action(async (opts) => {
      const spinner = ora('Fetching APIs...').start();
      try {
        const owner = opts.mine ? requirePublicKey() : undefined;
        const apis = await api.getApis(owner);
        spinner.stop();
        header('registered APIs');

        if (apis.length === 0) {
          console.log(dim('  No APIs registered.'));
          return;
        }

        const table = new Table({
          head: ['Slug', 'Price', 'Calls', 'Revenue', 'Base URL'],
          style: { head: ['white'], border: ['gray'] },
        });

        apis.forEach((a: any) => {
          table.push([
            accent(a.slug),
            `${a.price} USDC`,
            String(a.callCount || 0),
            `${(a.totalRevenue || 0).toFixed(2)} USDC`,
            dim(a.baseUrl.length > 40 ? a.baseUrl.slice(0, 37) + '...' : a.baseUrl),
          ]);
        });

        console.log(table.toString());
        console.log(dim(`\n  ${apis.length} API(s) registered\n`));
      } catch (err: any) {
        spinner.fail(err.message);
      }
    });

  gateway
    .command('test <slug>')
    .description('Test an x402 wrapped API call')
    .action(async (slug: string) => {
      const spinner = ora(`Calling /x402/${slug}...`).start();
      try {
        const result = await api.testWrappedApi(slug);
        spinner.stop();
        console.log(`\n${accent('>')} GET /x402/${slug}`);
        if (result.status === 402) {
          console.log(accent(`[402] Payment Required — ${result.amount} USDC`));
        } else {
          console.log(success('✓ Response received'));
          console.log(dim(JSON.stringify(result, null, 2).slice(0, 500)));
        }
      } catch (err: any) {
        spinner.stop();
        // 402 is expected — means gateway is working
        if (err.message.includes('402')) {
          console.log(`\n${accent('>')} GET /x402/${slug}`);
          console.log(accent('[402] Payment Required — gateway is working correctly'));
        } else {
          console.log(error(`Failed: ${err.message}`));
        }
      }
    });

  gateway
    .command('remove <id>')
    .description('Remove a registered API')
    .action(async (id: string) => {
      const spinner = ora('Removing API...').start();
      try {
        await api.removeApi(id);
        spinner.succeed('API removed');
      } catch (err: any) {
        spinner.fail(err.message);
      }
    });
}
