# P11-01: SRE 确定性输出修复

## Meta
- **Type**: `Standard / Logic`
- **Risk Level**: 🟡 Medium
- **depends_on**: None
- **Priority**: P0 (Critical Trust Fix)

## Input Files
- `sre-runtime/executor/sandbox.py` (L40-98)

## External Dependencies
| 资源 | 类型 | 状态 |
|------|------|------|
| Docker Desktop | 本地服务 | ✅ 已确认 |

## Problem Statement
当前 `sandbox.py` 中的 JSON 序列化未使用 `sort_keys=True`，导致:
- 不同执行环境下生成的结果 JSON 字段顺序可能不同
- 结果哈希 (result_hash) 不一致
- 无法进行可靠的 Challenger 验证

## Action Steps
1. **修改 L76**: `json.dumps(input_data)` → `json.dumps(input_data, sort_keys=True)`
   - 确保输入 JSON 序列化确定性

2. **修改 L95**: 添加结果规范化处理
   ```python
   output = container.logs().decode("utf-8")
   result = json.loads(output)
   return json.loads(json.dumps(result, sort_keys=True))  # 规范化输出
   ```

3. **添加 docstring 注释**:
   ```python
   # NOTE: sort_keys=True ensures deterministic hashing for Challenger verification
   ```

## Constraints
- 不得修改 `SandboxConfig` 默认参数
- 不得修改 `validate_input` 函数签名
- 保持向后兼容性

## Verification
- **Unit**: `cd sre-runtime && python -m pytest tests/test_sandbox.py -v`
- **Evidence**: 测试输出显示所有用例通过

## Rollback
- `git checkout sre-runtime/executor/sandbox.py`
