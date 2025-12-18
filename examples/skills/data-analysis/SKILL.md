---
# 元数据 (必填)
name: data-analysis
version: "1.0.0"
description: 分析结构化数据并生成统计报告和可视化建议
author: ExoProtocolDemo

# 定价 (必填)
pricing:
  model: per_call
  price_lamports: 30000

# 运行时要求 (必填)
runtime:
  docker_image: exo-runtime-python-3.11
  docker_image_hash: sha256:mno567pqr890...
  entrypoint: scripts/main.py
  timeout_seconds: 60

# 输入输出 Schema (必填)
io:
  input_schema:
    type: object
    properties:
      data:
        type: array
        description: 数据数组（JSON 格式）
        items:
          type: object
        maxItems: 10000
      columns:
        type: array
        description: 要分析的列名（可选，默认分析全部）
        items:
          type: string
      analysis_types:
        type: array
        description: 分析类型
        items:
          type: string
          enum: ["descriptive", "correlation", "distribution", "outliers", "trends"]
        default: ["descriptive"]
      group_by:
        type: string
        description: 分组字段（可选）
    required:
      - data
    additionalProperties: false
    maxProperties: 20
  output_schema:
    type: object
    properties:
      statistics:
        type: object
        description: 描述性统计
      correlations:
        type: object
        description: 相关性分析
      outliers:
        type: array
        description: 异常值检测结果
      visualization_suggestions:
        type: array
        description: 推荐的可视化类型
      insights:
        type: array
        description: 自动发现的数据洞察

# Tool Annotations - 行为注解
annotations:
  readOnlyHint: true
  destructiveHint: false
  idempotentHint: true
  openWorldHint: false
---

# Data Analysis Skill

## 功能描述

对结构化数据进行统计分析，自动检测异常值，计算相关性，并提供可视化建议。

**适用场景**:
- 数据探索性分析 (EDA)
- 业务指标分析
- 异常检测
- 报表生成

## 使用示例

**输入**:
```json
{
  "data": [
    {"date": "2024-01-01", "revenue": 1000, "users": 50},
    {"date": "2024-01-02", "revenue": 1200, "users": 55},
    {"date": "2024-01-03", "revenue": 950, "users": 48},
    {"date": "2024-01-04", "revenue": 1500, "users": 70},
    {"date": "2024-01-05", "revenue": 1100, "users": 52}
  ],
  "columns": ["revenue", "users"],
  "analysis_types": ["descriptive", "correlation", "outliers"]
}
```

**输出**:
```json
{
  "statistics": {
    "revenue": {
      "count": 5,
      "mean": 1150,
      "std": 202.48,
      "min": 950,
      "max": 1500,
      "median": 1100
    },
    "users": {
      "count": 5,
      "mean": 55,
      "std": 8.37,
      "min": 48,
      "max": 70,
      "median": 52
    }
  },
  "correlations": {
    "revenue_users": {
      "coefficient": 0.96,
      "interpretation": "strong_positive"
    }
  },
  "outliers": [
    {"column": "users", "value": 70, "index": 3, "z_score": 1.79}
  ],
  "visualization_suggestions": [
    {"type": "line_chart", "columns": ["date", "revenue"], "reason": "时序数据适合折线图"},
    {"type": "scatter_plot", "columns": ["users", "revenue"], "reason": "强相关性适合散点图"}
  ],
  "insights": [
    "revenue 与 users 呈强正相关 (r=0.96)",
    "2024-01-04 的 users 值 (70) 偏高，可能为异常值或特殊事件"
  ]
}
```

## 注意事项

- 数据量限制 10000 条记录
- 仅支持数值型列的统计分析
- 相关性分析需要至少 2 列数值数据
- 异常值检测基于 Z-score (|Z| > 1.5 标记为潜在异常)
