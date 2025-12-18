#!/usr/bin/env python3
"""
Text Summary Skill - Exo Protocol Demo
"""
import json
import sys
from typing import TypedDict


class InputSchema(TypedDict):
    text: str
    max_length: int
    language: str


class OutputSchema(TypedDict):
    summary: str
    word_count: int
    compression_ratio: float


def summarize_text(text: str, max_length: int = 200, language: str = "auto") -> OutputSchema:
    """
    简单的文本摘要实现（演示用）
    实际生产环境应接入 LLM API
    """
    original_length = len(text)
    
    # 简单截断策略（演示）
    sentences = text.replace('。', '.').replace('！', '.').replace('？', '.').split('.')
    sentences = [s.strip() for s in sentences if s.strip()]
    
    summary_parts = []
    current_length = 0
    
    for sentence in sentences:
        if current_length + len(sentence) > max_length:
            break
        summary_parts.append(sentence)
        current_length += len(sentence)
    
    summary = '。'.join(summary_parts) + '。' if summary_parts else text[:max_length]
    word_count = len(summary)
    compression_ratio = round(original_length / word_count, 2) if word_count > 0 else 0
    
    return {
        "summary": summary,
        "word_count": word_count,
        "compression_ratio": compression_ratio
    }


def main():
    """入口函数 - 从 stdin 读取 JSON 输入"""
    try:
        input_data: InputSchema = json.load(sys.stdin)
        
        text = input_data.get("text", "")
        max_length = input_data.get("max_length", 200)
        language = input_data.get("language", "auto")
        
        if not text:
            raise ValueError("Missing required field: text")
        
        if len(text) > 100000:
            raise ValueError("Text exceeds maximum length of 100KB")
        
        result = summarize_text(text, max_length, language)
        
        print(json.dumps(result, ensure_ascii=False))
        sys.exit(0)
        
    except Exception as e:
        error_output = {"error": str(e)}
        print(json.dumps(error_output), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
