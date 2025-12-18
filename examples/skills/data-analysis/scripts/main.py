#!/usr/bin/env python3
"""
Data Analysis Skill - Exo Protocol Demo
"""
import json
import sys
import math
from typing import TypedDict, Optional, List, Dict, Any


class Statistics(TypedDict):
    count: int
    mean: float
    std: float
    min: float
    max: float
    median: float


class Correlation(TypedDict):
    coefficient: float
    interpretation: str


class Outlier(TypedDict):
    column: str
    value: float
    index: int
    z_score: float


class VisualizationSuggestion(TypedDict):
    type: str
    columns: List[str]
    reason: str


class OutputSchema(TypedDict):
    statistics: Dict[str, Statistics]
    correlations: Dict[str, Correlation]
    outliers: List[Outlier]
    visualization_suggestions: List[VisualizationSuggestion]
    insights: List[str]


def calculate_mean(values: List[float]) -> float:
    return sum(values) / len(values) if values else 0


def calculate_std(values: List[float], mean: float) -> float:
    if len(values) < 2:
        return 0
    variance = sum((x - mean) ** 2 for x in values) / (len(values) - 1)
    return math.sqrt(variance)


def calculate_median(values: List[float]) -> float:
    sorted_vals = sorted(values)
    n = len(sorted_vals)
    if n == 0:
        return 0
    mid = n // 2
    if n % 2 == 0:
        return (sorted_vals[mid - 1] + sorted_vals[mid]) / 2
    return sorted_vals[mid]


def calculate_correlation(x: List[float], y: List[float]) -> float:
    """计算皮尔逊相关系数"""
    n = len(x)
    if n < 2:
        return 0
    
    mean_x = calculate_mean(x)
    mean_y = calculate_mean(y)
    
    numerator = sum((x[i] - mean_x) * (y[i] - mean_y) for i in range(n))
    
    sum_sq_x = sum((xi - mean_x) ** 2 for xi in x)
    sum_sq_y = sum((yi - mean_y) ** 2 for yi in y)
    
    denominator = math.sqrt(sum_sq_x * sum_sq_y)
    
    if denominator == 0:
        return 0
    
    return numerator / denominator


def interpret_correlation(r: float) -> str:
    """解释相关系数"""
    abs_r = abs(r)
    if abs_r >= 0.8:
        strength = "strong"
    elif abs_r >= 0.5:
        strength = "moderate"
    elif abs_r >= 0.3:
        strength = "weak"
    else:
        return "no_correlation"
    
    direction = "positive" if r > 0 else "negative"
    return f"{strength}_{direction}"


def analyze_data(
    data: List[Dict[str, Any]],
    columns: Optional[List[str]] = None,
    analysis_types: List[str] = None,
    group_by: Optional[str] = None
) -> OutputSchema:
    """
    数据分析实现
    """
    if analysis_types is None:
        analysis_types = ["descriptive"]
    
    if not data:
        return {
            "statistics": {},
            "correlations": {},
            "outliers": [],
            "visualization_suggestions": [],
            "insights": ["数据为空，无法进行分析"]
        }
    
    # 识别数值列
    numeric_columns = []
    date_columns = []
    
    sample = data[0]
    all_columns = columns if columns else list(sample.keys())
    
    for col in all_columns:
        if col in sample:
            val = sample[col]
            if isinstance(val, (int, float)):
                numeric_columns.append(col)
            elif isinstance(val, str) and ("date" in col.lower() or "time" in col.lower()):
                date_columns.append(col)
    
    # 提取数值数据
    column_data: Dict[str, List[float]] = {col: [] for col in numeric_columns}
    for row in data:
        for col in numeric_columns:
            if col in row and row[col] is not None:
                try:
                    column_data[col].append(float(row[col]))
                except (ValueError, TypeError):
                    pass
    
    result: OutputSchema = {
        "statistics": {},
        "correlations": {},
        "outliers": [],
        "visualization_suggestions": [],
        "insights": []
    }
    
    # 描述性统计
    if "descriptive" in analysis_types:
        for col, values in column_data.items():
            if values:
                mean = calculate_mean(values)
                std = calculate_std(values, mean)
                result["statistics"][col] = {
                    "count": len(values),
                    "mean": round(mean, 2),
                    "std": round(std, 2),
                    "min": round(min(values), 2),
                    "max": round(max(values), 2),
                    "median": round(calculate_median(values), 2)
                }
    
    # 相关性分析
    if "correlation" in analysis_types and len(numeric_columns) >= 2:
        for i, col1 in enumerate(numeric_columns):
            for col2 in numeric_columns[i + 1:]:
                if column_data[col1] and column_data[col2]:
                    min_len = min(len(column_data[col1]), len(column_data[col2]))
                    x = column_data[col1][:min_len]
                    y = column_data[col2][:min_len]
                    r = calculate_correlation(x, y)
                    key = f"{col1}_{col2}"
                    result["correlations"][key] = {
                        "coefficient": round(r, 2),
                        "interpretation": interpret_correlation(r)
                    }
                    
                    # 添加洞察
                    interp = interpret_correlation(r)
                    if "strong" in interp or "moderate" in interp:
                        direction = "正" if r > 0 else "负"
                        result["insights"].append(
                            f"{col1} 与 {col2} 呈{interp.split('_')[0]}{direction}相关 (r={round(r, 2)})"
                        )
    
    # 异常值检测
    if "outliers" in analysis_types:
        for col, values in column_data.items():
            if len(values) >= 3:
                mean = calculate_mean(values)
                std = calculate_std(values, mean)
                if std > 0:
                    for idx, val in enumerate(values):
                        z_score = (val - mean) / std
                        if abs(z_score) > 1.5:
                            result["outliers"].append({
                                "column": col,
                                "value": round(val, 2),
                                "index": idx,
                                "z_score": round(z_score, 2)
                            })
                            # 添加洞察
                            result["insights"].append(
                                f"第 {idx + 1} 条记录的 {col} 值 ({round(val, 2)}) 可能为异常值"
                            )
    
    # 可视化建议
    if date_columns and numeric_columns:
        result["visualization_suggestions"].append({
            "type": "line_chart",
            "columns": [date_columns[0]] + numeric_columns[:2],
            "reason": "时序数据适合折线图展示趋势"
        })
    
    if len(numeric_columns) >= 2:
        # 找相关性最强的两列
        max_corr = 0
        best_pair = numeric_columns[:2]
        for key, corr in result["correlations"].items():
            if abs(corr["coefficient"]) > abs(max_corr):
                max_corr = corr["coefficient"]
                best_pair = key.split("_")
        
        if abs(max_corr) > 0.5:
            result["visualization_suggestions"].append({
                "type": "scatter_plot",
                "columns": best_pair,
                "reason": f"相关性较强 (r={max_corr})，适合散点图"
            })
    
    if numeric_columns:
        result["visualization_suggestions"].append({
            "type": "bar_chart",
            "columns": numeric_columns[:3],
            "reason": "柱状图适合比较不同指标"
        })
    
    return result


def main():
    """入口函数 - 从 stdin 读取 JSON 输入"""
    try:
        input_data = json.load(sys.stdin)
        
        data = input_data.get("data", [])
        columns = input_data.get("columns")
        analysis_types = input_data.get("analysis_types", ["descriptive"])
        group_by = input_data.get("group_by")
        
        if not data:
            raise ValueError("Missing required field: data")
        
        if len(data) > 10000:
            raise ValueError("Data exceeds maximum of 10000 records")
        
        valid_types = ["descriptive", "correlation", "distribution", "outliers", "trends"]
        for at in analysis_types:
            if at not in valid_types:
                raise ValueError(f"Invalid analysis_type: {at}. Must be one of: {valid_types}")
        
        result = analyze_data(data, columns, analysis_types, group_by)
        
        print(json.dumps(result, ensure_ascii=False))
        sys.exit(0)
        
    except Exception as e:
        error_output = {"error": str(e)}
        print(json.dumps(error_output), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
