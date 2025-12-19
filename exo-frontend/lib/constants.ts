// RF01: Centralized configuration constants
// All hardcoded values should be imported from here

// ============================================================================
// Program IDs (Solana Devnet)
// ============================================================================

/** Exo Core Program ID - Main protocol logic */
export const EXO_CORE_PROGRAM_ID = "CdamAXn5fCros3MktPxmbQKXtxd34XHATTLmh9jkn7DT";

/** Exo Hooks Program ID - Transfer Hook implementation */
export const EXO_HOOKS_PROGRAM_ID = "C1iSwHyPWRR48pxbiztvQ6wt92mB7WfebgpEBdTv78kw";

/** Protocol Escrow Address - Receives skill payments */
export const PROTOCOL_ESCROW_ADDRESS = "Gav2g7qmk5FyUntJHzDBnb8FGRcuvZUbF1EiLPzcMFjB";

// ============================================================================
// Network Configuration
// ============================================================================

/** Current Solana network */
export const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';

/** Solana RPC URLs */
export const SOLANA_RPC_URL = SOLANA_NETWORK === 'mainnet-beta' 
    ? 'https://api.mainnet-beta.solana.com'
    : 'https://api.devnet.solana.com';

/** Helius WebSocket URLs */
export const HELIUS_WS_URL = (SOLANA_NETWORK === 'mainnet-beta' || SOLANA_NETWORK === 'mainnet')
    ? 'wss://atlas-mainnet.helius-rpc.com'
    : 'wss://atlas-devnet.helius-rpc.com';

/** Solana Devnet Chain ID (CAIP-2 format) */
export const SOLANA_DEVNET_CHAIN = 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1';

/** Solana Mainnet Chain ID (CAIP-2 format) */
export const SOLANA_MAINNET_CHAIN = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';

// ============================================================================
// Application Constants
// ============================================================================

/** Default skill price in lamports (0.1 SOL) */
export const DEFAULT_SKILL_PRICE_LAMPORTS = 100_000_000;

/** Lamports per SOL */
export const LAMPORTS_PER_SOL = 1_000_000_000;

/** WebSocket reconnect delay in ms */
export const WS_RECONNECT_DELAY = 3000;

/** Max WebSocket reconnection attempts */
export const WS_MAX_RECONNECT_ATTEMPTS = 5;
