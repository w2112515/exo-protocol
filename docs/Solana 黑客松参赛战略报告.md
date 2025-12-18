# **Solana生态黑客松全景战略深度研究报告：赛题透视、隐性规则与高维竞争策略**

## **执行摘要**

本报告专为具备极高技术执行力（AI辅助下的无限产能）与充足时间资源的参赛者量身定制，旨在以“资深产品经理与黑客松导师”的双重视角，对Solana生态黑客松（如Colosseum主办的Renaissance、Radar等赛事）进行详尽的战略拆解。报告全长约25,000字，旨在通过深度剖析过往冠军案例、评委心理模型及生态发展趋势，为参赛者构建一套从创意构思到最终交付的“降维打击”策略。

分析表明，Solana黑客松已从单纯的技术竞赛演变为Web3领域的顶级创业加速器入口。传统的“周末黑客”式项目（Weekend Hacks）已难以突围，取而代之的是具备商业闭环逻辑、展现“重型工程”实力（Heavy Engineering）以及深度契合Solana特有原语（如Token Extensions, Blinks, ZK Compression）的准创业项目。报告核心洞察指出，利用AI编程助手的“无限产能”，参赛者应避开AMM、基础NFT市场等“红海”，转而通过构建高复杂度的PayFi协议、AI Agent链上经济体及DePIN验证基础设施等“蓝海”赛道，通过技术堆栈的饱和式攻击（Saturated Engineering）获取不对称竞争优势。

## ---

**第一章 赛题透视：Colosseum时代的竞赛逻辑重构**

要赢得比赛，首先必须理解比赛的本质。自Solana基金会将黑客松运营权移交给Colosseum平台以来，赛事的底层逻辑发生了根本性转移。这不再仅仅是一场代码比拼，而是一场关于“可投资性”（Investability）的预演。

### **1.1 从“极客狂欢”到“创投漏斗”的范式转移**

在早期的Solana黑客松（如Ignition或Riptide时期），一个充满创意的各种Demo甚至只需前端交互即可获得优异名次。然而，随着生态的成熟和Colosseum加速器模式的引入，评委的视角已完全VC化（Venture Capitalized）。

#### **1.1.1 隐性得分点一：创业公司的雏形感**

评委在审视项目时，实际上是在问一个核心问题：“这个团队在黑客松结束后，是否还能存活并发展？”1。

* **长期主义信号**：获胜项目通常展现出超越赛期的规划。例如，Radar赛季的冠军Reflect，不仅仅是一个稳定币协议，它设计了一整套基于LST（流动性抵押代币）收益的Delta中性对冲机制，其白皮书和文档的深度堪比A轮融资项目3。  
* **品牌与叙事**：顶级项目不再使用默认的UI组件库，而是拥有独立的品牌视觉体系。项目名称、Logo设计以及Pitch Deck（融资路演文档）的专业度，被视为团队执行力的重要隐性指标。  
* **AI赋能点**：利用AI助手（Claude/Midjourney），参赛者可以在单人作战的情况下，产出由专业设计团队才能完成的品牌资产和UI/UX设计，从而在第一眼印象分上碾压对手。

#### **1.1.2 隐性得分点二：“唯有Solana”（Only Possible on Solana, OPOS）**

这是Solana基金会及评委最看重的核心价值观之一。如果你的项目可以轻易地迁移到以太坊Layer 2（如Arbitrum或Base）上，那么它的得分上限将被锁死。高分项目必须触及Solana的性能极限或独有特性5。

* **性能极限压榨**：Renaissance赛季的冠军Ore，通过在Solana上实现工作量证明（PoW）挖矿，制造了海量的交易并发，直接挑战了网络的吞吐量极限。这种“压力测试”式的项目极受核心开发者评委（如Anatoly Yakovenko或Helius Labs团队）的青睐，因为它展示了Solana区别于其他EVM链的高性能7。  
* **独有原语应用**：深度集成Solana特有的技术栈，如**Token Extensions (Token-2022)**、**State Compression (cNFTs)** 或 **ZK Compression**。例如，使用Token Extensions的Transfer Hooks（转账挂钩）来实现链上版税强制执行或复杂的合规逻辑，这在EVM链上实现成本极高，但在Solana上却是原生支持的优势点9。

### **1.2 评委画像与心理模型解析**

了解谁在打分，是制定策略的关键。Solana黑客松的评委通常由三类人组成：核心协议工程师、顶级VC合伙人（如Multicoin, Dragonfly）以及生态头部项目创始人（如Jupiter, Tensor的创始人）。

| 评委类型 | 关注核心 | 心理痛点 | 应对策略 (AI赋能) |
| :---- | :---- | :---- | :---- |
| **核心协议工程师** | 代码质量、架构创新、OPOS特性 | 厌恶EVM生搬硬套、厌恶低效的代码堆砌 | 利用AI进行Rust代码优化，生成复杂的宏（Macros）和严谨的测试覆盖率（Test Coverage），展示“重型工程”能力。 |
| **VC投资人** | 市场规模 (TAM)、商业模式、护城河 | 厌恶微创新、厌恶没有变现逻辑的“公共物品” | 利用AI生成详尽的市场分析报告放入README，构建精密的代币经济学模型（Tokenomics），强调PayFi等万亿级赛道潜力。 |
| **生态创始人** | 用户体验 (UX)、可组合性、病毒传播 | 厌恶糟糕的钱包交互、厌恶封闭系统 | 专注于前端交互的丝滑度（Blinks集成），设计与其他协议（如Jupiter, Marginfi）的可组合性接口。 |

### **1.3 提交物的“黄金标准”**

在数千个提交项目中，评委分配给每个项目的平均时间极短。因此，提交物必须符合特定的“黄金标准”才能通过初筛。

* **三分钟视频的叙事工程**：这不仅是演示，更是电影级的叙事。  
  * **前30秒定生死**：必须在前30秒内清晰陈述痛点（Problem Statement）并展示解决方案的高潮部分。绝不要在视频里演示“如何连接钱包”或“如何领水”，这是浪费时间的自杀行为11。  
  * **后端可视化**：如果你的项目是基础设施或后端协议（如Txtx），不要只展示命令行界面。利用AI快速构建一个“可视化仪表盘”，将后端的逻辑流（如智能合约的执行路径、资金流向）用动态图表展示出来。Txtx之所以能赢，是因为它将枯燥的运行手册（Runbooks）变成了一个直观的开发者平台4。  
* **代码仓库的“门面”**：README文档是项目的说明书。一个优秀的README应包含架构图（Mermaid/PlantUML）、本地运行指南、测试网部署地址以及详细的功能列表。AI助手可以帮助你快速生成极其专业的文档结构和图表。

## ---

**第二章 赛道预判：红海规避与蓝海突围**

基于对历届获奖名单（Hyperdrive, Renaissance, Radar）的数据分析，我们可以清晰地划定“红海”（过度竞争、低胜率）与“蓝海”（高潜力、高胜率）的界限。作为拥有无限技术力的参赛者，你的目标是进入那些需要“重型工程”门槛的蓝海领域。

### **2.1 红海警示录：那些“烂大街”的方向**

这些方向虽然看起来也是需求，但由于实现门槛低、存量项目巨大，除非你有颠覆性的创新（10x Better），否则极难获奖。

#### **2.1.1 通用型AMM DEX（自动做市商）**

* **现状**：Solana上已经有了Raydium, Orca, Meteora等巨头，流动性护城河极深。  
* **判词**：仅仅修改一条联合曲线（Bonding Curve）或增加一个UI皮肤，无法打动评委。除非你像Urani那样，从底层彻底解决MEV（最大可提取价值）问题，引入意图（Intent-based）架构，否则不要触碰DEX赛道1。

#### **2.1.2 基础NFT市场 (Vanilla NFT Marketplaces)**

* **现状**：Magic Eden和Tensor双寡头格局已定。  
* **判词**：简单的“上传图片、铸造、挂单”市场毫无竞争力。评委对于没有特定垂直领域（如RWA、游戏资产）或特定技术创新（如状态压缩）的NFT市场已产生审美疲劳。

#### **2.1.3 没有预言机解决方案的“Web3版Uber/Airbnb”**

* **现状**：这类“物理世界映射”项目常因无法解决“线下履约验证”问题而被视为欺诈风险高发区。  
* **判词**：如果你的项目声称去中心化打车，但无法解释如何防止司机刷单（缺乏硬件验证），那么在技术评审阶段就会被淘汰。这属于“伪需求”或“未完成的基础设施”15。

#### **2.1.4 简单的预测市场**

* **现状**：二元期权类的预测市场非常拥挤，且面临监管和流动性分散的问题。  
* **判词**：除非结合了**Blinks**（社交化嵌入）或**AI Agent**（自动操盘），否则传统的预测市场界面缺乏新意。

### **2.2 蓝海罗盘：四大高潜赛道深度解析**

以下赛道是Solana基金会重点关注（Requests for Startups）且技术门槛较高的领域，非常适合发挥你的“无限技术力”优势。

#### **2.2.1 蓝海一：PayFi (支付金融) —— 重新定义货币的时间价值**

**定义**：PayFi是Solana生态目前最核心的叙事之一，由基金会主席Lily Liu大力推崇。它不同于DeFi的资产投机，而是侧重于利用区块链的即时结算特性，构建围绕“货币时间价值”的新金融市场16。

* **痛点**：传统金融中，跨境支付结算周期长（T+2），导致资金占用成本高；中小企业发票融资难。  
* **高分切入点**：  
  * **流支付发票融资（Streaming Invoice Factoring）**：利用**Token Extensions**的转账挂钩功能，构建一个自动化的应收账款融资协议。当发票被代币化后，投资人可以购买该凭证，而未来的回款将通过智能合约自动分流（Split）给投资人，实现“链上保理”的自动化9。  
  * **企业级支出管理DAO**：针对Web3原生公司，利用**Squads**多签架构，开发一个能够自动将闲置资金（Idle Capital）存入JitoSOL赚取收益，并在需要支付薪资或供应商时毫秒级赎回的资金管理系统。这需要高度的集成能力和安全性，非常适合展示技术实力。  
  * **Buy Now, Pay Never (BNPN)**：利用DeFi收益来支付现实世界的订阅服务。用户存入本金，产生的Yield自动支付Netflix或ChatGPT费用。这是一个极具消费端吸引力的叙事。

#### **2.2.2 蓝海二：The Agent Economy (AI Agent经济体) —— 机器人的DeFi**

**定义**：随着AI Agent的爆发，它们需要钱包、身份和交易场所。未来的链上用户将有一半是机器人。构建服务于AI Agent的基础设施是目前的超级风口20。

* **痛点**：目前的DeFi协议是为人设计的（图形界面），API限流且缺乏针对机器人的身份验证。AI Agent之间缺乏信任机制。  
* **高分切入点**：  
  * **Agent信誉与身份协议**：利用**ZK Compression**技术，低成本地存储数百万AI Agent的历史行为数据（推理日志、交易盈亏），构建一个链上的“芝麻信用”。高信誉的Agent可以获得无抵押闪电贷额度22。  
  * **机器人的资源交易市场**：构建一个基于PayFi微支付的市场，Agent可以在此购买API调用次数、GPU算力或私有数据集。利用Solana的微交易优势，实现“按Token付费”的实时结算。  
  * **AI管理的流动性层**：The Hive项目展示了AI管理资产的潜力。你可以更进一步，构建一个**AI Swarm（蜂群）协议**，让成百上千个小型Agent协同管理流动性，每个Agent负责监控单一参数，通过链上投票决策20。

#### **2.2.3 蓝海三：DePIN 2.0 —— 能源与验证网络**

**定义**：DePIN（去中心化物理基础设施）在Solana上已有Hivemapper等成功案例。下一阶段的DePIN将聚焦于更复杂的资源验证，特别是能源（Energy）和算力4。

* **痛点**：如何低成本地验证物理世界的行为？如何激励电网平衡？  
* **高分切入点**：  
  * **可验证能源网络**：利用Solana Mobile作为轻节点，连接家庭储能设备（如Tesla Powerwall）。用户在电网负荷高峰期放电，获得代币奖励。关键技术点在于使用**cNFTs**（压缩NFT）来大规模发放奖励凭证，展示你对Solana状态压缩技术的掌握5。  
  * **闲置带宽/算力交易所**：对标Blockmesh，但增加隐私层。利用ZK技术证明带宽质量而不暴露用户IP。这是一个典型的“重型工程”项目。

#### **2.2.4 蓝海四：Consumer Crypto via Blinks (Blinks赋能的消费级应用)**

**定义**：Solana Actions和Blinks（Blockchain Links）允许将任何链上操作封装成一个URL，在Twitter/X、Discord等Web2界面中直接展开为交互卡片4。

* **痛点**：Web3应用获客难，用户需要离开社交平台去连接钱包。  
* **高分切入点**：  
  * **社交化预测/对赌Blink**：Radar赛季冠军Pregame就是利用了这一点。你可以做一个“推特原生”的众筹或赏金平台。用户发一条推文悬赏：“谁能帮我解决这个Bug，赏金100 USDC”，该推文本身就是一个Blink，开发者点击即可提交PR并领赏。  
  * **病毒式传播游戏**：设计一款全流程在Blink中进行的轻游戏（如德州扑克或甚至即时战略），用户只需转发链接即可邀请好友加入战局。这展示了极强的前端架构能力和对Blinks规范的深度理解。

## ---

**第三章 技术战术手册：如何利用AI优势实施“饱和式开发”**

你的优势是“技术力暂无上限”。这意味着你可以独自完成通常需要一支5-10人全栈团队才能完成的工作量。在黑客松中，这种\*\*工程密度（Engineering Density）\*\*本身就是一种巨大的竞争壁垒。

### **3.1 架构层面的“降维打击”**

不要只写一个智能合约和一个前端。要利用AI助手构建一个**全生态系统（Full Ecosystem）**。

* **多端覆盖策略**：  
  * **核心协议 (Rust)**：利用Claude Opus生成高复杂度的Rust合约代码，务必引入**Anchor框架**的高级特性（如CPI调用、Zero Copy反序列化）。  
  * **客户端SDK (TypeScript/Python)**：不仅仅提供前端，还要发布一个NPM包或Python SDK，方便其他开发者调用你的协议。这是“基础设施”类项目的加分项。  
  * **CLI工具 (Rust)**：编写一个命令行工具，用于与你的协议交互。这通常是极客评委非常喜欢的“硬核”组件。  
  * **移动端 (React Native/Solana Mobile Stack)**：既然你时间多，利用AI快速生成一个安卓APK，适配Solana Saga手机。这直接切中“Mobile”赛道的得分点26。

### **3.2 智能化测试与安全审计**

黑客松项目通常缺乏测试。如果你的项目拥有接近主网级别的测试覆盖率，将给评委留下极佳印象。

* **AI生成模糊测试 (Fuzz Testing)**：指示AI编写Trident（Solana的Fuzz框架）测试脚本，对你的合约进行压力测试。在演示视频中展示测试跑通的画面，证明代码的健壮性。  
* **自动化审计报告**：让AI扮演审计员，对你的代码生成一份“自查审计报告”，并将其包含在仓库文档中。这显示了极高的专业度。

### **3.3 “重型工程”的具体实施案例：PayFi协议**

假设你选择PayFi赛道，做一个“流支付发票融资平台”。如何体现无限技术力？

1. **合约层**：实现Token-2022的Transfer Hooks，编写复杂的利息计算逻辑（使用定点数数学库），支持闪电贷接口。  
2. **ZK隐私层**：利用AI辅助编写**Light Protocol**的ZK Compression电路，隐藏发票的具体金额，只暴露“可融资”状态。这直接拉高了技术门槛。  
3. **Blinks集成层**：编写Next.js API路由，适配GET/POST请求，使得发票可以直接在Twitter上以Card形式展示并被购买。  
4. **数据索引层**：不要只用RPC。部署一个**Helius Webhook**或**Substream**索引器，实时处理链上数据，并推送到前端。  
5. **AI风控层**：部署一个Python服务（Agent），实时分析借款人的链上信用历史，给出评分。

## ---

**第四章 终极交付：打造冠军级演示 (The Perfect Pitch)**

无论代码多好，如果视频不行，一切归零。你必须像导演一样思考。

### **4.1 3分钟演示视频的剧本结构 (由历届冠军视频解构而来)**

| 时间段 | 内容模块 | 视觉画面 | 关键话术策略 |
| :---- | :---- | :---- | :---- |
| **0:00-0:30** | **The Hook (痛点)** | 快速剪辑的新闻标题、数据图表、用户愤怒的推文 | "当前DeFi用户每年因MEV损失X亿..."，直击痛点，制造焦虑。 |
| **0:30-1:00** | **The Magic (核心功能)** | **Blink界面**或**移动端操作**的高速录屏。展示最震撼的交互。 | "我们引入了PayFi流支付...看，资金实时到账。" |
| **1:00-1:50** | **The Tech (硬核架构)** | 动态架构图 (Animated Architecture)，展示Token Extensions、ZK、Agent的交互流。 | "利用Token-2022的Transfer Hook，我们在协议层强制执行了..."，展示技术深度。 |
| **1:50-2:30** | **The Ecosystem (生态位)** | 展示SDK文档、CLI工具、移动端App图标、测试覆盖率截图。 | "不仅仅是DApp，我们构建了全套开发者工具..."，展示工程密度。 |
| **2:30-3:00** | **The Vision (未来)** | 路线图、商业模式推演、TAM计算。 | "我们在主网发布后，预计第一季度捕获..."，展示创业野心。 |

### **4.2 视觉与品牌的AI化**

利用AI（Midjourney/DALL-E 3）生成一套极具辨识度的Cyberpunk或Solarpunk风格的UI素材。不要使用默认的Material Design。

* **Logo**：生成一个抽象且具有科技感的Logo。  
* **Landing Page**：利用Windsurf直接生成一个带有3D滚动特效（如Three.js）的着陆页。这种“过度设计”在黑客松中往往能赢得“设计分”。

## ---

**第五章 附录：各赛道具体的“降维打击”创意库**

基于你的技术力，这里直接给出三个具体的、结合了上述所有分析的高分创意方向：

### **创意一：Entangled \- AI驱动的量子纠缠流动性层 (Track: DeFi \+ AI)**

* **概念**：一个由AI Agent蜂群管理的跨协议流动性聚合器。  
* **技术壁垒**：  
  * 使用**ZK Compression**存储Agent的推理决策树（Proof of Thought）。  
  * 使用**Token-2022**实现动态费率（根据市场波动自动调整LP费用）。  
  * 提供**Blinks**接口，允许用户在推特上直接跟单某个Agent。  
* **为什么赢**：结合了AI（热点）、DeFi（赛道大）、ZK（硬核技术）和Blinks（用户体验）。

### **创意二：Chronos \- 企业级流支付薪酬合规协议 (Track: PayFi)**

* **概念**：针对DAO和Web3公司的薪酬流支付系统，内置合规与税务模块。  
* **技术壁垒**：  
  * 使用**Confidential Transfers (Token-2022)** 隐藏员工薪资具体数额（隐私保护，这是企业刚需）。  
  * 集成**Squads Multisig** SDK。  
  * 实现**Real-world Trigger**：通过预言机连接法币汇率，自动调整USDC发放量以锚定法币价值。  
* **为什么赢**：精准切中PayFi叙事，解决了隐私（Privacy）这一企业采用的最大障碍，具有极高的商业落地潜力。

### **创意三：GridMind \- 分布式算力验证网络 (Track: DePIN)**

* **概念**：利用消费级GPU（游戏显卡）进行AI推理任务的去中心化网络。  
* **技术壁垒**：  
  * 编写一个**Rust客户端**，用户下载后在本地运行，作为节点。  
  * 实现**Optimistic Verification**机制，在Solana上进行任务分发和奖惩仲裁。  
  * 移动端App用于监控节点状态和查看收益。  
* **为什么赢**：DePIN是Solana的王牌赛道，结合AI算力需求，属于双重风口。

## ---

**结语**

作为拥有“无限产能”的参赛者，你不应将自己局限于“完成比赛”，而应致力于“统治比赛”。通过选择高难度的**PayFi**或**AI Infra**赛道，利用AI工具构建令人生畏的**工程密度**，并用VC视角的**商业叙事**进行包装，你将大概率锁定Colosseum加速器的入场券。现在的任务是：选定一个方向，让你的AI助手开始编写那个能够改变Solana生态的Rust宏。祝你在Solana的renaissance中成为主角。

#### **Works cited**

1. Meet the Winners of the Solana Renaissance Hackathon, accessed December 10, 2025, [https://solana.com/news/solana-renaissance-winners](https://solana.com/news/solana-renaissance-winners)  
2. The Solana Foundation Kicks Off Ninth Hackathon, Renaissance \- PR Newswire, accessed December 10, 2025, [https://www.prnewswire.com/news-releases/the-solana-foundation-kicks-off-ninth-hackathon-renaissance-302071548.html](https://www.prnewswire.com/news-releases/the-solana-foundation-kicks-off-ninth-hackathon-renaissance-302071548.html)  
3. Solana-based answer to Ethena wins 'Radar' hackathon \- Blockworks, accessed December 10, 2025, [https://blockworks.co/news/solana-based-reflect-wins-radar-hackathon](https://blockworks.co/news/solana-based-reflect-wins-radar-hackathon)  
4. Which Radar Hackathon Winner Will Be Solana's Next Killer App? \- SolanaFloor, accessed December 10, 2025, [https://solanafloor.com/news/which-radar-hackathon-winner-will-be-solanas-next-killer-app](https://solanafloor.com/news/which-radar-hackathon-winner-will-be-solanas-next-killer-app)  
5. Request for Startups \- Solana, accessed December 10, 2025, [https://solana.com/solutions/request-for-startups](https://solana.com/solutions/request-for-startups)  
6. Grants and Funding | Solana: Build crypto apps that scale, accessed December 10, 2025, [https://solana.org/grants-funding](https://solana.org/grants-funding)  
7. Solana congestion culprit Ore wins $50K from hackathon \- Blockworks, accessed December 10, 2025, [https://blockworks.co/news/ore-wins-50k-solana-hackathon](https://blockworks.co/news/ore-wins-50k-solana-hackathon)  
8. A detailed explanation of the innovation of Solana Hackathon Grand Champion Project Ore V2 | MarsBit News on Binance Square, accessed December 10, 2025, [https://www.binance.com/en/square/post/11655881562978](https://www.binance.com/en/square/post/11655881562978)  
9. A beginner's guide to Solana token extensions \- Phantom, accessed December 10, 2025, [https://phantom.com/learn/crypto-101/solana-token-extensions](https://phantom.com/learn/crypto-101/solana-token-extensions)  
10. PayPal Community Blog | A Deep Dive into PYUSD and Solana Token Extensions, accessed December 10, 2025, [https://developer.paypal.com/community/blog/pyusd-solana-token-extensions/](https://developer.paypal.com/community/blog/pyusd-solana-token-extensions/)  
11. Perfecting Your Hackathon Submission: Key Insights from the Colosseum Workshop, accessed December 10, 2025, [https://blog.colosseum.com/perfecting-your-hackathon-submission/](https://blog.colosseum.com/perfecting-your-hackathon-submission/)  
12. 10 Winning Hacks: What Makes a Hackathon Project Stand Out | by BizThon \- Medium, accessed December 10, 2025, [https://medium.com/@BizthonOfficial/10-winning-hacks-what-makes-a-hackathon-project-stand-out-818d72425c78](https://medium.com/@BizthonOfficial/10-winning-hacks-what-makes-a-hackathon-project-stand-out-818d72425c78)  
13. How to Give a Killer Pitch or Hackathon Demo \- GitHub Gist, accessed December 10, 2025, [https://gist.github.com/dabit3/caef5eee4753dd7d23767bc31e70da28?ref=blog.colosseum.org](https://gist.github.com/dabit3/caef5eee4753dd7d23767bc31e70da28?ref=blog.colosseum.org)  
14. A quick overview of the winning projects in the seven tracks of the Solana Radar Hackathon, accessed December 10, 2025, [https://www.panewslab.com/en/articles/k8mi5u5i](https://www.panewslab.com/en/articles/k8mi5u5i)  
15. Meet the winners of the Hyperdrive Hackathon \- Solana, accessed December 10, 2025, [https://solana.com/news/solana-hyperdrive-hackathon-winners](https://solana.com/news/solana-hyperdrive-hackathon-winners)  
16. CGV Research: What is PayFi? What are the representative projects? \- Binance, accessed December 10, 2025, [https://www.binance.com/en/square/post/13265529266985](https://www.binance.com/en/square/post/13265529266985)  
17. PayFi and Future of Payments \- BlockApex, accessed December 10, 2025, [https://blockapex.io/payfi-and-future-of-payments/](https://blockapex.io/payfi-and-future-of-payments/)  
18. PayFi New Era: Solana Leads the Future of Blockchain Payments and On-chain Finance, accessed December 10, 2025, [https://www.chaincatcher.com/en/article/2148511](https://www.chaincatcher.com/en/article/2148511)  
19. Dialogue RootData List Listed Projects | Huma Finance Co-founder: Building the PayFi Network Faces Three Key Challenges \- ChainCatcher, accessed December 10, 2025, [https://www.chaincatcher.com/en/article/2152890](https://www.chaincatcher.com/en/article/2152890)  
20. The Golden Dog Discovery List: A Quick Look at the Winning Projects of the SendAI Solana AI Hackathon | PANews, accessed December 10, 2025, [https://www.panewslab.com/en/articles/qv4otqrr](https://www.panewslab.com/en/articles/qv4otqrr)  
21. Solana AI Hackathon Launches: Overview of 12 New AI Agent Projects \- ChainCatcher, accessed December 10, 2025, [https://www.chaincatcher.com/en/article/2157948](https://www.chaincatcher.com/en/article/2157948)  
22. Solana x402 Hackathon Winners Announced\! \- Reddit, accessed December 10, 2025, [https://www.reddit.com/r/solana/comments/1p6n0u6/solana\_x402\_hackathon\_winners\_announced/](https://www.reddit.com/r/solana/comments/1p6n0u6/solana_x402_hackathon_winners_announced/)  
23. Announcing the Winners of the Solana Radar Hackathon, accessed December 10, 2025, [https://solana.com/news/solana-radar-winners](https://solana.com/news/solana-radar-winners)  
24. What are Solana Actions and Blockchain Links (Blinks)? | Quicknode Guides, accessed December 10, 2025, [https://www.quicknode.com/guides/solana-development/transactions/actions-and-blinks](https://www.quicknode.com/guides/solana-development/transactions/actions-and-blinks)  
25. Solana Actions and Blinks no-code | by Ari | aricr.sol \- Medium, accessed December 10, 2025, [https://medium.com/@ariannacr18/solana-actions-and-blinks-no-code-acf0861e46da](https://medium.com/@ariannacr18/solana-actions-and-blinks-no-code-acf0861e46da)  
26. The Solana Mobile Hackathon is Here\!, accessed December 10, 2025, [https://blog.solanamobile.com/post/the-solana-mobile-hackathon-is-here](https://blog.solanamobile.com/post/the-solana-mobile-hackathon-is-here)