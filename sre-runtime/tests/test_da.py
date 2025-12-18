# Exo Protocol - Data Availability Module Tests
# Tests for storage abstraction and local provider

import json
import os
import tempfile
import pytest
from pathlib import Path

# Test imports - AC-01 验证
from da import StorageProvider, store_result, fetch_result, get_provider
from da.storage import (
    set_provider,
    reset_provider,
    StorageError,
    UploadError,
    DownloadError,
    NotFoundError,
)
from da.providers.local import LocalStorageProvider


class TestStorageProviderProtocol:
    """Test StorageProvider protocol compliance."""
    
    def test_local_provider_implements_protocol(self):
        """AC-01: LocalStorageProvider implements StorageProvider protocol."""
        provider = LocalStorageProvider()
        assert isinstance(provider, StorageProvider)
    
    def test_protocol_methods_exist(self):
        """Verify required methods exist on provider."""
        provider = LocalStorageProvider()
        assert hasattr(provider, 'upload')
        assert hasattr(provider, 'download')
        assert hasattr(provider, 'exists')
        assert callable(provider.upload)
        assert callable(provider.download)
        assert callable(provider.exists)


class TestLocalStorageProvider:
    """Test LocalStorageProvider implementation."""
    
    @pytest.fixture
    def temp_storage(self, tmp_path):
        """Create a temporary storage directory."""
        storage_dir = tmp_path / "test_results"
        storage_dir.mkdir()
        return LocalStorageProvider(str(storage_dir))
    
    @pytest.mark.asyncio
    async def test_upload_creates_file(self, temp_storage):
        """AC-02: Upload creates file and returns valid URI."""
        data = b'{"test": "data"}'
        metadata = {"order_id": "order_001", "content_type": "application/json"}
        
        uri = await temp_storage.upload(data, metadata)
        
        assert uri.startswith("file://")
        assert "order_001" in uri
        assert uri.endswith(".json")
    
    @pytest.mark.asyncio
    async def test_download_returns_data(self, temp_storage):
        """AC-02: Download returns uploaded data."""
        original_data = b'{"hello": "world"}'
        metadata = {"order_id": "order_002"}
        
        uri = await temp_storage.upload(original_data, metadata)
        downloaded_data = await temp_storage.download(uri)
        
        assert downloaded_data == original_data
    
    @pytest.mark.asyncio
    async def test_exists_returns_true_for_existing(self, temp_storage):
        """Exists returns True for uploaded data."""
        data = b'test'
        metadata = {"order_id": "order_003"}
        
        uri = await temp_storage.upload(data, metadata)
        
        assert await temp_storage.exists(uri) is True
    
    @pytest.mark.asyncio
    async def test_exists_returns_false_for_missing(self, temp_storage):
        """Exists returns False for non-existent URI."""
        fake_uri = "file:///nonexistent/path/file.json"
        
        assert await temp_storage.exists(fake_uri) is False
    
    @pytest.mark.asyncio
    async def test_download_raises_for_missing(self, temp_storage):
        """Download raises FileNotFoundError for missing file."""
        fake_uri = "file:///nonexistent/path/file.json"
        
        with pytest.raises(FileNotFoundError):
            await temp_storage.download(fake_uri)
    
    @pytest.mark.asyncio
    async def test_upload_requires_order_id(self, temp_storage):
        """Upload raises ValueError if order_id missing."""
        data = b'test'
        metadata = {"content_type": "text/plain"}  # No order_id
        
        with pytest.raises(ValueError, match="order_id"):
            await temp_storage.upload(data, metadata)
    
    def test_uri_format_file_scheme(self, temp_storage):
        """AC-04: URI uses file:// scheme."""
        uri = temp_storage._path_to_uri(Path("/some/path/file.json"))
        assert uri.startswith("file://")


class TestStoreAndFetchResult:
    """Test high-level store_result and fetch_result functions."""
    
    @pytest.fixture(autouse=True)
    def setup_provider(self, tmp_path):
        """Setup temporary provider for each test."""
        storage_dir = tmp_path / "results"
        storage_dir.mkdir()
        provider = LocalStorageProvider(str(storage_dir))
        set_provider(provider)
        yield
        reset_provider()
    
    @pytest.mark.asyncio
    async def test_store_result_returns_uri(self):
        """store_result returns valid URI."""
        result = {"status": "success", "output": "Hello World"}
        order_id = "test_order_001"
        
        uri = await store_result(result, order_id)
        
        assert uri.startswith("file://")
        assert "test_order_001" in uri
    
    @pytest.mark.asyncio
    async def test_fetch_result_returns_data(self):
        """AC-03: fetch_result returns stored data."""
        original_result = {
            "status": "success",
            "output": {"value": 42},
            "logs": ["step1", "step2"],
        }
        order_id = "test_order_002"
        
        uri = await store_result(original_result, order_id)
        fetched_result = await fetch_result(uri)
        
        assert fetched_result == original_result
    
    @pytest.mark.asyncio
    async def test_roundtrip_preserves_data(self):
        """AC-03: Full roundtrip preserves all data."""
        complex_result = {
            "status": "completed",
            "output": {
                "text": "处理完成",  # Unicode test
                "numbers": [1, 2, 3],
                "nested": {"a": {"b": {"c": 1}}},
            },
            "metrics": {
                "duration_ms": 1234,
                "tokens_used": 500,
            },
        }
        order_id = "complex_order"
        
        uri = await store_result(complex_result, order_id)
        fetched = await fetch_result(uri)
        
        assert fetched == complex_result
        assert fetched["output"]["text"] == "处理完成"
    
    @pytest.mark.asyncio
    async def test_fetch_nonexistent_raises_not_found(self):
        """fetch_result raises NotFoundError for missing URI."""
        fake_uri = "file:///nonexistent/result.json"
        
        with pytest.raises(NotFoundError):
            await fetch_result(fake_uri)
    
    @pytest.mark.asyncio
    async def test_uri_format_compliance(self):
        """AC-04: URIs follow file:// or gist:// format."""
        result = {"test": True}
        uri = await store_result(result, "format_test")
        
        # For local provider, must be file://
        assert uri.startswith("file://") or uri.startswith("gist://")
        # Local provider uses file://
        assert uri.startswith("file://")


class TestProviderFallback:
    """Test provider initialization and fallback logic."""
    
    @pytest.fixture(autouse=True)
    def clean_provider(self):
        """Reset provider before each test."""
        reset_provider()
        # Remove GITHUB_TOKEN if set
        old_token = os.environ.pop("GITHUB_TOKEN", None)
        yield
        reset_provider()
        if old_token:
            os.environ["GITHUB_TOKEN"] = old_token
    
    def test_default_provider_is_local(self):
        """Without GITHUB_TOKEN, default is LocalStorageProvider."""
        provider = get_provider()
        assert isinstance(provider, LocalStorageProvider)
    
    def test_provider_singleton(self):
        """get_provider returns same instance."""
        p1 = get_provider()
        p2 = get_provider()
        assert p1 is p2
    
    def test_set_provider_overrides(self, tmp_path):
        """set_provider allows custom provider."""
        custom = LocalStorageProvider(str(tmp_path))
        set_provider(custom)
        
        assert get_provider() is custom


class TestImportability:
    """Test module importability - AC-01."""
    
    def test_import_from_da(self):
        """AC-01: Can import from da module."""
        from da import store_result, fetch_result, StorageProvider, get_provider
        
        assert callable(store_result)
        assert callable(fetch_result)
        assert callable(get_provider)
    
    def test_import_storage_directly(self):
        """Can import storage module directly."""
        from da.storage import store_result, fetch_result
        
        assert callable(store_result)
        assert callable(fetch_result)
    
    def test_import_local_provider(self):
        """Can import LocalStorageProvider."""
        from da.providers.local import LocalStorageProvider
        
        assert LocalStorageProvider is not None
