/**
 * P5-DEMO-01: 演示数据脚本
 * 
 * 预埋演示数据 - 确保评委看到完整价值
 * 基于 ADR-010 §5.3.3 设计规范
 * 
 * 使用方式:
 *   npx ts-node scripts/seed-demo-data.ts
 *   或
 *   node scripts/seed-demo-data.js (编译后)
 */

import * as fs from 'fs';
import * as path from 'path';

// Solana 常量 (避免依赖 @solana/web3.js)
const LAMPORTS_PER_SOL = 1_000_000_000;

// ============================================================================
// Demo Fixtures - 预埋数据
// ============================================================================

/**
 * 演示任务数据 - 3-5条已完成任务
 */
export const demoTasks = [
    {
        id: 'demo-001',
        skill: 'price-oracle',
        skillName: 'Price Oracle',
        description: 'BTC/USD 实时价格查询',
        amount: 0.05 * LAMPORTS_PER_SOL,
        timestamp: Date.now() - 3600000,  // 1小时前
        executor: 'Agent-Alpha',
        status: 'finalized' as const,
    },
    {
        id: 'demo-002',
        skill: 'tweet-sentiment',
        skillName: 'Tweet Sentiment Analyzer',
        description: '推文情感分析 @elonmusk',
        amount: 0.03 * LAMPORTS_PER_SOL,
        timestamp: Date.now() - 1800000,  // 30分钟前
        executor: 'Agent-Beta',
        status: 'finalized' as const,
    },
    {
        id: 'demo-003',
        skill: 'token-analyzer',
        skillName: 'Token Security Analyzer',
        description: 'SOL Token 安全评估',
        amount: 0.08 * LAMPORTS_PER_SOL,
        timestamp: Date.now() - 900000,   // 15分钟前
        executor: 'Agent-Gamma',
        status: 'finalized' as const,
    },
    {
        id: 'demo-004',
        skill: 'code-reviewer',
        skillName: 'Smart Contract Reviewer',
        description: 'Escrow 合约代码审计',
        amount: 0.15 * LAMPORTS_PER_SOL,
        timestamp: Date.now() - 300000,   // 5分钟前
        executor: 'Agent-Delta',
        status: 'committed' as const,
    },
];

/**
 * 桑基图数据 - 资金流可视化
 * 展示 Exo Protocol 的分账机制: 85% Executor + 10% Creator + 5% Protocol
 */
export const demoSankeyData = {
    nodes: [
        { id: 'client', name: '用户 (Client)', type: 'source' },
        { id: 'escrow', name: 'Escrow 托管', type: 'intermediate' },
        { id: 'executor', name: 'Executor (85%)', type: 'sink' },
        { id: 'creator', name: 'Creator 版税 (10%)', type: 'sink' },
        { id: 'protocol', name: 'Protocol 费用 (5%)', type: 'sink' },
    ],
    links: [
        { source: 'client', target: 'escrow', value: 0.31 * LAMPORTS_PER_SOL },
        { source: 'escrow', target: 'executor', value: 0.2635 * LAMPORTS_PER_SOL },
        { source: 'escrow', target: 'creator', value: 0.031 * LAMPORTS_PER_SOL },
        { source: 'escrow', target: 'protocol', value: 0.0155 * LAMPORTS_PER_SOL },
    ],
    summary: {
        totalVolume: 0.31 * LAMPORTS_PER_SOL,
        totalTasks: 4,
        avgTaskValue: 0.0775 * LAMPORTS_PER_SOL,
    }
};

/**
 * 演示日志 - 展示完整生命周期
 * 模拟 Helius WebSocket 返回的链上事件日志
 */
export const demoLogs = [
    {
        eventType: 'skill_registered',
        signature: '5xDemo...SkillReg1',
        slot: 280000001,
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        programId: 'CdamAXn5fCros3MktPxmbQKXtxd34XHATTLmh9jkn7DT',
        data: { skill: 'price-oracle', price: 0.05 * LAMPORTS_PER_SOL },
    },
    {
        eventType: 'agent_created',
        signature: '5xDemo...AgentCreate1',
        slot: 280000010,
        timestamp: new Date(Date.now() - 7000000).toISOString(),
        programId: 'CdamAXn5fCros3MktPxmbQKXtxd34XHATTLmh9jkn7DT',
        data: { agent: 'Agent-Alpha', tier: 1 },
    },
    {
        eventType: 'escrow_created',
        signature: '5xDemo...EscrowCreate1',
        slot: 280000100,
        timestamp: new Date(Date.now() - 3700000).toISOString(),
        programId: 'CdamAXn5fCros3MktPxmbQKXtxd34XHATTLmh9jkn7DT',
        data: { orderId: 'demo-001', amount: 0.05 * LAMPORTS_PER_SOL },
    },
    {
        eventType: 'escrow_funded',
        signature: '5xDemo...EscrowFund1',
        slot: 280000101,
        timestamp: new Date(Date.now() - 3650000).toISOString(),
        programId: 'CdamAXn5fCros3MktPxmbQKXtxd34XHATTLmh9jkn7DT',
        data: { orderId: 'demo-001', executor: 'Agent-Alpha' },
    },
    {
        eventType: 'escrow_released',
        signature: '5xDemo...EscrowRelease1',
        slot: 280000200,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        programId: 'CdamAXn5fCros3MktPxmbQKXtxd34XHATTLmh9jkn7DT',
        data: { orderId: 'demo-001', resultHash: '0xabc123...' },
    },
    {
        eventType: 'transfer_hooked',
        signature: '5xDemo...TransferHook1',
        slot: 280000201,
        timestamp: new Date(Date.now() - 3599000).toISOString(),
        programId: 'C1iSwHyPWRR48pxbiztvQ6wt92mB7WfebgpEBdTv78kw',
        data: { fee_bps: 500, executorAmount: 0.0425 * LAMPORTS_PER_SOL },
    },
    {
        eventType: 'escrow_created',
        signature: '5xDemo...EscrowCreate2',
        slot: 280000300,
        timestamp: new Date(Date.now() - 1900000).toISOString(),
        programId: 'CdamAXn5fCros3MktPxmbQKXtxd34XHATTLmh9jkn7DT',
        data: { orderId: 'demo-002', amount: 0.03 * LAMPORTS_PER_SOL },
    },
    {
        eventType: 'escrow_released',
        signature: '5xDemo...EscrowRelease2',
        slot: 280000400,
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        programId: 'CdamAXn5fCros3MktPxmbQKXtxd34XHATTLmh9jkn7DT',
        data: { orderId: 'demo-002', resultHash: '0xdef456...' },
    },
];

// ============================================================================
// Seed Functions - 数据注入
// ============================================================================

/**
 * 生成演示数据 JSON 文件
 * 输出到 exo-frontend/public/demo-data/ 目录供前端使用
 */
export async function seedDemoData() {
    const outputDir = path.join(__dirname, '..', 'exo-frontend', 'public', 'demo-data');

    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log(`📁 Created directory: ${outputDir}`);
    }

    // 1. 预埋历史任务记录
    const tasksWithCalculatedFees = demoTasks.map(task => ({
        ...task,
        executorEarnings: task.amount * 0.85,
        creatorRoyalty: task.amount * 0.10,
        protocolFee: task.amount * 0.05,
        completedAt: new Date(task.timestamp).toISOString(),
    }));

    fs.writeFileSync(
        path.join(outputDir, 'tasks.json'),
        JSON.stringify(tasksWithCalculatedFees, null, 2)
    );
    console.log('✅ Demo tasks seeded');

    // 2. 预埋桑基图数据
    fs.writeFileSync(
        path.join(outputDir, 'sankey.json'),
        JSON.stringify(demoSankeyData, null, 2)
    );
    console.log('✅ Sankey data seeded');

    // 3. 预埋日志记录
    fs.writeFileSync(
        path.join(outputDir, 'logs.json'),
        JSON.stringify(demoLogs, null, 2)
    );
    console.log('✅ Demo logs seeded');

    // 4. 生成索引文件
    const indexData = {
        version: '1.0.0',
        generatedAt: new Date().toISOString(),
        files: ['tasks.json', 'sankey.json', 'logs.json'],
        summary: {
            totalTasks: demoTasks.length,
            totalLogs: demoLogs.length,
            totalVolume: `${(demoSankeyData.summary.totalVolume / LAMPORTS_PER_SOL).toFixed(2)} SOL`,
        }
    };

    fs.writeFileSync(
        path.join(outputDir, 'index.json'),
        JSON.stringify(indexData, null, 2)
    );
    console.log('✅ Index file generated');

    console.log('\n🎉 Demo data seeded successfully!');
    console.log(`   Output: ${outputDir}`);
    console.log(`   Tasks: ${demoTasks.length}`);
    console.log(`   Logs: ${demoLogs.length}`);
    console.log(`   Volume: ${(demoSankeyData.summary.totalVolume / LAMPORTS_PER_SOL).toFixed(2)} SOL`);
}

// ============================================================================
// Main Entry
// ============================================================================

if (require.main === module) {
    seedDemoData()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error('❌ Error seeding demo data:', err);
            process.exit(1);
        });
}
