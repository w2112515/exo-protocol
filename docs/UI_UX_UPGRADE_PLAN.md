# 💎 Exo Protocol UI/UX Design System 3.0 (Audit & Upgrade)

> **Core Philosophy**:  **Terminal Minimalism (极致终端)** × **Invisible Interface (隐形界面)**
> **Audit Status**: ✅ IMPLEMENTED (2024-12-20). All items verified by CSA.
> **Target Aesthetic**: Linear, Vercel, Raycast — "Developer Luxury".

---

## 🛑 Audit Findings (The "Why")

Based on the audit of previous designs (`ui_ux.md`, `v2.0 Plan`), we identified three critical flaws preventing the "Premium" feel:

1.  **"Uncanny Valley" of Typography**: Using Serif fonts in a Cyber/Protocol context is a major style violation. The mix of sans-serif and serif created visual noise.
2.  **Lack of Physicality**: The UI felt "flat" (pure hex codes) rather than "material" (glass, noise, light). Premium UI mimics expensive materials (matte black metal, frosted glass).
3.  **Static lifelessness**: A protocol is a *living* thing. The current UI has no "pulse". Data appears instantly without transition, feeling cheap.

---

## 🛠️ The Upgrade Plan (The "How")

### 1. Typography System: The "Dual-Core" Engine

We will enforce a strict separation of concerns using a **Dual Font Stack**.

| Use Case | Font Family | Tailwinds Class | Characteristics |
| :--- | :--- | :--- | :--- |
| **Interface (UI)** | **Inter Tight** | `font-sans` | High legibility, geometric, -4% letter spacing for that "tight" modern look. |
| **Data (Code)** | **JetBrains Mono** | `font-mono` | The gold standard for code. Ligatures enabled. Used for *all* transient data. |

> **Rule**: If it changes (Hash, Time, Amount, Status), it MUST be `font-mono`. If it is static label (Header, Nav), it is `font-sans`.

### 2. The "Zinc" Color Physics

Abandon random grey hex codes. We adhere strictly to the **Zinc (Slate)** scale for a "Cold Metal" feel.

*   **Void (Bg)**: `bg-zinc-950` (Deepest black, not #000).
*   **Glass (Surface)**: `bg-zinc-900/40` + `backdrop-blur-xl` + `border-white/5` (Subtle boundary).
*   **Light (Highlight)**: `border-t-white/10` (Top border only to simulate overhead lighting).

#### Semantic Colors (The "Neon" Accents)
*   **Liquid Emerald**: `text-emerald-400` + `shadow-[0_0_10px_rgba(52,211,153,0.2)]` (Success)
*   **Electric Rose**: `text-rose-400` + `shadow-[0_0_10px_rgba(251,113,133,0.2)]` (Failure)
*   **Cyber Violet**: `text-violet-400` (System events)

### 3. Component Re-Engineering

#### 3.1 The "HFT" Live Transaction Terminal
*Target: Look like a Bloomberg Terminal for Crypto Agents.*

*   **Structure**:
    *   **Header**: `text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-medium`.
    *   **Rows**: Compressed height (`h-8`), strictly aligned.
*   **Typography**: All cell data is `font-mono text-xs`.
*   **Decoration**:
    *   **NO Scrollbars**: Use `.scrollbar-hide` utility.
    *   **Scanline**: A subtle CSS scanline animation running vertically over the list to imply active monitoring.
*   **Status Pills**:
    *   *Old*: Solid colored badges (Look cheap/mobile).
    *   *New*: **Ghost Borders**. Transparent bg, 1px colored border, colored text. `border-emerald-500/30 text-emerald-400`. Minimal visual weight.

#### 3.2 Agent Flow Graph (Physical Nodes)
*   **Nodes**: Should look like physical chips lying on the glass surface.
    *   `bg-zinc-900`
    *   `shadow-xl`
    *   `border border-zinc-800`
*   **Edges**:
    *   Animated SVG paths (`framer-motion` pathLength).
    *   Particles flowing along the path to visualize "Value Transfer".

---

## ⚡ Motion & Micro-interactions (The "Premium" Secret)

Static UI is dead. We introduce **Cinematic Physics**.

1.  **Staggered Entry**:
    *   When the dashboard loads, cards don't just appear. They slide up (`y: 20 -> 0`) with opacity fade, staggered by 0.1s.
2.  **The "Breathing" Pulse**:
    *   Live status indicators must have a slow `animate-pulse` (2s duration) to show the system is alive.
3.  **List Updates**:
    *   New transactions should `AnimatePresence` slide in from the top, pushing others down. This handles the "Shock Factor" — watching the feed move feels like watching money move.

---

## 📝 Implementation Checklist

- [x] **Global CSS**: Add `Inter` & `JetBrains Mono` imports (via CDN). Reset `body` to `bg-zinc-950`. ✅ P18-01
- [x] **Scrollbar Kill**: Add global CSS to hide scrollbars but keep functionality. ✅ P18-02
- [x] **Refactor Transactions**: Rewrite `LiveTransactions` component to use `<table>` or Grid for perfect alignment. Apply `font-mono`. ✅ (已完成)
- [x] **Motion**: Wrap the transaction list in `framer-motion`'s `<AnimatePresence>`. ✅ (已完成)
- [x] **Borders**: Add `border-white/5` to all cards. Eliminate distinct "headers" backgrounds, use whitespace. ✅ (已完成)
- [x] **Status Pills**: Ghost Borders for status indicators. ✅ P18-03

> **Final Goal**: A UI that looks like it costs $100k to build. Pure, raw, functional elegance.

---

## 📋 CSA Task Spec

> **Spec File**: `.project_state/plans/P18-UI-CHAMPION_spec.md`

| Task ID | 类型 | 优先级 | 说明 |
|---------|------|--------|------|
| P18-01 | Critical | P0 | Typography CDN + letter-spacing |
| P18-02 | Simple | P1 | Scrollbar hide utility |
| P18-03 | Standard | P2 | Ghost Border status pills |
| P18-04 | Simple | P3 | 本文档 Checklist 最终更新 |
