---
# 元数据 (必填)
name: web-search
version: "1.0.0"
description: 执行网页搜索并返回结构化结果摘要
author: ExoProtocolDemo

# 定价 (必填)
pricing:
  model: per_call
  price_lamports: 5000

# 运行时要求 (必填)
runtime:
  docker_image: exo-runtime-python-3.11
  docker_image_hash: sha256:ghi345jkl678...
  entrypoint: scripts/main.py
  timeout_seconds: 45

# 输入输出 Schema (必填)
io:
  input_schema:
    type: object
    properties:
      query:
        type: string
        description: 搜索查询关键词
        maxLength: 500
      max_results:
        type: integer
        description: 返回结果数量
        default: 5
        minimum: 1
        maximum: 20
      search_type:
        type: string
        description: 搜索类型
        enum: ["web", "news", "academic"]
        default: "web"
      time_range:
        type: string
        description: 时间范围过滤
        enum: ["any", "day", "week", "month", "year"]
        default: "any"
    required:
      - query
    additionalProperties: false
    maxProperties: 20
  output_schema:
    type: object
    properties:
      results:
        type: array
        items:
          type: object
          properties:
            title:
              type: string
            url:
              type: string
            snippet:
              type: string
            published_date:
              type: string
      total_found:
        type: integer
      search_time_ms:
        type: integer

# Tool Annotations - 行为注解
annotations:
  readOnlyHint: true
  destructiveHint: false
  idempotentHint: false
  openWorldHint: true
---

# Web Search Skill

## 功能描述

执行互联网搜索并返回结构化的搜索结果。支持普通网页、新闻和学术论文搜索。

**适用场景**:
- 实时信息检索
- 新闻追踪
- 学术文献查找
- 竞品调研

## 使用示例

**输入**:
```json
{
  "query": "Solana Token-2022 transfer hooks",
  "max_results": 3,
  "search_type": "web",
  "time_range": "month"
}
```

**输出**:
```json
{
  "results": [
    {
      "title": "Token-2022 Transfer Hooks Guide - Solana Docs",
      "url": "https://solana.com/docs/token-2022/transfer-hooks",
      "snippet": "Transfer hooks allow token creators to execute custom logic...",
      "published_date": "2024-12-01"
    },
    {
      "title": "Building with Transfer Hooks | Solana Cookbook",
      "url": "https://solanacookbook.com/token-2022/transfer-hooks",
      "snippet": "A comprehensive guide to implementing transfer hooks...",
      "published_date": "2024-11-28"
    }
  ],
  "total_found": 1250,
  "search_time_ms": 342
}
```

## 注意事项

- 查询字符串最大 500 字符
- 结果缓存 5 分钟
- openWorldHint=true: 此 Skill 需要访问外部网络
- idempotentHint=false: 搜索结果可能随时间变化
