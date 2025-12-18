# Phase 1: 协议层任务清单

**Phase**: 1 - 协议层
**预计时间**: Week 1
**状态**: 🟢 Active

---

## Task-03: Anchor 项目初始化 + Skill Registry 合约 🟡

**Status**: DISPATCHED
**Priority**: HIGH
**External Dependencies**: 无 (本地开发)

### Input

在 `anchor/` 目录下初始化 Anchor 项目并创建 Skill Registry 合约。

### Output

```
anchor/
├── Anchor.toml (已存在，需更新)
├── Cargo.toml
├── programs/
│   └── exo_skill_registry/
│       ├── Cargo.toml
│       └── src/
│           └── lib.rs
├── tests/
│   └── exo_skill_registry.ts
└── migrations/
    └── deploy.ts
```

### 合约要求 (参考 MVP v2.0.md §3.2.1)

**文件位置**: `anchor/programs/exo-core/src/instructions/register_skill.rs`

**Skill Registry 核心功能**:

1. **register_skill(content_hash, price_lamports)** 指令
   - PDA: `[b"skill", authority, name_hash]`
   - 创建 SkillAccount

2. **update_skill(new_content_hash, new_price)** 指令
   - 权限: 仅 authority 可调用
   - 版本号自增

3. **deprecate_skill()** 指令
   - 权限: 仅 authority 可调用
   - 下架 Skill

### Account 结构 (严格遵循 MVP 文档)

```rust
#[account]
pub struct SkillAccount {
    pub authority: Pubkey,           // 创作者地址
    pub content_hash: [u8; 32],      // SKILL.md Arweave TxID 哈希
    pub price_lamports: u64,         // 单次调用价格
    pub total_calls: u64,            // 累计调用次数
    pub total_revenue: u64,          // 累计收入
    pub version: u8,                 // 版本号
    pub audit_status: AuditStatus,   // 审计状态
    pub created_at: i64,             // 创建时间
    pub bump: u8,                    // PDA bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum AuditStatus {
    Unverified,     // 未验证
    Optimistic,     // 乐观上架 (质押保证金)
    Audited,        // 通过审计
}
```

### Verify

1. `anchor build` 成功 (exit code 0)
2. 生成 IDL 文件 `target/idl/exo_core.json`
3. 合约包含 3 个指令: register_skill, update_skill, deprecate_skill
4. SkillAccount 结构包含: authority, content_hash, price_lamports, total_calls, total_revenue, version, audit_status, created_at, bump
5. AuditStatus enum 定义: Unverified, Optimistic, Audited

### 验收标准

- [ ] Anchor 项目结构正确 (programs/exo-core/)
- [ ] Skill Registry 合约编译通过
- [ ] IDL 文件生成 (target/idl/exo_core.json)
- [ ] 基础测试文件存在 (tests/skill.test.ts)

---

## Task-04: Agent Identity 合约 (cNFT) ⬜

**Status**: PENDING
**依赖**: Task-03 完成

### 概要
使用 Metaplex Bubblegum 创建 Agent cNFT 身份合约。

---

## Task-05: Escrow Settlement 合约 ⬜

**Status**: PENDING
**依赖**: Task-03, Task-04 完成

### 概要
创建托管结算合约，支持 Skill 调用的支付流程。

---

## Task-06: Token-2022 Transfer Hook 合约 ⬜

**Status**: PENDING
**依赖**: Task-05 完成

### 概要
实现 Token-2022 Transfer Hook，在代币转账时触发版税/分成逻辑。

---

## Task-07: 单元测试 (Bankrun) ⬜

**Status**: PENDING
**依赖**: Task-03 ~ Task-06 完成

### 概要
使用 Bankrun 编写全面的单元测试覆盖所有合约。

---

## Phase 1 完成条件

- [ ] Task-03: Skill Registry 合约
- [ ] Task-04: Agent Identity 合约
- [ ] Task-05: Escrow Settlement 合约
- [ ] Task-06: Transfer Hook 合约
- [ ] Task-07: 单元测试

**Gate**: Phase 1 → Phase 2 解锁条件 = 所有合约编译通过 + 测试覆盖

---

*Created: 2024-12-14*
*Last Updated: 2024-12-14 01:12 UTC+8*
