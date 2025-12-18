---
# 元数据 (必填)
name: image-gen
version: "1.0.0"
description: 根据文本描述生成图像（返回生成参数和预览URL）
author: ExoProtocolDemo

# 定价 (必填)
pricing:
  model: per_call
  price_lamports: 50000

# 运行时要求 (必填)
runtime:
  docker_image: exo-runtime-python-3.11
  docker_image_hash: sha256:def789ghi012...
  entrypoint: scripts/main.py
  timeout_seconds: 60

# 输入输出 Schema (必填)
io:
  input_schema:
    type: object
    properties:
      prompt:
        type: string
        description: 图像描述文本
        maxLength: 2000
      style:
        type: string
        description: 图像风格
        enum: ["realistic", "anime", "sketch", "oil-painting", "watercolor"]
        default: "realistic"
      size:
        type: string
        description: 图像尺寸
        enum: ["256x256", "512x512", "1024x1024"]
        default: "512x512"
      seed:
        type: integer
        description: 随机种子（可选，用于复现）
        minimum: 0
        maximum: 2147483647
    required:
      - prompt
    additionalProperties: false
    maxProperties: 20
  output_schema:
    type: object
    properties:
      image_url:
        type: string
        description: 生成图像的临时URL
      generation_params:
        type: object
        description: 实际使用的生成参数
      estimated_cost:
        type: number
        description: 估算的计算成本

# Tool Annotations - 行为注解
annotations:
  readOnlyHint: true
  destructiveHint: false
  idempotentHint: false
  openWorldHint: false
---

# Image Generation Skill

## 功能描述

根据文本描述生成高质量图像。支持多种艺术风格和分辨率。

**适用场景**:
- 创意设计原型
- 营销素材生成
- 概念艺术创作
- 产品可视化

## 使用示例

**输入**:
```json
{
  "prompt": "一只可爱的橘猫坐在窗台上看雪景",
  "style": "watercolor",
  "size": "512x512",
  "seed": 42
}
```

**输出**:
```json
{
  "image_url": "ipfs://Qm.../cat_snow.png",
  "generation_params": {
    "prompt": "一只可爱的橘猫坐在窗台上看雪景",
    "style": "watercolor",
    "size": "512x512",
    "seed": 42,
    "model": "sdxl-1.0"
  },
  "estimated_cost": 0.002
}
```

## 注意事项

- 提示词最大 2000 字符
- 图像存储 24 小时后自动清理
- 不支持 NSFW 内容（会被过滤）
- idempotentHint=false: 相同输入可能产生不同结果（除非指定 seed）
