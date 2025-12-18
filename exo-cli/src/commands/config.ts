/**
 * Config 配置命令
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig } from '../utils/config.js';

export const configCommand = new Command('config')
    .description('Manage CLI configuration');

// exo config show
configCommand
    .command('show')
    .description('Show current configuration')
    .action(() => {
        const config = loadConfig(configCommand.parent?.opts() || {});

        console.log('\n' + chalk.bold('⚙️  CLI Configuration'));
        console.log(chalk.gray('─'.repeat(50)));
        console.log(`  ${chalk.gray('Network:')} ${chalk.cyan(config.network)}`);
        console.log(`  ${chalk.gray('RPC URL:')} ${chalk.cyan(config.rpcUrl)}`);
        console.log(`  ${chalk.gray('Keypair:')} ${config.keypairPath || chalk.gray('(default: ~/.config/solana/id.json)')}`);
        console.log(`  ${chalk.gray('Program ID:')} ${chalk.cyan(config.programId)}`);
        console.log();
    });

// exo config set
configCommand
    .command('set <key> <value>')
    .description('Set a configuration value')
    .action((key, value) => {
        console.log('\n' + chalk.bold('⚙️  Set Configuration'));
        console.log(chalk.gray('─'.repeat(50)));
        console.log(`  ${chalk.gray('Key:')} ${chalk.cyan(key)}`);
        console.log(`  ${chalk.gray('Value:')} ${chalk.green(value)}`);
        console.log(chalk.yellow('\n  Note: Config persistence not implemented in demo\n'));
    });

// exo config networks
configCommand
    .command('networks')
    .description('List available networks')
    .action(() => {
        console.log('\n' + chalk.bold('🌐 Available Networks'));
        console.log(chalk.gray('─'.repeat(50)));
        console.log(`
  ${chalk.green('●')} ${chalk.bold('devnet')} (default)
    RPC: https://api.devnet.solana.com
    
  ${chalk.gray('○')} ${chalk.bold('mainnet-beta')}
    RPC: https://api.mainnet-beta.solana.com
    
  ${chalk.gray('○')} ${chalk.bold('localnet')}
    RPC: http://localhost:8899
`);
    });
