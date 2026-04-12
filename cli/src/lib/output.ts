import chalk from 'chalk';

export const accent = chalk.hex('#FF4F00');
export const success = chalk.hex('#34D399');
export const error = chalk.hex('#F87171');
export const warning = chalk.hex('#FBBF24');
export const dim = chalk.hex('#6E6E7A');
export const muted = chalk.hex('#3E3E4A');

export function header(text: string) {
  console.log(`\n${accent('ero.')} ${chalk.white.bold(text)}\n`);
}

export function logLine(level: string, source: string, message: string) {
  const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
  const prefix = dim(`[${ts}]`);

  switch (level) {
    case 'payment':
      console.log(`${prefix} ${accent(`[${source}]`)} ${accent(message)}`);
      break;
    case 'error':
      console.log(`${prefix} ${error(`[${source}]`)} ${error(message)}`);
      break;
    case 'warn':
      console.log(`${prefix} ${warning(`[${source}]`)} ${message}`);
      break;
    case 'agent':
      console.log(`${prefix} ${chalk.cyan(`[${source}]`)} ${message}`);
      break;
    default:
      console.log(`${prefix} ${dim(`[${source}]`)} ${message}`);
  }
}

export function taskResult(lines: string[]) {
  console.log('');
  console.log(dim('── result ──────────────────────────────'));
  lines.forEach(l => console.log(chalk.white(l)));
  console.log(dim('────────────────────────────────────────'));
  console.log('');
}

export function kv(key: string, value: string | number) {
  console.log(`  ${dim(key + ':')} ${chalk.white(String(value))}`);
}
