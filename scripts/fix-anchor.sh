#!/bin/bash

echo "=== 修复 Anchor CLI 安装 ==="

# 设置环境变量
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
source $HOME/.cargo/env

echo "✓ Solana 版本:"
solana --version

echo ""
echo "正在安装 Anchor CLI (这需要几分钟)..."

# 安装 avm (Anchor Version Manager)
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force

# 使用 avm 安装 anchor
~/.cargo/bin/avm install latest
~/.cargo/bin/avm use latest

echo ""
echo "✓ Anchor 安装完成!"
echo ""
echo "请执行以下命令来验证:"
echo "  export PATH=\"\$HOME/.local/share/solana/install/active_release/bin:\$PATH\""
echo "  source \$HOME/.cargo/env"
echo "  anchor --version"
