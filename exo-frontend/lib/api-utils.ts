// Shared API utilities for Solana Actions/Blinks
// Reference: https://github.com/solana-developers/solana-actions

// Solana Devnet Chain ID (CAIP-2 format)
// Mainnet: solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp
// Devnet:  solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1
const SOLANA_DEVNET_CHAIN = 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1';

export const ACTIONS_CORS_HEADERS: HeadersInit = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers':
        'Content-Type, Authorization, Content-Encoding, Accept-Encoding, X-Action-Version, X-Blockchain-Ids',
    'Access-Control-Expose-Headers': 'X-Action-Version, X-Blockchain-Ids',
    'Content-Type': 'application/json',
    // Solana Actions spec headers
    'X-Action-Version': '2.4',
    'X-Blockchain-Ids': SOLANA_DEVNET_CHAIN,
};
