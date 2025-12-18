#!/usr/bin/env python3
"""
Web Search Skill - Exo Protocol Demo
"""
import json
import sys
import time
import hashlib
from typing import TypedDict, Optional, List


class SearchResult(TypedDict):
    title: str
    url: str
    snippet: str
    published_date: str


class InputSchema(TypedDict):
    query: str
    max_results: int
    search_type: str
    time_range: str


class OutputSchema(TypedDict):
    results: List[SearchResult]
    total_found: int
    search_time_ms: int


MOCK_RESULTS = {
    "web": [
        {
            "title": "Solana Documentation - Official Guide",
            "url": "https://solana.com/docs",
            "snippet": "Learn how to build on Solana with comprehensive tutorials and API references.",
            "published_date": "2024-12-10"
        },
        {
            "title": "Token-2022 Program Overview",
            "url": "https://spl.solana.com/token-2022",
            "snippet": "Token-2022 is a new token program with advanced features like transfer hooks.",
            "published_date": "2024-12-05"
        },
        {
            "title": "Building DeFi on Solana - Developer Tutorial",
            "url": "https://solana.com/developers/guides/defi",
            "snippet": "Step-by-step guide to building decentralized finance applications.",
            "published_date": "2024-11-28"
        }
    ],
    "news": [
        {
            "title": "Solana Ecosystem Growth Continues in Q4 2024",
            "url": "https://news.example.com/solana-q4-2024",
            "snippet": "Solana's developer activity reaches new highs as ecosystem expands.",
            "published_date": "2024-12-12"
        },
        {
            "title": "AI Agents Meet Blockchain: The Future of Autonomous Systems",
            "url": "https://tech.example.com/ai-blockchain-agents",
            "snippet": "How AI agents are leveraging blockchain for trustless execution.",
            "published_date": "2024-12-08"
        }
    ],
    "academic": [
        {
            "title": "Scalable Consensus Mechanisms for High-Throughput Blockchains",
            "url": "https://arxiv.org/abs/2024.12345",
            "snippet": "Analysis of Solana's Proof of History and its performance characteristics.",
            "published_date": "2024-11-15"
        },
        {
            "title": "Smart Contract Security in Token Programs",
            "url": "https://papers.example.edu/token-security",
            "snippet": "A comprehensive study of security patterns in modern token standards.",
            "published_date": "2024-10-20"
        }
    ]
}


def search_web(
    query: str,
    max_results: int = 5,
    search_type: str = "web",
    time_range: str = "any"
) -> OutputSchema:
    """
    网页搜索模拟实现（演示用）
    实际生产环境应接入搜索引擎 API
    """
    start_time = time.time()
    
    # 获取模拟结果
    results = MOCK_RESULTS.get(search_type, MOCK_RESULTS["web"])
    
    # 根据查询生成一致的伪随机 total_found
    query_hash = int(hashlib.md5(query.encode()).hexdigest()[:8], 16)
    total_found = (query_hash % 10000) + 100
    
    # 限制返回数量
    results = results[:max_results]
    
    search_time_ms = int((time.time() - start_time) * 1000) + 200
    
    return {
        "results": results,
        "total_found": total_found,
        "search_time_ms": search_time_ms
    }


def main():
    """入口函数 - 从 stdin 读取 JSON 输入"""
    try:
        input_data: InputSchema = json.load(sys.stdin)
        
        query = input_data.get("query", "")
        max_results = input_data.get("max_results", 5)
        search_type = input_data.get("search_type", "web")
        time_range = input_data.get("time_range", "any")
        
        if not query:
            raise ValueError("Missing required field: query")
        
        if len(query) > 500:
            raise ValueError("Query exceeds maximum length of 500 characters")
        
        valid_types = ["web", "news", "academic"]
        if search_type not in valid_types:
            raise ValueError(f"Invalid search_type. Must be one of: {valid_types}")
        
        valid_ranges = ["any", "day", "week", "month", "year"]
        if time_range not in valid_ranges:
            raise ValueError(f"Invalid time_range. Must be one of: {valid_ranges}")
        
        if not (1 <= max_results <= 20):
            raise ValueError("max_results must be between 1 and 20")
        
        result = search_web(query, max_results, search_type, time_range)
        
        print(json.dumps(result, ensure_ascii=False))
        sys.exit(0)
        
    except Exception as e:
        error_output = {"error": str(e)}
        print(json.dumps(error_output), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
