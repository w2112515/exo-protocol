# Phase 0: 标准定义任务清单

**Phase**: 0 - 标准定义
**预计时间**: Day 1-2
**状态**: ✅ Complete

---

## Task-00: SKILL_SCHEMA.md 规范文档 ✅

**Status**: COMPLETED (已在初始化时创建)
**Location**: `docs/SKILL_SCHEMA.md`

---

## Task-01: AGENT_STANDARD.md 规范文档 ✅

**Status**: COMPLETED (已在初始化时创建)
**Location**: `docs/AGENT_STANDARD.md`

---

## Task-02: 创建 5 个示例 Skill 包 ✅

**Status**: COMPLETED
**Priority**: HIGH
**External Dependencies**: 无

### Input
创建 5 个符合 SKILL.md v1.1 规范的示例 Skill 包，每个包含：
- `SKILL.md` (YAML frontmatter + 说明文档)
- `scripts/main.py` (入口脚本 - 可以是 Mock 实现)

### 示例 Skill 列表

| # | Name | 类型 | annotations |
|---|------|------|-------------|
| 1 | `token-analyzer` | 数据分析 | readOnly✅ idempotent✅ |
| 2 | `tweet-sentiment` | NLP | readOnly✅ idempotent✅ |
| 3 | `code-reviewer` | 代码审计 | readOnly✅ idempotent✅ |
| 4 | `image-generator` | 生成式 | openWorld✅ |
| 5 | `price-oracle` | 数据获取 | openWorld✅ |

### Output
```
sre-runtime/examples/
├── token-analyzer/
│   ├── SKILL.md
│   └── scripts/main.py
├── tweet-sentiment/
│   ├── SKILL.md
│   └── scripts/main.py
├── code-reviewer/
│   ├── SKILL.md
│   └── scripts/main.py
├── image-generator/
│   ├── SKILL.md
│   └── scripts/main.py
└── price-oracle/
    ├── SKILL.md
    └── scripts/main.py
```

### Verify
1. 每个 SKILL.md 包含完整的 YAML frontmatter
2. 每个 SKILL.md 包含 `annotations` 字段
3. 每个 `input_schema` 包含 `additionalProperties: false`
4. 每个 `scripts/main.py` 可执行 (接收 INPUT_JSON 环境变量)
5. 运行 `python scripts/main.py` 不报错

### 验收标准
- [ ] 5 个目录结构正确
- [ ] 5 个 SKILL.md 符合 v1.1 规范
- [ ] 5 个 main.py 可运行

---

## Phase 0 完成条件

- [x] Task-00: SKILL_SCHEMA.md
- [x] Task-01: AGENT_STANDARD.md
- [x] Task-02: 5 个示例 Skill 包

**Gate**: Phase 0 → Phase 1 ✅ **UNLOCKED**

---

*Created: 2024-12-14*
*Last Updated: 2024-12-14 00:41 UTC+8*
