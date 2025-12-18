# Exo Protocol - Verifier Module
# Implements result verification and challenge logic for the Optimistic Execution model

__version__ = "0.1.0"

from .verifier import verify_result, verify_result_with_mock
from .challenger import challenge_if_invalid, ChallengeResult

__all__ = [
    "verify_result",
    "verify_result_with_mock",
    "challenge_if_invalid",
    "ChallengeResult",
]
