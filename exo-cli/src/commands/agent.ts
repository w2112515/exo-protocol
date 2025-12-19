/**
 * Agent 管理命令
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { loadConfig, getConnection, loadKeypair } from '../utils/config.js';
import { formatLamports, shortenAddress, formatTimestamp } from '../utils/format.js';

const MIN_STAKE_SOL = 0.1;
const MIN_STAKE_LAMPORTS = MIN_STAKE_SOL * LAMPORTS_PER_SOL;

export const agentCommand = new Command('agent')
    .description('Manage Agent identity and staking');

// exo agent create
agentCommand
    .command('create')
    .description('Create a new Agent identity')
    .option('--dry-run', 'Simulate without sending transaction')
    .action(async (options) => {
        const spinner = ora('Creating Agent identity...').start();

        try {
            const config = loadConfig(agentCommand.parent?.opts() || {});
            const connection = getConnection(config);

            console.log('\n' + chalk.bold('🤖 Agent Identity Creation'));
            console.log(chalk.gray('─'.repeat(50)));
            console.log(`  ${chalk.gray('Network:')} ${config.network}`);

            if (options.dryRun) {
                spinner.info('Dry run - no transaction sent');
                console.log(chalk.yellow('\n  ⚠ Dry run mode: Transaction was not broadcast'));
            } else {
                spinner.text = 'Sending transaction...';
                // In production: send actual transaction via ExoClient
                await new Promise(resolve => setTimeout(resolve, 1500));
                spinner.succeed('Agent identity created successfully!');

                console.log(`\n  ${chalk.gray('Agent PDA:')} ${chalk.cyan('Agent...demo123')}`);
                console.log(`  ${chalk.gray('Tx Signature:')} ${chalk.cyan('5v7U...demo')}`);
                console.log(`  ${chalk.blue('→ View on Solscan:')} https://solscan.io/tx/5v7U...demo?cluster=${config.network}\n`);
            }
        } catch (error) {
            spinner.fail('Failed to create Agent identity');
            console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
            process.exit(1);
        }
    });

// exo agent stake <amount>
agentCommand
    .command('stake <amount>')
    .description(`Stake SOL to activate Agent (minimum ${MIN_STAKE_SOL} SOL)`)
    .option('--dry-run', 'Simulate without sending transaction')
    .action(async (amount: string, options) => {
        const amountNum = parseFloat(amount);

        // 前端校验最低质押
        if (isNaN(amountNum) || amountNum < MIN_STAKE_SOL) {
            console.log(chalk.red(`\n  ❌ Error: Minimum stake amount is ${MIN_STAKE_SOL} SOL\n`));
            process.exit(1);
        }

        const spinner = ora(`Staking ${amount} SOL...`).start();

        try {
            const config = loadConfig(agentCommand.parent?.opts() || {});
            const lamports = amountNum * LAMPORTS_PER_SOL;

            console.log('\n' + chalk.bold('💰 Agent Staking'));
            console.log(chalk.gray('─'.repeat(50)));
            console.log(`  ${chalk.gray('Amount:')} ${chalk.green(amount + ' SOL')} (${lamports.toLocaleString()} lamports)`);
            console.log(`  ${chalk.gray('Network:')} ${config.network}`);

            if (options.dryRun) {
                spinner.info('Dry run - no transaction sent');
                console.log(chalk.yellow('\n  ⚠ Dry run mode: Transaction was not broadcast'));
            } else {
                spinner.text = 'Sending transaction...';
                // In production: send actual transaction via ExoClient
                await new Promise(resolve => setTimeout(resolve, 1500));
                spinner.succeed(`Staked ${amount} SOL successfully!`);

                console.log(`\n  ${chalk.gray('Tx Signature:')} ${chalk.cyan('5v7U...stake')}`);
                console.log(`  ${chalk.gray('New Staked Balance:')} ${chalk.green(amount + ' SOL')}`);
                console.log(`  ${chalk.gray('Agent Status:')} ${chalk.green('● Active')}`);
                console.log(`  ${chalk.blue('→ View on Solscan:')} https://solscan.io/tx/5v7U...stake?cluster=${config.network}\n`);
            }
        } catch (error) {
            spinner.fail('Failed to stake SOL');
            console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
            process.exit(1);
        }
    });

// exo agent unstake <amount>
agentCommand
    .command('unstake <amount>')
    .description('Unstake SOL from Agent')
    .option('--dry-run', 'Simulate without sending transaction')
    .option('--force', 'Force unstake even if below minimum')
    .action(async (amount: string, options) => {
        const amountNum = parseFloat(amount);

        if (isNaN(amountNum) || amountNum <= 0) {
            console.log(chalk.red('\n  ❌ Error: Invalid amount\n'));
            process.exit(1);
        }

        const spinner = ora(`Unstaking ${amount} SOL...`).start();

        try {
            const config = loadConfig(agentCommand.parent?.opts() || {});
            const lamports = amountNum * LAMPORTS_PER_SOL;

            console.log('\n' + chalk.bold('💸 Agent Unstaking'));
            console.log(chalk.gray('─'.repeat(50)));
            console.log(`  ${chalk.gray('Amount:')} ${chalk.yellow(amount + ' SOL')} (${lamports.toLocaleString()} lamports)`);
            console.log(`  ${chalk.gray('Network:')} ${config.network}`);

            if (!options.force) {
                console.log(chalk.yellow(`\n  ⚠ Warning: If remaining stake falls below ${MIN_STAKE_SOL} SOL, Agent will be deactivated.`));
            }

            if (options.dryRun) {
                spinner.info('Dry run - no transaction sent');
                console.log(chalk.yellow('\n  ⚠ Dry run mode: Transaction was not broadcast'));
            } else {
                spinner.text = 'Sending transaction...';
                // In production: send actual transaction via ExoClient
                await new Promise(resolve => setTimeout(resolve, 1500));
                spinner.succeed(`Unstaked ${amount} SOL successfully!`);

                console.log(`\n  ${chalk.gray('Tx Signature:')} ${chalk.cyan('5v7U...unstake')}`);
                console.log(`  ${chalk.gray('Remaining Stake:')} ${chalk.yellow('0.15 SOL')}`);
                console.log(`  ${chalk.gray('Agent Status:')} ${chalk.green('● Active')}`);
                console.log(`  ${chalk.blue('→ View on Solscan:')} https://solscan.io/tx/5v7U...unstake?cluster=${config.network}\n`);
            }
        } catch (error) {
            spinner.fail('Failed to unstake SOL');
            console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
            process.exit(1);
        }
    });

// exo agent status [address]
agentCommand
    .command('status [address]')
    .description('View Agent status and staking info')
    .option('--json', 'Output as JSON')
    .action(async (address: string | undefined, options) => {
        const spinner = ora('Fetching Agent status...').start();

        try {
            const config = loadConfig(agentCommand.parent?.opts() || {});
            const connection = getConnection(config);

            // In production: fetch from ExoClient
            await new Promise(resolve => setTimeout(resolve, 800));

            const mockAgent = {
                address: address || 'Agent7qRg...YourAgent',
                tier: 1,
                tierName: 'Verified',
                stakedAmount: 0.25 * LAMPORTS_PER_SOL,
                isActive: true,
                reputationScore: 8500,
                totalEarnings: 1.5 * LAMPORTS_PER_SOL,
                totalTasks: 42,
                slashedCount: 0,
                createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
            };

            spinner.stop();

            if (options.json) {
                console.log(JSON.stringify({
                    address: mockAgent.address,
                    tier: mockAgent.tier,
                    stakedAmount: mockAgent.stakedAmount,
                    isActive: mockAgent.isActive,
                    reputationScore: mockAgent.reputationScore,
                    totalEarnings: mockAgent.totalEarnings,
                    totalTasks: mockAgent.totalTasks,
                    slashedCount: mockAgent.slashedCount,
                }, null, 2));
            } else {
                console.log(chalk.bold('\n📊 Agent Status\n'));
                console.log(`  ${chalk.gray('Address:')}     ${chalk.cyan(mockAgent.address)}`);
                console.log(`  ${chalk.gray('Tier:')}        ${getTierBadge(mockAgent.tier)}`);
                console.log(`  ${chalk.gray('Staked:')}      ${chalk.green((mockAgent.stakedAmount / LAMPORTS_PER_SOL).toFixed(2) + ' SOL')}`);
                console.log(`  ${chalk.gray('Active:')}      ${mockAgent.isActive ? chalk.green('✓ Yes') : chalk.red('✗ No')}`);
                console.log(`  ${chalk.gray('Reputation:')} ${formatReputation(mockAgent.reputationScore)}`);
                console.log(`  ${chalk.gray('Earnings:')}    ${chalk.green((mockAgent.totalEarnings / LAMPORTS_PER_SOL).toFixed(4) + ' SOL')}`);
                console.log(`  ${chalk.gray('Tasks:')}       ${mockAgent.totalTasks}`);
                console.log(`  ${chalk.gray('Slashed:')}     ${mockAgent.slashedCount === 0 ? chalk.green('0 times') : chalk.red(mockAgent.slashedCount + ' times')}`);
                console.log(`  ${chalk.gray('Created:')}     ${formatTimestamp(mockAgent.createdAt)}\n`);
            }
        } catch (error) {
            spinner.fail('Failed to fetch Agent status');
            console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
            process.exit(1);
        }
    });

// exo agent list
agentCommand
    .command('list')
    .description('List all registered Agents')
    .option('-l, --limit <number>', 'Number of agents to show', '10')
    .option('--active-only', 'Show only active agents')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
        const spinner = ora('Fetching Agents...').start();

        try {
            const config = loadConfig(agentCommand.parent?.opts() || {});

            // In production: fetch from ExoClient
            await new Promise(resolve => setTimeout(resolve, 1000));

            const mockAgents = [
                {
                    address: 'Agent7qRg...YourAgent',
                    tier: 1,
                    stakedAmount: 0.25 * LAMPORTS_PER_SOL,
                    isActive: true,
                    reputationScore: 8500,
                },
                {
                    address: 'AgentXyz...Demo002',
                    tier: 2,
                    stakedAmount: 1.0 * LAMPORTS_PER_SOL,
                    isActive: true,
                    reputationScore: 9200,
                },
                {
                    address: 'AgentAbc...Demo003',
                    tier: 0,
                    stakedAmount: 0,
                    isActive: false,
                    reputationScore: 5000,
                },
            ];

            const filteredAgents = options.activeOnly
                ? mockAgents.filter(a => a.isActive)
                : mockAgents;

            const limitedAgents = filteredAgents.slice(0, parseInt(options.limit));

            spinner.stop();

            if (options.json) {
                console.log(JSON.stringify(limitedAgents, null, 2));
            } else {
                console.log(chalk.bold(`\n📋 Registered Agents (${limitedAgents.length})\n`));
                console.log(chalk.gray('─'.repeat(70)));

                limitedAgents.forEach((agent, i) => {
                    const status = agent.isActive ? chalk.green('●') : chalk.gray('○');
                    const stake = (agent.stakedAmount / LAMPORTS_PER_SOL).toFixed(2);
                    const tierBadge = getTierBadge(agent.tier);

                    console.log(`  ${status} ${chalk.cyan(agent.address)} | ${tierBadge} | Stake: ${chalk.green(stake + ' SOL')} | Rep: ${agent.reputationScore}`);
                });

                console.log(chalk.gray('─'.repeat(70)));
                console.log(chalk.gray(`  Showing ${limitedAgents.length} agents on ${config.network}`));
                if (options.activeOnly) {
                    console.log(chalk.gray('  (filtered: active only)'));
                }
                console.log();
            }
        } catch (error) {
            spinner.fail('Failed to fetch Agents');
            console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
            process.exit(1);
        }
    });

// Helper functions
function getTierBadge(tier: number): string {
    switch (tier) {
        case 0:
            return chalk.gray('Open');
        case 1:
            return chalk.blue('Verified');
        case 2:
            return chalk.yellow('Premium');
        default:
            return chalk.gray('Unknown');
    }
}

function formatReputation(score: number): string {
    const percentage = (score / 100).toFixed(1) + '%';
    if (score >= 8000) {
        return chalk.green(percentage + ' ⭐');
    } else if (score >= 6000) {
        return chalk.yellow(percentage);
    } else {
        return chalk.red(percentage);
    }
}
