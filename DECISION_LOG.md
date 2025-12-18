# DECISION_LOG.md - Exo Protocol

**Project**: Exo Protocol MVP
**Created**: 2024-12-14

---

## ADR (Architecture Decision Records)

### ADR-001: 采用城邦 V5.0 Skill 标准 + Tool Annotations

**Date**: 2024-12-14
**Status**: Accepted

**Context**:
- Solana 黑客松需要标准化的 Skill 规范
- 城邦 V5.0 提供了成熟的 Skill 标准
- Anthropic 技术模式提供了 Tool Annotations 机制

**Decision**:
- SKILL.md 规范 v1.1 = V5.0 §7.3 + Tool Annotations
- 输入验证采用 JSON Schema + additionalProperties: false
- Sandbox 执行增加 100KB/20props 限制

**Consequences**:
- ✅ 与城邦生态对齐
- ✅ 为挑战重放提供基础 (idempotentHint)
- ✅ 安全性增强

### ADR-002: Token-2022 Transfer Hook 作为核心 OPOS 得分点

**Date**: 2024-12-14
**Status**: Accepted

**Context**:
- Solana 黑客松重视 OPOS (Only Possible on Solana) 特性
- Transfer Hook 是 Solana Token-2022 独有能力
- 自动分账是 PayFi 协议的核心需求

**Decision**:
- 使用 Transfer Hook 实现链级强制分账 (5% 协议费 + 10% 版税 + 85% 执行者)
- 即使 Week 1 开发困难，也不降级为后端分账

**Consequences**:
- ✅ OPOS 得分最大化
- ⚠️ 开发复杂度提高
- ⚠️ 需要更多测试覆盖

### ADR-004: Solana BPF 工具链依赖兼容性修复

**Date**: 2024-12-14
**Status**: Accepted
**Trigger**: Task-03/04 构建失败

**Context**:
- Solana BPF 工具链使用 rustc 1.75.0-dev，落后于最新 stable
- Cargo.lock v4 格式不兼容 rustc 1.75.0-dev
- 部分 crate (indexmap v2.12+) 要求 rustc 1.82+

**Root Cause Analysis**:
```
indexmap v2.12.1 → requires rustc 1.82+
  ↑ (依赖)
proc-macro-crate v3.x
  ↑ (依赖)
borsh v1.5.x
```

**Decision**:
1. **Cargo.lock 降级**: version 4 → version 3 (手动编辑第一行)
2. **borsh 锁定**: v1.2.1 (级联解决 indexmap 兼容性)
3. **记录约束**: 在 Cargo.toml 中添加版本注释

**Prevention**:
- 新增依赖前检查 MSRV (Minimum Supported Rust Version)
- 优先使用 Anchor 已验证的依赖版本

**Consequences**:
- ✅ 构建成功
- ⚠️ 无法使用 borsh 最新特性
- ⚠️ 需在 Solana 工具链升级后重新评估

---

### ADR-003: Arweave 存储降级为本地/GitHub 存储

**Date**: 2024-12-14
**Status**: Accepted
**Trigger**: 用户资源前置确认 (R6) - Arweave/Irys 不可用

**Context**:
- 原方案需要 Arweave/Irys 存储 SKILL.md 包
- 用户表示不熟悉 Irys 配置
- 黑客松时间紧迫，不宜花时间在非核心功能上

**Decision**:
- SKILL.md 包存储降级为 **本地文件 + GitHub 仓库**
- 链上仅存储 `content_hash` (SHA256)
- 演示时从本地/GitHub 获取 Skill 内容

**Implementation**:
```
原方案: SkillAccount.content_hash → Arweave TxID → 获取 SKILL.md
降级方案: SkillAccount.content_hash → GitHub Raw URL / 本地文件
```

**Consequences**:
- ✅ 零配置，立即开始开发
- ✅ 演示效果无差异
- ⚠️ 非永久存储（黑客松够用）
- ⚠️ 主网部署时需升级回 Arweave

**Gate Impact**: Phase 2 SRE 标记为 `Partial` (存储降级)

### ADR-005: 升级 Solana CLI 到 2.0.x 解决工具链冲突

**Date**: 2025-12-14
**Status**: Accepted
**Trigger**: Task-06 编译阻塞 (WAP R3 熔断上报)

**Context**:
- Solana CLI 1.18.26 使用 rustc 1.75.0-dev
- 依赖链中的 crate 需要更高版本 rustc:
  - indexmap 2.12.1 (requires rustc 1.82+)
  - toml_edit 0.23.9 (requires rustc 1.76+)
- WAP 尝试降级依赖失败 (proc-macro-crate v3 硬依赖 toml_edit ^0.23.2)

**Options Evaluated**:
| 选项 | 方案 | 风险 | 工作量 |
|------|------|------|--------|
| A ✅ | 升级 Solana CLI 到 2.0.x | exo-core 兼容性验证 | LOW |
| B | Docker 容器构建环境 | 增加构建复杂度 | MEDIUM |
| C | 等待 Anchor 0.31.x | 时间不确定 | WAIT |

**Decision**: 选项 A - 升级 Solana CLI 到 2.0.x

**Rationale**:
1. Hackathon 时效性优先，Docker 增加不必要复杂度
2. Solana 2.0 是官方主推版本，符合长期技术演进
3. exo-core 在同一仓库，可立即验证兼容性
4. 工作量最低，单一命令完成

**Action Items**:
1. `solana-install init 2.0.21` (或最新稳定版)
2. 验证 `anchor build -p exo_core` 兼容性
3. 重试 `anchor build -p exo_hooks`

**Consequences**:
- ✅ 解决 rustc 版本冲突
- ✅ 获得 Solana 2.0 新特性
- ⚠️ 需验证现有合约兼容性

### ADR-006: Platform-Tools 版本升级解决 rustc 依赖死锁

**Date**: 2025-12-14
**Status**: Proposed
**Trigger**: Task-06A 执行失败 (ADR-005 方案不充分)

**Problem Analysis**:
ADR-005 决策升级 Solana CLI 到 2.0.21，但 **未能解决根本问题**：

```
Solana CLI 2.0.21 → 自动下载 platform-tools v1.42 → rustc 1.75.0-dev
                                    ↓
                    与现代 crate 依赖不兼容
```

**Dependency Deadlock (WAP 诊断)**:
```
proc-macro-crate v3.4.0 → 需要 toml_edit ^0.23.2
toml_edit v0.23.x → 需要 rustc 1.76+
platform-tools v1.42 → 仅提供 rustc 1.75.0-dev
❌ 无法同时满足
```

**Key Discovery**:
WAP 在执行中发现 **platform-tools v1.52** (2025-10-30 发布) 是最新版本，可能包含更新的 rustc。

**Options Evaluated**:
| 选项 | 方案 | 风险 | 工作量 |
|------|------|------|--------|
| A ⭐ | 使用 platform-tools v1.52 | 需验证兼容性 | LOW |
| B | WSL2 Linux 环境构建 | 需安装配置 WSL2 + Solana | MEDIUM |
| C | Docker 官方构建镜像 | 需配置 Docker 构建流程 | MEDIUM |
| D | 降级 Anchor 到 0.29.x | 可能丢失 Token-2022 特性 | HIGH RISK |

**Decision**: 选项 A - 升级 platform-tools 到 v1.52

**Rationale**:
1. v1.52 是官方最新版，预期包含 rustc 1.79+ (满足依赖要求)
2. 工作量最低，仅需下载替换 SDK
3. 保持 Windows 原生开发环境，无需额外工具链
4. 如失败，可快速回退到选项 B (WSL2)

**Action Items**:
1. 下载 platform-tools v1.52 到项目目录
2. 使用 `--sbf-sdk` 参数指定 v1.52 路径
3. 验证 `anchor build -p exo_core`
4. 验证 `anchor build -p exo_hooks`

**Fallback**: 若 v1.52 仍失败，转 WSL2 方案

### ADR-008: 部分构建产物接受与 IDL 生成策略 (R2 干预)

**Date**: 2025-12-14
**Status**: Accepted
**Trigger**: Task-06A-v3 失败 (R2 三次失败干预触发)

**Problem Summary**:
Task-06A 已连续失败 3 次:
- v1: platform-tools v1.42 rustc 1.75.0-dev 不足
- v2: platform-tools v1.52 仍为 rustc 1.75.0-dev (Windows 打包缺陷)
- v3: Docker 镜像 (v0.30.1/v0.31.0) rustc 均不支持 `proc_macro2::Span::source_file()` API

**Root Cause**:
Anchor 0.30.x IDL 生成依赖 `proc_macro2::Span::source_file()`，该 API 需要 rustc 1.82+ 且启用 `proc_macro_span` feature。所有公开构建环境均不满足此条件。

**Intervention Strategy**: Decompose + Partial Gate

**Decision**:
1. **接受 .so 产物**: `exo_hooks.so` (233KB) 已成功构建，满足链上部署需求
2. **手动 IDL (Task-06B)**: 基于源码手工编写最小 IDL，仅覆盖 Transfer Hook 公开接口
3. **WSL2 备选 (Task-06C)**: 低优先级探索 WSL2 本地构建，Phase 2 前完成即可
4. **Gate 标记**: Task-06 标记为 Partial Complete

**Rationale**:
1. .so 是核心交付物，IDL 是辅助工具
2. 手动 IDL 工作量可控 (仅 3 个公开指令)
3. 不阻塞 Task-07 单元测试进度
4. WSL2 方案保留作为 Phase 2 SDK 开发的备选

**Consequences**:
- ✅ 解除 Phase 1 阻塞
- ✅ 保持黑客松进度
- ⚠️ 手动 IDL 需与源码同步维护
- ⚠️ Phase 2 前需解决自动 IDL 生成问题

---

### ADR-007: Docker 容器构建方案 (Windows Platform-Tools 上游缺陷绕过)

**Date**: 2025-12-14
**Status**: Superseded by ADR-008
**Trigger**: Task-06A-v2 失败 (ADR-006 Fallback 触发)

**Root Cause Confirmation**:
WAP 验证发现 Windows platform-tools **v1.42 和 v1.52 均打包 rustc 1.75.0-dev**，这是 **Anza 上游打包缺陷**，非本地可解决。

```
platform-tools v1.42 (Windows) → rustc 1.75.0-dev ❌
platform-tools v1.52 (Windows) → rustc 1.75.0-dev ❌ (未更新)
toml_edit v0.23.9 → requires rustc 1.76+ ❌ 死锁
```

**Options Re-evaluated**:
| 选项 | 方案 | 风险 | 资源状态 |
|------|------|------|----------|
| A | 降级 toml_edit | 依赖兼容性问题 | ⚠️ 可用但高风险 |
| B | WSL2 + Linux platform-tools | 需配置环境 | ⬜ 未确认 |
| C ⭐ | Docker 官方构建镜像 | 低风险 | ✅ Docker v29.1.2 已就绪 |

**Decision**: 选项 C - Docker 容器构建

**Rationale**:
1. 用户已确认 Docker v29.1.2 可用且已启动
2. 符合 Strategic DNA 声明 (Runtime: Python 3.11 + **Docker**)
3. 官方 Solana builder 镜像维护良好，rustc 版本更新
4. 不引入依赖兼容性风险 (Option A 风险)
5. 无需额外配置 WSL2 (Option B 复杂度)

**Implementation Strategy**:
1. 使用 `backpackapp/build:v0.30.1` 或 `projectserum/build` 镜像
2. 挂载项目目录到容器
3. 在容器内执行 `anchor build`
4. 构建产物输出到 `target/` 目录

**Consequences**:
- ✅ 绕过 Windows platform-tools rustc 版本限制
- ✅ 构建环境一致性保证
- ⚠️ 首次构建需下载镜像 (~2GB)
- ⚠️ 构建速度可能略慢于原生环境

---

### ADR-009: Blinks 演示范围锁定 (短文本输入 Skill)

**Date**: 2024-12-14
**Status**: Accepted
**Trigger**: Phase 2 前优化方案审计

**Context**:
- Blinks (Solana Actions) 对 URL 长度和 Metadata 有严格限制
- 复杂 Skill (如 `code-reviewer` 需要代码片段) 无法通过 Blinks 优雅传递

**Decision**:
- Blinks 演示仅限短文本输入 Skill: `price-oracle`, `tweet-sentiment`
- 复杂输入 Skill → Blink 提供 Deep Link 跳转到 Dashboard

**Consequences**:
- ✅ 降低 Blinks 集成风险
- ✅ 保证演示稳定性
- ⚠️ 复杂 Skill 需通过 Dashboard 入口

---

### ADR-010: Phase 2 CONDITIONAL ENTRY (优化方案审计)

**Date**: 2024-12-14
**Status**: Accepted
**Trigger**: 用户提交 Phase 2 前优化方案，CSA 审计通过

**Context**:
Phase 1 以 PARTIAL GATE 状态完成：
- Task-06: .so 构建成功，IDL 生成失败
- Task-07: AC-03 通过，AC-01/02/04/05 因 IDL 阻塞

用户提出 4 项优化修正：
1. P0-逻辑: 缺失 Challenger 验证机制
2. P0-数据: 结果数据可用性 (DA) 未明确
3. P1-风险: Blinks Payload 限制
4. P1-体验: Mock 数据注入 (演示兜底)

**CSA Audit Result**: 4/4 项 **APPROVE**

**Decision**:
1. Phase 1 标记为 **PARTIAL GATE**
2. Phase 2 以 **CONDITIONAL ENTRY** 模式进入
3. 优化方案修正项整合入 Phase 2/3 任务队列：
   - P2-VERIFY: Challenger/Verifier 验证脚本 (P0)
   - P2-DA: 结果数据可用性流程 (P0)
   - P2-CU: Transfer Hook CU 压测 (P1, 依赖 Task-07B)
   - P3-BLINKS: 范围锁定 (ADR-009)
   - P3-MOCK: Mock 数据注入脚本
4. Task-07B (IDL 修复) 作为 Phase 2 并行任务

**Consequences**:
- ✅ 逻辑闭环完善 (Challenger 机制)
- ✅ 交付闭环完善 (DA 流程)
- ✅ 演示稳定性保障 (Mock 数据)
- ⚠️ Phase 2 工作量增加

---

### ADR-012: Anchor 0.31.1 升级尝试与 Windows 工具链限制

**Date**: 2024-12-16
**Status**: Accepted
**Trigger**: Task-07B 技术债务修复尝试

**Context**:
- Anchor CLI 0.31.1 发布，声称修复了 `proc_macro_span` IDL 生成问题
- 当前版本 0.30.1，存在 ADR-008 记录的 IDL 生成失败

**Actions Taken**:
1. ✅ 升级 Anchor CLI: 0.30.1 → 0.31.1
2. ✅ 同步更新依赖: anchor-lang/anchor-spl 0.30.1 → 0.31.1
3. ❌ `anchor build -p exo_hooks` 失败

**Root Cause (New)**:
```
[ERROR cargo_build_sbf] Can't get home directory path: environment variable not found
platform-tools: 拒绝访问 (os error 5)
```

Windows platform-tools 存在两个持续性问题：
1. HOME 环境变量未设置 (已通过 `$env:HOME = $env:USERPROFILE` 解决)
2. 权限访问被拒绝 (os error 5) - **上游缺陷，无法本地解决**

**Decision**:
1. **保留手动 IDL 方案** (Task-06B 产出物 `exo_hooks.json`)
2. Task-07B 标记为 **WONT_FIX** (依赖上游工具链，Windows 环境不可解决)
3. P2-CU 解除对 Task-07B 的依赖，使用现有手动 IDL 进行压测
4. Anchor 0.31.1 升级保留，用于 exo-core 等无需 platform-tools 的操作

**Future Work**:
- 监控 Anza platform-tools Windows 版本更新
- 考虑 WSL2/Linux 环境作为构建备选方案

**Consequences**:
- ✅ Task-07B 技术债务闭环 (明确不可修复原因)
- ✅ P2-CU 可基于手动 IDL 继续执行
- ⚠️ Windows 环境 IDL 自动生成仍不可用

---

## Archived Tasks

### [ARCHIVED] P3D-FIX: Frontend Bugfix (2024-12-16)

**Status**: ✅ Complete
**Timestamp**: 2025-12-16T15:55:00+08:00
**Report**: `.project_state/reports/P3D-FIX_report.json`

**Subtasks**: 14/14 完成
| 类别 | 数量 | 描述 |
|------|------|------|
| 🔴 Critical | 3/3 | 剪贴板异步错误、Header 死链接、@ts-ignore 移除 |
| 🟡 Improvement | 6/6 | React Query 统一、Error 状态、空状态 UI 等 |
| 🟢 Refactor | 5/5 | CORS 提取、CSS 清理、死代码移除 |

**Verification**: `pnpm run build` ✅ (Exit code: 0)

**Diagnostics Resolved**:
- `mock-data.ts` 语法错误 (缺失 );)
- `particle-network.tsx` mesh.current 类型错误

---

*Last Updated: 2024-12-14 22:35 UTC+8*
