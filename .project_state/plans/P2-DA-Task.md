# Task P2-DA: 结果数据可用性流程

**Status**: 🔵 DISPATCHED
**Priority**: P0
**Assigned**: WAP
**Dispatched**: 2024-12-14 23:06 UTC+8

---

## Input

- MVP v2.0 文档 §4.2.3 Committer DA 流程
- 现有 `sre-runtime/` 目录结构
- P2-VERIFY 产出的 `verifier/` 模块

## Output

| 文件 | 描述 |
|------|------|
| `sre-runtime/da/__init__.py` | 模块初始化 |
| `sre-runtime/da/storage.py` | 存储抽象层 (Storage Provider Interface) |
| `sre-runtime/da/providers/local.py` | 本地文件存储 Provider |
| `sre-runtime/da/providers/github_gist.py` | GitHub Gist Provider (可选) |
| `sre-runtime/tests/test_da.py` | 单元测试 |

## 功能要求

### 核心接口

```python
# storage.py
class StorageProvider(Protocol):
    async def upload(self, data: bytes, metadata: Dict) -> str:
        """上传数据，返回 URI"""
        ...
    
    async def download(self, uri: str) -> bytes:
        """通过 URI 下载数据"""
        ...
    
    async def exists(self, uri: str) -> bool:
        """检查数据是否存在"""
        ...

async def store_result(result: Dict, order_id: str) -> str:
    """
    存储执行结果，返回可访问的 URI
    支持降级链: GitHub Gist → Local File
    """

async def fetch_result(uri: str) -> Dict:
    """通过 URI 获取执行结果"""
```

### 降级策略 (ADR-003 对齐)

1. **Primary**: GitHub Gist (如有 Token)
2. **Fallback**: 本地文件 (`sre-runtime/data/results/`)

## Acceptance Criteria

| AC | 描述 | 验证方式 |
|----|------|----------|
| AC-01 | `storage.py` 可独立导入 | `python -c "from da import store_result"` |
| AC-02 | 本地存储 upload/download 测试通过 | pytest |
| AC-03 | 结果 JSON 序列化/反序列化正确 | pytest |
| AC-04 | URI 格式符合规范 (`file://` 或 `gist://`) | pytest |

## External Dependencies

| 资源 | 类型 | 状态 | 备注 |
|------|------|------|------|
| Python 3.11+ | 本地服务 | ✅ 已确认 | - |
| GitHub Token | 私有 API | ⬜ 可选 | Gist 功能需要，无则降级 |

## Constraints

- **R2 法则**: 串行批处理，每步完成后提交
- **No External Deps**: 本地存储必须可用，不依赖网络
- **JSON Only**: 结果格式限定为 JSON

## Verify

- **Unit**: 模拟 upload/download 流程
- **Integration**: (后续) Dashboard 可通过 URI 读取结果

---

## WAP 执行指引

1. 创建 `da/` 目录结构
2. 实现 `StorageProvider` 抽象接口
3. 实现 `LocalStorageProvider`
4. 实现 `store_result()` 和 `fetch_result()` 函数
5. 编写单元测试
6. 生成报告 `.project_state/reports/P2-DA_report.json`

**报告提交后 @[/csa] 请求审计。**
