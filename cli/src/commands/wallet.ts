import { Command } from 'commander';
import ora from 'ora';
import { requirePublicKey } from '../lib/config-store';
import { signTransactionXdr } from '../lib/signer';
import * as api from '../lib/api-client';
import { accent, success, error, warning, dim, header, kv } from '../lib/output';

export function registerWalletCommand(program: Command) {
  const wallet = program.command('wallet').description('Agent wallet operations');

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
          console.log(`\n  Run ${accent('ero wallet activate')} to activate.\n`);
        }
      } catch (err: any) {
        spinner.fail(err.message);
      }
    });

  wallet
    .command('activate')
    .description('Activate agent wallet (auto-signs with your secret key)')
    .option('--xlm <amount>', 'XLM to fund activation', '5')
    .action(async (opts) => {
      const pk = requirePublicKey();
      const spinner = ora('Preparing activation transaction...').start();
      try {
        const { unsignedTxXdr } = await api.activateWallet(pk, parseFloat(opts.xlm));
        spinner.text = 'Signing transaction...';
        const signedTxXdr = signTransactionXdr(unsignedTxXdr);
        spinner.text = 'Submitting activation...';
        const result = await api.submitActivation(pk, signedTxXdr);
        spinner.succeed(`Wallet activated! Agent key: ${dim(result.agentPublicKey)}`);
      } catch (err: any) {
        spinner.fail(err.message);
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
        spinner.fail(err.message);
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
        spinner.fail(err.message);
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
}
