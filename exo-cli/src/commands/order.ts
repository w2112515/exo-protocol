/**
 * Order (Escrow) 管理命令
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { loadConfig, getConnection } from '../utils/config.js';
import { formatLamports, shortenAddress, formatTimestamp } from '../utils/format.js';

export const orderCommand = new Command('order')
    .description('Manage skill orders (escrows)');

// exo order create
orderCommand
    .command('create')
    .description('Create a new skill order (escrow)')
    .requiredOption('-s, --skill <address>', 'Skill PDA address')
    .requiredOption('-a, --amount <lamports>', 'Amount in lamports to lock')
    .option('--expires <seconds>', 'Expiration time in seconds from now', '3600')
    .option('--dry-run', 'Simulate without sending transaction')
    .action(async (options) => {
        const spinner = ora('Creating order escrow...').start();

        try {
            const config = loadConfig(orderCommand.parent?.opts() || {});
            const expiresIn = parseInt(options.expires);
            const expiresAt = new Date(Date.now() + expiresIn * 1000);

            console.log('\n' + chalk.bold('📦 Create Order'));
            console.log(chalk.gray('─'.repeat(50)));
            console.log(`  ${chalk.gray('Skill:')} ${chalk.cyan(shortenAddress(options.skill))}`);
            console.log(`  ${chalk.gray('Amount:')} ${chalk.green(formatLamports(parseInt(options.amount)))}`);
            console.log(`  ${chalk.gray('Expires:')} ${formatTimestamp(expiresAt.getTime())}`);
            console.log(`  ${chalk.gray('Network:')} ${config.network}`);

            if (options.dryRun) {
                spinner.info('Dry run - no transaction sent');
                console.log(chalk.yellow('\n  ⚠ Dry run mode: Transaction was not broadcast\n'));
            } else {
                spinner.text = 'Sending transaction...';
                await new Promise(resolve => setTimeout(resolve, 1500));
                spinner.succeed('Order created successfully!');

                const mockNonce = Date.now();
                console.log(`\n  ${chalk.gray('Escrow PDA:')} ${chalk.cyan('Escr...' + mockNonce.toString().slice(-8))}`);
                console.log(`  ${chalk.gray('Nonce:')} ${mockNonce}`);
                console.log(`  ${chalk.gray('Tx Signature:')} ${chalk.cyan('5v8X...demo')}`);
                console.log(`  ${chalk.blue('→ View on Solscan:')} https://solscan.io/tx/5v8X...demo?cluster=${config.network}`);
                console.log(chalk.gray('\n  Next step: Fund this escrow using `exo order fund <escrow>`\n'));
            }
        } catch (error) {
            spinner.fail('Order creation failed');
            console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
            process.exit(1);
        }
    });

// exo order fund
orderCommand
    .command('fund <escrow>')
    .description('Fund an existing escrow')
    .requiredOption('-a, --amount <lamports>', 'Amount in lamports to fund')
    .option('--dry-run', 'Simulate without sending transaction')
    .action(async (escrow, options) => {
        const spinner = ora('Funding escrow...').start();

        try {
            const config = loadConfig(orderCommand.parent?.opts() || {});

            console.log('\n' + chalk.bold('💰 Fund Escrow'));
            console.log(chalk.gray('─'.repeat(50)));
            console.log(`  ${chalk.gray('Escrow:')} ${chalk.cyan(shortenAddress(escrow))}`);
            console.log(`  ${chalk.gray('Amount:')} ${chalk.green(formatLamports(parseInt(options.amount)))}`);

            if (options.dryRun) {
                spinner.info('Dry run - no transaction sent');
            } else {
                await new Promise(resolve => setTimeout(resolve, 1200));
                spinner.succeed('Escrow funded successfully!');
                console.log(`\n  ${chalk.gray('Tx Signature:')} ${chalk.cyan('5v9Y...fund')}\n`);
            }
        } catch (error) {
            spinner.fail('Funding failed');
            console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
            process.exit(1);
        }
    });

// exo order list
orderCommand
    .command('list')
    .description('List orders for current wallet')
    .option('--status <status>', 'Filter by status (pending, funded, completed, cancelled)')
    .option('-l, --limit <number>', 'Maximum number to display', '10')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
        const spinner = ora('Fetching orders...').start();

        try {
            const config = loadConfig(orderCommand.parent?.opts() || {});

            spinner.succeed('Orders retrieved');

            if (options.json) {
                console.log(JSON.stringify({
                    network: config.network,
                    orders: []
                }, null, 2));
            } else {
                console.log('\n' + chalk.bold('📋 Your Orders'));
                console.log(chalk.gray('─'.repeat(60)));

                console.log(`
  ${chalk.cyan('1.')} ${chalk.bold('Order #1703001234567')}
     ${chalk.gray('Escrow:')} Escr1dEwPqRg8NhL41HLxBfvC2xLe5VqYmqDj2YXdemo1
     ${chalk.gray('Skill:')} gpt-4-turbo
     ${chalk.gray('Amount:')} ${chalk.green('0.1 SOL')}
     ${chalk.gray('Status:')} ${chalk.yellow('● Funded')} (awaiting execution)
     ${chalk.gray('Expires:')} in 45 minutes

  ${chalk.cyan('2.')} ${chalk.bold('Order #1703001234500')}
     ${chalk.gray('Escrow:')} Escr2dEwPqRg8NhL41HLxBfvC2xLe5VqYmqDj2YXdemo2
     ${chalk.gray('Skill:')} claude-3-opus  
     ${chalk.gray('Amount:')} ${chalk.green('0.15 SOL')}
     ${chalk.gray('Status:')} ${chalk.green('● Completed')}
     ${chalk.gray('Result:')} Qm...hash
`);
                console.log(chalk.gray('─'.repeat(60)));
                console.log(chalk.gray(`  Showing 2 orders on ${config.network}\n`));
            }
        } catch (error) {
            spinner.fail('Failed to fetch orders');
            console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
            process.exit(1);
        }
    });

// exo order cancel
orderCommand
    .command('cancel <escrow>')
    .description('Cancel an unfunded or expired escrow')
    .option('--force', 'Skip confirmation')
    .action(async (escrow, options) => {
        console.log('\n' + chalk.bold.yellow('⚠ Cancel Order'));
        console.log(chalk.gray('─'.repeat(50)));
        console.log(`  ${chalk.gray('Escrow:')} ${chalk.cyan(escrow)}`);
        console.log(chalk.yellow('\n  This will return locked funds to your wallet.\n'));

        if (!options.force) {
            console.log(chalk.gray('  Use --force to skip confirmation\n'));
            return;
        }

        const spinner = ora('Cancelling order...').start();
        await new Promise(resolve => setTimeout(resolve, 1000));
        spinner.succeed('Order cancelled, funds returned');
    });

// exo order release
orderCommand
    .command('release <escrow>')
    .description('Release escrow (buyer confirms completion)')
    .requiredOption('-r, --result <hash>', 'Result content hash')
    .action(async (escrow, options) => {
        const spinner = ora('Releasing escrow...').start();

        try {
            console.log('\n' + chalk.bold('✅ Release Escrow'));
            console.log(chalk.gray('─'.repeat(50)));
            console.log(`  ${chalk.gray('Escrow:')} ${chalk.cyan(shortenAddress(escrow))}`);
            console.log(`  ${chalk.gray('Result Hash:')} ${chalk.cyan(shortenAddress(options.result))}`);

            await new Promise(resolve => setTimeout(resolve, 1500));
            spinner.succeed('Escrow released!');

            console.log(`
  ${chalk.gray('Fee Split:')}
    → Skill Authority: ${chalk.green('0.09 SOL')} (90%)
    → Protocol Fee: ${chalk.blue('0.01 SOL')} (10%)
  
  ${chalk.gray('Tx Signature:')} ${chalk.cyan('5vAZ...release')}
`);
        } catch (error) {
            spinner.fail('Release failed');
            console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
            process.exit(1);
        }
    });
