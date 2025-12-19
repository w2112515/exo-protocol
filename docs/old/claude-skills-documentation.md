# Claude Skills 完整文档

> 来源: Context7 MCP Server - Anthropic Skills 官方仓库
> 获取时间: 2024-12-13
> 相关库: `/anthropics/skills`, `/composiohq/awesome-claude-skills`

---

## 一、概述 (Overview)

### 什么是 Skill?

**Skill** 是一个包含指令、脚本和资源的文件夹，Agent 可以动态发现并加载它来更好地执行特定任务。要让文件夹被识别为 Skill，它必须包含一个 `SKILL.md` 文件。

Skills 以 zip 文件形式分发，通过 Claude Code 的插件市场系统安装。注册后，Claude 会根据任务上下文、用户提及或文件类型触发器自动加载相关技能。

### 仓库说明

官方仓库包含示范性 Skills，展示 Claude Skills 系统的能力：
- **创意应用**: 艺术、音乐、设计
- **技术任务**: Web 应用测试、MCP 服务器生成
- **企业工作流**: 通信、品牌等

每个 Skill 都是独立的目录，包含 `SKILL.md` 文件，其中包含 Claude 使用的指令和元数据。

---

## 二、SKILL.md 文件规范

### 基本结构 (YAML Frontmatter + Markdown)

```markdown
---
name: my-skill-name
description: A clear description of what this skill does and when to use it
---

# My Skill Name

[Add your instructions here that Claude will follow when this skill is active]

## Examples
- Example usage 1
- Example usage 2

## Guidelines
- Guideline 1
- Guideline 2
```

### YAML Frontmatter 必填字段

| 字段 | 说明 |
|------|------|
| `name` | Skill 名称，使用 hyphen-case（小写 + 连字符），必须与包含 `SKILL.md` 的目录名匹配 |
| `description` | 描述 Skill 的功能以及 Claude 何时应该使用它 |

### 渐进式披露模式 (Progressive Disclosure)

- **保持简洁**: `SKILL.md` 主体应保持在 **500 行以内**，防止上下文膨胀
- **拆分文件**: 当内容接近限制时，拆分为单独文件
- **引用说明**: 从 `SKILL.md` 引用拆分的文件，并清楚描述何时应该读取它们
- **核心原则**: 仅在 `SKILL.md` 中包含核心工作流和选择指南，将变体特定细节、模式和示例移至单独的参考文件

---

## 三、Skill 目录结构

```
my-skill/
├── SKILL.md              # 主指令文件 (必需)
├── scripts/              # 可执行脚本
│   └── example_script.py
├── references/           # 参考文档
│   └── schema.md
└── assets/               # 模板和资源
    └── template/
```

### 各目录用途

| 目录 | 用途 | 示例 |
|------|------|------|
| `scripts/` | 可重用的脚本，执行特定操作 | `rotate_pdf.py`, `run_query.py` |
| `references/` | 参考文档，提供领域知识 | `schema.md`, `api_docs.md` |
| `assets/` | 模板、样板代码、静态资源 | `hello-world/`, `template.html` |

---

## 四、Skill 创建流程 (6 步骤)

### Step 1: 理解 Skill 的用途

通过具体示例理解 Skill 如何使用：
- 用户直接提供的示例
- 生成后与用户确认的示例

**关键问题**:
- Skill 应该支持哪些具体功能？
- 用户如何与它交互？
- 什么短语会触发这个 Skill？

### Step 2: 规划可重用组件

分析每个示例，确定如何从头执行，识别哪些脚本、引用和资源对重复执行有益：

| 示例查询 | 可能需要的资源 |
|----------|----------------|
| "rotate PDF" | `scripts/rotate_pdf.py` |
| "Build me a todo app" | `assets/hello-world/` 模板 |
| "How many users logged in?" | `references/schema.md` 表结构文档 |

### Step 3: 初始化 Skill

使用 `init_skill.py` 脚本创建模板：

```bash
# 从模板创建 Skill
python scripts/init_skill.py my-new-skill --path skills/

# 创建的目录结构:
# skills/my-new-skill/
#   ├── SKILL.md (带 TODO 占位符)
#   ├── scripts/ (示例脚本)
#   ├── references/ (示例参考)
#   └── assets/ (示例资源)
```

### Step 4: 编辑 Skill

填充必要的信息和资源：
- 编写 `SKILL.md` 文件
- 实现各种资源组件
- 提供非显而易见的程序性知识、领域特定信息或可重用资源

### Step 5: 打包 Skill

```bash
# 验证并打包
python scripts/package_skill.py path/to/my-skill

# 指定输出目录
python scripts/package_skill.py path/to/my-skill ./dist
# 输出: dist/my-skill.zip
```

打包脚本自动执行:
1. **验证**: YAML frontmatter 格式、必填字段、命名约定、目录结构、描述完整性
2. **打包**: 创建 `.skill` 文件（实际是带 `.skill` 扩展名的 zip 文件）

### Step 6: 基于实际使用迭代

在真实任务中使用 Skill，识别改进点，更新内容。

---

## 五、验证与快速验证

```bash
# 验证 Skill 结构和要求
python scripts/quick_validate.py path/to/my-skill

# 打包时自动包含验证
python scripts/package_skill.py path/to/my-skill
```

验证内容:
- YAML frontmatter 格式和必填字段
- Skill 命名约定和目录结构
- 描述完整性和质量
- 文件组织和资源引用

---

## 六、在 Claude Code 中安装和使用

```bash
# 注册 Skills 市场
/plugin marketplace add anthropics/skills

# 通过提及使用 Skill
# "use the pdf skill to extract tables from report.pdf"
```

---

## 七、实战示例: BigQuery Helper Skill

```bash
# Step 1: 理解需求 (询问用户)
# - Skill 应该支持什么功能？
# - 示例使用场景？
# - 什么会触发这个 Skill？

# Step 2: 初始化 Skill 结构
python scripts/init_skill.py bigquery-helper --path ./skills

# Step 3: 开发 Skill 内容
cd skills/bigquery-helper

# 添加常用操作脚本
cat > scripts/run_query.py << 'EOF'
#!/usr/bin/env python3
from google.cloud import bigquery
import sys

client = bigquery.Client()
query = sys.argv[1]
df = client.query(query).to_dataframe()
print(df.to_string())
EOF

# 添加参考文档
cat > references/schema.md << 'EOF'
# BigQuery Schema

## users table
- user_id: INT64 (primary key)
- email: STRING
- created_at: TIMESTAMP

## events table
- event_id: INT64 (primary key)
- user_id: INT64 (foreign key → users)
- event_type: STRING
- timestamp: TIMESTAMP
EOF

# Step 4: 编辑 SKILL.md
# 更新 frontmatter 描述并添加程序性指令

# Step 5: 验证并打包
cd ../..
python scripts/package_skill.py skills/bigquery-helper ./dist
# 输出: dist/bigquery-helper.zip

# Step 6: 基于测试迭代
# 在真实任务中使用，识别改进点，更新内容
```

---

## 八、MCP 工具开发最佳实践

### 工具定义示例 (TypeScript)

```typescript
// 数据处理工具
{
  name: "analyze_csv",
  description: "Analyze a CSV file",
  inputSchema: {
    type: "object",
    properties: {
      filepath: { type: "string" },
      operations: {
        type: "array",
        items: {
          enum: ["sum", "average", "count"]
        }
      }
    }
  }
}

// 系统操作工具
{
  name: "execute_command",
  description: "Run a shell command",
  inputSchema: {
    type: "object",
    properties: {
      command: { type: "string" },
      args: { type: "array", items: { type: "string" } }
    }
  }
}

// API 集成工具
{
  name: "github_create_issue",
  description: "Create a GitHub issue",
  inputSchema: {
    type: "object",
    properties: {
      title: { type: "string" },
      body: { type: "string" },
      labels: { type: "array", items: { type: "string" } }
    }
  }
}
```

### 工具注解 (Annotations)

```typescript
// 只读搜索工具
{
  name: "web_search",
  description: "Search the web for information",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string" }
    },
    required: ["query"]
  },
  annotations: {
    title: "Web Search",
    readOnlyHint: true,
    openWorldHint: true
  }
}

// 破坏性文件删除工具
{
  name: "delete_file",
  description: "Delete a file from the filesystem",
  inputSchema: {
    type: "object",
    properties: {
      path: { type: "string" }
    },
    required: ["path"]
  },
  annotations: {
    title: "Delete File",
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: false
  }
}

// 非破坏性数据库记录创建工具
{
  name: "create_record",
  description: "Create a new record in the database",
  inputSchema: {
    type: "object",
    properties: {
      table: { type: "string" },
      data: { type: "object" }
    },
    required: ["table", "data"]
  },
  annotations: {
    title: "Create Database Record",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false
  }
}
```

### Python 实现

```python
app = Server("example-server")

@app.list_tools()
async def list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="calculate_sum",
            description="Add two numbers together",
            inputSchema={
                "type": "object",
                "properties": {
                    "a": {"type": "number"},
                    "b": {"type": "number"}
                },
                "required": ["a", "b"]
            }
        )
    ]

@app.call_tool()
async def call_tool(
    name: str,
    arguments: dict
) -> list[types.TextContent | types.ImageContent | types.EmbeddedResource]:
    if name == "calculate_sum":
        a = arguments["a"]
        b = arguments["b"]
        result = a + b
        return [types.TextContent(type="text", text=str(result))]
    raise ValueError(f"Tool not found: {name}")
```

### TypeScript 实现

```typescript
const server = new Server({
  name: "example-server",
  version: "1.0.0"
}, {
  capabilities: {
    tools: {}
  }
});

// 定义可用工具
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [{
      name: "calculate_sum",
      description: "Add two numbers together",
      inputSchema: {
        type: "object",
        properties: {
          a: { type: "number" },
          b: { type: "number" }
        },
        required: ["a", "b"]
      }
    }]
  };
});

// 处理工具执行
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "calculate_sum") {
    const { a, b } = request.params.arguments;
    return {
      content: [
        {
          type: "text",
          text: String(a + b)
        }
      ]
    };
  }
  throw new Error("Tool not found");
});
```

### 工具命名最佳实践

1. **包含服务前缀**: 预期 MCP 服务器可能与其他服务器一起使用
2. **面向动作**: 以动词开头 (get, list, search, create, etc.)
3. **具体明确**: 避免可能与其他服务器冲突的通用名称
4. **保持一致**: 在服务器内使用一致的命名模式

---

## 九、高级特性

### 算法艺术 Skill 必备特性

**参数控制**:
- 数值滑块 (如粒子数、噪声比例)
- 颜色选择器
- 参数变化时实时更新
- 重置按钮

**种子导航**:
- 显示当前种子号
- "上一个" / "下一个" 按钮
- "随机" 按钮
- 跳转到特定种子的输入框
- 可生成 100 个变体 (种子 1-100)

**单一工件结构**:
- 所有代码和样式包含在单个 HTML 文件中
- 从 CDN 引入 p5.js
- 内联所有样式
- 直接在 HTML script 标签中放置所有 p5.js 代码

### 主题工厂 Skill

每个主题在 `themes/` 目录中详细定义：
- 精确 hex 代码的配色方案
- 标题和正文的互补字体配对
- 适合各种上下文和目标受众的独特视觉标识

---

## 十、评估创建指南

评估问题要求：
- **独立性**: 不依赖其他问题的结果
- **只读性**: 仅需非破坏性操作
- **复杂性**: 需要多个工具调用和深度数据探索
- **现实性**: 反映人类实际遇到的用例
- **可验证性**: 有单一、清晰的可确认答案
- **稳定性**: 答案不会随时间变化

---

## 十一、相关资源

### 官方仓库
- **Anthropic Skills**: https://github.com/anthropics/skills
- **Awesome Claude Skills**: https://github.com/composiohq/awesome-claude-skills

### 文档分类
| 目录 | 描述 |
|------|------|
| `document-skills/` | 驱动 Claude 文档功能的技能 (源码可用) |
| `algorithmic-art/` | 生成算法艺术 |
| `mcp-builder/` | MCP 服务器生成 |
| `skill-creator/` | 创建新 Skills 的元技能 |
| `theme-factory/` | 主题设计 |
| `internal-comms/` | 内部通信模板 |

### 许可
- 示例 Skills: Apache 2.0 (开源)
- `document-skills/`: 源码可用 (非开源)，作为复杂生产 AI 应用的参考

---

*本文档由 CSA Protocol 自动生成，通过 Context7 MCP Server 获取*
