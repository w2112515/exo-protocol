import { NextRequest, NextResponse } from 'next/server';
import { ACTIONS_CORS_HEADERS } from '@/lib/api-utils';

export const runtime = 'edge';

export async function OPTIONS(request: NextRequest) {
    return new NextResponse(null, {
        status: 200,
        headers: ACTIONS_CORS_HEADERS,
    });
}

export async function GET(request: NextRequest) {
    const payload = {
        rules: [
            {
                pathPattern: '/*',
                apiPath: '/api/actions/*',
            },
            {
                pathPattern: '/api/actions/**',
                apiPath: '/api/actions/**',
            },
        ],
    };

    return NextResponse.json(payload, {
        headers: ACTIONS_CORS_HEADERS,
    });
}
