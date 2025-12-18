import { NextRequest, NextResponse } from 'next/server';
import { ACTIONS_CORS_HEADERS } from '@/lib/api-utils';

export const runtime = 'edge';

interface MockSkill {
    skill_id: string;
    name: string;
    version: string;
    category: string;
    price_lamports: number;
    execution_count: number;
    success_rate: number;
}

export async function OPTIONS(request: NextRequest) {
    return new NextResponse(null, {
        status: 200,
        headers: ACTIONS_CORS_HEADERS,
    });
}

// Helper to load mock skills via HTTP (works in Edge/Serverless)
async function loadMockSkills(origin: string): Promise<MockSkill[]> {
    try {
        const response = await fetch(`${origin}/mock/mock_skills.json`);
        if (!response.ok) return [];
        return response.json();
    } catch {
        return [];
    }
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

    // Load mock data and find skill
    const skills = await loadMockSkills(requestUrl.origin);
    const skill = skills.find(s => s.skill_id === skillId);

    const title = skill ? skill.name : `Skill: ${skillId}`;
    const description = skill
        ? `${skill.category} skill (v${skill.version}) | Success Rate: ${(skill.success_rate * 100).toFixed(1)}% | Price: ${skill.price_lamports / 1_000_000_000} SOL`
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
                    href: `${baseHref}`,
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

        // Mock Transaction (Base64 of a dummy transaction)
        // This is a placeholder needed for the response structure. 
        // In a real scenario, we would build a real transaction here.
        const mockTransaction = "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";

        const payload = {
            transaction: mockTransaction,
            message: `Successfully purchased skill: ${skillId}`,
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
