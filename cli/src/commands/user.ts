import { Command } from 'commander';
import ora from 'ora';
import { requirePublicKey } from '../lib/config-store';
import { signTransactionXdr } from '../lib/signer';
import * as api from '../lib/api-client';
import { accent, success, error, warning, dim, header, kv } from '../lib/output';

export function registerUserCommand(program: Command) {
  const user = program.command('user').description('User wallet operations');

  const wallet = user.command('wallet').description('Your Stellar wallet');

  wallet
    .command('balance')
    .description('Check your USDC balance')
    .action(async () => {
      const pk = requirePublicKey();
      const spinner = ora('Fetching balance...').start();
      try {
        const info = await api.getBalance(pk);
        spinner.stop();
        console.log(`${accent(info.balance.toFixed(2))} USDC`);
      } catch (err: any) {
        spinner.fail('Could not fetch balance');
        console.log('');
        const msg = (err.message || '').toLowerCase();
        if (msg.includes('not found') || msg.includes('404')) {
          console.log(error('  Account not found on Stellar Testnet.'));
          console.log(dim('  Your wallet needs to be funded with XLM first.'));
          console.log(dim('  Visit:'));
          console.log(`  ${accent(`https://friendbot.stellar.org?addr=${pk}`)}`);
        } else {
          console.log(error(`  ${err.message}`));
        }
        console.log('');
      }
    });

  wallet
    .command('faucet')
    .description('Request free testnet USDC from the faucet')
    .option('--amount <usdc>', 'Amount of USDC to request (max 10,000)', '1000')
    .action(async (opts) => {
      const pk = requirePublicKey();
      const amount = parseFloat(opts.amount);
      const spinner = ora(`Requesting ${amount} USDC from faucet...`).start();

      try {
        const result = await api.requestFaucet(pk, amount);

        if (result.step === 'sign_trustline' && result.unsignedTrustlineTxXdr) {
          spinner.text = 'Setting up USDC trustline (first-time setup)...';
          const signedXdr = signTransactionXdr(result.unsignedTrustlineTxXdr);
          spinner.text = `Submitting trustline and receiving ${result.amount} USDC...`;
          const submit = await api.submitFaucet(signedXdr, pk, result.amount);
          spinner.succeed(`${submit.amount} USDC received! (tx: ${dim(submit.txHash.slice(0, 8))}...)`);
        } else {
          spinner.succeed(`${result.amount} USDC received!`);
        }

        // Show new balance
        try {
          const info = await api.getBalance(pk);
          console.log(`  ${dim('new balance:')} ${accent(info.balance.toFixed(2) + ' USDC')}`);
        } catch {}
      } catch (err: any) {
        spinner.fail('Faucet request failed');
        console.log('');
        const msg = (err.message || '').toLowerCase();
        if (msg.includes('not found') || msg.includes('account')) {
          console.log(error('  Account not found on Stellar Testnet.'));
          console.log(dim('  Your wallet needs XLM first. Visit:'));
          console.log(`  ${accent(`https://friendbot.stellar.org?addr=${pk}`)}`);
        } else if (msg.includes('rate') || msg.includes('limit') || msg.includes('429')) {
          console.log(error('  Faucet rate limit reached. Try again in a few minutes.'));
        } else {
          console.log(error(`  ${err.message}`));
        }
        console.log('');
      }
    });
}
