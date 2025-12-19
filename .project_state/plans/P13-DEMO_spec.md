# P13-DEMO: One-Shot Demo Page Specification

## Meta
- **Type**: `Critical / UI`
- **Risk Level**: 🟢 Low (Isolated Page)
- **Goal**: Create a dedicated `/demo` page for the 3-minute hackathon video.
- **Visual Reference**: 3-Column Layout (Blink | State Flow | Logs)

## 1. Page Layout (`app/demo/page.tsx`)

### Architecture
- **Route**: `/demo` (Hidden from main nav, direct access only)
- **Layout**: Full screen, no header/footer distraction.
- **Grid**: 3 Columns (25% | 45% | 30%)

```tsx
<div className="grid grid-cols-12 h-screen bg-black text-white overflow-hidden">
  {/* Left: Blink Executor */}
  <div className="col-span-3 border-r border-white/10 p-6">
    <DemoBlinkCard />
  </div>

  {/* Center: State Flow Visualization */}
  <div className="col-span-6 border-r border-white/10 p-6 flex flex-col">
    <StateFlowDiagram />
    <TransactionStatus />
  </div>

  {/* Right: Runtime Logs */}
  <div className="col-span-3 p-0 bg-black/50">
    <DemoTerminalFeed />
  </div>
</div>
```

## 2. Components Specification

### 2.1 `DemoBlinkCard`
- **Purpose**: Simulate the Blink interaction.
- **State**: `Idle` -> `Signing` -> `Sent`.
- **UI**: 
  - Simplified version of `SkillBlinkCard`.
  - Large "Execute Skill" button.
  - Mock Wallet Popup simulation (optional, or just toast).

### 2.2 `StateFlowDiagram`
- **Purpose**: Visualize the "Escrow -> Challenge -> Slash" lifecycle.
- **Tech**: React Flow or CSS SVG Animation (CSS preferred for smoother transitions).
- **States**:
  1. **Idle**: Greyed out path.
  2. **Escrow Locked**: Lock icon turns Purple.
  3. **Execution**: Docker icon spins.
  4. **Commit**: Hash appears.
  5. **Challenge (Red Alert)**: 
     - Arrow turns Red.
     - "Verifier" node pulses Red.
     - Status changes to `DISPUTED`.
  6. **Slash**: 
     - Escrow funds split animation.
     - "Slashed" stamp overlay.

### 2.3 `DemoTerminalFeed`
- **Purpose**: Show deterministic logs matching the visual flow.
- **Logic**: 
  - Instead of real WebSocket, use a `DemoScript` array.
  - Trigger logs based on State Machine steps.
  - **Key Log**: `[CRIT] HASH MISMATCH DETECTED -> SLASHING EXECUTOR`.

## 3. Demo Controller (State Machine)

A central `useDemoStore` (Zustand) to coordinate all 3 columns.

```typescript
interface DemoState {
  step: 'IDLE' | 'LOCKED' | 'EXECUTING' | 'COMMITTED' | 'CHALLENGED' | 'SLASHED';
  nextStep: () => void;
  triggerRedSlash: () => void; // The "Magic Button"
}
```

## 4. Implementation Steps (Atomic Tasks)

### [ ] Task-P13-01: Demo Layout & Store
- Create `app/demo/page.tsx`.
- Create `store/use-demo-store.ts`.
- Setup 3-column grid scaffold.

### [ ] Task-P13-02: State Flow Component
- Create `components/demo/state-flow.tsx`.
- Implement CSS transitions for 5 states.
- Add "Red Alert" visual state.

### [ ] Task-P13-03: Integrated Controller
- Connect Blink Button -> Trigger Store -> Update Diagram -> Push Logs.
- Add "Magic Key" (e.g., press 'X') to trigger the Malicious Branch.

## 5. Resources
- **Icons**: Lucide React (`Lock`, `ShieldAlert`, `Server`, `Zap`).
- **Colors**: 
  - Primary: `purple-500` (Escrow)
  - Success: `green-500` (Normal Flow)
  - Danger: `red-500` (Challenge/Slash)

## 6. Constraints & Dependencies
- **Dependencies**: 
  | 资源 | 类型 | 状态 |
  |------|------|------|
  | `zustand` | Library | ✓ Installed |
  | `lucide-react` | Library | ✓ Installed |
  | `framer-motion` | Library | ✗ Check (Optional) |
- **Constraints**:
  - **Zero Impact**: `/demo` 路由不得影响主应用 (`/dashboard`) 的性能或 Bundle size。
  - **Resolution**: 仅需适配 1920x1080 演示分辨率，无需完美移动端适配。

## 7. Verification Plan
- **Manual**:
  1. 访问 `/demo`，确认三栏布局无滚动条。
  2. 点击 "Execute Skill"，确认状态流从 `LOCKED` -> `SLASHED` 动画流畅。
  3. 检查 Logs 区域是否按时间戳滚动更新。
- **Automated**:
  - 无需编写复杂 E2E，仅需 Unit Test 确保 `useDemoStore` 状态机逻辑正确。

## 8. Rollback Strategy
- 若演示崩溃或构建失败：
  - `rm -rf app/demo`
  - `rm store/use-demo-store.ts`
