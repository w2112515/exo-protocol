/**
 * CLI 配置工具
 */

import { Connection } from '@solana/web3.js';
import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import dotenv from 'dotenv';

// Load .env file
dotenv.config();

/**
 * CLI 配置接口
 */
export interface CliConfig {
    network: 'devnet' | 'mainnet-beta' | 'localnet';
    rpcUrl: string;
    programId: string;
    keypairPath?: string;
}

/**
 * 网络 RPC 端点映射
 */
const NETWORK_ENDPOINTS: Record<string, string> = {
    'devnet': process.env.HELIUS_RPC_URL || 'https://api.devnet.solana.com',
    'mainnet-beta': 'https://api.mainnet-beta.solana.com',
    'localnet': 'http://localhost:8899',
};

/**
 * Exo Core Program ID (Devnet)
 */
const EXO_CORE_PROGRAM_ID = 'exoCr9pyNBDwwFMCHVzNGxyFRqcMqPH7KtRKxz7bLZU';

/**
 * 默认 keypair 路径
 */
function getDefaultKeypairPath(): string {
    return join(homedir(), '.config', 'solana', 'id.json');
}

/**
 * 加载 CLI 配置
 */
export function loadConfig(opts: {
    network?: string;
    keypair?: string;
    rpc?: string;
}): CliConfig {
    const network = (opts.network || 'devnet') as CliConfig['network'];

    return {
        network,
        rpcUrl: opts.rpc || NETWORK_ENDPOINTS[network] || NETWORK_ENDPOINTS.devnet,
        programId: EXO_CORE_PROGRAM_ID,
        keypairPath: opts.keypair,
    };
}

/**
 * 获取 Solana 连接
 */
export function getConnection(config: CliConfig): Connection {
    return new Connection(config.rpcUrl, 'confirmed');
}

/**
 * 加载 keypair
 */
export function loadKeypair(config: CliConfig): Uint8Array | null {
    const keypairPath = config.keypairPath || getDefaultKeypairPath();

    if (!existsSync(keypairPath)) {
        return null;
    }

    try {
        const keypairData = JSON.parse(readFileSync(keypairPath, 'utf-8'));
        return new Uint8Array(keypairData);
    } catch {
        return null;
    }
}
