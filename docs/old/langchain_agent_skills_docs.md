# LangChain Agent Skills 文档汇总

> 通过 Context7 MCP 获取于 2025-12-13

---

## 目录

1. [LangGraph Supervisor - 多智能体编排](#1-langgraph-supervisor---多智能体编排)
2. [LangMem - 智能体记忆管理](#2-langmem---智能体记忆管理)
3. [ReAct Agent - 推理与行动](#3-react-agent---推理与行动)
4. [DeepAgents - 深度智能体](#4-deepagents---深度智能体)
5. [LangGraph 核心能力](#5-langgraph-核心能力)
6. [Skill 实现模式 - 专门化子工作流](#6-skill-实现模式---专门化子工作流)

---

## 1. LangGraph Supervisor - 多智能体编排

### 快速开始：Supervisor 管理专门的 Agents

**来源**: https://github.com/langchain-ai/langgraph-supervisor-py

演示如何设置一个 supervisor agent 来编排专门的数学和研究 agents。

```python
from langchain_openai import ChatOpenAI

from langgraph_supervisor import create_supervisor
from langgraph.prebuilt import create_react_agent

model = ChatOpenAI(model="gpt-4o")

# Create specialized agents

def add(a: float, b: float) -> float:
    """Add two numbers."""
    return a + b

def multiply(a: float, b: float) -> float:
    """Multiply two numbers."""
    return a * b

def web_search(query: str) -> str:
    """Search the web for information."""
    return (
        "Here are the headcounts for each of the FAANG companies in 2024:\n"
        "1. **Facebook (Meta)**: 67,317 employees.\n"
        "2. **Apple**: 164,000 employees.\n"
        "3. **Amazon**: 1,551,000 employees.\n"
        "4. **Netflix**: 14,000 employees.\n"
        "5. **Google (Alphabet)**: 181,269 employees."
    )

math_agent = create_react_agent(
    model=model,
    tools=[add, multiply],
    name="math_expert",
    prompt="You are a math expert. Always use one tool at a time."
)

research_agent = create_react_agent(
    model=model,
    tools=[web_search],
    name="research_expert",
    prompt="You are a world class researcher with access to web search. Do not do any math."
)

# Create supervisor workflow
workflow = create_supervisor(
    [research_agent, math_agent],
    model=model,
    prompt=(
        "You are a team supervisor managing a research expert and a math expert. "
        "For current events, use research_agent. "
        "For math problems, use math_agent."
    )
)

# Compile and run
app = workflow.compile()
result = app.invoke({
    "messages": [
        {
            "role": "user",
            "content": "what's the combined headcount of FAANG in 2024"
        }
    ]
})
```

### 创建 Forward Message Tool

用于直接转发 agent 响应而不做修改，保留技术术语。

```python
from langgraph_supervisor import create_supervisor, create_forward_message_tool
from langgraph.prebuilt import create_react_agent
from langchain_openai import ChatOpenAI

model = ChatOpenAI(model="gpt-4o")

def generate_report(topic: str) -> str:
    """Generate detailed technical report."""
    return f"""
    Technical Report: {topic}

    Executive Summary: [Complex technical details with precise terminology]
    Analysis: [Detailed metrics and statistical data]
    Recommendations: [Specific action items with technical specifications]
    """

report_agent = create_react_agent(
    model=model,
    tools=[generate_report],
    name="report_generator",
    prompt="Generate detailed technical reports with precise language."
)

# Create forwarding tool to preserve exact agent output
forward_tool = create_forward_message_tool(supervisor_name="supervisor")

workflow = create_supervisor(
    agents=[report_agent],
    model=model,
    tools=[forward_tool],
    prompt=(
        "Manage report generator. Use forward_message tool to pass "
        "technical reports directly to users without modification."
    )
)

app = workflow.compile()
```

---

## 2. LangMem - 智能体记忆管理

### 与 Agent 交互：存储和检索记忆

**来源**: https://github.com/langchain-ai/langmem

```python
# Store a new memory (1)
agent.invoke(
    {"messages": [{"role": "user", "content": "Remember that I prefer dark mode."}]}
)

# Retrieve the stored memory (2)
response = agent.invoke(
    {"messages": [{"role": "user", "content": "What are my lighting preferences?"}]}
)
print(response["messages"][-1].content)
# Output: "You've told me that you prefer dark mode."
```

### Python Agent with LangMem Tools

使用 OpenAI API 和 LangMem 工具的完整 Agent 实现：

```python
from typing import Any, Dict, List

from langgraph.store.memory import InMemoryStore
from openai import OpenAI

from langmem import create_manage_memory_tool, create_search_memory_tool


def execute_tool(tools_by_name: Dict[str, Any], tool_call: Dict[str, Any]) -> str:
    """Execute a tool call and return the result"""
    tool_name = tool_call["function"]["name"]

    if tool_name not in tools_by_name:
        return f"Error: Tool {tool_name} not found"

    tool = tools_by_name[tool_name]
    try:
        result = tool.invoke(tool_call["function"]["arguments"])
        return str(result)
    except Exception as e:
        return f"Error executing {tool_name}: {str(e)}"


def run_agent(tools: List[Any], user_input: str, max_steps: int = 5) -> str:
    """Run a simple agent loop"""
    client = OpenAI()
    messages = [{"role": "user", "content": user_input}]
    tools_by_name = {t.name: t for t in tools}
    tool_schemas = [t.tool_call_schema for t in tools]
    
    for _ in range(max_steps):
        response = client.chat.completions.create(
            model="gpt-4",
            messages=messages,
            tools=tool_schemas
        )
        
        message = response.choices[0].message
        if not message.tool_calls:
            return message.content
            
        for tool_call in message.tool_calls:
            result = execute_tool(tools_by_name, tool_call)
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": result
            })
    
    return "Max steps reached"


# Initialize store and tools
store = InMemoryStore()
manage_memory = create_manage_memory_tool(namespace="user_preferences")
search_memory = create_search_memory_tool(namespace="user_preferences")

# Run agent
result = run_agent(
    [manage_memory, search_memory],
    "Remember that my favorite color is blue"
)
```

### 情景记忆 (Episodic Memory)

```python
from langgraph.graph import StateGraph, END

@entrypoint(store=store)
def app(messages: list):
    # Step 1: Find similar past episodes
    similar = store.search(
        ("memories", "episodes"),
        query=messages[-1]["content"],
        limit=1,
    )

    # Step 2: Build system message with relevant experience
    system_message = "You are a helpful assistant."
    if similar:
        system_message += "\n\n### EPISODIC MEMORY:"
        for i, item in enumerate(similar, start=1):
            episode = item.value["content"]
            system_message += f"""
            
Episode {i}:
When: {episode['observation']}
Thought: {episode['thoughts']}
Did: {episode['action']}
Result: {episode['result']}        """

    # Step 3: Generate response using past experience
    response = llm.invoke([{"role": "system", "content": system_message}, *messages])

    # Step 4: Store this interaction if successful
    manager.invoke({"messages": messages})
    return response
```

---

## 3. ReAct Agent - 推理与行动

### 定义 ReAct Agent Tools

**来源**: https://github.com/langchain-ai/react-agent

```python
import os
from tavily import TavilyClient

def create_tools():
    tavily_api_key = os.environ.get("TAVILY_API_KEY")
    if not tavily_api_key:
        raise ValueError("TAVILY_API_KEY not found in environment variables.")
    tavily = TavilyClient(api_key=tavily_api_key)

    tools = [
        {
            "name": "tavily_search",
            "description": "A search engine to look up information on the internet.",
            "tool_spec": {
                "type": "function",
                "function": {
                    "name": "tavily_search",
                    "description": "A search engine to look up information on the internet.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "description": "The search query."
                            }
                        },
                        "required": ["query"]
                    }
                }
            }
        }
    ]
    return tools
```

### 使用 LangGraph 实现 ReAct Agent 逻辑

```python
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated

class AgentState(TypedDict):
    input: str
    intermediate_steps: list

def create_react_agent_graph():
    def agent_node(state):
        # Logic for the agent to reason and decide on the next action
        # This would involve calling an LLM with the current state and tools
        pass

    def tool_node(state):
        # Logic to execute the chosen tool and return the observation
        pass

    # Build the graph
    workflow = StateGraph(AgentState)
    workflow.add_node("agent", agent_node)
    workflow.add_node("tools", tool_node)

    workflow.set_entry_point("agent")
    workflow.add_edge("agent", "tools")
    workflow.add_edge("tools", "agent")  # Loop back to agent after tool execution

    return workflow.compile()
```

### 环境配置

```bash
cp .env.example .env
# Define required API keys in your .env file.
TAVILY_API_KEY=your-api-key
ANTHROPIC_API_KEY=your-api-key
OPENAI_API_KEY=your-api-key
```

### 默认模型配置

```yaml
model: anthropic/claude-3-5-sonnet-20240620
```

---

## 4. DeepAgents - 深度智能体

### 整合 Tools

**来源**: https://github.com/langchain-ai/deepagentsjs

```typescript
import { tool } from "langchain";
import { TavilySearch } from "@langchain/tavily";
import { createDeepAgent } from "deepagents";
import { z } from "zod";

const internetSearch = tool(
  async ({
    query,
    maxResults = 5,
    topic = "general",
    includeRawContent = false,
  }: {
    query: string;
    maxResults?: number;
    topic?: "general" | "news" | "finance";
    includeRawContent?: boolean;
  }) => {
    const tavilySearch = new TavilySearch({
      maxResults,
      tavilyApiKey: process.env.TAVILY_API_KEY,
      includeRawContent,
      topic,
    });
    return await tavilySearch._call({ query });
  },
  {
    name: "internet_search",
    description: "Run a web search",
    schema: z.object({
      query: z.string().describe("The search query"),
      maxResults: z.number().optional().default(5),
      topic:
        z
          .enum(["general", "news", "finance"])
          .optional()
          .default("general"),
      includeRawContent: z.boolean().optional().default(false),
    }),
  },
);

const agent = createDeepAgent({
  tools: [internetSearch],
});
```

### 创建任务委托的 Subagents

```typescript
import { tool } from "langchain";
import { createDeepAgent } from "deepagents";
import { z } from "zod";

// Define specialized tools
const analyzeCode = tool(
  async ({ code }: { code: string }) => {
    // Code analysis logic
    return `Analysis of code: ${code.slice(0, 100)}...`;
  },
  {
    name: "analyze_code",
    description: "Analyze code for issues",
    schema: z.object({
      code: z.string().describe("The code to analyze"),
    }),
  },
);

const generateTests = tool(
  async ({ code }: { code: string }) => {
    // Test generation logic
    return `Generated tests for: ${code.slice(0, 100)}...`;
  },
  {
    name: "generate_tests",
    description: "Generate unit tests for code",
    schema: z.object({
      code: z.string().describe("The code to test"),
    }),
  },
);

// Create specialized subagents
const codeReviewer = createDeepAgent({
  tools: [analyzeCode],
  systemPrompt: "You are a code reviewer. Analyze code for best practices.",
});

const testWriter = createDeepAgent({
  tools: [generateTests],
  systemPrompt: "You are a test writer. Generate comprehensive unit tests.",
});

// Main agent can delegate to subagents
const mainAgent = createDeepAgent({
  tools: [internetSearch],
  subagents: [
    { name: "code-reviewer", agent: codeReviewer },
    { name: "test-writer", agent: testWriter },
  ],
});
```

### 完整的研究 Agent 示例

```typescript
import { tool } from "langchain";
import { TavilySearch } from "@langchain/tavily";
import { createDeepAgent } from "deepagents";
import { z } from "zod";

// Web search tool
const internetSearch = tool(
  async ({
    query,
    maxResults = 5,
    topic = "general",
    includeRawContent = false,
  }: {
    query: string;
    maxResults?: number;
    topic?: "general" | "news" | "finance";
    includeRawContent?: boolean;
  }) => {
    const tavilySearch = new TavilySearch({
      maxResults,
      tavilyApiKey: process.env.TAVILY_API_KEY,
      includeRawContent,
      topic,
    });
    return await tavilySearch._call({ query });
  },
  {
    name: "internet_search",
    description: "Run a web search",
    schema: z.object({
      query: z.string().describe("The search query"),
      maxResults: z.number().optional().default(5),
      topic: z.enum(["general", "news", "finance"]).optional().default("general"),
      includeRawContent: z.boolean().optional().default(false),
    }),
  },
);

// System prompt to steer the agent to be an expert researcher
const researchInstructions = `You are an expert researcher. Your job is to conduct thorough research, and then write a polished report.

You have access to an internet search tool as your primary means of gathering information.

## \`internet_search\`

Use this to run an internet search for a given query. You can specify the max number of results to return, the topic, and whether raw content should be included.
`;

// Create the deep agent
const agent = createDeepAgent({
  tools: [internetSearch],
  systemPrompt: researchInstructions,
});

// Invoke the agent
const result = await agent.invoke({
  messages: [{ role: "user", content: "What is langgraph?" }],
});
```

---

## 5. LangGraph 核心能力

### 集成预构建的 LLM Provider Tools

**来源**: https://github.com/langchain-ai/langgraph

```python
from langgraph.prebuilt import create_react_agent

agent = create_react_agent(
    model="openai:gpt-4o-mini",
    tools=[{"type": "web_search_preview"}]
)
response = agent.invoke(
    {"messages": ["What was a positive news story from today?"]}
)
```

TypeScript 版本：

```typescript
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";

const agent = createReactAgent({
  llm: new ChatOpenAI({ model: "gpt-4o-mini" }),
  tools: [{ type: "web_search_preview" }],
});

const response = await agent.invoke({
  messages: [
    { role: "user", content: "What was a positive news story from today?" },
  ],
});
```

### 定义和构建带动态工具选择的 Agent

```python
from typing import Annotated

from langchain_openai import ChatOpenAI
from typing_extensions import TypedDict

from langgraph.graph import StateGraph, START
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition


# Define the state
class AgentState(TypedDict):
    messages: Annotated[list, add_messages]
    selected_tool_ids: list[str]


def agent(state: AgentState):
    # Bind selected tools to LLM
    selected_tools = [tools_by_id[id] for id in state["selected_tool_ids"]]
    llm_with_tools = llm.bind_tools(selected_tools)
    response = llm_with_tools.invoke(state["messages"])
    return {"messages": [response]}


def select_tools(state: AgentState):
    # Use vector search to dynamically select tools
    query = state["messages"][-1].content
    relevant_tools = tool_store.similarity_search(query, k=5)
    return {"selected_tool_ids": [t.id for t in relevant_tools]}


# Build the graph
builder = StateGraph(AgentState)
builder.add_node("select_tools", select_tools)
builder.add_node("agent", agent)
builder.add_node("tools", ToolNode(all_tools))

builder.add_edge(START, "select_tools")
builder.add_edge("select_tools", "agent")
builder.add_conditional_edges("agent", tools_condition)
builder.add_edge("tools", "agent")

graph = builder.compile()
```

### 使用 @tool 装饰器定义工具

```python
from langchain_core.tools import tool


@tool
def multiply(a: int, b: int) -> int:
    """Multiply a and b.

    Args:
        a: first int
        b: second int
    """
    return a * b


@tool
def add(a: int, b: int) -> int:
    """Adds a and b.

    Args:
        a: first int
        b: second int
    """
    return a + b


@tool
def divide(a: int, b: int) -> float:
    """Divide a and b.

    Args:
        a: first int
        b: second int
    """
    return a / b
```

### 创建 Handoff Tools 用于多智能体系统

```python
from langgraph.prebuilt import create_handoff_tool

assign_to_research_agent = create_handoff_tool(
    agent_name="research_agent",
    description="Assign task to a researcher agent.",
)

assign_to_math_agent = create_handoff_tool(
    agent_name="math_agent",
    description="Assign task to a math agent.",
)
```

### 强制使用特定工具

```python
from langchain_core.tools import tool

@tool(return_direct=True)
def greet(user_name: str) -> int:
    """Greet user."""
    return f"Hello {user_name}!"

tools = [greet]

agent = create_react_agent(
    model=model.bind_tools(tools, tool_choice={"type": "tool", "name": "greet"}),
    tools=tools
)

agent.invoke(
    {"messages": [{"role": "user", "content": "Hi, I am Bob"}]}
)
```

---

## 总结

### 核心 Agent Skills 能力

| 能力类别 | 库/工具 | 描述 |
|---------|--------|------|
| **多智能体编排** | LangGraph Supervisor | 创建 supervisor 管理多个专门 agents |
| **记忆管理** | LangMem | 存储、检索、管理长期记忆 |
| **推理与行动** | ReAct Agent | 迭代推理并执行工具 |
| **深度任务** | DeepAgents | 复杂任务规划和子代理委托 |
| **工具调用** | LangGraph | 动态工具选择和执行 |
| **状态管理** | LangGraph | 图状态流转和条件分支 |

### 关键依赖

```
langchain
langgraph
langmem
langgraph-supervisor
tavily-python (搜索工具)
chromadb (向量存储)
openai / anthropic (LLM providers)
```

---

## 6. Skill 实现模式 - 专门化子工作流

> ⚠️ **重要说明**：LangChain/LangGraph 中**没有**专门的 `Skill` API 或类。
> "Skill" 是一个**架构概念**，用于描述专门化的子工作流 (Specialized Sub-Graph)。

### 官方定义

**来源**: https://github.com/langchain-ai/langgraph Customer Support Tutorial

> *"Your graph can detect user intent and select the appropriate **workflow or "skill"** to satisfy the user's needs. Each workflow can focus on its domain, allowing for isolated improvements without degrading the overall assistant."*

翻译：你的图可以检测用户意图，并选择合适的 **工作流或"技能"** 来满足用户需求。每个工作流可以专注于自己的领域，允许隔离改进而不影响整体助手。

---

### Skill 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                      Primary Assistant                       │
│                   (意图检测 & 路由分发)                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│   │  Skill A     │  │  Skill B     │  │  Skill C     │     │
│   │ (酒店预订)    │  │ (租车服务)    │  │ (行程推荐)    │     │
│   │              │  │              │  │              │     │
│   │ ┌──────────┐ │  │ ┌──────────┐ │  │ ┌──────────┐ │     │
│   │ │Safe Tools│ │  │ │Safe Tools│ │  │ │Safe Tools│ │     │
│   │ └──────────┘ │  │ └──────────┘ │  │ └──────────┘ │     │
│   │ ┌──────────┐ │  │ ┌──────────┐ │  │ ┌──────────┐ │     │
│   │ │Sensitive │ │  │ │Sensitive │ │  │ │Sensitive │ │     │
│   │ │Tools     │ │  │ │Tools     │ │  │ │Tools     │ │     │
│   │ └──────────┘ │  │ └──────────┘ │  │ └──────────┘ │     │
│   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│          │                 │                 │              │
│          └─────────────────┴─────────────────┘              │
│                            │                                │
│                    ┌───────▼───────┐                        │
│                    │  leave_skill  │                        │
│                    │ (返回主助手)   │                        │
│                    └───────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

---

### 核心组件

| 组件 | 作用 | 说明 |
|-----|------|------|
| **Primary Assistant** | 主助手 | 负责意图检测和路由分发 |
| **Specialized Sub-Graph** | Skill 子图 | 专门化的独立工作流 |
| **Dialog State Stack** | 对话状态栈 | 跟踪当前激活的 Skill |
| **`leave_skill` Node** | 退出节点 | 从 Skill 返回主助手 |
| **Safe Tools** | 安全工具 | 无需确认即可执行 |
| **Sensitive Tools** | 敏感工具 | 需要人工确认 |

---

### 完整实现代码

#### 1. 定义状态结构

```python
from typing import Annotated, Literal, Optional
from typing_extensions import TypedDict
from langgraph.graph.message import add_messages


def update_dialog_stack(left: list[str], right: Optional[str]) -> list[str]:
    """管理对话状态栈的 reducer"""
    if right is None:
        return left
    if right == "pop":
        return left[:-1]
    return left + [right]


class State(TypedDict):
    messages: Annotated[list, add_messages]
    user_info: str
    dialog_state: Annotated[
        list[
            Literal[
                "primary_assistant",
                "book_hotel",
                "book_car_rental", 
                "book_excursion",
            ]
        ],
        update_dialog_stack,
    ]
```

#### 2. 创建 Skill 入口节点工厂

```python
from langchain_core.messages import ToolMessage


def create_entry_node(assistant_name: str, new_dialog_state: str):
    """创建 Skill 入口节点的工厂函数"""
    def entry_node(state: State) -> dict:
        tool_call_id = state["messages"][-1].tool_calls[0]["id"]
        return {
            "messages": [
                ToolMessage(
                    content=f"The assistant is now the {assistant_name}. "
                    f"Reflect on the above conversation between the host assistant "
                    f"and the user. The user's intent is unsatisfied. "
                    f"Use the provided tools to assist the user. "
                    f"Remember, you are {assistant_name}, and the booking, "
                    f"update, or other action is not complete until "
                    f"after you have successfully invoked the appropriate tool. "
                    f"If the user changes their mind or needs help for other tasks, "
                    f"call the CompleteOrEscalate function to let the primary host "
                    f"assistant take control. Do not mention who you are - "
                    f"just act as the proxy for the assistant.",
                    tool_call_id=tool_call_id,
                )
            ],
            "dialog_state": new_dialog_state,
        }
    return entry_node
```

#### 3. 定义退出 Skill 的共享节点

```python
def pop_dialog_state(state: State) -> dict:
    """Pop the dialog stack and return to the main assistant.
    
    This lets the full graph explicitly track the dialog flow 
    and delegate control to specific sub-graphs.
    """
    messages = []
    if state["messages"][-1].tool_calls:
        messages.append(
            ToolMessage(
                content="Resuming dialog with the host assistant. "
                        "Please reflect on the past conversation and "
                        "assist the user as needed.",
                tool_call_id=state["messages"][-1].tool_calls[0]["id"],
            )
        )
    return {
        "dialog_state": "pop",
        "messages": messages,
    }
```

#### 4. 定义工作流路由函数

```python
def route_to_workflow(state: State) -> str:
    """Route to active delegated workflow from dialog_state stack.
    
    Returns the currently active skill, or primary_assistant if none.
    """
    dialog_state = state.get("dialog_state")
    if not dialog_state:
        return "primary_assistant"
    return dialog_state[-1]
```

#### 5. 定义 Skill 内部路由

```python
from langgraph.prebuilt import tools_condition


def route_book_hotel(state: State):
    """Hotel Skill 内部路由逻辑"""
    route = tools_condition(state)
    if route == END:
        return END
    
    tool_calls = state["messages"][-1].tool_calls
    
    # 检查是否要退出 Skill
    did_cancel = any(
        tc["name"] == CompleteOrEscalate.__name__ 
        for tc in tool_calls
    )
    if did_cancel:
        return "leave_skill"
    
    # 区分安全工具和敏感工具
    safe_tool_names = [t.name for t in book_hotel_safe_tools]
    if all(tc["name"] in safe_tool_names for tc in tool_calls):
        return "book_hotel_safe_tools"
    
    return "book_hotel_sensitive_tools"
```

#### 6. 定义 CompleteOrEscalate 工具

```python
from pydantic import BaseModel, Field


class CompleteOrEscalate(BaseModel):
    """A tool to mark the current task as completed and/or to escalate 
    control of the dialog to the main assistant.
    
    This is used when:
    - The task is complete
    - The user wants to do something else
    - The user's request is outside the skill's scope
    """
    cancel: bool = Field(
        default=True,
        description="True if the user wants to cancel the current task"
    )
    reason: str = Field(
        description="The reason for completing or escalating"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "cancel": True,
                "reason": "User changed their mind about the hotel booking."
            }
        }
```

#### 7. 构建完整的 Skill 图

```python
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import tools_condition


# --- 定义工具 ---
book_hotel_safe_tools = [search_hotels, lookup_hotel_info]
book_hotel_sensitive_tools = [book_hotel, update_booking, cancel_booking]
book_hotel_tools = book_hotel_safe_tools + book_hotel_sensitive_tools

# --- 创建 Assistant Runnable ---
book_hotel_runnable = hotel_prompt | llm.bind_tools(
    book_hotel_tools + [CompleteOrEscalate]
)

# --- 构建图 ---
builder = StateGraph(State)

# --- 添加 Primary Assistant ---
builder.add_node("primary_assistant", Assistant(primary_assistant_runnable))
builder.add_node("primary_assistant_tools", create_tool_node_with_fallback(primary_tools))

# --- 添加 Hotel Skill ---
builder.add_node(
    "enter_book_hotel",
    create_entry_node("Hotel Booking Assistant", "book_hotel"),
)
builder.add_node("book_hotel", Assistant(book_hotel_runnable))
builder.add_node(
    "book_hotel_safe_tools",
    create_tool_node_with_fallback(book_hotel_safe_tools),
)
builder.add_node(
    "book_hotel_sensitive_tools", 
    create_tool_node_with_fallback(book_hotel_sensitive_tools),
)

# --- 添加共享的 leave_skill 节点 ---
builder.add_node("leave_skill", pop_dialog_state)

# --- 定义边 ---
# Primary Assistant 路由
builder.add_conditional_edges(
    "primary_assistant",
    route_primary_assistant,
    [
        "primary_assistant_tools",
        "enter_book_hotel",
        "enter_book_car_rental",
        "enter_book_excursion",
        END,
    ],
)
builder.add_edge("primary_assistant_tools", "primary_assistant")

# Hotel Skill 路由
builder.add_edge("enter_book_hotel", "book_hotel")
builder.add_conditional_edges(
    "book_hotel",
    route_book_hotel,
    ["book_hotel_safe_tools", "book_hotel_sensitive_tools", "leave_skill", END],
)
builder.add_edge("book_hotel_safe_tools", "book_hotel")
builder.add_edge("book_hotel_sensitive_tools", "book_hotel")

# Leave Skill 返回 Primary Assistant
builder.add_edge("leave_skill", "primary_assistant")

# --- 入口点 ---
builder.add_conditional_edges(START, route_to_workflow)

# --- 编译 ---
memory = MemorySaver()
graph = builder.compile(
    checkpointer=memory,
    interrupt_before=["book_hotel_sensitive_tools"],  # Human-in-the-loop
)
```

---

### Skill 模式的关键设计原则

| 原则 | 说明 |
|-----|------|
| **单一职责** | 每个 Skill 专注于一个领域（酒店、租车、行程等） |
| **独立改进** | 可以独立优化某个 Skill 而不影响其他部分 |
| **状态隔离** | 通过 Dialog State Stack 管理 Skill 激活状态 |
| **安全分层** | 区分安全工具和敏感工具，敏感操作需人工确认 |
| **优雅退出** | 统一的 `leave_skill` 节点确保状态正确恢复 |
| **可扩展性** | 新增 Skill 只需按模板添加新的子图 |

---

### 添加新 Skill 的模板

```python
# 1. 定义工具
new_skill_safe_tools = [tool_a, tool_b]
new_skill_sensitive_tools = [tool_c, tool_d]
new_skill_tools = new_skill_safe_tools + new_skill_sensitive_tools

# 2. 创建 Runnable
new_skill_runnable = new_skill_prompt | llm.bind_tools(
    new_skill_tools + [CompleteOrEscalate]
)

# 3. 添加节点
builder.add_node(
    "enter_new_skill",
    create_entry_node("New Skill Assistant", "new_skill"),
)
builder.add_node("new_skill", Assistant(new_skill_runnable))
builder.add_node(
    "new_skill_safe_tools",
    create_tool_node_with_fallback(new_skill_safe_tools),
)
builder.add_node(
    "new_skill_sensitive_tools",
    create_tool_node_with_fallback(new_skill_sensitive_tools),
)

# 4. 定义路由函数
def route_new_skill(state: State):
    route = tools_condition(state)
    if route == END:
        return END
    tool_calls = state["messages"][-1].tool_calls
    did_cancel = any(tc["name"] == CompleteOrEscalate.__name__ for tc in tool_calls)
    if did_cancel:
        return "leave_skill"
    safe_names = [t.name for t in new_skill_safe_tools]
    if all(tc["name"] in safe_names for tc in tool_calls):
        return "new_skill_safe_tools"
    return "new_skill_sensitive_tools"

# 5. 添加边
builder.add_edge("enter_new_skill", "new_skill")
builder.add_conditional_edges(
    "new_skill",
    route_new_skill,
    ["new_skill_safe_tools", "new_skill_sensitive_tools", "leave_skill", END],
)
builder.add_edge("new_skill_safe_tools", "new_skill")
builder.add_edge("new_skill_sensitive_tools", "new_skill")

# 6. 更新 State 定义中的 dialog_state 类型
# 在 Literal 中添加 "new_skill"
```

---

## 总结

### 核心 Agent Skills 能力

| 能力类别 | 库/工具 | 描述 |
|---------|--------|------|
| **多智能体编排** | LangGraph Supervisor | 创建 supervisor 管理多个专门 agents |
| **记忆管理** | LangMem | 存储、检索、管理长期记忆 |
| **推理与行动** | ReAct Agent | 迭代推理并执行工具 |
| **深度任务** | DeepAgents | 复杂任务规划和子代理委托 |
| **工具调用** | LangGraph | 动态工具选择和执行 |
| **状态管理** | LangGraph | 图状态流转和条件分支 |
| **Skill 模式** | LangGraph Sub-Graph | 专门化子工作流，意图检测 + 领域隔离 |

### 关键依赖

```
langchain
langgraph
langmem
langgraph-supervisor
tavily-python (搜索工具)
chromadb (向量存储)
openai / anthropic (LLM providers)
pydantic (数据模型)
```

### Skill vs 其他模式对比

| 特性 | Skill (Sub-Graph) | Supervisor | ReAct Agent |
|-----|-------------------|------------|-------------|
| **状态隔离** | ✅ 完全隔离 | ❌ 共享状态 | ❌ 单一状态 |
| **意图检测** | ✅ 主动路由 | ❌ 需手动分发 | ❌ 无 |
| **Human-in-loop** | ✅ 敏感工具中断 | ⚠️ 需额外配置 | ⚠️ 需额外配置 |
| **可扩展性** | ✅ 模板化添加 | ✅ 添加新 Agent | ⚠️ 较复杂 |
| **复杂度** | 中等 | 低 | 低 |
| **适用场景** | 客服、助手系统 | 任务分发 | 通用推理 |

