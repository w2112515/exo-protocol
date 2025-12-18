# SKILL.md 规范 v1.1

**基于**: 城邦 V5.0 §7.3 标准 + Tool Annotations
**版本**: 1.1.0
**更新**: 2024-12-14

---

## 1. 目录结构

```
my-skill/
├── SKILL.md              # 主指令文件 (必需)
├── scripts/              # 可执行脚本
│   └── main.py
├── references/           # 参考文档
└── assets/               # 模板和资源
```

## 2. SKILL.md YAML Frontmatter

```yaml
---
# 元数据 (必填)
name: string                    # Skill 唯一标识符 (kebab-case)
version: string                 # 语义化版本号 (semver)
description: string             # 简短描述 (<100字符)
author: string                  # 创作者 Solana 地址

# 定价 (必填)
pricing:
  model: "per_call" | "subscription"  # MVP 仅支持 per_call
  price_lamports: number              # 单次调用价格 (lamports)
  
# 运行时要求 (必填)
runtime:
  docker_image: string          # 标准镜像 (exo-runtime-python-3.11)
  docker_image_hash: string     # SHA256 哈希 (确定性构建)
  entrypoint: string            # 入口脚本 (scripts/main.py)
  timeout_seconds: number       # 最大执行时间 (默认60)

# 输入输出 Schema (必填)
io:
  input_schema:                 # JSON Schema
    type: object
    properties: {}
    additionalProperties: false # 禁止额外字段，防止注入
    maxProperties: 20           # 限制最大属性数
  output_schema:                # JSON Schema
    type: object
    properties: {}

# Tool Annotations - 行为注解 (可选，默认值如下)
# 参考: 城邦 V5.0 §7.3.2.1
annotations:
  readOnlyHint: true            # 工具只读，不修改环境 (默认 true)
  destructiveHint: false        # 工具不执行破坏性操作 (默认 false)
  idempotentHint: true          # 重复调用无副作用 (默认 true, 沙盒可重放)
  openWorldHint: false          # 工具不与外部系统交互 (默认 false, 网络禁用)
---

# Skill 名称

## 功能描述

[描述 Skill 的功能和使用场景]

## 使用示例

[提供输入输出示例]

## 注意事项

[列出使用限制和注意事项]
```

## 3. Tool Annotations 说明

| Annotation | 类型 | 含义 | 影响 |
|------------|------|------|------|
| `readOnlyHint` | boolean | 工具只读，不修改环境 | A/B 类任务自动标记 |
| `destructiveHint` | boolean | 工具会破坏性修改数据 | 需要更高 Security Bond |
| `idempotentHint` | boolean | 重复调用无副作用 | 可安全重试/沙盒重放 |
| `openWorldHint` | boolean | 工具与外部系统交互 | 需要 Integration 测试 |

## 4. 审计状态

| 状态 | 说明 |
|------|------|
| `Unverified` | 未验证 (任何人可用) |
| `Optimistic` | 乐观上架 (质押保证金) |
| `Audited` | 通过审计 (Verifier签名) |

## 5. 版本兼容性

| 版本变更 | 兼容性 | 审计要求 |
|----------|--------|----------|
| **Patch** (1.0.0 → 1.0.1) | 完全兼容 | 免审计 |
| **Minor** (1.0.0 → 1.1.0) | 向后兼容 | 简化审计 |
| **Major** (1.0.0 → 2.0.0) | 可能不兼容 | 完整审计 |

---

**参考**: 城邦 V5.0 总纲 §7.3
