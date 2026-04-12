import { Command } from 'commander';
import ora from 'ora';
import * as api from '../lib/api-client';
import { requirePublicKey } from '../lib/config-store';
import { accent, success, error, dim } from '../lib/output';

export function registerWrapCommand(program: Command) {
  program
    .command('wrap')
    .description('Register a REST API as x402 payable')
    .requiredOption('--base-url <url>', 'Base URL of the API')
    .requiredOption('--slug <slug>', 'Slug for the wrapped endpoint (e.g. news-api)')
    .requiredOption('--price <usdc>', 'Price per call in USDC')
    .option('--wallet <address>', 'Stellar address to receive payments (defaults to your wallet)')
    .action(async (opts) => {
      const pk = requirePublicKey();

      console.log(`${accent('>')} ero wrap --base-url ${opts.baseUrl} --slug ${opts.slug} --price ${opts.price}`);
      const spinner = ora('Registering API as x402 payable...').start();

      try {
        await api.registerApi({
          baseUrl: opts.baseUrl,
          slug: opts.slug,
          price: parseFloat(opts.price),
          receiverAddress: opts.wallet,
          owner: pk,
        });
        spinner.stop();
        console.log(success(`✓ registered /x402/${opts.slug} (${opts.price} USDC/call)`));
      } catch (err: any) {
        spinner.fail('Registration failed');
        console.log('');
        const msg = (err.message || '').toLowerCase();
        if (msg.includes('already') || msg.includes('exists') || msg.includes('duplicate')) {
          console.log(error(`  Slug "${opts.slug}" is already registered.`));
          console.log(dim('  Choose a different slug or remove the existing one first.'));
        } else {
          console.log(error(`  ${err.message}`));
        }
        console.log('');
      }
    });
}
