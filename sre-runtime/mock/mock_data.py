# Exo Protocol - Mock Data Generator
# Generates mock Order and Skill records for dashboard demo

import hashlib
import json
import random
import uuid
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from typing import List, Optional


@dataclass
class MockOrder:
    """
    Mock 订单记录 (对齐 OrderResult 结构)
    
    Attributes:
        order_id: 订单唯一标识符
        skill_id: Skill 唯一标识符
        status: 执行状态 ("completed" | "failed" | "timeout")
        execution_time_ms: 执行耗时 (毫秒)
        created_at: 创建时间 (ISO8601)
        result_hash: 结果哈希 (64 hex chars)
        agent_id: Agent 唯一标识符
    """
    order_id: str
    skill_id: str
    status: str
    execution_time_ms: int
    created_at: str
    result_hash: str
    agent_id: str
    
    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class MockSkill:
    """
    Mock Skill 记录 (对齐 SKILL_SCHEMA.md)
    
    Attributes:
        skill_id: Skill 唯一标识符
        name: Skill 名称
        version: 语义化版本号
        category: 分类
        price_lamports: 单次调用价格 (lamports)
        execution_count: 执行次数
        success_rate: 成功率 (0.0-1.0)
    """
    skill_id: str
    name: str
    version: str
    category: str
    price_lamports: int
    execution_count: int
    success_rate: float
    
    def to_dict(self) -> dict:
        return asdict(self)


# 预定义的 Skill 模板
SKILL_TEMPLATES = [
    {"name": "text-summarizer", "category": "nlp", "base_price": 1000},
    {"name": "image-classifier", "category": "vision", "base_price": 2000},
    {"name": "sentiment-analyzer", "category": "nlp", "base_price": 800},
    {"name": "code-reviewer", "category": "dev-tools", "base_price": 3000},
    {"name": "translation-engine", "category": "nlp", "base_price": 1500},
    {"name": "data-validator", "category": "data", "base_price": 500},
    {"name": "report-generator", "category": "business", "base_price": 2500},
    {"name": "anomaly-detector", "category": "analytics", "base_price": 4000},
]

# 预定义的 Agent 模板
AGENT_TEMPLATES = [
    "agent-alpha-001",
    "agent-beta-002",
    "agent-gamma-003",
    "agent-delta-004",
    "agent-epsilon-005",
]

# 状态权重 (更真实的分布)
STATUS_WEIGHTS = {
    "completed": 0.85,
    "failed": 0.10,
    "timeout": 0.05,
}


def _generate_result_hash(seed_data: str) -> str:
    """生成 64 字符的十六进制哈希"""
    return hashlib.sha256(seed_data.encode()).hexdigest()


def _generate_iso_timestamp(base_time: datetime, offset_minutes: int) -> str:
    """生成 ISO8601 格式时间戳"""
    ts = base_time - timedelta(minutes=offset_minutes)
    return ts.strftime("%Y-%m-%dT%H:%M:%SZ")


def _weighted_choice(weights: dict, rng: random.Random) -> str:
    """基于权重的随机选择"""
    items = list(weights.keys())
    probs = list(weights.values())
    return rng.choices(items, weights=probs, k=1)[0]


def generate_mock_orders(
    count: int = 10,
    seed: Optional[int] = None
) -> List[MockOrder]:
    """
    生成 Mock Order 记录
    
    Args:
        count: 生成数量 (默认 10)
        seed: 随机种子 (可选, 用于可复现结果)
        
    Returns:
        List[MockOrder]: Mock 订单列表
    """
    rng = random.Random(seed)
    orders = []
    
    base_time = datetime.utcnow()
    
    for i in range(count):
        # 随机选择 Skill 和 Agent
        skill_template = rng.choice(SKILL_TEMPLATES)
        agent_id = rng.choice(AGENT_TEMPLATES)
        
        # 生成订单 ID
        order_id = f"order-{uuid.UUID(int=rng.getrandbits(128))}"
        skill_id = f"skill-{skill_template['name']}-v1"
        
        # 随机状态
        status = _weighted_choice(STATUS_WEIGHTS, rng)
        
        # 执行时间 (基于状态)
        if status == "completed":
            execution_time_ms = rng.randint(50, 500)
        elif status == "failed":
            execution_time_ms = rng.randint(10, 100)
        else:  # timeout
            execution_time_ms = rng.randint(30000, 60000)
        
        # 创建时间 (最近 24 小时内)
        offset_minutes = rng.randint(0, 1440)
        created_at = _generate_iso_timestamp(base_time, offset_minutes)
        
        # 结果哈希
        hash_seed = f"{order_id}-{skill_id}-{i}-{seed or 'random'}"
        result_hash = _generate_result_hash(hash_seed)
        
        order = MockOrder(
            order_id=order_id,
            skill_id=skill_id,
            status=status,
            execution_time_ms=execution_time_ms,
            created_at=created_at,
            result_hash=result_hash,
            agent_id=agent_id,
        )
        orders.append(order)
    
    return orders


def generate_mock_skills(
    count: int = 5,
    seed: Optional[int] = None
) -> List[MockSkill]:
    """
    生成 Mock Skill 记录
    
    Args:
        count: 生成数量 (默认 5)
        seed: 随机种子 (可选, 用于可复现结果)
        
    Returns:
        List[MockSkill]: Mock Skill 列表
    """
    rng = random.Random(seed)
    skills = []
    
    # 选择模板 (不重复)
    templates = SKILL_TEMPLATES.copy()
    rng.shuffle(templates)
    selected = templates[:min(count, len(templates))]
    
    # 如果需要更多，循环使用
    while len(selected) < count:
        extra = templates[:count - len(selected)]
        selected.extend(extra)
    
    for i, template in enumerate(selected):
        skill_id = f"skill-{template['name']}-v1"
        
        # 随机版本
        major = rng.randint(1, 3)
        minor = rng.randint(0, 9)
        patch = rng.randint(0, 20)
        version = f"{major}.{minor}.{patch}"
        
        # 基于模板的价格浮动
        price_lamports = template["base_price"] + rng.randint(-200, 500)
        price_lamports = max(100, price_lamports)  # 最低 100
        
        # 执行统计
        execution_count = rng.randint(10, 10000)
        success_rate = round(rng.uniform(0.80, 0.99), 3)
        
        skill = MockSkill(
            skill_id=skill_id,
            name=template["name"],
            version=version,
            category=template["category"],
            price_lamports=price_lamports,
            execution_count=execution_count,
            success_rate=success_rate,
        )
        skills.append(skill)
    
    return skills


def save_mock_data(
    orders_path: str = "mock_orders.json",
    skills_path: str = "mock_skills.json",
    order_count: int = 10,
    skill_count: int = 5,
    seed: Optional[int] = None,
) -> dict:
    """
    生成并保存 Mock 数据到 JSON 文件
    
    Args:
        orders_path: 订单数据保存路径
        skills_path: Skill 数据保存路径
        order_count: 订单数量
        skill_count: Skill 数量
        seed: 随机种子 (可选)
        
    Returns:
        dict: 包含生成统计的结果
    """
    orders = generate_mock_orders(count=order_count, seed=seed)
    skills = generate_mock_skills(count=skill_count, seed=seed)
    
    # 序列化
    orders_data = [o.to_dict() for o in orders]
    skills_data = [s.to_dict() for s in skills]
    
    # 保存
    with open(orders_path, "w", encoding="utf-8") as f:
        json.dump(orders_data, f, indent=2, ensure_ascii=False)
    
    with open(skills_path, "w", encoding="utf-8") as f:
        json.dump(skills_data, f, indent=2, ensure_ascii=False)
    
    return {
        "orders_count": len(orders),
        "skills_count": len(skills),
        "orders_path": orders_path,
        "skills_path": skills_path,
        "seed": seed,
    }


if __name__ == "__main__":
    # CLI 模式 - 生成默认数据
    import os
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    orders_path = os.path.join(script_dir, "mock_orders.json")
    skills_path = os.path.join(script_dir, "mock_skills.json")
    
    result = save_mock_data(
        orders_path=orders_path,
        skills_path=skills_path,
        order_count=15,
        skill_count=8,
        seed=42,  # 固定种子确保可复现
    )
    
    print(f"Generated {result['orders_count']} orders -> {result['orders_path']}")
    print(f"Generated {result['skills_count']} skills -> {result['skills_path']}")
