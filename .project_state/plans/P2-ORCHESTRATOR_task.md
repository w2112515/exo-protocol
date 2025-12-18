# Task: P2-ORCHESTRATOR

**ID**: P2-ORCHESTRATOR
**Phase**: 2 - SRE 运行时
**Priority**: P0 (Phase 2 收尾)
**Depends On**: P2-SANDBOX✅, P2-COMMITTER✅, P2-VERIFY✅, P2-DA✅

---

## 目标 (Objective)

创建 SRE 协调器模块，整合 sandbox → committer → verify 流程，形成完整的 Skill 执行管道。

---

## Input

- `sre-runtime/executor/sandbox.py` (execute_in_sandbox)
- `sre-runtime/committer/committer.py` (commit_result)
- `sre-runtime/verifier/verify.py` (verify_result)
- `sre-runtime/da/storage.py` (store_result)

---

## Output

| 文件 | 说明 |
|------|------|
| `sre-runtime/orchestrator/__init__.py` | 模块导出 |
| `sre-runtime/orchestrator/orchestrator.py` | 协调器主模块 |
| `sre-runtime/tests/test_orchestrator.py` | 单元测试 |
| `.project_state/reports/P2-ORCHESTRATOR_report.json` | 任务报告 |

---

## Acceptance Criteria

| AC | 描述 | 验证方式 |
|----|------|----------|
| AC-01 | orchestrator.py 可独立导入 | `python -c "from orchestrator import ..."` |
| AC-02 | `execute_skill_order()` 整合完整流程 | 单元测试 Mock 验证调用链 |
| AC-03 | 支持 OrderConfig (超时/重试/回调) | 配置参数传递测试 |
| AC-04 | 返回 OrderResult 包含完整执行状态 | 数据结构验证 |
| AC-05 | 执行失败时触发回调/记录日志 | 异常场景测试 |

---

## Technical Spec

### OrderConfig 数据结构
```python
@dataclass
class OrderConfig:
    order_id: str
    skill_package: dict
    input_data: dict
    timeout_seconds: int = 300
    max_retries: int = 0
    callback_url: Optional[str] = None
    sandbox_config: Optional[SandboxConfig] = None
```

### OrderResult 数据结构
```python
@dataclass
class OrderResult:
    order_id: str
    status: str  # "completed" | "failed" | "timeout"
    commit_result: Optional[CommitResult]
    verification: Optional[VerifyResult]
    execution_time_ms: int
    error_message: Optional[str] = None
```

### 执行流程
```
OrderConfig → execute_skill_order()
  ├─ 1. commit_result() → sandbox + DA
  ├─ 2. verify_result() → 结果验证
  ├─ 3. 组装 OrderResult
  └─ 4. 触发回调 (可选)
```

---

## External Dependencies

无 (纯本地模块整合)

---

## Verify

```bash
cd sre-runtime
python -c "from orchestrator import execute_skill_order, OrderConfig, OrderResult; print('AC-01: PASS')"
python -m pytest tests/test_orchestrator.py -v
```

---

## Notes

- 此任务整合 Phase 2 已完成的所有模块
- 不涉及链上交互 (P2-LISTENER BLOCKED)
- 为 Phase 3 提供完整的后端执行能力
