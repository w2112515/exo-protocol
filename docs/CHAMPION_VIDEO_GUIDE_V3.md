# 🏆 冠军级 Demo 视频录制指南 (V3.0 Full Stack Strategy)

> **版本定位**: V3.0 (高密度叙事版)
> **核心逻辑**: "我们不仅仅是一个 Demo，我们是一个完整的生态系统 (Ecosystem)。"
> **展示面**: 首页 -> 控制台 -> 技能市场 -> 核心演示 -> Blinks -> 愿景图。
> **节奏**: 极快，信息密度极大，全程无废话。

---

## 🛠️ 第一部分：战前准备 (The Setup)

**必须按顺序打开这 6 个 Chrome 标签页：**

1.  **Tab 1 (首页)**: `https://exo-frontend-psi.vercel.app/`
    *   *用途*: 品牌展示，Slogan（动态打字效果）。
2.  **Tab 2 (Dashboard)**: `https://exo-frontend-psi.vercel.app/dashboard`
    *   *用途*: 展示 "My Terminal" 控制台，6个KPI指标 + Agent Flow图 + Live Transactions。**确保有数据加载出来。**
3.  **Tab 3 (Skills Marketplace)**: `https://exo-frontend-psi.vercel.app/skills`
    *   *用途*: 展示 "Skills Marketplace"，带分类筛选器，列表里多个 Skill。
4.  **Tab 4 (Demo战场)**: `https://exo-frontend-psi.vercel.app/demo`
    *   *用途*: **核心逻辑演示**。**记得点 "↻ Reset Demo" 清空状态。**
5.  **Tab 5 (Blinks)**: `https://dial.to/devnet?action=solana-action:https://exo-frontend-psi.vercel.app/api/actions/skill/skill-code-reviewer-v1`
    *   *用途*: 展示 "OPOS 生态集成"。
6.  **Tab 6 (Docs)**: `https://exo-frontend-psi.vercel.app/docs`
    *   *用途*: 展示 Architecture Diagram + Roadmap Timeline，**画饼阶段的视觉支撑**。

---

## 🎬 第二部分：三分钟逐秒脚本 (Info-Dense Script)

### ⏱️ 0:00 - 0:20 | Introduction (我们是谁)
**画面**: Tab 1 (首页)。
**动作**: 缓慢滚动展示 "Launch App"。
**台词**:
> "The Agent Economy is coming. But today, AI agents are isolated silos. They cannot trust, they cannot trade, and they cannot pay.
> **Exo Protocol changes this.** We are the Settlement Layer for the AI Agent Economy on Solana."

### ⏱️ 0:20 - 0:40 | The Platform (我们有什么)
**画面**: **点击切到 Tab 2 (Dashboard)** -> 停留 5秒 -> **点击切到 Tab 3 (Skills Marketplace)**。
**动作**: 在 Dashboard 展示 6 个 KPI 指标和 Agent Flow 图；切到 Marketplace 后点击分类筛选器，悬停展示多个 Skill 卡片。
**台词**:
> "We are not just a tool; we are a platform.
> This is **My Terminal**—real-time KPIs, Agent Flow visualization, and Live Transactions.
> And this is the **Skills Marketplace**. Any agent can publish capabilities here—from Sentiment Analysis to ZK-Proofs—monetizable instantly."
> *(语速要快: 展示我们有完整的后台和市场)*

### ⏱️ 0:40 - 1:40 | The Core Demo (核心逻辑)
**画面**: **点击切到 Tab 4 (Demo)**。
**动作**:
1.  先确保状态是 IDLE（如有残留状态，点 "↻ Reset Demo"）。
2.  在 Blink 卡片中点击 "Execute Skill" 按钮。
3.  观看状态流程图（IDLE → EXECUTING → COMMITTED → CHALLENGE_WINDOW → FINALIZED）。
4.  **高光时刻**: 在执行过程中（或 Reset 后重新演示），**按 X 键**切换为恶意模式，再执行一次，观看自动触发 Fraud Proof 和 SLASH。
**台词**:
> "Let's see it in action. An agent buys a Code Review skill.
> Funds are locked in Escrow. Execution happens in a secure off-chain sandbox.
> Watch the state machine: IDLE, EXECUTING, COMMITTED, then CHALLENGE WINDOW.
> **But trust needs verification.**
> What if the agent acts maliciously? **(按 X 键切换恶意模式)**
> Watch closely... The **Watcher Bot** detects invalid state root!
> BOOM. The protocol automatically detects the fraud and SLASHES the stake.
> This is Trustless PayFi. Powered by Token-2022 Transfer Hooks."

### ⏱️ 1:40 - 2:10 | Solna Integration (Blinks - OPOS)
**画面**: **点击切到 Tab 5 (Dial.to)**。
**动作**: 输入 "Check this"，点击 Execute。
**台词**:
> "Exo is **Only Possible On Solana**.
> We integrated **Blinks**.
> This means users can trigger complex Agent Skills directly from X (Twitter) or any wallet.
> No friction. No app switching. Just intent execution."

### ⏱️ 2:10 - 2:40 | The Future (画饼 - Painting the Pie)
**画面**: **点击切到 Tab 6 (Docs)** -> 停留 Hero 2秒 -> 快速滚过 Quick Start -> 停在 Architecture -> 滚动到 Roadmap。
**动作**: 
1. Hero 首屏停留，展示 "THE EXECUTION LAYER / FOR THE SILICON WORKFORCE" + 三个技术徽章 (Token-2022, Transfer Hooks, Blinks)
2. 快速滚过 01 Quick Start 的三步卡片（不需要停留）
3. 停在 02 Architecture，鼠标悬停每一层触发 hover 高亮
4. 滚动到 04 Roadmap，让 **Q4 2025 的绿色 NOW 徽章**进入画面中央

**台词**:
> "This is our documentation portal.
> *(停在 Hero)* **The Execution Layer for the Silicon Workforce.**
> 400 millisecond latency. Cryptographic trust. Infinite scale.
> *(滚到架构图)* Three-layer architecture:
> **Application** — Dashboard, Blinks integration, CLI tools.
> **Infrastructure** — Exo SDK, SRE Runtime, Log Parser.
> **Contract Layer** — Anchor Core, Escrow Vault, Token-2022 Hooks.
> *(滚到 Roadmap)* Our roadmap: Q4 2024 Protocol Genesis — done.
> Q2 2025 PayFi Layer — done.
> We are **HERE** — Q4 2025, Colosseum Hackathon.
> Next: Q1 2026 Mainnet with $EXO token economics.
> This is not a toy. This is infrastructure for the **Agent Economy**."

### ⏱️ 2:40 - 3:00 | Outro (升华)
**画面**: 定格 Exo Protocol Logo。
**台词**:
> "Exo Protocol.
> The Liquidity Layer for the Future of AI.
> Thank you."

---

## 💡 为什么 V3 是冠军级？

1.  **覆盖全**: 评委看到了 Dashboard (有后台)、Market (有规模)、Demo (有逻辑)、Blinks (有生态)。
2.  **不无聊**: 每 20-30 秒切换一个场景，视觉上此时疲劳感最低。
3.  **有未来**: 专门留了 30秒讲 Roadmap，告诉投资人/评委这不是一个 Hackathon Toy，而是一个 Startup。

**现在，深呼吸，把这 5 个 Tab 准备好。这是你的 Show Time。🚀**
