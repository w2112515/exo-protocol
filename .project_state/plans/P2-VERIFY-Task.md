# P2-VERIFY: Challenger/Verifier 验证脚本

**Task ID**: P2-VERIFY
**Priority**: P0 (最高)
**Status**: 🔵 DISPATCHED
**Created**: 2024-12-14 22:58 UTC+8

---

## Task Description

实现 Verifier 模块，用于验证 Executor 提交的结果正确性，并在检测到恶意提交时触发链上挑战。

## Input

- `docs/mvp v2.0.md` §4.2.4 - Verifier 模块设计
- 现有目录: `sre-runtime/executor/`
- 示例 Skill 包: `skills/` 目录

## Output

### 文件清单

| 文件 | 描述 |
|------|------|
| `sre-runtime/verifier/__init__.py` | 模块初始化 |
| `sre-runtime/verifier/verifier.py` | 核心验证逻辑 |
| `sre-runtime/verifier/challenger.py` | 挑战触发逻辑 |

### 功能要求

1. **verify_result(order_pubkey)**
   - 获取订单和已提交的结果哈希
   - 重新执行 Skill (确定性重放)
   - 对比哈希，返回验证结果

2. **challenge_if_invalid(order_pubkey)**
   - 验证失败时构建 challenge 指令
   - 记录挑战日志

## Verify

### Unit Test (Mock 数据)

```python
# tests/test_verifier.py
def test_verify_result_match():
    """测试哈希匹配场景"""
    mock_result = {"price": "100.5", "timestamp": 1234567890}
    mock_hash = hashlib.sha256(json.dumps(mock_result, sort_keys=True).encode()).digest()
    # 模拟重放返回相同结果
    assert verify_result_with_mock(mock_result, mock_hash) is None

def test_verify_result_mismatch():
    """测试哈希不匹配场景"""
    mock_result = {"price": "100.5", "timestamp": 1234567890}
    wrong_hash = b'\x00' * 32
    # 模拟重放返回不同哈希
    error = verify_result_with_mock(mock_result, wrong_hash)
    assert error is not None
    assert "Hash mismatch" in error
```

### AC (验收标准)

| AC | 描述 | 验证方式 |
|----|------|---------|
| AC-01 | verifier.py 可独立运行 | `python -m sre-runtime.verifier.verifier --help` |
| AC-02 | 哈希匹配测试通过 | `pytest tests/test_verifier.py::test_verify_result_match` |
| AC-03 | 哈希不匹配测试通过 | `pytest tests/test_verifier.py::test_verify_result_mismatch` |
| AC-04 | 模块可导入 | `from sre_runtime.verifier import verify_result` |

## External Dependencies

| 资源 | 类型 | 状态 |
|------|------|------|
| Docker Desktop | 本地服务 | ✅ 已确认 |
| Python 3.11+ | 本地服务 | ✅ 已确认 |

---

## Report Template

任务完成后，WAP 需在 `.project_state/reports/P2-VERIFY_report.json` 提交报告：

```json
{
  "task_id": "P2-VERIFY",
  "status": "success|failed",
  "timestamp": "ISO8601",
  "evidence_files": [
    "sre-runtime/verifier/__init__.py",
    "sre-runtime/verifier/verifier.py",
    "sre-runtime/verifier/challenger.py",
    "tests/test_verifier.py"
  ],
  "test_results": {
    "AC-01": { "passed": true, "output": "..." },
    "AC-02": { "passed": true, "output": "..." },
    "AC-03": { "passed": true, "output": "..." },
    "AC-04": { "passed": true, "output": "..." }
  },
  "notes": "..."
}
```
