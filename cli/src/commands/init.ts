import { Command } from 'commander';
import * as readline from 'readline';
import { Keypair } from '@stellar/stellar-sdk';
import { loadConfig, saveConfig, encryptSecret, isInitialized } from '../lib/config-store';
import { accent, success, warning, dim, header, kv } from '../lib/output';

function prompt(question: string, hidden = false): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    if (hidden && process.stdin.isTTY) {
      // Mask input for secret key
      process.stdout.write(question);
      let input = '';
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding('utf8');
      const onData = (char: string) => {
        if (char === '\n' || char === '\r' || char === '\u0004') {
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.removeListener('data', onData);
          rl.close();
          process.stdout.write('\n');
          resolve(input);
        } else if (char === '\u0003') {
          process.exit();
        } else if (char === '\u007F' || char === '\b') {
          if (input.length > 0) {
            input = input.slice(0, -1);
            process.stdout.write('\b \b');
          }
        } else {
          input += char;
          process.stdout.write('*');
        }
      };
      process.stdin.on('data', onData);
    } else {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    }
  });
}

export function registerInitCommand(program: Command) {
  program
    .command('init')
    .description('Initialize ero CLI — connect your Stellar wallet')
    .option('--reset', 'Reset existing configuration')
    .action(async (opts) => {
      console.log('');
      console.log(accent('  ero.') + dim(' — x402 Agent Gateway CLI'));
      console.log(dim('  ─────────────────────────────────'));
      console.log('');

      if (isInitialized() && !opts.reset) {
        const cfg = loadConfig();
        console.log(success('  Already initialized.'));
        kv('  public key', cfg.publicKey);
        console.log(`\n  Run ${accent('ero init --reset')} to reconfigure.\n`);
        return;
      }

      const cfg = loadConfig();

      console.log(dim('  Your Stellar secret key is used to sign transactions locally.'));
      console.log(dim('  It will be encrypted and stored at ~/.ero/config.json'));
      console.log(dim('  It never leaves this machine.\n'));

      const secretKey = await prompt(`  ${accent('Stellar secret key')} (S...): `, true);

      if (!secretKey || !secretKey.startsWith('S')) {
        console.error('\n  Invalid secret key. Must start with S.');
        process.exit(1);
      }

      // Validate the key
      let keypair: Keypair;
      try {
        keypair = Keypair.fromSecret(secretKey);
      } catch {
        console.error('\n  Invalid Stellar secret key.');
        process.exit(1);
      }

      cfg.publicKey = keypair.publicKey();
      cfg.encryptedSecret = encryptSecret(secretKey);
      cfg.initialized = true;

      saveConfig(cfg);

      console.log('');
      console.log(success('  ✓ Initialized'));
      console.log('');
      kv('  public key', cfg.publicKey);
      kv('  secret', dim('encrypted at ~/.ero/config.json'));
      console.log('');
      console.log(dim('  Next steps:'));
      console.log(`    ${accent('ero agent wallet status')}    — check your agent wallet`);
      console.log(`    ${accent('ero agent wallet activate')} — activate your agent wallet`);
      console.log(`    ${accent('ero gateway list')}           — browse available APIs`);
      console.log(`    ${accent('ero agent task run "..."')}   — run your first agent task`);
      console.log('');
    });
}
