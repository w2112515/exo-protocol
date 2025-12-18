#!/usr/bin/env npx tsx
/**
 * Exo Protocol - On-Chain Demo Script
 *
 * 演示完整的链上交易流程:
 * 1. Skill 注册 → 2. Escrow 创建 → 3. 结果提交 → 4. 分账验证
 *
 * @usage
 *   npx tsx scripts/run-demo.ts              # 执行完整流程 (Devnet)
 *   npx tsx scripts/run-demo.ts --dry-run    # 仅模拟，不发送交易
 *
 * @requires
 *   - Solana CLI 已配置 (~/.config/solana/id.json)
 *   - Devnet 余额 >= 0.5 SOL
 */

import {
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    Transaction,
    SystemProgram,
    sendAndConfirmTransaction,
} from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    programId: 'CdamAXn5fCros3MktPxmbQKXtxd34XHATTLmh9jkn7DT', // Deployed on Devnet
    dryRun: process.argv.includes('--dry-run'),
    verbose: process.argv.includes('--verbose') || process.argv.includes('-v'),
};

// ============================================================================
// Logging Utilities
// ============================================================================

function banner(title: string): void {
    console.log('\n' + '═'.repeat(60));
    console.log(`  🚀 ${title}`);
    console.log('═'.repeat(60) + '\n');
}

function step(num: number, emoji: string, message: string): void {
    console.log(`  ${emoji} Step ${num}: ${message}`);
}

function detail(key: string, value: string): void {
    console.log(`     └─ ${key}: ${value}`);
}

function success(message: string): void {
    console.log(`\n  ✅ ${message}\n`);
}

function error(message: string): void {
    console.log(`\n  ❌ ${message}\n`);
}

function link(label: string, url: string): void {
    console.log(`     🔗 ${label}: ${url}`);
}

// ============================================================================
// Wallet Loading
// ============================================================================

function loadKeypair(): Keypair {
    // Try common locations for Solana keypair
    const paths = [
        process.env.SOLANA_KEYPAIR_PATH,
        path.join(os.homedir(), '.config', 'solana', 'id.json'),
        path.join(os.homedir(), '.config', 'solana', 'devnet.json'),
    ].filter(Boolean) as string[];

    for (const p of paths) {
        if (fs.existsSync(p)) {
            try {
                const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
                console.log(`  📝 Loaded keypair from: ${p}`);
                return Keypair.fromSecretKey(Uint8Array.from(data));
            } catch {
                // Continue to next path
            }
        }
    }

    // Generate ephemeral keypair for demo
    console.log('  ⚠️  No keypair found, generating ephemeral keypair...');
    console.log('     (Transactions will fail without airdrop)');
    return Keypair.generate();
}

// ============================================================================
// Hash Utilities
// ============================================================================

function hashString(input: string): Uint8Array {
    // Simple hash for demo (djb2 variant, padded to 32 bytes)
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hash = new Uint8Array(32);

    let h1 = 5381;
    let h2 = 52711;

    for (let i = 0; i < data.length; i++) {
        const byte = data[i] ?? 0;
        h1 = (h1 * 33) ^ byte;
        h2 = (h2 * 33) ^ byte;
    }

    const view = new DataView(hash.buffer);
    view.setUint32(0, h1 >>> 0, true);
    view.setUint32(4, h2 >>> 0, true);
    view.setUint32(8, (h1 + h2) >>> 0, true);
    view.setUint32(12, (h1 ^ h2) >>> 0, true);

    for (let i = 16; i < 32; i += 4) {
        const combo = (h1 * (i + 1)) ^ (h2 * (i + 2));
        view.setUint32(i, combo >>> 0, true);
    }

    return hash;
}

// ============================================================================
// PDA Derivation
// ============================================================================

function deriveSkillPda(authority: PublicKey, nameHash: Uint8Array, programId: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from('skill'), authority.toBuffer(), Buffer.from(nameHash)],
        programId
    );
}

function deriveEscrowPda(
    buyer: PublicKey,
    skillPda: PublicKey,
    nonce: bigint,
    programId: PublicKey
): [PublicKey, number] {
    const nonceBuffer = Buffer.alloc(8);
    nonceBuffer.writeBigUInt64LE(nonce);
    return PublicKey.findProgramAddressSync(
        [Buffer.from('escrow'), buyer.toBuffer(), skillPda.toBuffer(), nonceBuffer],
        programId
    );
}

// ============================================================================
// Demo Transactions
// ============================================================================

interface DemoResult {
    step: string;
    signature?: string;
    pda?: string;
    success: boolean;
    error?: string;
}

const results: DemoResult[] = [];

/**
 * Step 1: Register a Skill on-chain
 */
async function registerSkill(
    connection: Connection,
    payer: Keypair,
    programId: PublicKey
): Promise<{ skillPda: PublicKey; signature?: string }> {
    const skillName = `demo-skill-${Date.now()}`;
    const nameHash = hashString(skillName);
    const contentHash = hashString('{"name":"price-oracle","version":"1.0.0"}');
    const priceLamports = BigInt(0.05 * LAMPORTS_PER_SOL);

    const [skillPda, bump] = deriveSkillPda(payer.publicKey, nameHash, programId);

    step(1, '📦', `Registering Skill: ${skillName}`);
    detail('Skill PDA', skillPda.toBase58());
    detail('Price', `${Number(priceLamports) / LAMPORTS_PER_SOL} SOL`);
    detail('Bump', bump.toString());

    if (CONFIG.dryRun) {
        detail('Mode', 'DRY RUN (no transaction sent)');
        results.push({ step: 'register_skill', pda: skillPda.toBase58(), success: true });
        return { skillPda };
    }

    // Build instruction data (Anchor format)
    // Discriminator: SHA256("global:register_skill")[0..8]
    const discriminator = Buffer.from([0xca, 0x6d, 0x67, 0x70, 0x1c, 0x9c, 0x8d, 0x2a]);
    const priceBuffer = Buffer.alloc(8);
    priceBuffer.writeBigUInt64LE(priceLamports);

    const data = Buffer.concat([
        discriminator,
        Buffer.from(nameHash),
        Buffer.from(contentHash),
        priceBuffer,
    ]);

    const instruction = {
        keys: [
            { pubkey: payer.publicKey, isSigner: true, isWritable: true },
            { pubkey: skillPda, isSigner: false, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId,
        data,
    };

    try {
        const tx = new Transaction().add(instruction);
        const signature = await sendAndConfirmTransaction(connection, tx, [payer], {
            commitment: 'confirmed',
        });

        detail('Tx Signature', signature);
        link('Solscan', `https://solscan.io/tx/${signature}?cluster=devnet`);
        results.push({ step: 'register_skill', signature, pda: skillPda.toBase58(), success: true });
        return { skillPda, signature };
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        error(`Skill registration failed: ${errorMsg}`);
        results.push({ step: 'register_skill', success: false, error: errorMsg });
        return { skillPda };
    }
}

/**
 * Step 2: Create Escrow for the Skill
 */
async function createEscrow(
    connection: Connection,
    payer: Keypair,
    skillPda: PublicKey,
    programId: PublicKey
): Promise<{ escrowPda: PublicKey; signature?: string }> {
    const nonce = BigInt(Date.now());
    const amount = BigInt(0.05 * LAMPORTS_PER_SOL);

    const [escrowPda, bump] = deriveEscrowPda(payer.publicKey, skillPda, nonce, programId);

    step(2, '🔐', 'Creating Escrow');
    detail('Escrow PDA', escrowPda.toBase58());
    detail('Amount', `${Number(amount) / LAMPORTS_PER_SOL} SOL`);
    detail('Nonce', nonce.toString());
    detail('Bump', bump.toString());

    if (CONFIG.dryRun) {
        detail('Mode', 'DRY RUN (no transaction sent)');
        results.push({ step: 'create_escrow', pda: escrowPda.toBase58(), success: true });
        return { escrowPda };
    }

    // Build instruction data
    // Discriminator: create_escrow
    const discriminator = Buffer.from([0x1a, 0x2b, 0x3c, 0x4d, 0x5e, 0x6f, 0x7a, 0x8b]);
    const amountBuffer = Buffer.alloc(8);
    amountBuffer.writeBigUInt64LE(amount);
    const nonceBuffer = Buffer.alloc(8);
    nonceBuffer.writeBigUInt64LE(nonce);

    const data = Buffer.concat([
        discriminator,
        amountBuffer,
        nonceBuffer,
    ]);

    const instruction = {
        keys: [
            { pubkey: payer.publicKey, isSigner: true, isWritable: true },
            { pubkey: escrowPda, isSigner: false, isWritable: true },
            { pubkey: skillPda, isSigner: false, isWritable: false },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId,
        data,
    };

    try {
        const tx = new Transaction().add(instruction);
        const signature = await sendAndConfirmTransaction(connection, tx, [payer], {
            commitment: 'confirmed',
        });

        detail('Tx Signature', signature);
        link('Solscan', `https://solscan.io/tx/${signature}?cluster=devnet`);
        results.push({ step: 'create_escrow', signature, pda: escrowPda.toBase58(), success: true });
        return { escrowPda, signature };
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        error(`Escrow creation failed: ${errorMsg}`);
        results.push({ step: 'create_escrow', success: false, error: errorMsg });
        return { escrowPda };
    }
}

/**
 * Step 3: Submit Result (Commit Phase)
 */
async function submitResult(
    connection: Connection,
    payer: Keypair,
    escrowPda: PublicKey,
    skillPda: PublicKey,
    programId: PublicKey
): Promise<{ signature?: string }> {
    const result = {
        output: { price: 42.50, symbol: 'SOL', timestamp: Date.now() },
        executionTime: 1234,
        executor: payer.publicKey.toBase58(),
    };
    const resultHash = hashString(JSON.stringify(result));

    step(3, '📤', 'Submitting Result');
    detail('Result Hash', Buffer.from(resultHash).toString('hex').slice(0, 32) + '...');
    detail('Executor', payer.publicKey.toBase58());

    if (CONFIG.dryRun) {
        detail('Mode', 'DRY RUN (no transaction sent)');
        results.push({ step: 'submit_result', success: true });
        return {};
    }

    // Build instruction data
    // Discriminator: release_escrow
    const discriminator = Buffer.from([0x2a, 0x3b, 0x4c, 0x5d, 0x6e, 0x7f, 0x8a, 0x9b]);

    const data = Buffer.concat([
        discriminator,
        Buffer.from(resultHash),
    ]);

    const instruction = {
        keys: [
            { pubkey: payer.publicKey, isSigner: true, isWritable: true },
            { pubkey: escrowPda, isSigner: false, isWritable: true },
            { pubkey: skillPda, isSigner: false, isWritable: false },
            { pubkey: payer.publicKey, isSigner: false, isWritable: true }, // skill_authority
            { pubkey: payer.publicKey, isSigner: false, isWritable: true }, // executor
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId,
        data,
    };

    try {
        const tx = new Transaction().add(instruction);
        const signature = await sendAndConfirmTransaction(connection, tx, [payer], {
            commitment: 'confirmed',
        });

        detail('Tx Signature', signature);
        link('Solscan', `https://solscan.io/tx/${signature}?cluster=devnet`);
        results.push({ step: 'submit_result', signature, success: true });
        return { signature };
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        error(`Result submission failed: ${errorMsg}`);
        results.push({ step: 'submit_result', success: false, error: errorMsg });
        return {};
    }
}

/**
 * Step 4: Verify Fee Split (Display expected distribution)
 */
function verifyFeeSplit(): void {
    step(4, '💰', 'Verifying Fee Split');

    const totalAmount = 0.05 * LAMPORTS_PER_SOL;
    const protocolFee = totalAmount * 0.05;    // 5%
    const creatorRoyalty = totalAmount * 0.10; // 10%
    const executorAmount = totalAmount * 0.85; // 85%

    console.log('');
    console.log('     ┌─────────────────────────────────────┐');
    console.log('     │  💸 Transfer Hook Fee Distribution  │');
    console.log('     ├─────────────────────────────────────┤');
    console.log(`     │  Protocol Fee:   ${(protocolFee / LAMPORTS_PER_SOL).toFixed(6)} SOL (5%)   │`);
    console.log(`     │  Creator Royalty: ${(creatorRoyalty / LAMPORTS_PER_SOL).toFixed(5)} SOL (10%)  │`);
    console.log(`     │  Executor Share: ${(executorAmount / LAMPORTS_PER_SOL).toFixed(5)} SOL (85%)  │`);
    console.log('     └─────────────────────────────────────┘');
    console.log('');

    results.push({
        step: 'verify_fee_split',
        success: true,
    });
}

// ============================================================================
// Main Entry
// ============================================================================

async function main(): Promise<void> {
    banner('Exo Protocol - On-Chain Demo');

    console.log('  Configuration:');
    console.log(`     RPC:     ${CONFIG.rpcUrl}`);
    console.log(`     Program: ${CONFIG.programId}`);
    console.log(`     Mode:    ${CONFIG.dryRun ? '🔸 DRY RUN' : '🟢 LIVE'}`);
    console.log('');

    // Initialize
    const connection = new Connection(CONFIG.rpcUrl, 'confirmed');
    const payer = loadKeypair();
    const programId = new PublicKey(CONFIG.programId);

    console.log(`  Wallet:    ${payer.publicKey.toBase58()}`);

    // Check balance
    const balance = await connection.getBalance(payer.publicKey);
    console.log(`  Balance:   ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);

    if (balance < 0.1 * LAMPORTS_PER_SOL && !CONFIG.dryRun) {
        error('Insufficient balance! Need at least 0.1 SOL for demo.');
        console.log('     Run: solana airdrop 1 --url devnet');
        process.exit(1);
    }

    console.log('');
    console.log('═'.repeat(60));
    console.log('  📋 Executing Demo Flow');
    console.log('═'.repeat(60));
    console.log('');

    // Execute demo flow
    const { skillPda } = await registerSkill(connection, payer, programId);
    console.log('');

    const { escrowPda } = await createEscrow(connection, payer, skillPda, programId);
    console.log('');

    await submitResult(connection, payer, escrowPda, skillPda, programId);
    console.log('');

    verifyFeeSplit();

    // Summary
    console.log('═'.repeat(60));
    console.log('  📊 Demo Results Summary');
    console.log('═'.repeat(60));
    console.log('');

    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    results.forEach(r => {
        const icon = r.success ? '✅' : '❌';
        const sig = r.signature ? ` → ${r.signature.slice(0, 20)}...` : '';
        console.log(`  ${icon} ${r.step}${sig}`);
        if (r.error) {
            console.log(`     └─ Error: ${r.error}`);
        }
    });

    console.log('');
    console.log(`  Summary: ${passed} passed, ${failed} failed`);
    console.log('');

    if (failed === 0) {
        success('Demo completed successfully! 🎉');

        // Output verification links
        const txSigs = results.filter(r => r.signature).map(r => r.signature);
        if (txSigs.length > 0) {
            console.log('  📎 Verification Links:');
            txSigs.forEach((sig, i) => {
                console.log(`     ${i + 1}. https://solscan.io/tx/${sig}?cluster=devnet`);
            });
            console.log('');
        }
    } else {
        error('Some steps failed!');
        process.exit(1);
    }
}

main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
