# Task: P3-MOCK
## Mock 数据注入脚本 (演示兜底)

**Priority**: P0 (演示核心)
**Dependencies**: P2-ORCHESTRATOR ✅
**External Dependencies**: 无

---

## 背景

Phase 2 SRE 运行时核心模块已完成 (VERIFY, DA, SANDBOX, COMMITTER, ORCHESTRATOR)。
为确保 Hackathon 演示有完整数据展示，需要 Mock 数据注入脚本作为兜底方案。

---

## Input (输入条件)

1. 已有 Skill 包示例 (`docs/examples/`)
2. 已有 SRE 运行时模块 (`sre-runtime/`)
3. 需要支持 Dashboard 数据展示

---

## Output (交付产物)

| 文件 | 说明 |
|------|------|
| `sre-runtime/mock/mock_data.py` | Mock 数据生成器 |
| `sre-runtime/mock/mock_orders.json` | 预生成的订单数据 |
| `sre-runtime/mock/mock_skills.json` | 预生成的 Skill 数据 |
| `sre-runtime/mock/__init__.py` | 模块导出 |
| `sre-runtime/tests/test_mock.py` | 单元测试 |
| `.project_state/reports/P3-MOCK_report.json` | 验证报告 |

---

## Acceptance Criteria (验收标准)

| AC | 描述 | 验证方式 |
|----|------|----------|
| AC-01 | mock 模块可独立导入 | `python -c "from mock import ..."` |
| AC-02 | 生成 10+ 个 Mock Order 记录 | JSON 文件包含 10+ 订单 |
| AC-03 | 生成 5+ 个 Mock Skill 记录 | JSON 文件包含 5+ Skill |
| AC-04 | Mock 数据符合 OrderResult 结构 | 结构验证测试 |
| AC-05 | 支持随机生成和固定种子模式 | 测试验证 seed 参数 |

---

## Verify (验证命令)

```bash
cd sre-runtime

# AC-01: 模块导入
python -c "from mock import generate_mock_orders, generate_mock_skills; print('AC-01: PASS')"

# AC-02/03: 数据生成
python -c "from mock import generate_mock_orders, generate_mock_skills; print(f'Orders: {len(generate_mock_orders(10))}'); print(f'Skills: {len(generate_mock_skills(5))}')"

# 单元测试
python -m pytest tests/test_mock.py -v
```

---

## Technical Notes

1. **Order 数据结构** (对齐 `OrderResult`):
   ```python
   {
     "order_id": str,
     "skill_id": str,
     "status": "completed" | "failed" | "timeout",
     "execution_time_ms": int,
     "created_at": str (ISO8601),
     "result_hash": str (64 hex chars),
     "agent_id": str
   }
   ```

2. **Skill 数据结构** (对齐 `SKILL_SCHEMA.md`):
   ```python
   {
     "skill_id": str,
     "name": str,
     "version": str,
     "category": str,
     "price_lamports": int,
     "execution_count": int,
     "success_rate": float
   }
   ```

3. **Seed 模式**: 支持 `seed=42` 参数确保数据可复现

---

## Constraints

- **禁止**: 调用外部 API
- **禁止**: 硬编码敏感数据
- **要求**: 数据结构必须与 Phase 2 模块兼容

---

*Dispatched by CSA at 2024-12-15 00:27 UTC+8*
