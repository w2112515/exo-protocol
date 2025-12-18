# P10-C03: 扩展 Skill 数据模型

## Meta
- **Type**: `Critical / Data Model`
- **Risk Level**: 🔴 High (影响多个组件)
- **depends_on**: P10-C01✅, P10-C02✅

## Input Files
- `exo-frontend/lib/mock-data.ts` (L14-22: Skill interface)
- `exo-frontend/public/mock/mock_skills.json` (8 条记录)
- `exo-frontend/app/api/actions/skill/[skillId]/route.ts` (Blink Metadata Handler)

## External Dependencies
| 资源 | 类型 | 状态 |
|------|------|------|
| 无外部依赖 | - | ✓ |

## Action Steps

### Step 1: 扩展 Skill Interface (`mock-data.ts`)

将现有 Interface 扩展为：

```typescript
export interface Skill {
  // === 基础字段 (已有) ===
  skill_id: string;
  name: string;
  version: string;
  category: string;
  price_lamports: number;
  execution_count: number;
  success_rate: number;
  
  // === 新增: 描述与能力 ===
  description: string;           // 1-2 句话描述技能能力
  input_schema: string;          // 输入参数说明 (简化版)
  output_format: string;         // 输出格式说明
  
  // === 新增: 性能指标 ===
  avg_latency_ms: number;        // 平均响应时间 (毫秒)
  
  // === 新增: Exo 差异化 (链上可验证) ===
  creator_address: string;       // 创作者 Solana 地址
  royalty_rate: number;          // 版税比例 (0.10 = 10%)
  total_royalties_earned: number;// 累计版税收入 (lamports)
  on_chain_verified: boolean;    // 是否链上注册
  
  // === 新增: 元数据 ===
  tags: string[];                // 细粒度标签
  last_updated: string;          // ISO 时间戳
}
```

### Step 2: 更新 isValidSkill 类型守卫

在 `isValidSkill` 函数中添加新字段验证 (可选字段用 optional check)。

### Step 3: 更新 Blink API Handler (`route.ts`)

1. 同步更新 `route.ts` 中的 `MockSkill` 接口定义，建议直接导入：
   `import { Skill } from '@/lib/mock-data';`
2. 更新 `GET` 方法中的 `description` 生成逻辑：
   - 优先使用 `skill.description`
   - 保留原有的价格/成功率后缀信息
   - 格式示例: `AI-powered code review... | Success: 88% | Price: 0.002 SOL`

### Step 4: 更新 Mock 数据 (`mock_skills.json`)

请直接使用以下完整的 JSON 数据覆盖原文件，确保所有字段齐全：

```json
[
  {
    "skill_id": "skill-code-reviewer-v1",
    "name": "code-reviewer",
    "version": "3.1.17",
    "category": "dev-tools",
    "price_lamports": 2889,
    "execution_count": 9684,
    "success_rate": 0.88,
    "description": "AI-powered code review that analyzes code quality, security vulnerabilities, and suggests improvements.",
    "input_schema": "{ code: string, language: string }",
    "output_format": "{ issues: Issue[], suggestions: string[], score: number }",
    "avg_latency_ms": 1250,
    "creator_address": "Gav2g7qmk5FyUntJHzDBnb8FGRcuvZUbF1EiLPzcMFjB",
    "royalty_rate": 0.1,
    "total_royalties_earned": 2797707,
    "on_chain_verified": true,
    "tags": ["code-quality", "security", "gpt-4"],
    "last_updated": "2025-12-18T10:30:00Z"
  },
  {
    "skill_id": "skill-translation-engine-v1",
    "name": "translation-engine",
    "version": "1.1.6",
    "category": "nlp",
    "price_lamports": 1538,
    "execution_count": 8289,
    "success_rate": 0.914,
    "description": "High-accuracy neural machine translation supporting 50+ languages with context awareness.",
    "input_schema": "{ text: string, target_lang: string }",
    "output_format": "{ translated_text: string, confidence: number }",
    "avg_latency_ms": 450,
    "creator_address": "8Fw7g...3kL9",
    "royalty_rate": 0.1,
    "total_royalties_earned": 1274848,
    "on_chain_verified": true,
    "tags": ["translation", "multilingual", "neural-net"],
    "last_updated": "2025-12-17T14:20:00Z"
  },
  {
    "skill_id": "skill-report-generator-v1",
    "name": "report-generator",
    "version": "3.3.20",
    "category": "business",
    "price_lamports": 2858,
    "execution_count": 6883,
    "success_rate": 0.842,
    "description": "Automated business report generation from raw data. Creates executive summaries and charts.",
    "input_schema": "{ data: any[], type: string }",
    "output_format": "{ pdf_url: string, summary: string }",
    "avg_latency_ms": 3200,
    "creator_address": "3Xq9...mP2v",
    "royalty_rate": 0.1,
    "total_royalties_earned": 1967161,
    "on_chain_verified": false,
    "tags": ["business-intel", "automation", "reporting"],
    "last_updated": "2025-12-18T09:15:00Z"
  },
  {
    "skill_id": "skill-anomaly-detector-v1",
    "name": "anomaly-detector",
    "version": "3.4.0",
    "category": "analytics",
    "price_lamports": 3963,
    "execution_count": 6934,
    "success_rate": 0.865,
    "description": "Real-time anomaly detection in time-series data. Identifies outliers and patterns using statistical models.",
    "input_schema": "{ time_series: Point[] }",
    "output_format": "{ anomalies: Point[], severity: string }",
    "avg_latency_ms": 890,
    "creator_address": "9Ln4...jK8p",
    "royalty_rate": 0.1,
    "total_royalties_earned": 2747944,
    "on_chain_verified": true,
    "tags": ["analytics", "security", "monitoring"],
    "last_updated": "2025-12-16T11:45:00Z"
  },
  {
    "skill_id": "skill-sentiment-analyzer-v1",
    "name": "sentiment-analyzer",
    "version": "1.3.10",
    "category": "nlp",
    "price_lamports": 704,
    "execution_count": 1529,
    "success_rate": 0.872,
    "description": "Sentiment analysis for text content. Classifies emotions, opinions, and brand perception.",
    "input_schema": "{ text: string }",
    "output_format": "{ sentiment: string, score: number }",
    "avg_latency_ms": 200,
    "creator_address": "5Ry2...bN7m",
    "royalty_rate": 0.1,
    "total_royalties_earned": 107641,
    "on_chain_verified": true,
    "tags": ["nlp", "sentiment", "social-media"],
    "last_updated": "2025-12-18T16:00:00Z"
  },
  {
    "skill_id": "skill-data-validator-v1",
    "name": "data-validator",
    "version": "2.5.19",
    "category": "data",
    "price_lamports": 570,
    "execution_count": 721,
    "success_rate": 0.939,
    "description": "Schema validation and data quality checks. Ensures data integrity before processing.",
    "input_schema": "{ data: any, schema: object }",
    "output_format": "{ valid: boolean, errors: string[] }",
    "avg_latency_ms": 150,
    "creator_address": "2Tk8...vL4q",
    "royalty_rate": 0.1,
    "total_royalties_earned": 41097,
    "on_chain_verified": true,
    "tags": ["data-quality", "validation", "infrastructure"],
    "last_updated": "2025-12-15T08:30:00Z"
  },
  {
    "skill_id": "skill-text-summarizer-v1",
    "name": "text-summarizer",
    "version": "3.1.12",
    "category": "nlp",
    "price_lamports": 880,
    "execution_count": 9054,
    "success_rate": 0.856,
    "description": "Intelligent text summarization. Extracts key points while preserving context and meaning.",
    "input_schema": "{ text: string, max_length: number }",
    "output_format": "{ summary: string, keywords: string[] }",
    "avg_latency_ms": 600,
    "creator_address": "7Hp1...zX9c",
    "royalty_rate": 0.1,
    "total_royalties_earned": 796752,
    "on_chain_verified": true,
    "tags": ["nlp", "productivity", "content"],
    "last_updated": "2025-12-18T13:10:00Z"
  },
  {
    "skill_id": "skill-image-classifier-v1",
    "name": "image-classifier",
    "version": "3.9.11",
    "category": "vision",
    "price_lamports": 2391,
    "execution_count": 3160,
    "success_rate": 0.934,
    "description": "Computer vision classification. Identifies objects, scenes, and categories in images.",
    "input_schema": "{ image_url: string }",
    "output_format": "{ classes: string[], probabilities: number[] }",
    "avg_latency_ms": 1800,
    "creator_address": "4Jk6...wM8d",
    "royalty_rate": 0.1,
    "total_royalties_earned": 755556,
    "on_chain_verified": true,
    "tags": ["vision", "images", "classification"],
    "last_updated": "2025-12-17T09:45:00Z"
  }
]
```

## Constraints
- 保持向后兼容：新字段不影响现有功能
- creator_address 使用真实的 Devnet 地址 (已部署的)
- royalty_rate 固定为 0.10 (10%)，与 Transfer Hook 逻辑一致
- total_royalties_earned 基于 execution_count * price * royalty_rate 计算

## Verification
- **Unit**: `npx tsc --noEmit --skipLibCheck`
- **Integration**: 访问 `/skills` 页面，数据加载正常
- **Evidence**: 截图显示新字段已生效

## Rollback
- `git checkout -- exo-frontend/lib/mock-data.ts exo-frontend/public/mock/mock_skills.json`
