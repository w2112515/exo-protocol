# Exo Protocol - Mock Module Tests
# Tests for AC-01 through AC-05

import json
import os
import sys
import tempfile
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from mock import (
    MockOrder,
    MockSkill,
    generate_mock_orders,
    generate_mock_skills,
    save_mock_data,
)


class TestAC01ModuleImport:
    """AC-01: mock 模块可独立导入"""
    
    def test_can_import_mock_order(self):
        """验证 MockOrder 类可导入"""
        assert MockOrder is not None
    
    def test_can_import_mock_skill(self):
        """验证 MockSkill 类可导入"""
        assert MockSkill is not None
    
    def test_can_import_generate_orders(self):
        """验证 generate_mock_orders 函数可导入"""
        assert callable(generate_mock_orders)
    
    def test_can_import_generate_skills(self):
        """验证 generate_mock_skills 函数可导入"""
        assert callable(generate_mock_skills)
    
    def test_can_import_save_mock_data(self):
        """验证 save_mock_data 函数可导入"""
        assert callable(save_mock_data)


class TestAC02MockOrders:
    """AC-02: 生成 10+ 个 Mock Order 记录"""
    
    def test_generate_default_10_orders(self):
        """默认生成 10 个订单"""
        orders = generate_mock_orders()
        assert len(orders) == 10
    
    def test_generate_custom_count_orders(self):
        """可自定义生成数量"""
        orders = generate_mock_orders(count=15)
        assert len(orders) == 15
    
    def test_generate_more_than_10_orders(self):
        """生成超过 10 个订单"""
        orders = generate_mock_orders(count=20)
        assert len(orders) >= 10


class TestAC03MockSkills:
    """AC-03: 生成 5+ 个 Mock Skill 记录"""
    
    def test_generate_default_5_skills(self):
        """默认生成 5 个 Skill"""
        skills = generate_mock_skills()
        assert len(skills) == 5
    
    def test_generate_custom_count_skills(self):
        """可自定义生成数量"""
        skills = generate_mock_skills(count=8)
        assert len(skills) == 8
    
    def test_generate_more_than_5_skills(self):
        """生成超过 5 个 Skill"""
        skills = generate_mock_skills(count=10)
        assert len(skills) >= 5


class TestAC04OrderResultStructure:
    """AC-04: Mock 数据符合 OrderResult 结构"""
    
    def test_order_has_order_id(self):
        """Order 包含 order_id 字段"""
        orders = generate_mock_orders(count=1, seed=42)
        order = orders[0]
        assert hasattr(order, 'order_id')
        assert isinstance(order.order_id, str)
        assert len(order.order_id) > 0
    
    def test_order_has_skill_id(self):
        """Order 包含 skill_id 字段"""
        orders = generate_mock_orders(count=1, seed=42)
        order = orders[0]
        assert hasattr(order, 'skill_id')
        assert isinstance(order.skill_id, str)
    
    def test_order_has_valid_status(self):
        """Order status 为有效枚举值"""
        orders = generate_mock_orders(count=100, seed=42)
        valid_statuses = {"completed", "failed", "timeout"}
        for order in orders:
            assert order.status in valid_statuses
    
    def test_order_has_execution_time_ms(self):
        """Order 包含 execution_time_ms 字段"""
        orders = generate_mock_orders(count=1, seed=42)
        order = orders[0]
        assert hasattr(order, 'execution_time_ms')
        assert isinstance(order.execution_time_ms, int)
        assert order.execution_time_ms > 0
    
    def test_order_has_created_at_iso8601(self):
        """Order created_at 为 ISO8601 格式"""
        orders = generate_mock_orders(count=1, seed=42)
        order = orders[0]
        assert hasattr(order, 'created_at')
        # 验证 ISO8601 格式 (YYYY-MM-DDTHH:MM:SSZ)
        from datetime import datetime
        datetime.strptime(order.created_at, "%Y-%m-%dT%H:%M:%SZ")
    
    def test_order_has_result_hash_64_hex(self):
        """Order result_hash 为 64 字符十六进制"""
        orders = generate_mock_orders(count=1, seed=42)
        order = orders[0]
        assert hasattr(order, 'result_hash')
        assert len(order.result_hash) == 64
        # 验证是有效的十六进制
        int(order.result_hash, 16)
    
    def test_order_has_agent_id(self):
        """Order 包含 agent_id 字段"""
        orders = generate_mock_orders(count=1, seed=42)
        order = orders[0]
        assert hasattr(order, 'agent_id')
        assert isinstance(order.agent_id, str)
    
    def test_skill_has_required_fields(self):
        """Skill 包含所有必需字段"""
        skills = generate_mock_skills(count=1, seed=42)
        skill = skills[0]
        
        required_fields = [
            ('skill_id', str),
            ('name', str),
            ('version', str),
            ('category', str),
            ('price_lamports', int),
            ('execution_count', int),
            ('success_rate', float),
        ]
        
        for field_name, field_type in required_fields:
            assert hasattr(skill, field_name), f"Missing field: {field_name}"
            assert isinstance(getattr(skill, field_name), field_type), f"Wrong type for {field_name}"
    
    def test_skill_success_rate_valid_range(self):
        """Skill success_rate 在 0.0-1.0 范围内"""
        skills = generate_mock_skills(count=10, seed=42)
        for skill in skills:
            assert 0.0 <= skill.success_rate <= 1.0
    
    def test_order_to_dict_returns_dict(self):
        """Order.to_dict() 返回字典"""
        orders = generate_mock_orders(count=1, seed=42)
        order_dict = orders[0].to_dict()
        assert isinstance(order_dict, dict)
        assert 'order_id' in order_dict
    
    def test_skill_to_dict_returns_dict(self):
        """Skill.to_dict() 返回字典"""
        skills = generate_mock_skills(count=1, seed=42)
        skill_dict = skills[0].to_dict()
        assert isinstance(skill_dict, dict)
        assert 'skill_id' in skill_dict


class TestAC05SeedMode:
    """AC-05: 支持随机生成和固定种子模式"""
    
    def test_random_mode_produces_different_results(self):
        """无种子模式每次生成不同结果"""
        orders1 = generate_mock_orders(count=5)
        orders2 = generate_mock_orders(count=5)
        
        # 订单 ID 应该不同
        ids1 = {o.order_id for o in orders1}
        ids2 = {o.order_id for o in orders2}
        assert ids1 != ids2
    
    def test_seed_mode_produces_same_results(self):
        """固定种子模式每次生成相同结果"""
        orders1 = generate_mock_orders(count=5, seed=42)
        orders2 = generate_mock_orders(count=5, seed=42)
        
        # 订单 ID 应该相同
        for o1, o2 in zip(orders1, orders2):
            assert o1.order_id == o2.order_id
            assert o1.skill_id == o2.skill_id
            assert o1.status == o2.status
            assert o1.execution_time_ms == o2.execution_time_ms
            assert o1.result_hash == o2.result_hash
    
    def test_different_seeds_produce_different_results(self):
        """不同种子生成不同结果"""
        orders1 = generate_mock_orders(count=5, seed=42)
        orders2 = generate_mock_orders(count=5, seed=123)
        
        ids1 = {o.order_id for o in orders1}
        ids2 = {o.order_id for o in orders2}
        assert ids1 != ids2
    
    def test_skill_seed_mode_reproducible(self):
        """Skill 生成也支持种子模式"""
        skills1 = generate_mock_skills(count=5, seed=42)
        skills2 = generate_mock_skills(count=5, seed=42)
        
        for s1, s2 in zip(skills1, skills2):
            assert s1.skill_id == s2.skill_id
            assert s1.name == s2.name
            assert s1.version == s2.version
            assert s1.price_lamports == s2.price_lamports


class TestSaveMockData:
    """测试数据保存功能"""
    
    def test_save_creates_json_files(self):
        """save_mock_data 创建 JSON 文件"""
        with tempfile.TemporaryDirectory() as tmpdir:
            orders_path = os.path.join(tmpdir, "orders.json")
            skills_path = os.path.join(tmpdir, "skills.json")
            
            result = save_mock_data(
                orders_path=orders_path,
                skills_path=skills_path,
                order_count=10,
                skill_count=5,
                seed=42,
            )
            
            assert os.path.exists(orders_path)
            assert os.path.exists(skills_path)
            assert result['orders_count'] == 10
            assert result['skills_count'] == 5
    
    def test_saved_json_is_valid(self):
        """保存的 JSON 文件格式正确"""
        with tempfile.TemporaryDirectory() as tmpdir:
            orders_path = os.path.join(tmpdir, "orders.json")
            skills_path = os.path.join(tmpdir, "skills.json")
            
            save_mock_data(
                orders_path=orders_path,
                skills_path=skills_path,
                order_count=10,
                skill_count=5,
                seed=42,
            )
            
            with open(orders_path, 'r') as f:
                orders_data = json.load(f)
            
            with open(skills_path, 'r') as f:
                skills_data = json.load(f)
            
            assert isinstance(orders_data, list)
            assert len(orders_data) == 10
            assert isinstance(skills_data, list)
            assert len(skills_data) == 5


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
