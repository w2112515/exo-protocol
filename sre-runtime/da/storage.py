# Exo Protocol - Storage Abstraction Layer
# Provides unified interface for result data availability

import json
import os
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any, Dict, Optional, Protocol, runtime_checkable


@runtime_checkable
class StorageProvider(Protocol):
    """
    Storage Provider Interface for Data Availability.
    Implements Protocol for structural subtyping (duck typing).
    """

    async def upload(self, data: bytes, metadata: Dict[str, Any]) -> str:
        """
        Upload data to storage.
        
        Args:
            data: Raw bytes to store
            metadata: Additional metadata (order_id, timestamp, etc.)
            
        Returns:
            URI string (file:// or gist://)
        """
        ...

    async def download(self, uri: str) -> bytes:
        """
        Download data from storage.
        
        Args:
            uri: Storage URI returned from upload
            
        Returns:
            Raw bytes of stored data
        """
        ...

    async def exists(self, uri: str) -> bool:
        """
        Check if data exists at URI.
        
        Args:
            uri: Storage URI to check
            
        Returns:
            True if data exists, False otherwise
        """
        ...


class StorageError(Exception):
    """Base exception for storage operations."""
    pass


class UploadError(StorageError):
    """Raised when upload fails."""
    pass


class DownloadError(StorageError):
    """Raised when download fails."""
    pass


class NotFoundError(StorageError):
    """Raised when requested data is not found."""
    pass


# Global provider instance (lazy initialized)
_provider: Optional[StorageProvider] = None


def get_provider() -> StorageProvider:
    """
    Get the current storage provider.
    Implements fallback chain: GitHub Gist → Local File (ADR-003)
    
    Returns:
        Active StorageProvider instance
    """
    global _provider
    
    if _provider is not None:
        return _provider
    
    # Check for GitHub token (Gist provider)
    github_token = os.environ.get("GITHUB_TOKEN")
    
    if github_token:
        try:
            from .providers.github_gist import GitHubGistProvider
            _provider = GitHubGistProvider(github_token)
            return _provider
        except ImportError:
            pass  # Fall through to local provider
    
    # Default: Local file storage
    from .providers.local import LocalStorageProvider
    _provider = LocalStorageProvider()
    return _provider


def set_provider(provider: StorageProvider) -> None:
    """
    Set a custom storage provider (for testing).
    
    Args:
        provider: StorageProvider instance to use
    """
    global _provider
    _provider = provider


def reset_provider() -> None:
    """Reset provider to trigger re-initialization."""
    global _provider
    _provider = None


async def store_result(result: Dict[str, Any], order_id: str) -> str:
    """
    Store execution result and return accessible URI.
    Supports fallback chain: GitHub Gist → Local File (ADR-003)
    
    Args:
        result: Execution result dictionary
        order_id: Unique order identifier
        
    Returns:
        URI string for accessing the stored result
        
    Raises:
        UploadError: If storage fails
    """
    provider = get_provider()
    
    # Serialize result to JSON bytes
    result_with_meta = {
        "order_id": order_id,
        "stored_at": datetime.utcnow().isoformat() + "Z",
        "result": result,
    }
    
    data = json.dumps(result_with_meta, indent=2, ensure_ascii=False).encode("utf-8")
    
    metadata = {
        "order_id": order_id,
        "content_type": "application/json",
        "timestamp": datetime.utcnow().isoformat(),
    }
    
    try:
        uri = await provider.upload(data, metadata)
        return uri
    except Exception as e:
        raise UploadError(f"Failed to store result for order {order_id}: {e}") from e


async def fetch_result(uri: str) -> Dict[str, Any]:
    """
    Fetch execution result by URI.
    
    Args:
        uri: Storage URI returned from store_result
        
    Returns:
        Stored result dictionary
        
    Raises:
        NotFoundError: If URI does not exist
        DownloadError: If download fails
    """
    provider = get_provider()
    
    try:
        if not await provider.exists(uri):
            raise NotFoundError(f"Result not found at URI: {uri}")
        
        data = await provider.download(uri)
        result_with_meta = json.loads(data.decode("utf-8"))
        
        # Return the inner result for convenience
        return result_with_meta.get("result", result_with_meta)
    except NotFoundError:
        raise
    except json.JSONDecodeError as e:
        raise DownloadError(f"Invalid JSON at URI {uri}: {e}") from e
    except Exception as e:
        raise DownloadError(f"Failed to fetch result from {uri}: {e}") from e
