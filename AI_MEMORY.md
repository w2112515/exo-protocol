# AI_MEMORY.md - Exo Protocol

**Project**: Exo Protocol - Skill-Native PayFi for Agent Economy
**Version**: MVP 2.1.0
**Target**: Solana Colosseum Hackathon
**Created**: 2024-12-14

---

## Strategic DNA (硬编码 - 禁止修改)

### Tech Stack
| Layer | Technology | Version |
|-------|------------|---------|
| **Contract** | Anchor (Rust) | 0.30.x |
| **Token** | Token-2022 (Transfer Hooks) | - |
| **Identity** | Metaplex Bubblegum (cNFT) | - |
| **Runtime** | Python 3.11 + Docker | - |
| **Frontend** | Next.js 15 (App Router) | ADR-011 |
| **Styling** | TailwindCSS + shadcn/ui + CVA | ADR-011 |
| **State** | TanStack Query 5.x + Zustand 4.x | ADR-011 |
| **Visualization** | React Flow + Recharts + R3F (Hero) | ADR-011 |
| **Wallet** | @solana/wallet-adapter | - |

### Architecture Directives
- **OPOS First**: 必须使用 Solana 独有技术 (Token-2022, cNFT, Blinks)
- **V5.0 Aligned**: 遵循城邦 V5.0 Skill 标准 + Tool Annotations
- **Security**: Sandbox 输入验证 (100KB limit, 20 props max)

### Design References (设计参考文档)
| 文档 | 路径 | 说明 |
|------|------|------|
| **MVP 执行方案** | `docs/mvp v2.0.md` | v2.2.0 完整 Phase 1-4 规划 (上游规范) |
| **前端设计规范** | `.project_state/plans/P3-FRONTEND-DESIGN.md` | v2.0 Terminal Minimalism (ADR-011) |
| **任务规格** | `.project_state/plans/P3A-FOUNDATION_spec.json` | Phase 3-A 原子任务 |

### Forbidden
- ❌ Redux / MobX (使用 Zustand)
- ❌ 直接使用 Claude/OpenAI API Key (后端无关)
- ❌ 跳过 Transfer Hook (核心 OPOS 得分点)

---

## Active Blueprint (当前任务 - 不超过50行)

### Phase 10: Hackathon Final Polish [🔄 IN PROGRESS]

> **Priority**: P0 (最后一公里)
> **Goal**: Dashboard 深度优化 & 交互体验升级 (基于 P10-FINAL-POLISH)
> **CSA Audit**: P10-C01/C02/C03/C04 已完成，进入 Dashboard 专项

---

### [x] P10-C01/02/03/04: Critical 基础建设 ✅ PASS
- **Summary**: Skills/Docs/Blinks 页面及底层数据模型已就绪 (见历史归档)

### [x] P10-S01: Dashboard KPI 增强 ✅ PASS
- **Spec**: `.project_state/plans/P10-S01_spec.md`
- **Type**: `Standard / UI` | **Risk**: 🟡 Medium
- **Summary**: 新增 Total Royalties (紫色高亮), Success Rate, Unique Agents 指标
- **Blocked**: No

### [x] P10-S03: Agent Flow 激活 ✅ PASS
- **Spec**: `.project_state/plans/P10-S03_spec.md`
- **Type**: `Standard / UI` | **Risk**: 🟡 Medium
- **Summary**: 节点显示真实 SOL 金额，展示 Transfer Hook 分账可视化
- **Blocked**: No

### [x] P10-L01: 统一 UI ✅ PASS
- **Spec**: `.project_state/plans/P10-L01_spec.md`
- **Type**: `Simple / UI` | **Risk**: 🟢 Low
- **Summary**: 添加 Header 组件 + Mock 时间戳动态化
- **Blocked**: No

---

## WAP Task Queue

> **Status**: ✅ Phase 10 Dashboard Polish - 3 Tasks COMPLETED
> **Parallel OK**: P10-S01, P10-S03, P10-L01 可并行执行 (无依赖)
> **Priority**: P10-S01 > P10-S03 > P10-L01 (按业务价值排序)

## Deployment Assets

| 资产 | URL |
|------|-----|
| **生产网站** | https://exo-frontend-psi.vercel.app |
| **dial.to Blink** | https://dial.to/devnet?action=solana-action:https://exo-frontend-psi.vercel.app/api/actions/skill/skill-code-reviewer-v1 |
| **Solscan 交易** | https://solscan.io/account/Gav2g7qmk5FyUntJHzDBnb8FGRcuvZUbF1EiLPzcMFjB?cluster=devnet |

## Resource Status (R6 资源前置)

| 资源 | 类型 | 状态 | 备注 |
|------|------|------|------|
| Helius API Key | 私有 API | ✅ 已确认 | RPC + WebSocket (Phase 4 实时日志) |
| ~~Arweave/Irys~~ | ~~私有 API~~ | ✅ 已降级 | → 本地/GitHub 存储 (ADR-003) |
| Docker Desktop | 本地服务 | ✅ v29.1.2 | SRE 沙盒 |
| Solana CLI | 本地服务 | ✅ v2.0.21 (Agave) | ADR-005 完成 |
| Anchor CLI | 本地服务 | ✅ v0.31.1 | 合约框架 (Upgraded) |
| Node.js 18+ | 本地服务 | ✅ v22.12.0 | 前端/SDK |
| Python 3.11+ | 本地服务 | ✅ v3.12.6 | SRE 运行时 |
| Devnet 合约 | 公开 API | ✅ 已部署 | exo_core + exo_hooks |
| Vercel Token | 私有 API | ✅ 已配置 | 生产部署 |
| Devnet SOL | 公开 API | ✅ 4.89 SOL | 足够刷数据 |

---

## Gate Status

| Phase | Status | Evidence |
|-------|--------|----------|
| Phase 0 | ✅ Complete | Task-00✅ Task-01✅ Task-02✅ |
| Phase 1 | 🟡 **PARTIAL GATE** | Task-03✅ Task-04✅ Task-05✅ Task-06🟡 Task-07🟡 |
| Phase 2 | ✅ **COMPLETE** | P2-VERIFY✅ P2-DA✅ P2-CU✅ P2-LISTENER✅ P2-SANDBOX✅ P2-COMMITTER✅ P2-ORCHESTRATOR✅ |
| Phase 3 | ✅ **COMPLETE** | P3-MOCK✅ P3-DASHBOARD✅ P3-BLINKS✅ P3-SDK✅ P3D-FIX✅ |
| Phase 4 | ✅ **COMPLETE** | P4-01✅ P4-02✅ P4-03✅ P4-04✅ P4-05✅ P4-FIX-01✅ P4-FIX-02✅ P4-FIX-03✅ |
| Phase 5 | ✅ **COMPLETE** | P5-DOC-01✅ P5-DOC-02✅ P5-DEMO-01✅ P5-REFACTOR-01✅ |
| Phase 6 | ✅ **COMPLETE** | P6-VIDEO-01✅ P6-DEMO-01✅ P6-CLI-01✅ P6-README-01✅ |
| Phase 7 | ✅ **COMPLETE** | P7-FIX-01[~] P7-FIX-01-PATCH✅ P7-DOC-01✅ P7-DOC-02✅ P7-DOC-03✅ |
| Phase 8 | ✅ **COMPLETE** | P8-FIX-01✅ P8-DEPLOY-01✅ P8-SCRIPT-01✅ P8-SCRIPT-02✅ P8-VERIFY✅ |
| Phase 9 | ✅ **COMPLETE** | P9-FIX-01✅ P9-FIX-02✅ P9-FIX-03✅ P9-FIX-04✅ P9-FIX-05✅ P9-DOC-01✅ |
| Phase 10 | ✅ **COMPLETE** | P10-C03✅ P10-C04✅ P10-S01✅ P10-S03✅ P10-L01✅ |

---

*Last Updated: 2025-12-19 02:20 UTC+8 (CSA Status: P10-S01/S03/L01 Completed)*


