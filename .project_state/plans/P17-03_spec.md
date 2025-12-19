# Task-P17-03: 挑战窗口 + FINALIZED 状态

## Meta
- **Type**: `Critical / Logic + UI`
- **Risk Level**: 🟡 Medium
- **Priority**: Must
- **Estimated**: 2h
- **depends_on**: 无 (可独立开发)

## Input Files
- `exo-frontend/store/use-demo-store.ts` (状态定义)
- `exo-frontend/components/demo/state-flow-diagram.tsx` (状态流图)
- `exo-frontend/app/demo/page.tsx` (状态机逻辑)

## External Dependencies
| 资源 | 类型 | 状态 |
|------|------|------|
| 无 | - | ✓ |

## Background

MVP 文档定义了 "100 blocks (~40秒)" 的挑战窗口，这是 Optimistic Execution 的核心安全保障。当前 Demo 页面缺少此状态，直接从 COMMITTED 跳到完成，削弱了去中心化验证网络的可信度。

## Action Steps

### Step 1: 扩展状态枚举 (use-demo-store.ts)
```typescript
// 修改 DemoState 类型
type DemoState = 
  | 'IDLE' 
  | 'LOCKED' 
  | 'EXECUTING' 
  | 'COMMITTED' 
  | 'CHALLENGE_WINDOW'  // 新增
  | 'FINALIZED'         // 新增
  | 'CHALLENGED' 
  | 'SLASHED';

// 新增状态字段
interface DemoStore {
  // ... existing fields
  challengeWindowProgress: number;  // 0-100
  challengeWindowSlots: number;     // 当前 slot 数
  totalChallengeSlots: number;      // 总 slot 数 (默认40)
}
```

### Step 2: 添加挑战窗口倒计时 Action
```typescript
// 新增 action
startChallengeWindow: () => void;
tickChallengeWindow: () => void;  // 每秒调用
```

### Step 3: 更新状态流图 (state-flow-diagram.tsx)
- 在 COMMITTED 和 FINALIZED 之间新增 CHALLENGE_WINDOW 节点
- 节点内显示倒计时进度条
- 恶意路径: CHALLENGE_WINDOW → CHALLENGED → SLASHED

**节点设计**:
```
┌─────────────────────────────────────────┐
│  ⏱️ CHALLENGE WINDOW                    │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░ 15/40 slots │
│                                         │
│  [ Simulate Fraud Proof ]  ← 可选按钮   │
└─────────────────────────────────────────┘
```

### Step 4: 更新 Demo 页面状态机逻辑 (page.tsx)
```typescript
// COMMITTED 后自动进入 CHALLENGE_WINDOW
// 使用 setInterval 模拟 slot 推进
// 40 slots 后自动进入 FINALIZED
// 如果用户点击 Simulate Fraud Proof，进入 CHALLENGED
```

### Step 5: 更新状态流转映射
| 触发 | 当前状态 | 目标状态 |
|------|----------|----------|
| 提交结果 | COMMITTED | CHALLENGE_WINDOW |
| 40 slots 无挑战 | CHALLENGE_WINDOW | FINALIZED |
| 用户点击 Fraud Proof | CHALLENGE_WINDOW | CHALLENGED |
| 恶意行为检测 | CHALLENGED | SLASHED |

## Constraints
- 使用 setTimeout 模拟，不做真实 slot 监听
- 倒计时动画使用 CSS transition，不使用 JS 动画库
- 进度条使用现有 Tailwind 主题色 (emerald/cyan)
- 保持现有组件结构，最小化改动

## Verification
- **Unit**: 手动测试状态切换
  - [ ] COMMITTED → CHALLENGE_WINDOW 自动触发
  - [ ] 进度条从 0% 增长到 100%
  - [ ] 40 slots 后自动进入 FINALIZED
  - [ ] 点击 Fraud Proof 按钮进入 CHALLENGED
- **Integration**: `pnpm dev` 运行完整 Demo 流程
- **Evidence**: 截图显示挑战窗口 UI

## Rollback
- `git checkout exo-frontend/store/use-demo-store.ts`
- `git checkout exo-frontend/components/demo/state-flow-diagram.tsx`
- `git checkout exo-frontend/app/demo/page.tsx`

---

**CSA 签章**: ✅ 规格审核通过
**派发时间**: 2024-12-19 22:15 UTC+8
