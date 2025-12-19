# Exo Protocol: Solana 黑客松夺冠补强执行方案

> **代号**: Operation Red Slash
> **目标**: 冲击 Colosseum Hackathon Top 3 / Grand Champion
> **核心策略**: 补全 "SRE 挑战机制" 最后一公里，通过 "恶意攻击-自动防御" 的戏剧性演示，证明协议的去中心化与安全性。
> **演示限制**: 3 分钟视频
> **CSA 状态**: Phase 12 Active

---

## 1. 核心战术：The "Red Slash" Moment

在 3 分钟的演示中，常规的 "下单 -> 执行 -> 成功" 流程只能拿 80 分。要拿 100 分，必须展示 **"系统如何处理作恶"**。

**演示剧本核心 (The Plot)**:
1.  **正常交易**: 展示 PayFi 的丝滑 (30s)。
2.  **恶意攻击**: 一个恶意的 Executor 提交了错误结果，试图骗取资金 (30s)。
3.  **自动防御**: 链下 Verifier 瞬间捕获异常，发起挑战 (Chain Terminal 疯狂滚动红色日志) (30s)。
4.  **正义执行**: 链上合约裁决，恶意节点押金被 Slash，用户资金安全退回 (30s)。
5.  **升华**: "Code is Law" (30s)。

---

## 2. 补强执行清单 (Execution Checklist)

### Phase 1: 合约层 (The Judge) - `Critical`
> **目标**: 实现最小化挑战裁决逻辑。
> **Task ID**: `P12-CONTRACT`

- [ ] **Challenge Instruction**: 
  - 在 `exo-core` 中实现 `challenge(order_id, proof)` 指令。
  - 逻辑：接收 Verifier 的挑战，将订单状态从 `Committed` 变更为 `Disputed`。
- [ ] **Resolve Instruction**:
  - 实现 `resolve_dispute(order_id, winner)`。
  - **Hackathon Shortcut**: 为了演示稳定性，MVP 阶段可简化为 "Verifier 提交确凿证据（如 Hash 不匹配）直接触发 Slash"，跳过复杂的委员会投票。
  - **Slash 逻辑**: 扣除 Executor 押金 -> 转给 Challenger (Verifier) + 退还用户本金。

### Phase 2: SRE 运行时 (The Police) - `Standard`
> **目标**: 实现确定性验证与自动挑战。
> **Task ID**: `P12-SRE`

- [ ] **Bad Actor Bot**:
  - 编写一个脚本 `malicious_executor.py`，故意提交错误的 Result Hash。
- [ ] **Watcher Bot (Verifier)**:
  - 升级 `watcher.py`:
    1. 监听 `OrderCommitted` 事件。
    2. 拉取 Input 和 Skill Image。
    3. 本地 Docker 重放执行。
    4. 对比 Hash。
    5. **关键**: 若 Hash 不匹配，自动调用合约 `challenge` 指令。

### Phase 3: 前端视觉 (The Show) - `Standard`
> **目标**: 让后台的复杂的 SRE 逻辑 "被看见"。
> **Task ID**: `P12-UI`

- [ ] **Terminal UI 组件**:
  - 在 Dashboard 增加一个 "Network Terminal" 悬浮窗或侧边栏。
  - 实时显示 WebSocket 推送的日志：
    - `[INFO] Skill execution started...`
    - `[INFO] Result hash committed: 0xAbC...`
    - `[WARN] 🚨 HASH MISMATCH DETECTED!`
    - `[CRIT] ⚔️ CHALLENGE TX SUBMITTED: 5kN...`
    - `[SUCCESS] ✅ MALICIOUS ACTOR SLASHED.`
- [ ] **Red State (红灯模式)**:
  - 当挑战发生时，Dashboard UI 边框变红，给评委强烈的视觉冲击。

---

## 3. 三分钟演示视频分镜脚本 (The 3-Minute Movie)

**Task ID**: `P12-VIDEO`
**总时长**: 180秒
**节奏**: 快 -> 慢 (高潮) -> 快

| 时间 | 画面 | 旁白/字幕 | 关键动作 |
|------|------|-----------|----------|
| **0:00-0:30**<br>(Hook) | 快速剪辑：AI Agent 图标、Solana 标志、混乱的代码背景。<br>切入 Exo 首页 Hero 动画。 | "AI Agents are the new economic actors. But they are naked without a legal system."<br>"Meet Exo: The TCP/IP for Agent Economy." | 展示 Exo 极具科技感的 Landing Page。 |
| **0:30-0:50**<br>(Normal Flow) | 屏幕分屏：左边是 Twitter (Blink)，右边是 Exo Dashboard。<br>用户点击 Blink "Analyze Token"。 | "Seamless PayFi experience."<br>"One click, funds locked, skill executed." | 快速展示正常流程：Blink 下单 -> 终端绿字滚动 -> 结果返回。 |
| **0:50-1:20**<br>(The Crisis) | **音乐转为紧张**。<br>Dashboard 出现一个新的 Pending 订单。<br>终端显示：`Executor-998 connected (High Risk)`。 | "But what if the executor is malicious?"<br>"Let's simulate an attack." | 运行 `malicious_executor.py`。<br>终端显示 Executor 提交了结果。<br>UI 显示 "Result Committed"。 |
| **1:20-1:50**<br>(The Slash) | **UI 突然变红 (Red Alert)**。<br>Terminal 疯狂滚动报警日志。<br>画面特写：`HASH MISMATCH` -> `CHALLENGE SENT`。 | "Exo's Watcher Network never sleeps."<br>"Verification failed. Challenge initiated instantly." | 展示 Verifier 自动捕获错误。<br>展示链上交易 Hash 弹出。<br>订单状态变为 `SLASHED`。 |
| **1:50-2:10**<br>(The Result) | 资金流向图 (Sankey Diagram) 动画：<br>Executor 押金被切分，一部分给 Verifier，用户本金回流。 | "Justice served on-chain."<br>"Transfer Hooks executed the penalty automatically." | 展示 Transfer Hook 的代码片段一闪而过 (证明是真代码)。 |
| **2:10-2:40**<br>(Under the Hood) | 快速滚动的 Rust 代码、Dockerfile、SRE 架构图。<br>展示 GitHub 提交记录和测试覆盖率。 | "Built with Anchor, Token-2022, and Docker."<br>"Deterministic execution. Heavy engineering." | 秀肌肉：工程密度展示。 |
| **2:40-3:00**<br>(Outro) | 回到 Exo Logo。<br>背景是无数连接的 Agent 节点。 | "Exo Protocol. <br>The Skill-Native PayFi Layer for Solana." | 结束画面 + Hackathon 链接。 |

---

## 4. 资源需求清单 (R6 Check)

| 资源 | 状态 | 动作 |
|------|------|------|
| **Devnet RPC** | ✅ Ready | Helius API |
| **Docker** | ✅ Ready | SRE Sandbox |
| **Anchor** | ✅ Ready | Contract Dev |
| **OBS/ScreenFlow** | ⏳ Pending | Video Recording |

## 5. 立即行动 (Next Steps)

1.  **合约**: 实现 `challenge` 指令 (P12-CONTRACT)。
2.  **Bot**: 编写 `malicious_bot.py` (P12-SRE)。
3.  **前端**: 实现 Terminal UI (P12-UI)。
4.  **演练**: 跑通 Red Slash 流程。

---
*Generated by CSA Protocol for Operation Red Slash*
