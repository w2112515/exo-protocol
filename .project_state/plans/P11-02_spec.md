# P11-02: 信任指标重塑

## Meta
- **Type**: `Simple / UI-Mock`
- **Risk Level**: 🟢 Low
- **depends_on**: None
- **Priority**: P0 (Critical Trust Fix)

## Input Files
- `exo-frontend/lib/mock-data.ts` (L4-12, L22)
- `exo-frontend/public/mock/mock_skills.json`
- `exo-frontend/public/mock/mock_orders.json`

## Action Steps

### Step 1: 更新 Order 类型定义 (mock-data.ts)
```typescript
export interface Order {
    order_id: string;
    skill_id: string;
    status: 'completed' | 'failed' | 'timeout';
    execution_time_ms: number;
    created_at: string;
    result_hash: string;
    agent_id: string;
    verificationStatus: 'verified' | 'pending' | 'challenged';  // 新增
}
```

### Step 2: 更新 isValidOrder 类型守卫
- 添加 `verificationStatus` 字段验证

### Step 3: 更新 Mock 数据文件
- `mock_skills.json`: 所有 `success_rate` 改为 `0.999` 或以上
- `mock_orders.json`: 添加 `verificationStatus: "verified"` 字段到所有 completed 订单

## Verification
- **Unit**: `cd exo-frontend && pnpm run build`
- **Evidence**: Build 成功，无类型错误

## Rollback
- `git checkout exo-frontend/lib/mock-data.ts exo-frontend/public/mock/`
