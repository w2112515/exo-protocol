# P2-COMMITTER 任务派发单

**Task ID**: P2-COMMITTER
**Status**: ⏳ DISPATCHED
**Dispatcher**: CSA
**Timestamp**: 2024-12-14 23:56 UTC+8
**Priority**: P1 (Phase 2 关键路径)

---

## 任务目标

实现 SRE 运行时的结果提交模块，整合沙盒执行 (P2-SANDBOX) 和数据可用性存储 (P2-DA)，生成链上提交所需的数据结构。

---

## Input (输入)

| 依赖模块 | 路径 | 导出接口 |
|----------|------|----------|
| Sandbox | `executor/sandbox.py` | `execute_in_sandbox`, `SandboxConfig` |
| DA Storage | `da/storage.py` | `store_result`, `fetch_result`, `StorageProvider` |
| Verifier | `verifier/verifier.py` | 验证逻辑参考 |

### 上下文
- P2-DA 已实现 `store_result(result, order_id) -> URI` 接口
- P2-SANDBOX 已实现 `execute_in_sandbox(skill_package, input_data) -> result` 接口
- 需要将执行结果提交到链上 (调用 Escrow Settlement 合约)

---

## Output (产出)

| 文件 | 描述 |
|------|------|
| `sre-runtime/committer/__init__.py` | 模块入口 |
| `sre-runtime/committer/committer.py` | 结果提交核心逻辑 |
| `sre-runtime/tests/test_committer.py` | 单元测试 |

### 核心接口设计

```python
@dataclass
class CommitResult:
    """提交结果数据结构"""
    order_id: str           # 订单 ID
    result_uri: str         # DA 存储 URI
    result_hash: str        # 结果哈希 (SHA256)
    execution_time_ms: int  # 执行耗时
    status: str             # "success" | "failed"
    error_message: Optional[str] = None

async def commit_result(
    order_id: str,
    skill_package: dict,
    input_data: dict,
    sandbox_config: Optional[SandboxConfig] = None
) -> CommitResult:
    """
    执行 Skill 并提交结果
    
    流程:
    1. 调用 sandbox 执行 skill
    2. 计算结果哈希
    3. 调用 DA 存储结果
    4. 返回 CommitResult (供链上提交使用)
    """
    pass

def compute_result_hash(result: dict) -> str:
    """计算结果的 SHA256 哈希"""
    pass
```

---

## Acceptance Criteria (验收标准)

| AC | 描述 | 验证命令 |
|----|------|----------|
| AC-01 | `committer.py` 可独立导入 | `python -c "from committer import commit_result, CommitResult"` |
| AC-02 | `commit_result` 整合 sandbox + DA | Mock 测试验证调用链 |
| AC-03 | `result_hash` 使用 SHA256 | 测试哈希一致性 |
| AC-04 | 执行失败时返回 `status="failed"` | 异常场景测试 |
| AC-05 | `execution_time_ms` 正确记录 | 计时测试 |

---

## Verify (验证)

```bash
# 1. 模块导入测试
cd sre-runtime && python -c "from committer import commit_result, CommitResult; print('AC-01: PASS')"

# 2. 单元测试
python -m pytest tests/test_committer.py -v

# 3. 全量测试
python -m pytest tests/ -v --tb=short
```

---

## 约束条件

1. **Mock 依赖**: 测试中 Mock `execute_in_sandbox` 和 `store_result`，避免真实 Docker/文件操作
2. **异步接口**: 保持与 DA 模块一致的 `async/await` 风格
3. **错误处理**: 捕获 sandbox 和 DA 异常，转换为 `CommitResult.status="failed"`
4. **哈希算法**: 使用 `hashlib.sha256`，JSON 序列化时使用 `sort_keys=True` 保证确定性

---

## External Dependencies (R6)

| 资源 | 类型 | 状态 |
|------|------|------|
| Docker | 本地服务 | ✅ 已确认 (测试使用 Mock) |
| 文件系统 | 本地服务 | ✅ 可用 |

**无外部阻塞资源**，任务可立即执行。

---

## WAP 执行指引

1. 创建 `committer/` 目录结构
2. 实现 `CommitResult` dataclass
3. 实现 `compute_result_hash` 函数
4. 实现 `commit_result` 异步函数
5. 编写测试用例覆盖 5 项 AC
6. 运行测试并生成报告

**完成后提交**: `.project_state/reports/P2-COMMITTER_report.json`

---

*CSA Dispatch Complete. WAP, check your orders.*
