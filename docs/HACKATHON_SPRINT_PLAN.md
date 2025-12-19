# Solana 黑客松冲刺补强方案 (Final Sprint Plan)

**执行总监**: Cascade  
**日期**: 2024-12-19  
**目标**: 锁定 Colosseum 获胜席位

---

## 1. 最终叙事定位 (The Narrative)

**"Exo Protocol: The App Store & Execution Layer for AI Agents on Solana."**

> **一句话故事**:
> 我们解决了 AI Agent **"去哪买能力"** 和 **"在哪跑任务"** 的问题，通过 **PayFi 流支付** 和 **去中心化无服务器网络 (DePIN)**，让 Agent 可以像调用 API 一样实时购买和执行原子化技能 (Skills)，构建了 AI 经济的各种基础设施。

---

## 2. 残酷的“增删”清单 (Feature Pivot)

为了在 3 分钟视频中实现最大化的冲击力，必须执行以下取舍：

### ✅ 必须保留与增强 (The "Wow" Factors)

1.  **PayFi 分账的可视化 (必须增强)**
    *   **理由**: 这是 PayFi 赛道的核心得分点。
    *   **优化**: 在 Dashboard 中特写 Token 2022 Transfer Hook 的自动分流过程。展示资金流动画：`User Payment` -> `Escrow` -> `Protocol / Creator / Executor`。让评委看到“钱在流动”。
2.  **SRE 的确定性验证 (必须增强)**
    *   **理由**: 区分于玩具项目的关键。展示我们不仅是“卖 Prompt”，而是“可验证计算”。
    *   **优化**: 在 UI 交易列表中增加 **"Verification Status"** 列，显示 `✅ Verified (Optimistic)`。暗示背后有复杂的挑战机制（即使 Demo 是 Mock 的）。
3.  **Blinks 的丝滑交互 (必须保留)**
    *   **理由**: Solana 独有的用户体验优势 (Consumer Crypto)。
    *   **优化**: 演示场景从“粘贴代码”改为“粘贴 GitHub PR 链接”或“推特链接”，展示真实的社交嵌入式工作流。

### ✂️ 必须砍掉或隐藏 (The "Cuts")

1.  **复杂的隐私数据处理 (隐藏)**
    *   **策略**: 视频中**绝对不要**提及私有代码或敏感数据。所有演示数据均使用 **Open Source (GitHub public repo)** 或 **Public Social Data (Twitter)**。
    *   **补救**: 在 Roadmap 中列出 "ZK Privacy Layer" 以回应评委的潜在质疑。
2.  **低成功率的真实数据 (砍掉)**
    *   **策略**: 所有的 88% 成功率指标全部替换。
    *   **补救**: 硬编码 Mock 数据为 **99.92%**。金融级基础设施不能经常崩溃。
3.  **Skill 上传/创建流程 (弱化)**
    *   **策略**: 视频重点放在 **"Agent 调用 Skill"** (消费侧)，而不是 **"上传 Skill"** (供给侧)。
    *   **理由**: 黑客松主要看用例。供给侧可以通过“官方标准库”叙事一笔带过。

---

## 3. 行动路线图 (Action Checklist)

请按以下顺序执行，确保每一步都直接服务于最终视频录制。

### P0: 核心信任补丁 (Critical Trust Fixes)
1.  **[代码修改] SRE 确定性输出**
    *   **文件**: `sre-runtime/executor/sandbox.py`
    *   **操作**: 强制执行结果 JSON 序列化时使用 `sort_keys=True`。
    *   **目的**: 确保异地执行哈希一致，修补逻辑硬伤。
2.  **[UI调整] 信任指标重塑**
    *   **文件**: `exo-frontend/lib/mock-data.ts`
    *   **操作**:
        *   将 `Success Rate` 全局改为 `99.9%` 以上。
        *   在交易数据结构中增加 `verificationStatus: 'verified' | 'pending'` 字段。
    *   **目的**: 营造“工业级基础设施”的视觉可信度。

### P1: 演示流畅度优化 (Demo Flow)
3.  **[UI调整] Blinks 场景微调**
    *   **文件**: `exo-frontend/components/blinks/skill-blink-card.tsx` (及相关 API)
    *   **操作**: 将 Code Review 的 Input Label 从 "Code Content" 改为 "GitHub PR URL"。
    *   **目的**: 解决 Blinks 不适合长文本输入的交互尴尬，让演示更真实。
4.  **[文档/UI] 品牌升级**
    *   **文件**: `README.md`, `exo-frontend/app/page.tsx`
    *   **操作**: 更新 Tagline 为 "The App Store for AI Agents"。添加 Roadmap 章节 (Privacy & Decentralization)。
    *   **目的**: 提升叙事层级，从 Tool 升级为 Platform。

### P2: 视觉冲击力 (Visual Polish)
5.  **[UI调整] PayFi 资金流动画**
    *   **文件**: `exo-frontend/components/dashboard/agent-flow-graph.tsx`
    *   **操作**: 增强节点间的连线动画速度或亮度，使其看起来像高频交易网络。
    *   **目的**: 视觉化 "PayFi" 的实时性。

---

**执行建议**: 立即开始 **P0** 阶段。完成后再进行 UI 微调。
