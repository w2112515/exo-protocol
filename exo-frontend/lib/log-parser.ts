
import { PublicKey } from '@solana/web3.js';

// Program IDs
export const EXO_CORE_PROGRAM_ID = "CdamAXn5fCros3MktPxmbQKXtxd34XHATTLmh9jkn7DT";
export const EXO_HOOKS_PROGRAM_ID = "C1iSwHyPWRR48pxbiztvQ6wt92mB7WfebgpEBdTv78kw";

// Event Types
export enum EventType {
    // Skill Events
    SKILL_REGISTERED = "skill_registered",
    SKILL_UPDATED = "skill_updated",
    SKILL_DEPRECATED = "skill_deprecated",

    // Agent Events
    AGENT_CREATED = "agent_created",
    AGENT_UPDATED = "agent_updated",
    AGENT_CLOSED = "agent_closed",

    // Escrow Events
    ESCROW_CREATED = "escrow_created",
    ESCROW_FUNDED = "escrow_funded",
    ESCROW_RELEASED = "escrow_released",
    ESCROW_CANCELLED = "escrow_cancelled",
    ESCROW_DISPUTED = "escrow_disputed",

    // Transfer Hook Events
    HOOK_INITIALIZED = "hook_initialized",
    HOOK_CONFIG_UPDATED = "hook_config_updated",
    TRANSFER_HOOKED = "transfer_hooked",

    // Unknown
    UNKNOWN = "unknown"
}

// Chain Event Interface
export interface ChainEvent {
    eventType: EventType;
    signature: string;
    slot: number;
    timestamp: Date;
    programId: string;
    data: Record<string, any>;
    rawLogs: string[];
}

export class LogParser {
    // Event keywords mapping
    private static EVENT_KEYWORDS: Record<string, EventType> = {
        // Skill
        "Skill registered": EventType.SKILL_REGISTERED,
        "skill registered": EventType.SKILL_REGISTERED,
        "RegisterSkill": EventType.SKILL_REGISTERED,
        "Skill updated": EventType.SKILL_UPDATED,
        "UpdateSkill": EventType.SKILL_UPDATED,
        "Skill deprecated": EventType.SKILL_DEPRECATED,
        "DeprecateSkill": EventType.SKILL_DEPRECATED,

        // Agent
        "Agent created": EventType.AGENT_CREATED,
        "CreateIdentity": EventType.AGENT_CREATED,
        "Agent updated": EventType.AGENT_UPDATED,
        "UpdateProfile": EventType.AGENT_UPDATED,
        "Agent closed": EventType.AGENT_CLOSED,
        "CloseIdentity": EventType.AGENT_CLOSED,

        // Escrow
        "Escrow created": EventType.ESCROW_CREATED,
        "CreateEscrow": EventType.ESCROW_CREATED,
        "Escrow funded": EventType.ESCROW_FUNDED,
        "FundEscrow": EventType.ESCROW_FUNDED,
        "Escrow released": EventType.ESCROW_RELEASED,
        "ReleaseEscrow": EventType.ESCROW_RELEASED,
        "Escrow cancelled": EventType.ESCROW_CANCELLED,
        "CancelEscrow": EventType.ESCROW_CANCELLED,
        "Escrow disputed": EventType.ESCROW_DISPUTED,

        // Transfer Hook
        "Hook initialized": EventType.HOOK_INITIALIZED,
        "Hook config updated": EventType.HOOK_CONFIG_UPDATED,
        "Transfer hooked": EventType.TRANSFER_HOOKED,
        "fee_bps": EventType.TRANSFER_HOOKED,  // Hook logs contain fee_bps
    };

    /**
     * Parse Solana transaction logs to extract Exo Protocol events
     * @param signature Transaction signature
     * @param logs List of log strings
     * @param slot Block slot number
     * @param timestamp Event timestamp
     * @returns Parsed ChainEvent or null if no relevant event found
     */
    public static parse(
        signature: string,
        logs: string[],
        slot: number = 0,
        timestamp: Date = new Date()
    ): ChainEvent | null {
        let eventType = EventType.UNKNOWN;
        let programId = "";
        const data: Record<string, any> = {};

        for (const log of logs) {
            // Extract Program ID
            // Format: "Program <ID> invoke [<depth>]"
            if (log.includes("Program ") && log.includes(" invoke")) {
                const parts = log.split(" ");
                // parts[0] = "Program", parts[1] = ID, parts[2] = "invoke", ...
                if (parts.length >= 2) {
                    programId = parts[1];
                }
            }

            // Detect Event Type
            for (const [keyword, type] of Object.entries(this.EVENT_KEYWORDS)) {
                if (log.includes(keyword)) {
                    eventType = type;
                    break;
                }
            }

            // Extract Data (Simplified)
            if (log.includes("Program data:")) {
                try {
                    const b64Data = log.split("Program data:")[1].trim();
                    // In a browser environment, Buffer might not be available directly without polyfills.
                    // However, for this project (Next.js/Node), Buffer is likely available or polyfilled.
                    // If running in a strict browser env without Buffer, we'd use atob.
                    // Assuming Buffer is available (Next.js server/client usually handles this, or utilize a utility).
                    const buffer = Buffer.from(b64Data, 'base64');
                    data["raw_data"] = buffer.toString('hex');
                } catch (e) {
                    console.warn('[LogParser] Failed to decode Program data:', e);
                }
            }

            // Extract fee_bps (Transfer Hook)
            if (log.includes("fee_bps")) {
                try {
                    // Log format: "fee_bps: 500"
                    const parts = log.split(":");
                    if (parts.length >= 2) {
                        const val = parseInt(parts[parts.length - 1].trim(), 10);
                        if (!isNaN(val)) {
                            data["fee_bps"] = val;
                        }
                    }
                } catch (e) {
                    console.warn('[LogParser] Failed to parse fee_bps:', e);
                }
            }

            // Extract amount
            // Python: if "amount" in log.lower():
            if (log.toLowerCase().includes("amount")) {
                try {
                    // Log format: "Amount: 1000000" or similar
                    const parts = log.split(":");
                    if (parts.length >= 2) {
                        const val = parseInt(parts[parts.length - 1].trim(), 10);
                        if (!isNaN(val)) {
                            data["amount"] = val;
                        }
                    }
                } catch (e) {
                    console.warn('[LogParser] Failed to parse amount:', e);
                }
            }
        }

        // Return only valid events or unknown events from our programs
        if (eventType === EventType.UNKNOWN &&
            programId !== EXO_CORE_PROGRAM_ID &&
            programId !== EXO_HOOKS_PROGRAM_ID) {
            return null;
        }

        return {
            eventType,
            signature,
            slot,
            timestamp,
            programId,
            data,
            rawLogs: logs
        };
    }
}
