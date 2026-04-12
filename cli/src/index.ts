#!/usr/bin/env node

import { Command } from 'commander';
import { registerInitCommand } from './commands/init';
import { registerConfigCommand } from './commands/config';
import { registerUserCommand } from './commands/user';
import { registerAgentCommand } from './commands/agent';
import { registerGatewayCommand } from './commands/gateway';
import { registerWrapCommand } from './commands/wrap';
import { registerDashboardCommand } from './commands/dashboard';

const program = new Command();

program
  .name('ero')
  .description('ero. — CLI for x402 Agent Gateway & Playground')
  .version('1.0.0');

registerInitCommand(program);
registerConfigCommand(program);
registerUserCommand(program);
registerAgentCommand(program);
registerGatewayCommand(program);
registerWrapCommand(program);
registerDashboardCommand(program);

program.parse(process.argv);
