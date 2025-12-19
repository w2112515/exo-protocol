# P11-05: PayFi 资金流动画增强

## Meta
- **Type**: `Standard / UI`
- **Risk Level**: 🟢 Low
- **depends_on**: None
- **Priority**: P2 (Visual Polish)

## Input Files
- `exo-frontend/components/dashboard/agent-flow-graph.tsx` (L84-121)

## Action Steps

### Step 1: 增强边动画效果
修改 `dynamicEdges` 定义，提升视觉冲击力:

```typescript
// user-protocol 边: 增加脉冲效果
{
    id: 'user-protocol',
    source: 'user',
    target: 'protocol',
    animated: true,
    style: { 
        stroke: 'var(--color-primary)', 
        strokeWidth: 3,  // 加粗
        strokeDasharray: '8,4',  // 更明显的虚线
    },
    // ...
}
```

### Step 2: 添加 CSS 动画类 (可选)
如需更复杂动画，在 globals.css 添加:
```css
@keyframes pulse-flow {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
}
```

### Step 3: 优化边颜色对比
- Executor 边: `#22c55e` (更亮的绿色)
- Creator 边: `#a855f7` (保持紫色)
- Fee 边: `#eab308` (保持黄色)

## Verification
- **Visual**: Dashboard 页面 Agent Flow 图动画流畅
- **Evidence**: 截图对比

## Rollback
- `git checkout exo-frontend/components/dashboard/agent-flow-graph.tsx`
