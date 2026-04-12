import { Command } from 'commander';
import { loadConfig, saveConfig, isInitialized } from '../lib/config-store';
import { accent, dim, kv, header, warning } from '../lib/output';

export function registerConfigCommand(program: Command) {
  const config = program.command('config').description('Manage CLI configuration');

  config
    .command('set <key> <value>')
    .description('Set a config value (api-url)')
    .action((key: string, value: string) => {
      const cfg = loadConfig();
      switch (key) {
        case 'api-url':
          cfg.apiUrl = value;
          break;
        default:
          console.error(`Unknown config key: ${key}. Use: api-url`);
          console.error(`To change wallet, run: ero init --reset`);
          process.exit(1);
      }
      saveConfig(cfg);
      console.log(`${accent('✓')} ${key} = ${value}`);
    });

  config
    .command('show')
    .description('Show current configuration')
    .action(() => {
      header('config');
      const cfg = loadConfig();
      kv('initialized', cfg.initialized ? accent('yes') : warning('no'));
      kv('api-url', cfg.apiUrl);
      kv('public-key', cfg.publicKey || dim('(not set)'));
      kv('secret-key', cfg.encryptedSecret ? dim('●●●●●●● (encrypted)') : dim('(not set)'));
    });
}
