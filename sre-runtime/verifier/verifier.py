"""
Exo Protocol - Verifier Module
Implements result verification logic for the Optimistic Execution model.

Reference: docs/mvp v2.0.md §4.2.4
"""

import argparse
import asyncio
import hashlib
import json
import logging
from dataclasses import dataclass
from typing import Any, Dict, Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class VerificationResult:
    """Result of a verification operation."""
    is_valid: bool
    error: Optional[str] = None
    expected_hash: Optional[str] = None
    actual_hash: Optional[str] = None


def compute_result_hash(result: Dict[str, Any]) -> bytes:
    """
    Compute deterministic hash of a result dictionary.
    Uses sorted keys JSON serialization for consistency.
    """
    result_json = json.dumps(result, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(result_json.encode("utf-8")).digest()


def verify_result_with_mock(
    result: Dict[str, Any],
    submitted_hash: bytes,
) -> Optional[str]:
    """
    Verify a result against a submitted hash (Mock version for unit testing).
    
    Args:
        result: The result dictionary to verify
        submitted_hash: The hash that was submitted on-chain
        
    Returns:
        None if verification passes, error message string if it fails
    """
    computed_hash = compute_result_hash(result)
    
    if computed_hash != submitted_hash:
        return (
            f"Hash mismatch: expected {computed_hash.hex()}, "
            f"got {submitted_hash.hex()}"
        )
    
    return None


async def fetch_order(order_pubkey: str) -> Dict[str, Any]:
    """
    Fetch order details from chain.
    
    TODO: Implement actual chain interaction via anchorpy
    Currently returns mock data for testing.
    """
    logger.info(f"Fetching order: {order_pubkey}")
    return {
        "pubkey": order_pubkey,
        "client": "mock_client_pubkey",
        "executor": "mock_executor_pubkey",
        "skill": "mock_skill_pubkey",
        "result_hash": b"\x00" * 32,
        "status": "Committed",
    }


async def fetch_skill(skill_pubkey: str) -> Dict[str, Any]:
    """
    Fetch skill details from chain.
    
    TODO: Implement actual chain interaction via anchorpy
    """
    logger.info(f"Fetching skill: {skill_pubkey}")
    return {
        "pubkey": skill_pubkey,
        "content_hash": "mock_content_hash",
        "price_lamports": 1000000,
    }


async def fetch_skill_package(content_hash: str) -> Dict[str, Any]:
    """
    Fetch skill package from storage (Arweave/GitHub/Local).
    
    TODO: Implement actual storage retrieval
    """
    logger.info(f"Fetching skill package: {content_hash}")
    return {
        "name": "mock-skill",
        "runtime": {
            "docker_image": "exo-runtime-python-3.11",
            "entrypoint": "scripts/main.py",
            "timeout_seconds": 60,
        },
    }


async def fetch_order_input(order_pubkey: str) -> Dict[str, Any]:
    """
    Fetch original order input from chain events or storage.
    
    TODO: Implement actual input retrieval
    """
    logger.info(f"Fetching order input: {order_pubkey}")
    return {"input_data": "mock_input"}


async def execute_in_sandbox(
    skill_package: Dict[str, Any],
    input_data: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Execute skill in Docker sandbox for deterministic replay.
    
    TODO: Implement actual Docker execution
    Currently returns mock result for testing.
    """
    logger.info(f"Executing skill in sandbox: {skill_package.get('name', 'unknown')}")
    return {"result": "mock_result", "timestamp": 1234567890}


async def verify_result(order_pubkey: str) -> Optional[str]:
    """
    Verify the correctness of a submitted result.
    
    This function:
    1. Fetches the order and submitted result hash from chain
    2. Retrieves the skill package
    3. Replays the skill execution in sandbox
    4. Compares the replay result hash with submitted hash
    
    Args:
        order_pubkey: The public key of the order to verify
        
    Returns:
        None if verification passes, error message string if it fails
    """
    logger.info(f"Starting verification for order: {order_pubkey}")
    
    # 1. Fetch order and submitted hash
    order = await fetch_order(order_pubkey)
    submitted_hash = order["result_hash"]
    
    # 2. Fetch skill information
    skill = await fetch_skill(order["skill"])
    skill_package = await fetch_skill_package(skill["content_hash"])
    
    # 3. Fetch original input
    original_input = await fetch_order_input(order_pubkey)
    
    # 4. Replay execution in sandbox (deterministic)
    replay_result = await execute_in_sandbox(skill_package, original_input)
    
    # 5. Compute replay result hash
    replay_hash = compute_result_hash(replay_result)
    
    # 6. Compare hashes
    if replay_hash != submitted_hash:
        error_msg = (
            f"Hash mismatch: expected {replay_hash.hex()}, "
            f"got {submitted_hash.hex() if isinstance(submitted_hash, bytes) else submitted_hash}"
        )
        logger.warning(f"Verification failed: {error_msg}")
        return error_msg
    
    logger.info(f"Verification passed for order: {order_pubkey}")
    return None


def main():
    """CLI entry point for the verifier module."""
    parser = argparse.ArgumentParser(
        description="Exo Protocol Verifier - Verify executor-submitted results"
    )
    parser.add_argument(
        "--order",
        type=str,
        help="Order public key to verify",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Enable verbose logging",
    )
    parser.add_argument(
        "--version",
        action="version",
        version="%(prog)s 0.1.0",
    )
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    if args.order:
        result = asyncio.run(verify_result(args.order))
        if result:
            print(f"❌ Verification failed: {result}")
            exit(1)
        else:
            print("✅ Verification passed")
            exit(0)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
