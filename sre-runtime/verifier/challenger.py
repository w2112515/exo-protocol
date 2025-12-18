"""
Exo Protocol - Challenger Module
Implements challenge logic for invalid result submissions.

Reference: docs/mvp v2.0.md §4.2.4
"""

import asyncio
import logging
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from .verifier import verify_result

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ChallengeStatus(Enum):
    """Status of a challenge operation."""
    PENDING = "pending"
    SUBMITTED = "submitted"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    FAILED = "failed"


@dataclass
class ChallengeResult:
    """Result of a challenge operation."""
    order_pubkey: str
    status: ChallengeStatus
    error_reason: Optional[str] = None
    tx_signature: Optional[str] = None
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "order_pubkey": self.order_pubkey,
            "status": self.status.value,
            "error_reason": self.error_reason,
            "tx_signature": self.tx_signature,
            "timestamp": self.timestamp,
        }


class ChallengeLog:
    """Maintains a log of all challenge operations."""
    
    def __init__(self):
        self._log: List[ChallengeResult] = []
    
    def add(self, result: ChallengeResult):
        """Add a challenge result to the log."""
        self._log.append(result)
        logger.info(f"Challenge logged: {result.order_pubkey} -> {result.status.value}")
    
    def get_all(self) -> List[ChallengeResult]:
        """Get all challenge results."""
        return self._log.copy()
    
    def get_by_status(self, status: ChallengeStatus) -> List[ChallengeResult]:
        """Get challenge results filtered by status."""
        return [r for r in self._log if r.status == status]


challenge_log = ChallengeLog()


async def build_challenge_instruction(
    order_pubkey: str,
    proof: bytes,
) -> Dict[str, Any]:
    """
    Build a challenge instruction for the on-chain program.
    
    TODO: Implement actual instruction building via anchorpy
    Currently returns mock instruction data.
    
    Args:
        order_pubkey: The order to challenge
        proof: Proof of invalid result (truncated to 64 bytes)
        
    Returns:
        Instruction data dictionary
    """
    logger.info(f"Building challenge instruction for order: {order_pubkey}")
    
    return {
        "program_id": "ExoEscrowProgramId",
        "instruction": "challenge",
        "accounts": {
            "order": order_pubkey,
            "challenger": "challenger_pubkey",
            "system_program": "11111111111111111111111111111111",
        },
        "data": {
            "proof": proof[:64].hex(),
        },
    }


async def submit_challenge_transaction(
    instruction: Dict[str, Any],
) -> Optional[str]:
    """
    Submit challenge transaction to the blockchain.
    
    TODO: Implement actual transaction submission via solana-py
    Currently returns mock transaction signature.
    
    Args:
        instruction: The challenge instruction to submit
        
    Returns:
        Transaction signature if successful, None if failed
    """
    logger.info("Submitting challenge transaction...")
    
    # Mock transaction submission
    # In production, this would:
    # 1. Build transaction with instruction
    # 2. Sign with challenger keypair
    # 3. Send to RPC
    # 4. Wait for confirmation
    
    await asyncio.sleep(0.1)  # Simulate network delay
    
    return "mock_tx_signature_" + instruction["accounts"]["order"][:8]


async def challenge_if_invalid(order_pubkey: str) -> ChallengeResult:
    """
    Verify a submitted result and challenge if invalid.
    
    This function:
    1. Verifies the result using deterministic replay
    2. If invalid, builds and submits a challenge transaction
    3. Logs the challenge operation
    
    Args:
        order_pubkey: The public key of the order to verify and potentially challenge
        
    Returns:
        ChallengeResult containing the operation status and details
    """
    logger.info(f"Starting challenge check for order: {order_pubkey}")
    
    # Step 1: Verify the result
    error = await verify_result(order_pubkey)
    
    if error is None:
        # Result is valid, no challenge needed
        result = ChallengeResult(
            order_pubkey=order_pubkey,
            status=ChallengeStatus.REJECTED,
            error_reason="Result is valid, no challenge needed",
        )
        challenge_log.add(result)
        logger.info(f"✅ Result valid for order {order_pubkey}, no challenge submitted")
        return result
    
    # Step 2: Result is invalid, prepare challenge
    logger.warning(f"🚨 Invalid result detected for order {order_pubkey}: {error}")
    
    try:
        # Step 3: Build challenge instruction
        proof = error.encode("utf-8")[:64]
        instruction = await build_challenge_instruction(order_pubkey, proof)
        
        # Step 4: Submit challenge transaction
        tx_signature = await submit_challenge_transaction(instruction)
        
        if tx_signature:
            result = ChallengeResult(
                order_pubkey=order_pubkey,
                status=ChallengeStatus.SUBMITTED,
                error_reason=error,
                tx_signature=tx_signature,
            )
            logger.info(f"✅ Challenge submitted for order {order_pubkey}: {tx_signature}")
        else:
            result = ChallengeResult(
                order_pubkey=order_pubkey,
                status=ChallengeStatus.FAILED,
                error_reason=f"Transaction submission failed: {error}",
            )
            logger.error(f"❌ Challenge submission failed for order {order_pubkey}")
        
    except Exception as e:
        result = ChallengeResult(
            order_pubkey=order_pubkey,
            status=ChallengeStatus.FAILED,
            error_reason=f"Challenge failed: {str(e)}",
        )
        logger.exception(f"❌ Challenge failed for order {order_pubkey}: {e}")
    
    challenge_log.add(result)
    return result


async def watch_and_challenge(order_pubkeys: List[str]) -> List[ChallengeResult]:
    """
    Watch multiple orders and challenge any invalid results.
    
    Args:
        order_pubkeys: List of order public keys to verify
        
    Returns:
        List of ChallengeResult for each order
    """
    results = []
    for order_pubkey in order_pubkeys:
        result = await challenge_if_invalid(order_pubkey)
        results.append(result)
    return results


def get_challenge_stats() -> Dict[str, int]:
    """Get statistics about challenge operations."""
    all_challenges = challenge_log.get_all()
    return {
        "total": len(all_challenges),
        "submitted": len(challenge_log.get_by_status(ChallengeStatus.SUBMITTED)),
        "rejected": len(challenge_log.get_by_status(ChallengeStatus.REJECTED)),
        "failed": len(challenge_log.get_by_status(ChallengeStatus.FAILED)),
    }
