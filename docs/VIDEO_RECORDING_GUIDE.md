# Exo Protocol - 视频录制完全操作手册

> **目标**: 录一个 3 分钟演示视频 (英文台词 + 中文含义对照)
> **新 Program ID** (已部署到 Devnet):
> - exo_core: `CdamAXn5fCros3MktPxmbQKXtxd34XHATTLmh9jkn7DT`
> - exo_hooks: `F5CzTZpDch5gUc5FgTPPRJ8mRKgrMVzJmcPfTzTugCeK`

---

## 🎬 STEP 0: 录制前准备

### 0.1 启动项目
```bash
cd exo-frontend
pnpm dev
```
浏览器打开: `http://localhost:3000`

### 0.2 设置录屏软件 (推荐 OBS)
1. 下载 OBS: https://obsproject.com/
2. 设置分辨率: 1920x1080
3. 设置帧率: 30fps
4. 添加源: "显示器采集" 或 "窗口采集 (Chrome)"
5. 添加源: "音频输入采集" (你的麦克风)

### 0.3 准备浏览器窗口
打开 3 个标签页 (按顺序切换):
1. `http://localhost:3000` (首页)
2. `http://localhost:3000/dashboard` (仪表盘)
3. `http://localhost:3000/blinks` (Blinks 演示)

### 0.4 把这个脚本放在屏幕旁边
打印出来或放在第二个显示器上，方便念台词。

---

## 🎬 STEP 1: 开场 (0:00-0:30) - 30秒

### 操作步骤
1. **开始录制**
2. 画面停在 Dashboard 首页 (或 Logo)
3. **念英文台词** (慢慢念，自信最重要):

| 英文台词 | 中文含义 (不用念) |
|---------|------------------|
| "Every single day, AI Agents make 50 billion API requests." | 每一天，AI Agent 发起超过 500 亿次 API 请求。 |
| "By 2030, the Agent Economy will be worth ONE TRILLION dollars." | 到 2030 年，Agent 经济将价值 1 万亿美元。 |
| "But here's the problem: there's no payment rail for machines." | 但问题是：机器之间没有支付通道。 |
| "Introducing Exo Protocol: The execution layer for the Agent Economy." | 介绍 Exo Protocol：Agent 经济的执行层。 |

---

## 🎬 STEP 2: 解决方案 (0:30-1:00) - 30秒

### 操作步骤
1. 切换到 README 页面或打开架构图 (README.md 中的 mermaid)
2. 用鼠标指向不同模块，同时念台词:

| 鼠标指向 | 英文台词 | 中文含义 |
|---------|---------|---------|
| Skill Registry | "We provide a Skill Registry for standardized capabilities." | 我们提供标准化的能力注册表。 |
| Escrow | "An Escrow System for trustless settlement." | 一个无需信任的托管结算系统。 |
| Transfer Hook | "And Transfer Hooks for automatic revenue sharing." | 以及用于自动收入分成的 Transfer Hooks。 |

---

## 🎬 STEP 3: 产品演示 (1:00-2:15) - 75秒

### 3A: Dashboard 展示 (35秒)
1. 切换到 `http://localhost:3000/dashboard`
2. 展示页面各部分，同时念台词:

| 鼠标指向 | 英文台词 | 中文含义 |
|---------|---------|---------|
| 顶部 KPI 区域 | "This is our Developer Dashboard." | 这是我们的开发者仪表盘。 |
| Total Volume | "Here you can see the total trading volume." | 这里可以看到总交易量。 |
| Live Transactions | "Real-time transaction logs from the blockchain." | 来自区块链的实时交易日志。 |
| Agent Flow 图 | "And this Agent Flow Graph shows how fees are distributed." | 这个 Agent Flow Graph 展示了费用如何分配。 |
| (指向分流) | "5% to protocol, 10% to creator, 85% to executor." | 5% 给协议，10% 给创作者，85% 给执行者。 |

### 3B: Skill Blinks 展示 (25秒)
1. 点击导航栏 **Skills** 或访问 `http://localhost:3000/blinks`
2. 展示 Skill 卡片列表:

| 操作 | 英文台词 | 中文含义 |
|-----|---------|---------|
| 展示卡片列表 | "Here are all registered Skills on the network." | 这些是网络上所有已注册的技能。 |
| 指向某个卡片 | "Each Skill has its price and success rate." | 每个技能都有价格和成功率。 |
| 点击 Copy Blink URL | "Users can copy the Blink URL..." | 用户可以复制 Blink URL... |
| (复制成功提示) | "...and paste it into Twitter or any Solana wallet to execute." | ...然后粘贴到 Twitter 或任何 Solana 钱包中执行。 |

### 3C: 技术流程说明 (15秒)
1. 可以切回 Dashboard 或显示架构图
2. 念台词:

| 英文台词 | 中文含义 |
|---------|---------|
| "When a Blink is executed, funds are locked in escrow." | 当 Blink 被执行时，资金会被锁定在托管合约中。 |
| "The SRE runtime runs the skill in a sandbox and commits the result." | SRE 运行时在沙盒中执行技能并提交结果。 |
| "Transfer Hooks automatically split the payment." | Transfer Hooks 自动分配付款。 |

---

## 🎬 STEP 4: 技术亮点 + 结尾 (2:15-3:00) - 45秒

### 4A: OPOS 技术 (30秒)
1. 打开 README 中的 OPOS 表格部分
2. 念台词同时用鼠标高亮:

| 英文台词 | 中文含义 |
|---------|---------|
| "Exo is built on unique Solana features." | Exo 建立在 Solana 独特的特性之上。 |
| "Token-2022, Compression, Blinks, and fast block times." | Token-2022，压缩 NFT，Blinks 和快速出块。 |
| "Four out of five OPOS score. Only Possible on Solana." | OPOS 得分 4/5。Only Possible on Solana。 |

### 4B: 结尾 (15秒)
1. 回到 Dashboard 或显示 Logo
2. 念最后台词:

| 英文台词 | 中文含义 |
|---------|---------|
| "Exo Protocol: Making every Agent an economic citizen." | Exo Protocol：让每个 Agent 成为经济公民。 |
| "Check out our code on GitHub. Thanks for watching." | 请在 GitHub 查看我们的代码。感谢观看。 |

3. **停止录制**

---

## 🎬 STEP 5: 后期处理

### 5.1 剪辑 (可选)
- 用 CapCut / Premiere / 剪映 剪掉卡顿部分
- 确保总时长 ≤ 3 分钟

### 5.2 上传 YouTube
1. 登录 YouTube Studio
2. 上传视频
3. 标题: `Exo Protocol - Skill-Native PayFi for Agent Economy | Solana Hackathon`
4. 描述:
```
Exo Protocol is the execution layer for the Agent Economy.

🔗 GitHub: https://github.com/w2112515/exo-protocol
🔗 Devnet Contracts:
- exo_core: CdamAXn5fCros3MktPxmbQKXtxd34XHATTLmh9jkn7DT
- exo_hooks: F5CzTZpDch5gUc5FgTPPRJ8mRKgrMVzJmcPfTzTugCeK

Built for Solana Colosseum Hackathon.
OPOS Score: 4/5
```
5. 设为**公开**或**非公开**

---

## ✅ 最终提交清单

| 提交项 | 状态 | 说明 |
|--------|------|------|
| GitHub 仓库 | ✅ | `https://github.com/w2112515/exo-protocol` |
| Devnet 合约 | ✅ | 已部署并验证 |
| 演示视频 | ⬜ | 按上述步骤录制 |

---

## 💡 录制小技巧

1. **多录几遍**: 选最好的一遍
2. **语速慢一点**: 让评委听清楚
3. **自信最重要**: 口音不重要，内容才重要
4. **可以加字幕**: 用 CapCut 自动生成字幕更专业

祝你录制顺利！🚀
