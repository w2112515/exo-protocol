import { NextRequest, NextResponse } from 'next/server';
import { ACTIONS_CORS_HEADERS } from '@/lib/api-utils';
import { Skill } from '@/lib/mock-data';
import {
    Connection,
    PublicKey,
    SystemProgram,
    Transaction,
    LAMPORTS_PER_SOL,
} from '@solana/web3.js';

export const runtime = 'edge';

// Protocol Escrow address for skill payments
const PROTOCOL_ESCROW = new PublicKey('Gav2g7qmk5FyUntJHzDBnb8FGRcuvZUbF1EiLPzcMFjB');
const DEVNET_RPC = 'https://api.devnet.solana.com';
const DEFAULT_PRICE_LAMPORTS = 0.1 * LAMPORTS_PER_SOL; // 0.1 SOL default

// Inline mock skills data (Edge Runtime compatible - no fetch self-loop)
const MOCK_SKILLS: Skill[] = [
    {
        skill_id: 'skill-code-reviewer-v1',
        name: 'code-reviewer',
        version: '3.1.17',
        category: 'dev-tools',
        price_lamports: 100000000, // 0.1 SOL
        execution_count: 9684,
        success_rate: 0.9992,
        description: 'AI-powered code review that analyzes code quality, security vulnerabilities, and suggests improvements.',
        input_schema: '{ code: string, language: string }',
        output_format: '{ issues: Issue[], suggestions: string[], score: number }',
        avg_latency_ms: 1250,
        creator_address: 'Gav2g7qmk5FyUntJHzDBnb8FGRcuvZUbF1EiLPzcMFjB',
        royalty_rate: 0.1,
        total_royalties_earned: 2797707,
        on_chain_verified: true,
        tags: ['code-quality', 'security', 'gpt-4'],
        last_updated: '2025-12-18T10:30:00Z',
    },
    {
        skill_id: 'skill-translation-engine-v1',
        name: 'translation-engine',
        version: '1.1.6',
        category: 'nlp',
        price_lamports: 50000000, // 0.05 SOL
        execution_count: 8289,
        success_rate: 0.9987,
        description: 'High-accuracy neural machine translation supporting 50+ languages.',
        input_schema: '{ text: string, target_lang: string }',
        output_format: '{ translated_text: string, confidence: number }',
        avg_latency_ms: 450,
        creator_address: '8Fw7g3kL9',
        royalty_rate: 0.1,
        total_royalties_earned: 1274848,
        on_chain_verified: true,
        tags: ['translation', 'multilingual'],
        last_updated: '2025-12-17T14:20:00Z',
    },
];

export async function OPTIONS(request: NextRequest) {
    return new NextResponse(null, {
        status: 200,
        headers: ACTIONS_CORS_HEADERS,
    });
}

// Helper to find skill from inline mock data
function findSkill(skillId: string): Skill | undefined {
    return MOCK_SKILLS.find(s => s.skill_id === skillId);
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ skillId: string }> }
) {
    const { skillId } = await params;
    const requestUrl = new URL(request.url);
    const baseHref = new URL(
        `/api/actions/skill/${skillId}`,
        requestUrl.origin
    ).toString();

    // Find skill from inline mock data (CR02: no fetch self-loop)
    const skill = findSkill(skillId);

    const title = skill ? skill.name : `Skill: ${skillId}`;
    const description = skill
        ? `${skill.description} | Success: ${(skill.success_rate * 100).toFixed(0)}% | Price: ${(skill.price_lamports / 1_000_000_000).toFixed(4)} SOL`
        : "Execute this skill directly from a Blink. Price: 0.1 SOL";

    const payload = {
        icon: new URL("/favicon.ico", requestUrl.origin).toString(),
        title,
        description,
        label: "Purchase Skill",
        // Solana Actions spec: specify blockchain for dial.to compatibility
        blockchain: "solana" as const,
        links: {
            actions: [
                {
                    label: "Purchase Skill",
                    href: `${baseHref}?pr={pr}`,
                    parameters: [
                        {
                            name: "pr",
                            label: "GitHub PR URL (for Code Review)",
                            required: false,
                        },
                    ],
                },
            ],
        },
    };

    return NextResponse.json(payload, {
        headers: ACTIONS_CORS_HEADERS,
    });
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ skillId: string }> }
) {
    try {
        const { skillId } = await params;
        const body = await request.json();
        const account = body.account;

        if (!account) {
            return new NextResponse('Missing "account" in request body', {
                status: 400,
                headers: ACTIONS_CORS_HEADERS,
            });
        }

        // Validate account is a valid Solana public key
        let userPubkey: PublicKey;
        try {
            userPubkey = new PublicKey(account);
        } catch {
            return new NextResponse('Invalid Solana account address', {
                status: 400,
                headers: ACTIONS_CORS_HEADERS,
            });
        }

        // CR01: Build real Solana transfer transaction
        const skill = findSkill(skillId);
        const priceLamports = skill?.price_lamports ?? DEFAULT_PRICE_LAMPORTS;

        // Connect to devnet to get recent blockhash
        const connection = new Connection(DEVNET_RPC, 'confirmed');
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

        // Create transfer instruction: User -> Protocol Escrow
        const transferInstruction = SystemProgram.transfer({
            fromPubkey: userPubkey,
            toPubkey: PROTOCOL_ESCROW,
            lamports: priceLamports,
        });

        // Build transaction
        const transaction = new Transaction({
            blockhash,
            lastValidBlockHeight,
            feePayer: userPubkey,
        }).add(transferInstruction);

        // Serialize and encode to base64
        const serializedTx = transaction.serialize({
            requireAllSignatures: false,
            verifySignatures: false,
        });
        const base64Tx = Buffer.from(serializedTx).toString('base64');

        const priceSOL = (priceLamports / LAMPORTS_PER_SOL).toFixed(4);
        const payload = {
            transaction: base64Tx,
            message: `Purchase skill "${skill?.name ?? skillId}" for ${priceSOL} SOL`,
        };

        return NextResponse.json(payload, {
            headers: ACTIONS_CORS_HEADERS,
        });
    } catch (err) {
        return new NextResponse('Invalid request body', {
            status: 400,
            headers: ACTIONS_CORS_HEADERS,
        });
    }
}
