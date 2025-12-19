/**
 * @exo/sdk - TypeScript SDK for Exo Protocol
 *
 * Skill-Native PayFi for Agent Economy on Solana
 *
 * @packageDocumentation
 */

// ============================================================================
// Types
// ============================================================================
export * from './types';
export * from './types/compressed';

// ============================================================================
// Constants
// ============================================================================
export * from './constants';

// ============================================================================
// PDA Utilities
// ============================================================================
export * from './pda';

// ============================================================================
// Instructions
// ============================================================================
export * from './instructions/skill';
export * from './instructions/agent';
export * from './instructions/escrow';
export { ZKAgentHistory } from './instructions/zk';

// ============================================================================
// Client
// ============================================================================
export {
    ExoClient,
    createExoClient,
    SkillNamespace,
    AgentNamespace,
    EscrowNamespace,
    PdaNamespace,
    type ExoClientOptions,
    type WalletAdapter,
    type TransactionResult,
} from './client';

// ============================================================================
// SDK Version
// ============================================================================
export const SDK_VERSION = '0.1.0';
