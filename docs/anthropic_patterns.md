# Anthropic 技术模式参考文档

**Version**: 1.0.0 | **来源**: anthropics/skills, anthropic-cookbook, courses
**适用**: 城邦 V5.0 Skill 标准与 Agent 编排
**声明**: 本文档提取的技术模式**不依赖 Anthropic API**，可用任意 LLM 后端实现

---

## 1. Skill 目录结构规范

### 1.1 标准目录结构

```
my-skill/
├── SKILL.md              # 主指令文件 (YAML frontmatter + Markdown)
├── scripts/              # 可执行脚本
│   └── run_query.py
├── references/           # 参考文档
│   └── schema.md
└── assets/               # 模板和资源
    └── template.json
```

### 1.2 SKILL.md Frontmatter 规范

```yaml
---
name: my-skill-name
description: A clear description of what this skill does and when to use it
version: 1.0.0
# 城邦扩展字段
author: creator_address
audit_hash: 0x...
egress_policy: blocked    # blocked/restricted/open
supported_backends:
  - gpt-4o
  - llama-3
  - qwen-max
---

# My Skill Name

[Instructions that the LLM will follow when this skill is active]

## Examples
- Example usage 1
- Example usage 2

## Guidelines
- Guideline 1
- Guideline 2
```

### 1.3 工具链脚本

| 脚本 | 功能 |
|------|------|
| `init_skill.py <name> --path <dir>` | 初始化 Skill 目录结构 |
| `quick_validate.py <path>` | 验证 Skill 结构和必填字段 |
| `package_skill.py <path> [output]` | 打包为 `.skill` 分发文件 |

---

## 2. Tool Annotations 机制

### 2.1 行为注解定义

Anthropic MCP 定义的工具行为注解，用于声明工具的副作用特性：

| Annotation | 类型 | 含义 | 城邦应用 |
|------------|------|------|---------|
| `readOnlyHint` | boolean | 工具只读，不修改环境 | A/B 类任务自动标记 |
| `destructiveHint` | boolean | 工具会破坏性修改数据 | 需要更高保证金 |
| `idempotentHint` | boolean | 重复调用无副作用 | 可安全重试/重放 |
| `openWorldHint` | boolean | 工具与外部系统交互 | 需要 Integration 测试 |

### 2.2 Python 实现示例

```python
@mcp.tool(
    name="service_tool_name",
    annotations={
        "title": "Human-Readable Tool Title",
        "readOnlyHint": True,      # 工具不修改环境
        "destructiveHint": False,  # 工具不执行破坏性操作
        "idempotentHint": True,    # 重复调用无副作用
        "openWorldHint": False     # 工具不与外部系统交互
    }
)
async def service_tool_name(params: ServiceToolInput) -> str:
    pass
```

### 2.3 TypeScript 实现示例

```typescript
server.registerTool(
  "example_search_users",
  {
    title: "Search Example Users",
    description: "Search for users in the system",
    inputSchema: UserSearchInputSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (params) => { /* implementation */ }
);
```

---

## 3. Schema 验证模式

### 3.1 Pydantic (Python) 验证

```python
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from enum import Enum

class ResponseFormat(str, Enum):
    MARKDOWN = "markdown"
    JSON = "json"

class SkillInput(BaseModel):
    """Skill 输入参数验证模型"""
    model_config = ConfigDict(
        str_strip_whitespace=True,    # 自动去除空白
        validate_assignment=True,      # 赋值时验证
        extra='forbid'                 # 禁止额外字段
    )
    
    query: str = Field(
        ..., 
        description="Search query",
        min_length=1, 
        max_length=1000
    )
    limit: int = Field(
        default=20, 
        description="Maximum results",
        ge=1, 
        le=100
    )
    tags: Optional[List[str]] = Field(
        default_factory=list,
        description="Filter tags",
        max_items=10
    )
    response_format: ResponseFormat = Field(
        default=ResponseFormat.MARKDOWN,
        description="Output format"
    )
```

### 3.2 Zod (TypeScript) 验证

```typescript
import { z } from "zod";

const SkillInputSchema = z.object({
  query: z.string()
    .min(1, "Query required")
    .max(1000, "Query too long")
    .describe("Search query"),
  limit: z.number()
    .int()
    .min(1)
    .max(100)
    .default(20)
    .describe("Maximum results"),
  tags: z.array(z.string())
    .max(10)
    .default([])
    .describe("Filter tags"),
  response_format: z.enum(["markdown", "json"])
    .default("markdown")
    .describe("Output format")
}).strict();  // 禁止额外字段

type SkillInput = z.infer<typeof SkillInputSchema>;
```

---

## 4. Tool Use 工作流模式

### 4.1 四步工作流（LLM 无关）

```
1. [Client] 提供工具定义 + 用户提示 → LLM
2. [LLM] 判断是否调用工具 → 输出工具调用请求
3. [Client] 执行工具功能 → 获取结果
4. [Client] 工具结果返回 LLM → 生成最终响应
```

### 4.2 Agent Loop 实现

```python
def agent_loop(prompt: str, tools: list) -> tuple:
    """通用 Agent 循环，不依赖特定 LLM"""
    messages = [{"role": "user", "content": prompt}]
    tool_metrics = {}
    
    response = llm.generate(messages, tools=tools)
    messages.append({"role": "assistant", "content": response.content})
    
    while response.stop_reason == "tool_use":
        tool_use = extract_tool_call(response)
        tool_name = tool_use.name
        
        # 执行工具并记录指标
        start_time = time.time()
        try:
            tool_result = execute_tool(tool_name, tool_use.input)
        except Exception as e:
            tool_result = f"Error: {str(e)}"
        duration = time.time() - start_time
        
        # 更新指标
        if tool_name not in tool_metrics:
            tool_metrics[tool_name] = {"count": 0, "durations": []}
        tool_metrics[tool_name]["count"] += 1
        tool_metrics[tool_name]["durations"].append(duration)
        
        # 添加工具结果到消息
        messages.append({
            "role": "user",
            "content": [{
                "type": "tool_result",
                "tool_use_id": tool_use.id,
                "content": tool_result
            }]
        })
        
        response = llm.generate(messages, tools=tools)
        messages.append({"role": "assistant", "content": response.content})
    
    return response.text, tool_metrics
```

### 4.3 工具调用分发器

```python
def process_skill_call(skill_name: str, skill_input: dict) -> tuple:
    """城邦统一 Skill 调用分发器"""
    # 从 Registry 加载 Skill
    skill = load_skill_from_registry(skill_name)
    
    # Schema 验证
    validated_input = skill.schema.validate(skill_input)
    
    # 执行并记录日志（用于挑战重放）
    with ExecutionLogger() as log:
        result = skill.execute(validated_input)
    
    return result, log.get_trace()
```

---

## 5. Agent 编排模式

### 5.1 Subagent Orchestration

```python
class SwarmCoordinator:
    """多 Agent 协调器"""
    
    def __init__(self, task_spec: dict):
        self.blackboard = SharedBlackboard(
            storage=task_spec.get("storage", "ipfs"),
            encryption=task_spec.get("encryption", True),
            ttl=task_spec.get("ttl", "24h")
        )
        self.participants = self.load_participants(task_spec)
        self.watchdog = WatchdogTimer(timeout=task_spec.get("step_timeout", 900))
    
    async def execute_step(self, step_num: int) -> dict:
        actor = self.get_step_actor(step_num)
        
        # 从黑板读取输入
        input_data = self.blackboard.read(step_num - 1)
        
        # 启动看门狗
        self.watchdog.start()
        
        try:
            # 执行并写入黑板
            result = await actor.execute(input_data)
            self.blackboard.write(step_num, result)
            
            # 写入检查点（用于宕机恢复）
            self.blackboard.checkpoint(step_num)
            
            return {"status": "success", "result": result}
        except TimeoutError:
            return {"status": "timeout", "step": step_num}
        finally:
            self.watchdog.stop()
    
    async def recover_from_checkpoint(self) -> int:
        """从最新检查点恢复"""
        latest_checkpoint = self.blackboard.get_latest_checkpoint()
        return latest_checkpoint.step_num if latest_checkpoint else 0
```

### 5.2 共享黑板机制

```python
class SharedBlackboard:
    """基于 CRDT 的共享黑板"""
    
    def __init__(self, storage: str, encryption: bool, ttl: str):
        self.storage = storage
        self.encryption = encryption
        self.ttl = parse_duration(ttl)
        self.data = JSONCRDTDocument()  # 使用 CRDT 防止并发冲突
    
    def write(self, step_num: int, data: dict, version: int = None):
        """乐观锁写入"""
        if version and self.data.version != version:
            raise OptimisticLockError("Version conflict, please retry")
        
        self.data.merge({
            f"step_{step_num}": {
                "data": data,
                "timestamp": time.time(),
                "version": self.data.version + 1
            }
        })
    
    def checkpoint(self, step_num: int):
        """写入检查点"""
        self.data.merge({
            "checkpoint": {
                "step": step_num,
                "timestamp": time.time(),
                "hash": self.compute_state_hash()
            }
        })
```

---

## 6. 安全验证清单

### 6.1 输入验证

| 检查项 | 实现方式 |
|--------|----------|
| **路径遍历防护** | 清洗文件路径，禁止 `..` |
| **命令注入防护** | 系统调用参数化，禁止字符串拼接 |
| **URL/ID 验证** | 白名单校验，正则匹配 |
| **参数范围检查** | Schema 约束 (min/max) |
| **类型验证** | 强类型 Schema (Pydantic/Zod) |
| **额外字段禁止** | `extra='forbid'` / `.strict()` |

### 6.2 测试分层

| 测试类型 | 描述 | 审计要求 |
|----------|------|----------|
| **Functional** | 验证正确执行 | 必须 |
| **Integration** | 外部系统交互 | 涉及外部依赖时必须 |
| **Security** | 认证/输入消毒/限流 | 必须 |
| **Performance** | 负载/超时行为 | 推荐 |

### 6.3 错误处理标准

```python
def handle_api_error(error: Exception) -> str:
    """标准化错误处理"""
    if isinstance(error, httpx.HTTPStatusError):
        status = error.response.status_code
        if status == 404:
            return "Error: Resource not found"
        elif status == 403:
            return "Error: Permission denied"
        elif status == 429:
            return "Error: Rate limit exceeded"
    elif isinstance(error, httpx.TimeoutException):
        return "Error: Request timeout"
    
    return f"Error: Unexpected error - {str(error)}"
```

---

## 7. 分页响应标准

### 7.1 响应格式

```json
{
  "total": 150,
  "count": 20,
  "offset": 0,
  "items": [...],
  "has_more": true,
  "next_offset": 20
}
```

### 7.2 实现示例

```python
def paginated_response(
    items: list,
    total: int,
    offset: int,
    limit: int
) -> dict:
    return {
        "total": total,
        "count": len(items),
        "offset": offset,
        "items": items,
        "has_more": total > offset + len(items),
        "next_offset": offset + len(items) if total > offset + len(items) else None
    }
```

---

## 8. MCP Server 命名规范

| 语言 | 格式 | 示例 |
|------|------|------|
| Python | `{service}_mcp` | `skill_registry_mcp` |
| Node/TypeScript | `{service}-mcp-server` | `skill-registry-mcp-server` |

**命名原则**：
- 使用 snake_case (Python) 或 kebab-case (Node)
- 包含服务前缀，避免冲突
- 动作导向（动词开头）
- 具体明确，避免歧义

---

## 参考资料

- [Anthropic Skills Repository](https://github.com/anthropics/skills)
- [Anthropic Cookbook](https://github.com/anthropics/anthropic-cookbook)
- [Anthropic Courses](https://github.com/anthropics/courses)
- [MCP Best Practices](https://github.com/anthropics/skills/blob/main/mcp-builder/reference/mcp_best_practices.md)

**注意**: 以上所有模式均为设计参考，不依赖任何特定 LLM API。
