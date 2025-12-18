# Phase 2 任务计划

**Phase**: SRE 运行时 (Week 2)
**Gate Status**: CONDITIONAL ENTRY (ADR-010)
**Created**: 2024-12-14

---

## 任务队列

### P2-VERIFY: Challenger/Verifier 验证脚本 🔴 P0

**Input**:
- MVP v2.0 文档 §4.2.4 Verifier 模块设计
- 现有 `sre-runtime/` 目录结构

**Output**:
- `sre-runtime/verifier/verifier.py` - 结果验证脚本
- `sre-runtime/verifier/__init__.py`
- 验证逻辑: 重放 Skill 执行 → 对比 Hash → 触发挑战

**Verify**:
- Unit: 模拟 Hash 匹配/不匹配场景
- Integration: (Phase 2 后期) 与链上 challenge() 指令集成

**External Dependencies**:
- Docker Desktop ✅ (已确认)
- Python 3.11+ ✅ (已确认)

---

### P2-DA: 结果数据可用性流程 🔴 P0

**Input**:
- MVP v2.0 文档 §4.2.3 Committer DA 流程

**Output**:
- `sre-runtime/executor/committer.py` - 增强版提交模块
- 支持: Arweave → GitHub Gist → 本地存储 降级链

**Verify**:
- Unit: 模拟上传/读取流程
- Integration: Dashboard 可通过 URL 读取结果

**External Dependencies**:
- GitHub Token (可选，用于 Gist)

---

### P2-LISTENER: 链上事件监听 🟡

**Input**:
- MVP v2.0 文档 §4.2.1 Listener 设计

**Output**:
- `sre-runtime/executor/listener.py`

**External Dependencies**:
- Helius API Key ⬜ (待确认)

---

### P2-SANDBOX: Docker 沙盒执行 🟡

**Input**:
- MVP v2.0 文档 §4.2.2 Sandbox 设计

**Output**:
- `sre-runtime/executor/sandbox.py`

**External Dependencies**:
- Docker Desktop ✅

---

### P2-COMMITTER: 结果提交模块 🟡

**Depends On**: P2-DA

---

### Task-07B: Anchor IDL 修复 (并行) 🟡

**Input**:
- ADR-008 分析结论
- WSL2 环境探索

**Output**:
- 自动生成的 IDL 文件

---

## 执行顺序

```
Day 1: P2-VERIFY (Verifier 脚本)
Day 2: P2-DA (DA 流程)
Day 3-4: P2-LISTENER + P2-SANDBOX
Day 5: P2-COMMITTER + 集成测试
并行: Task-07B (IDL 修复)
```
