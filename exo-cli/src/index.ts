#!/usr/bin/env node
/**
 * @exo-protocol/cli - Exo Protocol CLI
 *
 * A command-line interface for interacting with Exo Protocol
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { skillCommand } from './commands/skill.js';
import { orderCommand } from './commands/order.js';
import { configCommand } from './commands/config.js';
import { infoCommand } from './commands/info.js';
import { agentCommand } from './commands/agent.js';

const program = new Command();

// ASCII Art Banner
const banner = `
${chalk.cyan('╔═══════════════════════════════════════════════════════════╗')}
${chalk.cyan('║')}  ${chalk.bold.white('EXO PROTOCOL')} - ${chalk.yellow('Skill-Native PayFi for Agent Economy')}  ${chalk.cyan('║')}
${chalk.cyan('╚═══════════════════════════════════════════════════════════╝')}
`;

program
    .name('exo')
    .description(banner + '\n  CLI tool for Exo Protocol operations')
    .version('0.1.0', '-v, --version', 'Output the current version')
    .option('-n, --network <network>', 'Solana network (devnet, mainnet)', 'devnet')
    .option('-k, --keypair <path>', 'Path to keypair file')
    .option('--rpc <url>', 'Custom RPC endpoint URL');

// Register sub-commands
program.addCommand(skillCommand);
program.addCommand(orderCommand);
program.addCommand(configCommand);
program.addCommand(infoCommand);
program.addCommand(agentCommand);

// Default action when no command is provided
program.action(() => {
    console.log(banner);
    console.log(chalk.gray('  Use --help to see available commands\n'));
    program.outputHelp();
});

// Parse and execute
program.parse(process.argv);
