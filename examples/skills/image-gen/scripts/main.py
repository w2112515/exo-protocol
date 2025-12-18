#!/usr/bin/env python3
"""
Image Generation Skill - Exo Protocol Demo
"""
import json
import sys
import hashlib
from typing import TypedDict, Optional


class InputSchema(TypedDict):
    prompt: str
    style: str
    size: str
    seed: Optional[int]


class GenerationParams(TypedDict):
    prompt: str
    style: str
    size: str
    seed: int
    model: str


class OutputSchema(TypedDict):
    image_url: str
    generation_params: GenerationParams
    estimated_cost: float


STYLE_MODELS = {
    "realistic": "sdxl-1.0",
    "anime": "animagine-xl",
    "sketch": "sd-sketch-v1",
    "oil-painting": "sd-artistic-v2",
    "watercolor": "sd-watercolor-v1"
}

SIZE_COSTS = {
    "256x256": 0.001,
    "512x512": 0.002,
    "1024x1024": 0.004
}


def generate_image(
    prompt: str,
    style: str = "realistic",
    size: str = "512x512",
    seed: Optional[int] = None
) -> OutputSchema:
    """
    图像生成模拟实现（演示用）
    实际生产环境应接入 Stable Diffusion 或类似服务
    """
    import random
    
    if seed is None:
        seed = random.randint(0, 2147483647)
    
    # 生成模拟的 IPFS CID
    content = f"{prompt}-{style}-{size}-{seed}"
    fake_cid = "Qm" + hashlib.sha256(content.encode()).hexdigest()[:44]
    
    model = STYLE_MODELS.get(style, "sdxl-1.0")
    cost = SIZE_COSTS.get(size, 0.002)
    
    return {
        "image_url": f"ipfs://{fake_cid}/generated.png",
        "generation_params": {
            "prompt": prompt,
            "style": style,
            "size": size,
            "seed": seed,
            "model": model
        },
        "estimated_cost": cost
    }


def main():
    """入口函数 - 从 stdin 读取 JSON 输入"""
    try:
        input_data: InputSchema = json.load(sys.stdin)
        
        prompt = input_data.get("prompt", "")
        style = input_data.get("style", "realistic")
        size = input_data.get("size", "512x512")
        seed = input_data.get("seed")
        
        if not prompt:
            raise ValueError("Missing required field: prompt")
        
        if len(prompt) > 2000:
            raise ValueError("Prompt exceeds maximum length of 2000 characters")
        
        valid_styles = ["realistic", "anime", "sketch", "oil-painting", "watercolor"]
        if style not in valid_styles:
            raise ValueError(f"Invalid style. Must be one of: {valid_styles}")
        
        valid_sizes = ["256x256", "512x512", "1024x1024"]
        if size not in valid_sizes:
            raise ValueError(f"Invalid size. Must be one of: {valid_sizes}")
        
        result = generate_image(prompt, style, size, seed)
        
        print(json.dumps(result, ensure_ascii=False))
        sys.exit(0)
        
    except Exception as e:
        error_output = {"error": str(e)}
        print(json.dumps(error_output), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
