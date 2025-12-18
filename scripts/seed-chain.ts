#!/usr/bin/env npx tsx
/**
 * Exo Protocol - Chain Data Seeding Script
 *
 * 刷链上数据 - 生成真实的 Solscan 交易记录
 *
 * @usage
 *   npx tsx scripts/seed-chain.ts           # 执行 10 笔交易
 *   npx tsx scripts/seed-chain.ts --count 50  # 执行 50 笔交易
 */

import {
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    Transaction,
    TransactionInstruction,
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
    rpcUrl: 'https://api.devnet.solana.com',
    programId: 'CdamAXn5fCros3MktPxmbQKXtxd34XHATTLmh9jkn7DT',
    count: parseInt(process.argv.find(a => a.startsWith('--count='))?.split('=')[1] || '10'),
};

// ============================================================================
// IDL Discriminators (from anchor/target/idl/exo_core.json)
// ============================================================================

const DISCRIMINATORS = {
    register_skill: Buffer.from([166, 249, 255, 189, 192, 197, 102, 2]),
    create_agent: Buffer.from([143, 66, 198, 95, 110, 85, 83, 249]),
    create_escrow: Buffer.from([253, 215, 165, 116, 36, 108, 68, 80]),
};

// ============================================================================
// Utils
// ============================================================================

function loadKeypair(): Keypair {
    const keypairPath = path.join(os.homedir(), '.config', 'solana', 'id.json');
    if (!fs.existsSync(keypairPath)) {
        throw new Error(`Keypair not found at ${keypairPath}`);
    }
    const data = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'));
    return Keypair.fromSecretKey(Uint8Array.from(data));
}

function hashString(input: string): Uint8Array {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hash = new Uint8Array(32);

    let h1 = 5381;
    let h2 = 52711;

    for (let i = 0; i < data.length; i++) {
        h1 = (h1 * 33) ^ (data[i] ?? 0);
        h2 = (h2 * 33) ^ (data[i] ?? 0);
    }

    const view = new DataView(hash.buffer);
    view.setUint32(0, h1 >>> 0, true);
    view.setUint32(4, h2 >>> 0, true);
    view.setUint32(8, (h1 + h2) >>> 0, true);
    view.setUint32(12, (h1 ^ h2) >>> 0, true);
    for (let i = 16; i < 32; i += 4) {
        view.setUint32(i, ((h1 * (i + 1)) ^ (h2 * (i + 2))) >>> 0, true);
    }

    return hash;
}

function deriveSkillPda(authority: PublicKey, nameHash: Uint8Array, programId: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from('skill'), authority.toBuffer(), Buffer.from(nameHash)],
        programId
    );
}

function deriveAgentPda(owner: PublicKey, programId: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from('agent'), owner.toBuffer()],
        programId
    );
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// Instruction Builders
// ============================================================================

function buildRegisterSkillIx(
    authority: PublicKey,
    nameHash: Uint8Array,
    contentHash: Uint8Array,
    priceLamports: bigint,
    programId: PublicKey
): TransactionInstruction {
    const [skillPda] = deriveSkillPda(authority, nameHash, programId);

    const priceBuffer = Buffer.alloc(8);
    priceBuffer.writeBigUInt64LE(priceLamports);

    const data = Buffer.concat([
        DISCRIMINATORS.register_skill,
        Buffer.from(nameHash),
        Buffer.from(contentHash),
        priceBuffer,
    ]);

    return new TransactionInstruction({
        keys: [
            { pubkey: authority, isSigner: true, isWritable: true },
            { pubkey: skillPda, isSigner: false, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId,
        data,
    });
}

function buildCreateAgentIx(
    owner: PublicKey,
    programId: PublicKey
): TransactionInstruction {
    const [agentPda] = deriveAgentPda(owner, programId);

    return new TransactionInstruction({
        keys: [
            { pubkey: owner, isSigner: true, isWritable: true },
            { pubkey: agentPda, isSigner: false, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId,
        data: DISCRIMINATORS.create_agent,
    });
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
    console.log('\n' + '═'.repeat(60));
    console.log('  🚀 Exo Protocol - Chain Data Seeding');
    console.log('═'.repeat(60) + '\n');

    const connection = new Connection(CONFIG.rpcUrl, 'confirmed');
    const payer = loadKeypair();
    const programId = new PublicKey(CONFIG.programId);

    console.log(`  Wallet:    ${payer.publicKey.toBase58()}`);
    const balance = await connection.getBalance(payer.publicKey);
    console.log(`  Balance:   ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
    console.log(`  Program:   ${CONFIG.programId}`);
    console.log(`  Target:    ${CONFIG.count} transactions`);
    console.log('');

    if (balance < 0.5 * LAMPORTS_PER_SOL) {
        console.log('  ⚠️  Low balance! Run: solana airdrop 2 --url devnet');
        process.exit(1);
    }

    const results: { success: number; failed: number; signatures: string[] } = {
        success: 0,
        failed: 0,
        signatures: [],
    };

    // First, try to create Agent (might already exist)
    console.log('  📦 Step 1: Ensuring Agent exists...');
    try {
        const agentIx = buildCreateAgentIx(payer.publicKey, programId);
        const agentTx = new Transaction().add(agentIx);
        const agentSig = await sendAndConfirmTransaction(connection, agentTx, [payer], {
            commitment: 'confirmed',
        });
        console.log(`     ✅ Agent created: ${agentSig.slice(0, 20)}...`);
        results.signatures.push(agentSig);
        results.success++;
    } catch (err: any) {
        if (err.message?.includes('already in use')) {
            console.log('     ℹ️  Agent already exists (skipping)');
        } else {
            console.log(`     ⚠️  Agent creation failed: ${err.message?.slice(0, 50)}`);
        }
    }

    // Register multiple Skills
    console.log(`\n  📦 Step 2: Registering ${CONFIG.count} Skills...\n`);

    for (let i = 0; i < CONFIG.count; i++) {
        const skillName = `skill-${Date.now()}-${i}`;
        const nameHash = hashString(skillName);
        const contentHash = hashString(`{"name":"${skillName}","version":"1.0.0"}`);
        const price = BigInt(Math.floor(Math.random() * 100000000) + 10000000); // 0.01-0.11 SOL

        try {
            const ix = buildRegisterSkillIx(
                payer.publicKey,
                nameHash,
                contentHash,
                price,
                programId
            );

            const tx = new Transaction().add(ix);
            const signature = await sendAndConfirmTransaction(connection, tx, [payer], {
                commitment: 'confirmed',
            });

            console.log(`     [${i + 1}/${CONFIG.count}] ✅ ${signature.slice(0, 20)}...`);
            results.signatures.push(signature);
            results.success++;

            // Rate limit: wait 500ms between transactions
            if (i < CONFIG.count - 1) {
                await sleep(500);
            }
        } catch (err: any) {
            console.log(`     [${i + 1}/${CONFIG.count}] ❌ ${err.message?.slice(0, 50) || 'Unknown error'}`);
            results.failed++;
        }
    }

    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('  📊 Results Summary');
    console.log('═'.repeat(60));
    console.log(`\n  ✅ Success: ${results.success}`);
    console.log(`  ❌ Failed:  ${results.failed}`);

    if (results.signatures.length > 0) {
        console.log(`\n  🔗 Solscan Links (first 5):`);
        results.signatures.slice(0, 5).forEach((sig, i) => {
            console.log(`     ${i + 1}. https://solscan.io/tx/${sig}?cluster=devnet`);
        });
    }

    console.log('\n  🎉 Done! Check Solscan for transaction history.\n');
}

main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
