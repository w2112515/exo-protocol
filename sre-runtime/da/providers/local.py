# Exo Protocol - Local File Storage Provider
# Fallback storage implementation using local filesystem

import hashlib
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict


class LocalStorageProvider:
    """
    Local filesystem storage provider.
    Stores results as JSON files in the data/results/ directory.
    
    URI Format: file://{absolute_path}
    """
    
    # Default storage directory relative to sre-runtime
    DEFAULT_STORAGE_DIR = "data/results"
    
    def __init__(self, storage_dir: str = None):
        """
        Initialize local storage provider.
        
        Args:
            storage_dir: Custom storage directory path (absolute or relative to cwd)
        """
        if storage_dir:
            self._storage_dir = Path(storage_dir)
        else:
            # Default: sre-runtime/data/results/
            base_dir = Path(__file__).parent.parent.parent
            self._storage_dir = base_dir / self.DEFAULT_STORAGE_DIR
        
        # Ensure directory exists
        self._storage_dir.mkdir(parents=True, exist_ok=True)
    
    @property
    def storage_dir(self) -> Path:
        """Get the storage directory path."""
        return self._storage_dir
    
    def _generate_filename(self, order_id: str, metadata: Dict[str, Any]) -> str:
        """
        Generate a unique filename for the stored data.
        
        Args:
            order_id: Order identifier
            metadata: Additional metadata
            
        Returns:
            Filename string
        """
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        # Create a short hash for uniqueness
        hash_input = f"{order_id}:{timestamp}".encode()
        short_hash = hashlib.sha256(hash_input).hexdigest()[:8]
        return f"{order_id}_{timestamp}_{short_hash}.json"
    
    def _uri_to_path(self, uri: str) -> Path:
        """
        Convert file:// URI to local path.
        
        Args:
            uri: file:// URI
            
        Returns:
            Path object
            
        Raises:
            ValueError: If URI scheme is not file://
        """
        if not uri.startswith("file://"):
            raise ValueError(f"Invalid URI scheme, expected file://: {uri}")
        
        # Handle Windows paths (file:///C:/... or file://C:/...)
        path_str = uri[7:]  # Remove "file://"
        if path_str.startswith("/") and len(path_str) > 2 and path_str[2] == ":":
            # Unix-style Windows path: /C:/path -> C:/path
            path_str = path_str[1:]
        
        return Path(path_str)
    
    def _path_to_uri(self, path: Path) -> str:
        """
        Convert local path to file:// URI.
        
        Args:
            path: Local filesystem path
            
        Returns:
            file:// URI string
        """
        abs_path = path.resolve()
        # Use forward slashes for URI
        path_str = str(abs_path).replace("\\", "/")
        return f"file://{path_str}"
    
    async def upload(self, data: bytes, metadata: Dict[str, Any]) -> str:
        """
        Store data to local filesystem.
        
        Args:
            data: Raw bytes to store
            metadata: Must contain 'order_id' key
            
        Returns:
            file:// URI pointing to stored file
            
        Raises:
            ValueError: If order_id not in metadata
            IOError: If file write fails
        """
        order_id = metadata.get("order_id")
        if not order_id:
            raise ValueError("metadata must contain 'order_id'")
        
        filename = self._generate_filename(order_id, metadata)
        file_path = self._storage_dir / filename
        
        try:
            file_path.write_bytes(data)
            return self._path_to_uri(file_path)
        except Exception as e:
            raise IOError(f"Failed to write to {file_path}: {e}") from e
    
    async def download(self, uri: str) -> bytes:
        """
        Read data from local filesystem.
        
        Args:
            uri: file:// URI
            
        Returns:
            Raw bytes of file content
            
        Raises:
            FileNotFoundError: If file does not exist
            IOError: If file read fails
        """
        file_path = self._uri_to_path(uri)
        
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        try:
            return file_path.read_bytes()
        except Exception as e:
            raise IOError(f"Failed to read from {file_path}: {e}") from e
    
    async def exists(self, uri: str) -> bool:
        """
        Check if file exists at URI.
        
        Args:
            uri: file:// URI
            
        Returns:
            True if file exists, False otherwise
        """
        try:
            file_path = self._uri_to_path(uri)
            return file_path.exists()
        except ValueError:
            return False
