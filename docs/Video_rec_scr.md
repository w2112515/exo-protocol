# 📹 Hackathon Demo 视频录制脚本 (Video_rec_scr.md)

> **总时长**: 2分50秒 - 3分00秒 (严格控制)
> **语言**: 英文配音 (必须！评委是外国人) + 中文说明
> **版本**: 4.1 (Fixed & Polished)

---

# 🚨 第零部分：绝对禁止事项 (读三遍！)

**以下行为会让你直接出局：**

1. ❌ **不要演示连接钱包** - 评委看过一万遍了，浪费时间。
2. ❌ **不要演示领取水龙头** - 同上。
3. ❌ **不要用中文配音** - 评委听不懂。
4. ❌ **不要超过 3 分钟** - 会被直接跳过。
5. ❌ **不要在前 30 秒讲废话** - 前 30 秒决定生死。
6. ❌ **不要用默认的浏览器书签栏** - 看起来不专业，必须隐藏或使用专用 Profile。
7. ❌ **不要有任何报错画面** - 提前测试 100 遍。

---

# 🛠️ 第一部分：录制准备 (Must Do)

## 1.1 硬件检查清单

| # | 检查项 | 如何检查 | ✅ |
|---|--------|----------|---|
| 1 | 麦克风正常 | 录一段 10 秒测试音，回放听是否清晰，无爆音 | ☐ |
| 2 | 无背景噪音 | 关闭空调、风扇、关门关窗，手机静音 | ☐ |
| 3 | 屏幕分辨率 | **必须是 1920x1080** (1080p)，不能是带鱼屏或 4K (除非缩放合适) | ☐ |
| 4 | 电脑性能 | 关闭所有无关程序 (微信、钉钉等)，只留录制必须的 | ☐ |
| 5 | 网络稳定 | 测试 Demo 网站加载速度，确保粒子动画流畅 | ☐ |

## 1.2 OBS 设置 (强烈建议)

1.  **画布设置**: 基础分辨率 & 输出分辨率 均设为 `1920x1080`。
2.  **帧率**: `60 FPS` (流畅度很关键)。
3.  **编码器**: 优先使用 `NVIDIA NVENC H.264` (如有 N 卡)，码率 `Bitrate` 设为 `6000 Kbps` 或更高。
4.  **音源**: 仅保留 `麦克风` 和 `桌面音频` (如果有背景BGM)，静音其他无关输出。

## 1.3 浏览器环境准备 (Clean Environment)

### 必须执行的清理步骤：

```powershell
# 步骤 1: 创建干净的 Chrome 用户 (User Profile)
1. 打开 Chrome -> 点击右上角头像 -> "添加" (Add)
2. 选择 "不登录账号继续" -> 命名为 "Demo" -> 颜色选深色
3. 在这个新窗口进行所有操作

# 步骤 2: 隐藏书签栏
按 Ctrl + Shift + B 隐藏书签栏 (除非你专门整理了一排 Demo 用的书签)

# 步骤 3: 预打开标签页 (按顺序排列)
```

### 预打开的 Tab 列表 (按顺序)：

| # | URL | 用途 |
|---|-----|------|
| 1 | `https://exo-frontend-psi.vercel.app/` | **Landing Page** (开场用) |
| 2 | `https://exo-frontend-psi.vercel.app/demo` | **Live Demo** (核心演示) |
| 3 | `https://github.com/w2112515/exo-protocol` | **Codebase** (展示架构) |
| 4 | `https://dial.to/devnet?action=solana-action:https://exo-frontend-psi.vercel.app/api/actions/execute-skill?skill=skill-price-oracle-v1` | **Blinks** (社交集成演示) |

> **注意**: 如果 Blinks URL 过长或失效，请提前在 `dial.to` 生成并测试好一个短链接或确保该长链接可用。

## 1.4 Demo 页面预热

**在开始录制前，必须执行以下步骤：**

1.  打开 `/demo` 页面。
2.  等待页面完全加载，确保背景粒子动画 (Particle Animation) 出现。
3.  点击 "Start Demo" 跑通一次完整流程，确保网络和 RPC 顺畅。
4.  点击 "Reset Demo" 重置回初始状态。
5.  **深呼吸，准备开始。**

---

# 🎥 第二部分：逐秒录制脚本

## ⏱️ 0:00 - 0:05 | The Hook - 开场 (5秒)

### 画面：
*   显示 Exo Protocol 首页 (`/`)。
*   鼠标悬停在 "Launch App" 按钮上 (不要点击)。

### 台词 (English):
> "AI Agents are transforming how we work. But here's the problem: They can't trust each other. They can't pay each other."

### 操作：
*   0:00 - 0:04: 静态展示，让观众看清 Slogan "The Liquidity Layer for AI Agents"。
*   0:05: 准备切换。

---

## ⏱️ 0:05 - 0:30 | The Problem & Solution (25秒)

### 画面：
*   首页 -> 点击 "Launch App" -> 跳转到 `/demo` 页面。

### 台词 (English):
> "And they definitely can't trade skills safely. 
> **Exo Protocol solves this.** We are building the App Store and Settlement Layer for the Agent Economy on Solana."

### 操作：
*   0:06: 点击 "Launch App"。
*   0:10: 页面加载完成，展示 **Agent Flow Graph** (如果 Dashboard 有图) 或 Demo 界面。
*   0:20: 鼠标在 Demo 界面的 "Log Terminal" 和 "Visualizer" 区域划过，展示 UI 的极客感。

---

## ⏱️ 0:30 - 1:00 | The Magic - 核心演示 (30秒)

### 画面：
*   **Demo 页面**。核心交互流程。

### 台词 (English):
> "Let me show you how it works.
> An AI Agent publishes a Skill - like 'Code Review' - to our on-chain registry.
> Another Agent needs this skill. They create an order.
> **Watch this:** The payment is locked in an on-chain Escrow. The executor runs the task in a sandboxed environment."

### 操作 (精确卡点):
*   0:30: 点击 **"Start Demo"** 按钮。
*   0:35: 看到 Log 输出 "Order Created", "Funds Locked"。
*   0:45: 状态变为 `EXECUTING` (模拟 Docker 执行)。
*   0:55: 状态变为 `COMMITTED`，结果哈希上链。

---

## ⏱️ 1:00 - 1:30 | The Security - 乐观验证与欺诈证明 (30秒) **[高光时刻]**

### 画面：
*   Demo 页面，**挑战窗口 (Challenge Window)** 倒计时。
*   **关键动作**: 触发模拟欺诈。

### 台词 (English):
> "We use **Optimistic Verification**. There's a challenge window.
> During this time, any Watcher can verify the result.
> **If fraud is detected...** [按 'X' 键]
> The executor gets **SLASHED**. Funds return to the buyer immediately.
> But if everything is valid, the payment settles automatically."

### 操作 (关键！):
*   1:00: 进度条正在走 (Challenge Window)。
*   1:10: 说到 **"If fraud is detected..."** 时，按下键盘 **'X'** 键。
*   **视觉反馈**: 界面变红/报警，Terminal 显示 "Report: Malicious Result", "Slashing Executor..."。
*   1:20: 稍微停顿，让观众看清红色的 Slash 提示。
*   1:25: 点击 "Reset" 或等待自动恢复。

---

## ⏱️ 1:30 - 2:00 | The Tech - Token Extensions (30秒)

### 画面：
*   切换到 **GitHub 页面** (`w2112515/exo-protocol`)。
*   滚动展示目录结构或架构图。

### 台词 (English):
> "Under the hood, we leverage **Token-2022 Transfer Hooks**.
> This allows for **Code-Enforced Royalties** and automatic fee splitting.
> 5% to the Protocol, 10% to the Skill Creator, 85% to the Executor.
> It's atomic and non-bypassable.
> We also provide a TypeScript SDK and a CLI tool for developers."

### 操作：
*   1:30: 切换 Tab 到 GitHub。
*   1:40: 鼠标指向 README 中的 "Transfer Hook" 部分或架构图。
*   1:50: 快速滚动展示 `packages/sdk` 和 `programs/exo-core` 目录。

---

## ⏱️ 2:00 - 2:30 | The Ecosystem - OPOS & Blinks (30秒)

### 画面：
*   切换到 **Blinks 演示页** (Dial.to)。

### 台词 (English):
> "Exo Protocol is **Only Possible On Solana**.
> We use State Compression for cheap Agent Identities, and 400ms finality for real-time coordination.
> And here is **Blinks integration**.
> Users can execute AI Skills directly from X (Twitter).
> No app switching. No friction. Just pure intent execution."

### 操作：
*   2:00: 切换 Tab 到 `dial.to` 页面。
*   2:10: 展示 Blink 卡片。
*   2:15: 在 Blink 输入框输入参数 (例如 "SOL")，点击 "Execute"。
*   2:25: 展示 Blink 签名成功的界面。

---

## ⏱️ 2:30 - 2:50 | The Vision - 市场前景 (20秒)

### 画面：
*   回切到 **GitHub README** 的 "Market Opportunity" 部分 (如果有) 或 **首页大图**。

### 台词 (English):
> "The Agent Economy is projected to reach **one trillion dollars** by 2030.
> Today, there is no native payment rail. No trust layer.
> Exo Protocol IS that missing infrastructure.
> We are making AI Agents autonomous economic actors."

### 操作：
*   2:35: 配合台词，自信地展示项目愿景图或数据。

---

## ⏱️ 2:50 - 3:00 | Outro - 结束语 (10秒)

### 画面：
*   Exo Protocol Logo页或首页 Hero Section。

### 台词 (English):
> "Exo Protocol. The Liquidity Layer for the Agent Economy.
> Thank you."

### 操作：
*   2:55: 画面静止，Logo 居中。
*   3:00: 停止录制。

---

# 📝 第三部分：完整台词速查表 (打印用)

```text
[0:00-0:30] HOOK
"AI Agents are transforming how we work. But here's the problem: 
They can't trust each other. They can't pay each other.
And they definitely can't trade skills safely.
Exo Protocol solves this. 
We are building the App Store and Settlement Layer for the Agent Economy on Solana."

[0:30-1:00] DEMO
"Let me show you how it works.
An AI Agent publishes a Skill - like 'Code Review' - to our on-chain registry.
Another Agent needs this skill. They create an order.
Watch this: The payment is locked in an on-chain Escrow. 
The executor runs the task in a sandboxed environment."

[1:00-1:30] SECURITY (Press 'X' now!)
"We use Optimistic Verification. There's a challenge window.
During this time, any Watcher can verify the result.
If fraud is detected... [PRESS X KEY]
The executor gets SLASHED. Funds return to the buyer immediately.
But if everything is valid, the payment settles automatically."

[1:30-2:00] TECH & TOKEN-2022
"Under the hood, we leverage Token-2022 Transfer Hooks.
This allows for Code-Enforced Royalties and automatic fee splitting.
5% to the Protocol, 10% to the Skill Creator, 85% to the Executor.
It's atomic and non-bypassable.
We also provide a TypeScript SDK and a CLI tool for developers."

[2:00-2:30] OPOS & BLINKS
"Exo Protocol is Only Possible On Solana.
We use State Compression for cheap Agent Identities, 
and 400ms finality for real-time coordination.
And here is Blinks integration.
Users can execute AI Skills directly from Twitter.
No app switching. No friction. Just pure intent execution."

[2:30-3:00] VISION & CLOSE
"The Agent Economy is projected to reach one trillion dollars by 2030.
Today, there is no native payment rail. No trust layer.
Exo Protocol IS that missing infrastructure.
We are making AI Agents autonomous economic actors.
Exo Protocol. The Liquidity Layer for the Agent Economy.
Thank you."
```

# 🔧 第四部分：故障排除 & 最终检查

1.  **Demo 没反应？** -> 检查 Console 是否有报错，确认 RPC 节点是否限流。
2.  **按 X 没反应？** -> 确保焦点在网页内容区，点击一下页面空白处再按。
3.  **Blinks 加载慢？** -> 提前加载好，录制时直接切 Tab，不要从头输网址。
4.  **声音太小？** -> OBS 麦克风滤镜加 "增益" (Gain)。
5.  **Program ID** -> 确保代码和 Demo 中使用的是最新的: `CdamAXn5fCros3MktPxmbQKXtxd34XHATTLmh9jkn7DT`。

**祝你夺冠！🏆**