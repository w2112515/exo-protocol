# Exo Protocol - Data Availability Module
# Implements result storage and retrieval for the Optimistic Execution model

__version__ = "0.1.0"

from .storage import (
    StorageProvider,
    store_result,
    fetch_result,
    get_provider,
)

__all__ = [
    "StorageProvider",
    "store_result",
    "fetch_result",
    "get_provider",
]
