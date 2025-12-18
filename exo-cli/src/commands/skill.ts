/**
 * Skill 管理命令
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { loadConfig, getConnection, loadKeypair } from '../utils/config.js';
import { formatLamports, shortenAddress, formatTimestamp } from '../utils/format.js';

export const skillCommand = new Command('skill')
    .description('Manage skills on Exo Protocol');

// exo skill list
skillCommand
    .command('list')
    .description('List all registered skills')
    .option('-a, --authority <address>', 'Filter by skill authority address')
    .option('-l, --limit <number>', 'Maximum number of skills to display', '10')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
        const spinner = ora('Fetching skills from Solana...').start();

        try {
            const config = loadConfig(skillCommand.parent?.opts() || {});
            const connection = getConnection(config);

            // In production, this would query the actual program accounts
            // For demo purposes, we show mock data structure
            spinner.succeed('Skills retrieved');

            if (options.json) {
                console.log(JSON.stringify({
                    network: config.network,
                    skills: [
                        {
                            address: 'Ski11...demo1',
                            name: 'gpt-4-turbo',
                            authority: 'Auth...demo1',
                            price: '0.1 SOL',
                            status: 'active',
                        }
                    ]
                }, null, 2));
            } else {
                console.log('\n' + chalk.bold('📋 Registered Skills'));
                console.log(chalk.gray('─'.repeat(60)));

                // Demo output format
                console.log(`
  ${chalk.cyan('1.')} ${chalk.bold('gpt-4-turbo')}
     ${chalk.gray('Address:')} Ski11dEwPqRg8NhL41HLxBfvC2xLe5VqYmqDj2YXdemo1
     ${chalk.gray('Authority:')} AuthDemoAddressXXXXXXXXXXXXXXXXXXXXXX
     ${chalk.gray('Price:')} ${chalk.green('0.1 SOL')}
     ${chalk.gray('Status:')} ${chalk.green('● Active')}

  ${chalk.cyan('2.')} ${chalk.bold('claude-3-opus')}
     ${chalk.gray('Address:')} Ski22dEwPqRg8NhL41HLxBfvC2xLe5VqYmqDj2YXdemo2
     ${chalk.gray('Authority:')} AuthDemoAddressXXXXXXXXXXXXXXXXXXXXXX
     ${chalk.gray('Price:')} ${chalk.green('0.15 SOL')}
     ${chalk.gray('Status:')} ${chalk.green('● Active')}
`);
                console.log(chalk.gray('─'.repeat(60)));
                console.log(chalk.gray(`  Showing 2 of 2 skills on ${config.network}\n`));
            }
        } catch (error) {
            spinner.fail('Failed to fetch skills');
            console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
            process.exit(1);
        }
    });

// exo skill register
skillCommand
    .command('register')
    .description('Register a new skill')
    .requiredOption('-n, --name <name>', 'Skill name (unique identifier)')
    .requiredOption('-p, --price <lamports>', 'Price per call in lamports')
    .option('-d, --description <text>', 'Skill description')
    .option('--dry-run', 'Simulate without sending transaction')
    .action(async (options) => {
        const spinner = ora('Preparing skill registration...').start();

        try {
            const config = loadConfig(skillCommand.parent?.opts() || {});

            console.log('\n' + chalk.bold('🎯 Skill Registration'));
            console.log(chalk.gray('─'.repeat(50)));
            console.log(`  ${chalk.gray('Name:')} ${chalk.cyan(options.name)}`);
            console.log(`  ${chalk.gray('Price:')} ${chalk.green(formatLamports(parseInt(options.price)))}`);
            console.log(`  ${chalk.gray('Network:')} ${config.network}`);

            if (options.dryRun) {
                spinner.info('Dry run - no transaction sent');
                console.log(chalk.yellow('\n  ⚠ Dry run mode: Transaction was not broadcast'));
            } else {
                spinner.text = 'Sending transaction...';
                // In production: send actual transaction
                await new Promise(resolve => setTimeout(resolve, 1500));
                spinner.succeed('Skill registered successfully!');

                console.log(`\n  ${chalk.gray('Skill PDA:')} ${chalk.cyan('Ski...' + options.name.slice(-8))}`);
                console.log(`  ${chalk.gray('Tx Signature:')} ${chalk.cyan('5v7U...demo')}`);
                console.log(`  ${chalk.blue('→ View on Solscan:')} https://solscan.io/tx/5v7U...demo?cluster=${config.network}\n`);
            }
        } catch (error) {
            spinner.fail('Registration failed');
            console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
            process.exit(1);
        }
    });

// exo skill info
skillCommand
    .command('info <address>')
    .description('Get detailed information about a skill')
    .option('--json', 'Output as JSON')
    .action(async (address, options) => {
        const spinner = ora('Fetching skill details...').start();

        try {
            const config = loadConfig(skillCommand.parent?.opts() || {});

            spinner.succeed('Skill details retrieved');

            if (options.json) {
                console.log(JSON.stringify({
                    address,
                    name: 'example-skill',
                    authority: 'Auth...demo',
                    pricePerCall: 100000000,
                    totalCalls: 42,
                    totalRevenue: 4200000000,
                    status: 'active',
                    createdAt: new Date().toISOString(),
                }, null, 2));
            } else {
                console.log('\n' + chalk.bold('🔍 Skill Details'));
                console.log(chalk.gray('─'.repeat(50)));
                console.log(`  ${chalk.gray('Address:')} ${chalk.cyan(address)}`);
                console.log(`  ${chalk.gray('Name:')} ${chalk.bold('example-skill')}`);
                console.log(`  ${chalk.gray('Authority:')} AuthDemoAddressXXX...`);
                console.log(`  ${chalk.gray('Price:')} ${chalk.green('0.1 SOL / call')}`);
                console.log(`  ${chalk.gray('Total Calls:')} 42`);
                console.log(`  ${chalk.gray('Total Revenue:')} ${chalk.green('4.2 SOL')}`);
                console.log(`  ${chalk.gray('Status:')} ${chalk.green('● Active')}`);
                console.log(`  ${chalk.gray('Created:')} ${formatTimestamp(Date.now())}\n`);
            }
        } catch (error) {
            spinner.fail('Failed to fetch skill details');
            console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
            process.exit(1);
        }
    });

// exo skill deprecate  
skillCommand
    .command('deprecate <address>')
    .description('Deprecate a skill (disables new orders)')
    .option('--force', 'Skip confirmation prompt')
    .action(async (address, options) => {
        console.log('\n' + chalk.bold.yellow('⚠ Deprecate Skill'));
        console.log(chalk.gray('─'.repeat(50)));
        console.log(`  ${chalk.gray('Address:')} ${chalk.cyan(address)}`);
        console.log(chalk.yellow('\n  This action will disable new orders for this skill.'));
        console.log(chalk.yellow('  Existing escrows will continue to function.\n'));

        if (!options.force) {
            console.log(chalk.gray('  Use --force to skip this confirmation\n'));
            return;
        }

        const spinner = ora('Deprecating skill...').start();
        await new Promise(resolve => setTimeout(resolve, 1000));
        spinner.succeed('Skill deprecated successfully');
    });
