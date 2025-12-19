# Phase 18: UI Champion Polish - 冠军级视觉打磨

## Meta
- **Type**: `Critical / UI-System`
- **Risk Level**: 🟡 Medium
- **Priority**: P0 (Champion Polish)
- **Goal**: 落实 UI_UX_UPGRADE_PLAN.md 全部规范，实现 "Developer Luxury" 视觉标准
- **Source**: `docs/UI_UX_UPGRADE_PLAN.md`

---

## Audit Summary (审计结论)

| 规范项 | 当前状态 | 目标 |
|--------|----------|------|
| Typography Dual-Core | 🔴 系统字体降级 | Inter + JetBrains Mono |
| Scrollbar Hide | 🔴 缺失 | 全局隐藏滚动条 |
| Status Ghost Borders | 🟡 部分 | 透明背景+彩色边框 |
| Zinc Color Physics | ✅ 已实现 | - |
| Glass Card System | ✅ 已实现 | - |
| Scan Line Animation | ✅ 已实现 | - |
| Framer Motion | ✅ 已实现 | - |

---

## Task Breakdown

### P18-01: Typography System 字体系统修复 (Critical)

**Input Files**:
- `exo-frontend/lib/fonts.ts` (L1-25)
- `exo-frontend/app/layout.tsx` (L2, L21)
- `exo-frontend/app/globals.css` (L51-53)

**Action Steps**:
1. 在 `globals.css` 顶部添加 Google Fonts CDN import (fallback 方案):
   ```css
   @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
   ```
2. 更新 `:root` 字体定义:
   ```css
   --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
   --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;
   ```
3. 添加 Inter 字体的 tight letter-spacing utility:
   ```css
   .tracking-tight { letter-spacing: -0.04em; }
   ```
4. `fonts.ts` 保持 mock 结构但注释说明 CDN 已生效

**Constraints**:
- 不使用 next/font/google (网络不稳定)
- CDN 作为主方案，系统字体作为 fallback

**Verify**:
- `pnpm build` 无错误
- DevTools > Elements 检查 body 字体为 Inter
- 截图对比 font-mono 元素显示 JetBrains Mono

---

### P18-02: Scrollbar Kill 滚动条隐藏 (Simple)

**Input Files**:
- `exo-frontend/app/globals.css` (L120-134 @layer utilities)

**Action Steps**:
1. 在 `@layer utilities` 中添加 scrollbar-hide:
   ```css
   .scrollbar-hide {
     -ms-overflow-style: none;
     scrollbar-width: none;
   }
   .scrollbar-hide::-webkit-scrollbar {
     display: none;
   }
   ```

2. 应用到 terminal-feed 容器 (可选，由 WAP 判断):
   - `terminal-feed.tsx` 的日志列表容器添加 `scrollbar-hide overflow-y-auto max-h-[400px]`

**Verify**:
- 浏览器中 TerminalFeed 无可见滚动条
- 仍可鼠标滚轮/触控板滚动

---

### P18-03: Status Ghost Borders 状态徽章升级 (Standard)

**Input Files**:
- `exo-frontend/components/dashboard/terminal-feed.tsx` (L24-36, L369-372)

**Action Steps**:
1. 修改 statusColors 映射，添加 Ghost Border 样式:
   ```typescript
   const statusStyles = {
     completed: 'border border-emerald-500/30 text-emerald-400 bg-transparent',
     failed: 'border border-red-500/30 text-red-400 bg-transparent',
     timeout: 'border border-yellow-500/30 text-yellow-400 bg-transparent',
   } as const;
   ```

2. 更新状态显示区域，改为 pill 形式:
   ```tsx
   <span className={cn(
     'px-2 py-0.5 rounded-full text-xs font-mono',
     statusStyles[order.status]
   )}>
     {statusLabels[order.status]}
   </span>
   ```

**Verify**:
- Mock 数据模式下，状态显示为透明背景 + 彩色边框
- 截图对比旧版 vs 新版

---

### P18-04: Documentation Sync 文档同步 (Simple)

**Input Files**:
- `docs/UI_UX_UPGRADE_PLAN.md` (L85-92)

**Action Steps**:
1. 更新 Implementation Checklist 状态:
   ```markdown
   ## 📝 Implementation Checklist

   - [x] **Global CSS**: Add `Inter` & `JetBrains Mono` imports (via CDN). Reset `body` to `bg-zinc-950`. ✅ P18-01
   - [x] **Scrollbar Kill**: Add global CSS to hide scrollbars but keep functionality. ✅ P18-02
   - [x] **Refactor Transactions**: Rewrite `LiveTransactions` component to use `<table>` or Grid for perfect alignment. Apply `font-mono`. ✅ (已完成)
   - [x] **Motion**: Wrap the transaction list in `framer-motion`'s `<AnimatePresence>`. ✅ (已完成)
   - [x] **Borders**: Add `border-white/5` to all cards. Eliminate distinct "headers" backgrounds, use whitespace. ✅ (已完成)
   - [x] **Status Pills**: Ghost Borders for status indicators. ✅ P18-03
   ```

2. 添加 Audit Status 更新:
   ```markdown
   > **Audit Status**: ✅ IMPLEMENTED (2024-12-20). All items verified by CSA.
   ```

---

## Execution Order

| 顺序 | Task ID | 类型 | 依赖 | 风险 |
|------|---------|------|------|------|
| 1 | P18-01 | Critical | 无 | 🟡 CDN 可能被墙 |
| 2 | P18-02 | Simple | 无 | 🟢 Low |
| 3 | P18-03 | Standard | P18-01 (字体生效) | 🟢 Low |
| 4 | P18-04 | Simple | P18-01~03 全部完成 | 🟢 Low |

---

## Verification Matrix

| Task | Unit Test | Visual Evidence |
|------|-----------|-----------------|
| P18-01 | `pnpm build` pass | DevTools Font 截图 |
| P18-02 | 手动滚动测试 | 无滚动条截图 |
| P18-03 | Mock 数据状态切换 | Ghost Pill 截图 |
| P18-04 | Markdown 渲染 | Checklist 全勾选 |

---

## Rollback Strategy

- Git: `git checkout HEAD -- exo-frontend/app/globals.css exo-frontend/lib/fonts.ts`
- 如 CDN 字体加载失败，系统字体 fallback 自动生效，不影响功能

---

*Created by CSA: 2024-12-20 01:50 UTC+8*
