# Phase 16: Operation Polish (Frontend Fixes)

## Meta
- **Type**: `Critical / Refactor`
- **Goal**: 修复代码审查发现的 Critical 问题及高优先级体验问题，确保演示无故障。
- **Source**: `docs/FRONTEND_CODE_REVIEW.md`

## Task Breakdown

### [ ] P16-CR01: Blinks API 真实交易构建 (Critical)
- **Problem**: POST 方法返回 Mock Base64，导致钱包无法签名。
- **Files**: `app/api/actions/skill/[skillId]/route.ts`
- **Action**:
  1. 引入 `@solana/web3.js` 和 `@solana/actions`。
  2. 构建真实的 `SystemProgram.transfer` 交易 (User -> Protocol Escrow)。
  3. 序列化并 Base64 编码返回。
- **Verify**: Dial.to 测试能唤起钱包并显示正确金额 (0.1 SOL)。

### [ ] P16-CR02: Edge Runtime 自回环修复 (Critical)
- **Problem**: Edge Function 中 `fetch(origin)` 导致超时。
- **Files**: `app/api/actions/skill/[skillId]/route.ts`
- **Action**:
  1. 移除 `fetch` 自调用。
  2. 直接导入 `lib/mock-data.ts` 中的数据 (Edge 兼容)。
  3. 或将 Mock 数据内联/移动到 KV (既然是 Mock，直接 import 最安全)。

### [ ] P16-CR03: Demo 页面内存泄漏修复 (Critical)
- **Problem**: `setTimeout` 未被清理。
- **Files**: `app/demo/page.tsx`
- **Action**:
  1. 使用 `useRef` 存储 timer ID。
  2. 在 `useEffect` cleanup 函数中执行 `clearTimeout`。

### [ ] P16-CR04: TerminalFeed 依赖修复 (Critical)
- **Problem**: `useEffect` 缺少依赖，可能导致闭包陷阱。
- **Files**: `components/dashboard/terminal-feed.tsx`
- **Action**:
  1. 将 `onAlertChange` 加入依赖数组。
  2. 使用 `useCallback` 稳定回调函数或 ref 存储。

### [ ] P16-CR05: SkillBlinkCard SSR 修复 (Critical)
- **Problem**: SSR Hydration Mismatch (window.location).
- **Files**: `components/blinks/skill-blink-card.tsx`
- **Action**:
  1. 使用 `useEffect` 获取 `window.location.origin`。
  2. 或使用 `NEXT_PUBLIC_APP_URL` 环境变量替代。

### [ ] P16-IM01: Dashboard 性能与错误处理 (Improvement)
- **Problem**: KPI 计算阻塞主线程；错误状态无重试。
- **Files**: `app/dashboard/page.tsx`
- **Action**:
  1. 使用 `useMemo` 包裹 `calculateKPIs`。
  2. 优化 Error State UI，添加 "Retry" 按钮 (调用 `queryClient.invalidateQueries`)。

### [ ] P16-IM02: 列表页虚拟滚动/分页 (Improvement)
- **Problem**: 一次性渲染大量 DOM。
- **Files**: `app/skills/page.tsx`, `app/blinks/page.tsx`
- **Action**:
  1. 引入简单的客户端分页 (Limit 12 items per page)。
  2. 添加 "Load More" 按钮。

### [ ] P16-IM03: Loading Skeleton (Improvement)
- **Problem**: 页面跳动。
- **Files**: `components/ui/skeleton.tsx` (新建), `components/dashboard/dashboard-skeleton.tsx`
- **Action**:
  1. 创建基础 Skeleton 组件 (Tailwind `animate-pulse`)。
  2. 在 Dashboard 和 Skill List 加载状态应用。

### [ ] P16-IM04: 移动端导航 (Improvement)
- **Problem**: Header 导航在移动端不可见 (`hidden md:flex`)。
- **Files**: `components/layout/header.tsx`
- **Action**:
  1. 添加 Hamburger 图标按钮 (移动端显示)。
  2. 使用 `useState` 控制移动端导航展开/收起。
  3. 或使用 Sheet/Drawer 组件实现侧边导航。

### [ ] P16-IM05: Demo 重置按钮 (Improvement)
- **Problem**: 状态机到达 SLASHED 后无法重置，需刷新页面。
- **Files**: `app/demo/page.tsx`
- **Action**:
  1. 在页面底部或侧边添加 "Reset Demo" 按钮。
  2. 调用 `useDemoStore.getState().reset()` 重置状态。

### [ ] P16-IM06: ParticleNetwork 性能优化 (Improvement - Optional)
- **Problem**: Three.js Canvas 在低端设备 FPS 不足。
- **Files**: `components/hero/particle-network.tsx`
- **Action**:
  1. 检测 `prefers-reduced-motion` 媒体查询。
  2. 若用户偏好减少动画，降低粒子数量或提供静态 fallback。
- **Note**: 可选任务，视时间情况决定是否执行。

### [ ] P16-IM07: Toast 通知系统 (Improvement - Optional)
- **Problem**: 操作反馈仅通过按钮状态，用户可能错过。
- **Files**: `components/providers/` (新建 toast-provider), `package.json`
- **Action**:
  1. 安装 `sonner` 或 `react-hot-toast`。
  2. 在 Layout 中添加 Toaster 组件。
  3. 在 Copy Blink URL 等操作处调用 toast。
- **Note**: 可选任务，视时间情况决定是否执行。

---

## Refactor Tasks (代码卫生)

### [ ] P16-RF01: 硬编码配置统一化 (Refactor)
- **Problem**: 同一配置在多处重复定义 (EXO_PROGRAM_ID, Helius URL, Chain ID)。
- **Files**: 
  - `app/dashboard/page.tsx:18`
  - `hooks/use-helius-logs.ts:59-62`
  - `lib/log-parser.ts:5-6`
  - `lib/api-utils.ts:7`
- **Action**:
  1. 创建 `lib/constants.ts` 统一导出所有配置常量。
  2. 替换各文件中的硬编码为 import。
- **Verify**: `grep -r "CdamAXn5fCros3MktPxmbQKXtxd34XHATTLmh9jkn7DT" --include="*.ts" --include="*.tsx"` 仅返回 constants.ts。

### [ ] P16-RF02: Mock 数据逻辑解耦 (Refactor)
- **Problem**: `fetchOrders` 包含复杂的 Mock 时间戳生成逻辑，与 API 接口耦合。
- **Files**: `lib/api.ts:18-26`
- **Action**:
  1. 创建 `lib/mock-service.ts`，将 Mock 数据生成逻辑迁移至此。
  2. `lib/api.ts` 保持纯净的接口定义，通过 Adapter 模式切换 Mock/Real。
- **Verify**: `lib/api.ts` 中不包含 `Math.random()` 或时间戳生成逻辑。

### [ ] P16-RF03: 冗余类型定义清理 (Refactor)
- **Problem**: `type MockSkill = Skill` 是冗余定义。
- **Files**: `app/api/actions/skill/[skillId]/route.ts:8`
- **Action**:
  1. 删除 `type MockSkill = Skill` 行。
  2. 将所有 `MockSkill` 引用替换为 `Skill`。
- **Verify**: 构建通过，无类型错误。

### [ ] P16-RF04: CSS-in-JS 风格统一 (Refactor)
- **Problem**: `styled-jsx` 与 TailwindCSS 混用，风格不一致。
- **Files**: `components/dashboard/terminal-feed.tsx:377-397`
- **Action**:
  1. 将 `scan-line` 动画迁移至 `globals.css` 的 `@layer utilities`。
  2. 或改用 Framer Motion 的 `animate` prop。
  3. 移除 `<style jsx>` 块。
- **Verify**: 文件中不包含 `<style jsx>`。

### [ ] P16-RF05: Icon 导出统一化 (Refactor - Optional)
- **Problem**: 每个组件单独从 `lucide-react` 导入图标，重复代码多。
- **Files**: 多个组件
- **Action**:
  1. 创建 `components/icons.ts`。
  2. 统一导出常用图标 (Terminal, Zap, Shield, User, etc.)。
  3. 各组件从 `@/components/icons` 导入。
- **Note**: 可选优化，主要为代码整洁度。

### [ ] P16-RF06: 死代码清理 (Refactor)
- **Problem**: `isValidOrder` / `isValidSkill` type guard 定义但从未使用。
- **Files**: `lib/mock-data.ts:48-61, 67-91`
- **Action**:
  - **Option A**: 在 API 层 (`lib/api.ts`) 添加运行时校验。
  - **Option B**: 删除未使用的函数 (推荐，减少包体积)。
- **Verify**: 若删除，确保构建通过；若保留，确保至少有一处调用。

### [ ] P16-RF07: 组件 displayName 补全 (Refactor)
- **Problem**: 函数组件缺少 `displayName`，DevTools 调试时显示为匿名。
- **Files**: 
  - `components/layout/bento-grid.tsx`
  - `components/ui/glass-card.tsx`
- **Action**:
  1. 在组件定义后添加 `ComponentName.displayName = "ComponentName"`。
- **Verify**: React DevTools 中显示正确组件名。

---

## Execution Plan
1. **P16-CR** (Critical): 优先修复，确保核心流程可用。
2. **P16-IM** (Improvement): 优化 UI/UX，提升用户体验。
3. **P16-RF** (Refactor): 代码卫生，提升可维护性 (可并行执行)。

## Task Summary

| 类型 | 数量 | 优先级 |
|------|------|--------|
| 🔴 Critical | 5 | P0 - 必须 |
| 🟡 Improvement | 7 | P1 - 建议 (2 Optional) |
| 🟢 Refactor | 7 | P2 - 可选 (2 Optional) |

## Verification
- **Unit**: 构建通过，无 ESLint 错误。
- **Manual**:
  - Dial.to 验证 Blink 支付。
  - Demo 页面快速切换无报错。
  - Dashboard 加载平滑，无卡顿。
