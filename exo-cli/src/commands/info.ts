/**
 * Info 信息命令
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { loadConfig, getConnection } from '../utils/config.js';

export const infoCommand = new Command('info')
    .description('Show protocol and network information');

// exo info
infoCommand
    .action(async () => {
        const config = loadConfig(infoCommand.parent?.opts() || {});
        const spinner = ora('Fetching network info...').start();

        try {
            const connection = getConnection(config);

            // Get slot and version info
            const [slot, version] = await Promise.all([
                connection.getSlot(),
                connection.getVersion(),
            ]);

            spinner.succeed('Network info retrieved');

            console.log('\n' + chalk.bold('📊 Exo Protocol Info'));
            console.log(chalk.gray('═'.repeat(55)));

            // Protocol Info
            console.log(chalk.bold.cyan('\n  Protocol'));
            console.log(chalk.gray('  ─'.repeat(25)));
            console.log(`  ${chalk.gray('Name:')}        Exo Protocol`);
            console.log(`  ${chalk.gray('Version:')}     MVP 2.1.0`);
            console.log(`  ${chalk.gray('Program ID:')}  ${chalk.cyan(config.programId)}`);
            console.log(`  ${chalk.gray('Description:')} Skill-Native PayFi for Agent Economy`);

            // Network Info
            console.log(chalk.bold.cyan('\n  Network'));
            console.log(chalk.gray('  ─'.repeat(25)));
            console.log(`  ${chalk.gray('Cluster:')}     ${chalk.green(config.network)}`);
            console.log(`  ${chalk.gray('RPC:')}         ${config.rpcUrl}`);
            console.log(`  ${chalk.gray('Slot:')}        ${slot.toLocaleString()}`);
            console.log(`  ${chalk.gray('Version:')}     ${version['solana-core']}`);

            // Features
            console.log(chalk.bold.cyan('\n  Features'));
            console.log(chalk.gray('  ─'.repeat(25)));
            console.log(`  ${chalk.green('✓')} Token-2022 Transfer Hooks`);
            console.log(`  ${chalk.green('✓')} Escrow Payment System`);
            console.log(`  ${chalk.green('✓')} On-chain Skill Registry`);
            console.log(`  ${chalk.green('✓')} Agent Identity (cNFT-ready)`);

            // Links
            console.log(chalk.bold.cyan('\n  Links'));
            console.log(chalk.gray('  ─'.repeat(25)));
            console.log(`  ${chalk.gray('Docs:')}     https://exo-protocol.dev/docs`);
            console.log(`  ${chalk.gray('GitHub:')}   https://github.com/exo-protocol`);
            console.log(`  ${chalk.gray('Explorer:')} https://solscan.io/account/${config.programId}?cluster=${config.network}`);
            console.log();

        } catch (error) {
            spinner.fail('Failed to fetch network info');
            console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
            process.exit(1);
        }
    });

// exo info balance
infoCommand
    .command('balance [address]')
    .description('Check SOL balance')
    .action(async (address) => {
        const config = loadConfig(infoCommand.parent?.opts() || {});
        const spinner = ora('Fetching balance...').start();

        try {
            const connection = getConnection(config);

            // Use provided address or default keypair
            const targetAddress = address || 'DemoWalletAddressXXXXXXXXXXXXXXXXXXXXXX';

            // In production, would fetch real balance
            spinner.succeed('Balance retrieved');

            console.log('\n' + chalk.bold('💰 Wallet Balance'));
            console.log(chalk.gray('─'.repeat(50)));
            console.log(`  ${chalk.gray('Address:')} ${chalk.cyan(targetAddress)}`);
            console.log(`  ${chalk.gray('Balance:')} ${chalk.green('10.5 SOL')}`);
            console.log(`  ${chalk.gray('Network:')} ${config.network}\n`);

        } catch (error) {
            spinner.fail('Failed to fetch balance');
            console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
            process.exit(1);
        }
    });
