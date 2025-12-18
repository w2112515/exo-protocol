#!/usr/bin/env python3
"""
Code Review Skill - Exo Protocol Demo
"""
import json
import sys
import re
from typing import TypedDict, Optional, List


class Issue(TypedDict):
    line: int
    severity: str
    category: str
    message: str
    suggestion: str


class Summary(TypedDict):
    total_issues: int
    critical_count: int
    error_count: int
    warning_count: int
    info_count: int


class OutputSchema(TypedDict):
    issues: List[Issue]
    summary: Summary
    overall_score: int


SEVERITY_ORDER = ["info", "warning", "error", "critical"]

PATTERNS = {
    "python": {
        "sql_injection": {
            "pattern": r'f["\'].*SELECT.*\{',
            "severity": "critical",
            "category": "security",
            "message": "Potential SQL Injection vulnerability (f-string in SQL)",
            "suggestion": "Use parameterized queries with placeholders"
        },
        "eval_usage": {
            "pattern": r'\beval\s*\(',
            "severity": "critical",
            "category": "security",
            "message": "Dangerous use of eval() function",
            "suggestion": "Avoid eval(); use ast.literal_eval() for safe parsing"
        },
        "hardcoded_secret": {
            "pattern": r'(password|secret|api_key)\s*=\s*["\'][^"\']+["\']',
            "severity": "error",
            "category": "security",
            "message": "Hardcoded credential detected",
            "suggestion": "Use environment variables or secret management"
        },
        "missing_type_hints": {
            "pattern": r'def\s+\w+\s*\([^)]*\)\s*:',
            "severity": "info",
            "category": "best-practices",
            "message": "Function may be missing type hints",
            "suggestion": "Add type hints for better code documentation"
        },
        "bare_except": {
            "pattern": r'except\s*:',
            "severity": "warning",
            "category": "best-practices",
            "message": "Bare except clause catches all exceptions",
            "suggestion": "Specify exception types: except ValueError:"
        }
    },
    "javascript": {
        "eval_usage": {
            "pattern": r'\beval\s*\(',
            "severity": "critical",
            "category": "security",
            "message": "Dangerous use of eval() function",
            "suggestion": "Avoid eval(); use JSON.parse() for JSON data"
        },
        "innerHTML": {
            "pattern": r'\.innerHTML\s*=',
            "severity": "error",
            "category": "security",
            "message": "Direct innerHTML assignment may lead to XSS",
            "suggestion": "Use textContent or sanitize HTML input"
        },
        "var_usage": {
            "pattern": r'\bvar\s+',
            "severity": "warning",
            "category": "best-practices",
            "message": "Using 'var' instead of 'let' or 'const'",
            "suggestion": "Use 'const' for constants, 'let' for variables"
        }
    },
    "typescript": {
        "any_type": {
            "pattern": r':\s*any\b',
            "severity": "warning",
            "category": "best-practices",
            "message": "Using 'any' type defeats TypeScript's type safety",
            "suggestion": "Define proper types or use 'unknown'"
        }
    },
    "rust": {
        "unwrap_usage": {
            "pattern": r'\.unwrap\(\)',
            "severity": "warning",
            "category": "best-practices",
            "message": "Using unwrap() may cause panic",
            "suggestion": "Use match, if let, or ? operator for error handling"
        },
        "unsafe_block": {
            "pattern": r'\bunsafe\s*\{',
            "severity": "error",
            "category": "security",
            "message": "Unsafe block detected - review carefully",
            "suggestion": "Minimize unsafe code and document safety guarantees"
        }
    },
    "solidity": {
        "tx_origin": {
            "pattern": r'\btx\.origin\b',
            "severity": "critical",
            "category": "security",
            "message": "Using tx.origin for authorization is vulnerable",
            "suggestion": "Use msg.sender instead of tx.origin"
        },
        "reentrancy": {
            "pattern": r'\.call\{.*value.*\}\s*\(',
            "severity": "error",
            "category": "security",
            "message": "Potential reentrancy vulnerability",
            "suggestion": "Use checks-effects-interactions pattern"
        }
    },
    "go": {
        "error_ignored": {
            "pattern": r'_\s*=\s*\w+\([^)]*\)',
            "severity": "warning",
            "category": "best-practices",
            "message": "Error return value is being ignored",
            "suggestion": "Handle errors explicitly"
        }
    }
}


def review_code(
    code: str,
    language: str,
    review_focus: List[str],
    severity_threshold: str = "info"
) -> OutputSchema:
    """
    代码审查实现（基于模式匹配的演示版本）
    实际生产环境应接入专业静态分析工具或 LLM
    """
    issues: List[Issue] = []
    lines = code.split('\n')
    
    patterns = PATTERNS.get(language, {})
    threshold_idx = SEVERITY_ORDER.index(severity_threshold)
    
    for line_num, line in enumerate(lines, 1):
        for pattern_name, pattern_info in patterns.items():
            if pattern_info["category"] not in review_focus:
                continue
                
            severity_idx = SEVERITY_ORDER.index(pattern_info["severity"])
            if severity_idx < threshold_idx:
                continue
            
            if re.search(pattern_info["pattern"], line, re.IGNORECASE):
                issues.append({
                    "line": line_num,
                    "severity": pattern_info["severity"],
                    "category": pattern_info["category"],
                    "message": pattern_info["message"],
                    "suggestion": pattern_info["suggestion"]
                })
    
    # 计算摘要
    summary: Summary = {
        "total_issues": len(issues),
        "critical_count": sum(1 for i in issues if i["severity"] == "critical"),
        "error_count": sum(1 for i in issues if i["severity"] == "error"),
        "warning_count": sum(1 for i in issues if i["severity"] == "warning"),
        "info_count": sum(1 for i in issues if i["severity"] == "info")
    }
    
    # 计算评分
    base_score = 100
    base_score -= summary["critical_count"] * 25
    base_score -= summary["error_count"] * 15
    base_score -= summary["warning_count"] * 5
    base_score -= summary["info_count"] * 1
    overall_score = max(0, min(100, base_score))
    
    return {
        "issues": issues,
        "summary": summary,
        "overall_score": overall_score
    }


def main():
    """入口函数 - 从 stdin 读取 JSON 输入"""
    try:
        input_data = json.load(sys.stdin)
        
        code = input_data.get("code", "")
        language = input_data.get("language", "")
        review_focus = input_data.get("review_focus", ["security", "best-practices"])
        severity_threshold = input_data.get("severity_threshold", "info")
        
        if not code:
            raise ValueError("Missing required field: code")
        
        if not language:
            raise ValueError("Missing required field: language")
        
        if len(code) > 50000:
            raise ValueError("Code exceeds maximum length of 50KB")
        
        valid_languages = ["python", "javascript", "typescript", "rust", "solidity", "go"]
        if language not in valid_languages:
            raise ValueError(f"Invalid language. Must be one of: {valid_languages}")
        
        result = review_code(code, language, review_focus, severity_threshold)
        
        print(json.dumps(result, ensure_ascii=False))
        sys.exit(0)
        
    except Exception as e:
        error_output = {"error": str(e)}
        print(json.dumps(error_output), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
