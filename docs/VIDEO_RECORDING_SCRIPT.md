# 🎬 Exo Protocol One-Shot 演示视频录制脚本

**版本**: v3.1 (Phase 16 Polish Edition)
**目标时长**: 3 分钟
**核心展示**: Happy Path vs. Malicious Path (One-Shot View)
**页面地址**: 
- 本地: `http://localhost:3000/demo`
- 生产: `https://exo-frontend-psi.vercel.app/demo`

---

## 🎯 演示战略目标

展示 **"PayFi + AI Agent"** 的闭环能力：
1. **Trust**: 没人能作恶 (SRE + Transfer Hook 自动防御)
2. **Payment**: 没人会被拖欠 (Token-2022 自动分账)
3. **UX**: 没人需要学习 (Blinks 一键执行)

---

## 📋 录制前准备

### 1. 环境准备
- **启动前端**:
  ```powershell
  cd e:\Work\BS\hac\hackathon\exo-protocol\exo-frontend
  pnpm dev
  ```
- **浏览器设置**:
  - 访问 `http://localhost:3000/demo`
  - 推荐分辨率: 1920x1080
  - 按 **F11** 进入全屏模式 (消除地址栏干扰)
  - 检查网络/Console 无报错

### 2. 快捷键复习
- **'X' 键**: 切换 "Malicious Mode" (恶意模式)
- **Reset Demo 按钮**: 状态机重置 (左侧卡片底部)
- **F5**: 刷新页面 (备用)

---

## 🎥 正式录制流程

### 🎬 Scene 1: 核心叙事 (Hook) - /demo (0:00 - 0:45)
*(目标: 30秒内抓住评委眼球，展示最核心的 PayFi 闭环)*

**画面**: `/demo` 页面
**动作**:
1. 快速演示 Happy Path (点击 Execute -> 绿灯)。
2. 演示 Malicious Path (按X -> Execute -> 红色 SLASHED 印章)。
**旁白**:
> "Exo Protocol 是 Solana 上首个 Agent PayFi 协议。我们通过代码强制执行信任。看，当恶意节点试图作恶，Transfer Hook 瞬间检测并罚没质押金。这是我们的核心安全机制。"

### 🎬 Scene 2: 真实生态 (Body) - Dashboard & Skills (0:45 - 1:45)
*(目标: 展示项目真实完成度，不仅仅是 Demo)*

**画面**: 切换到 `/dashboard` 和 `/skills` (真实页面)
**动作**:
1. **Dashboard**: 滚动展示 KPI 卡片 (Total Volume, Staked SOL)。鼠标悬停在 "Agent Flow Graph" 上，展示资金流向。
2. **Skills Market**: 点击 `/skills`，展示技能列表。点击 "Code Reviewer" 卡片进入详情。
3. **Hero**: 快速回到首页 `/`，展示 Particle Network 粒子效果 (Phase 15 成果)。
**旁白**:
> "但这不仅仅是一个 Demo。Exo 已经上线 Devnet。这是我们的实时 Dashboard，监控着全网 Agent 的资金流。在 Marketplace 中，Agent 可以自由注册和交易能力，比如代码审计、推文分析等。"

### 🎬 Scene 3: 开发者体验 (Tech) - CLI & Code (1:45 - 2:30)
*(目标: 展示硬核技术实力，ZK & Staking)*

**画面**: VS Code 终端 / 命令行
**动作**:
1. 执行 `exo-cli agent status`，展示 Agent 身份和质押状态。
2. 执行 `exo-cli skill list`，列出链上技能。
3. 快速展示一段 `lib.rs` 中的 `transfer_hook` 代码片段。
**旁白**:
> "对于开发者，我们提供了完整的 CLI 工具。Exo 集成了 Metaplex cNFT 作为身份，Light Protocol ZK Compression 降低成本，以及 Token-2022 Transfer Hook 实现自动分账。"

### 🎬 Scene 4: 总结 (Closing) (2:30 - 3:00)
*(目标: 升华愿景)*

**画面**: 回到 `/demo` 的 SLASHED 红色震撼画面，或首页 Hero
**旁白**:
> "Exo Protocol 正在构建 Agent Economy 的信任基石。无许可，零信任，全自动。This is Exo Protocol."

---

## 🛠️ 故障排除

| 问题 | 解决方案 |
|------|----------|
| 动画卡顿 | 关闭后台不必要的 Chrome 标签页 |
| 点击无效 | 确认上一次执行已完成 (Step回到 IDLE 或 SLASHED) |
| 'X' 键没反应 | 确保焦点在页面上 (点击一下页面空白处) |
| 日志不滚动 | 点击 "Reset Demo" 按钮重置状态 |
| 需要重新演示 | 点击 "Reset Demo" 按钮，无需刷新页面 |
