---
# 元数据 (必填)
name: code-review
version: "1.0.0"
description: 分析代码质量并提供改进建议
author: ExoProtocolDemo

# 定价 (必填)
pricing:
  model: per_call
  price_lamports: 25000

# 运行时要求 (必填)
runtime:
  docker_image: exo-runtime-python-3.11
  docker_image_hash: sha256:jkl901mno234...
  entrypoint: scripts/main.py
  timeout_seconds: 45

# 输入输出 Schema (必填)
io:
  input_schema:
    type: object
    properties:
      code:
        type: string
        description: 待审查的代码内容
        maxLength: 50000
      language:
        type: string
        description: 编程语言
        enum: ["python", "javascript", "typescript", "rust", "solidity", "go"]
      review_focus:
        type: array
        description: 审查重点
        items:
          type: string
          enum: ["security", "performance", "style", "best-practices"]
        default: ["security", "best-practices"]
      severity_threshold:
        type: string
        description: 最低报告严重程度
        enum: ["info", "warning", "error", "critical"]
        default: "info"
    required:
      - code
      - language
    additionalProperties: false
    maxProperties: 20
  output_schema:
    type: object
    properties:
      issues:
        type: array
        items:
          type: object
          properties:
            line:
              type: integer
            severity:
              type: string
            category:
              type: string
            message:
              type: string
            suggestion:
              type: string
      summary:
        type: object
        properties:
          total_issues:
            type: integer
          critical_count:
            type: integer
          error_count:
            type: integer
          warning_count:
            type: integer
          info_count:
            type: integer
      overall_score:
        type: integer
        description: 代码质量评分 (0-100)

# Tool Annotations - 行为注解
annotations:
  readOnlyHint: true
  destructiveHint: false
  idempotentHint: true
  openWorldHint: false
---

# Code Review Skill

## 功能描述

自动化代码审查工具，检测代码中的安全漏洞、性能问题和风格问题，并提供改进建议。

**适用场景**:
- PR 预审查
- 安全漏洞扫描
- 代码质量门禁
- 学习最佳实践

## 使用示例

**输入**:
```json
{
  "code": "def get_user(id):\n    query = f\"SELECT * FROM users WHERE id = {id}\"\n    return db.execute(query)",
  "language": "python",
  "review_focus": ["security", "best-practices"],
  "severity_threshold": "warning"
}
```

**输出**:
```json
{
  "issues": [
    {
      "line": 2,
      "severity": "critical",
      "category": "security",
      "message": "SQL Injection vulnerability detected",
      "suggestion": "Use parameterized queries: db.execute('SELECT * FROM users WHERE id = ?', [id])"
    },
    {
      "line": 1,
      "severity": "warning",
      "category": "best-practices",
      "message": "Missing type hints for function parameters",
      "suggestion": "Add type hints: def get_user(id: int) -> dict:"
    }
  ],
  "summary": {
    "total_issues": 2,
    "critical_count": 1,
    "error_count": 0,
    "warning_count": 1,
    "info_count": 0
  },
  "overall_score": 45
}
```

## 注意事项

- 代码内容最大 50KB
- 支持 6 种主流编程语言
- 安全问题优先级最高
- 建议与 CI/CD 流程集成
