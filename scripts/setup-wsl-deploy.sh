#!/bin/bash

echo "=== Exo Protocol Devnet 部署脚本 ==="
echo ""

# 检查并安装 Rust
if ! command -v rustc &> /dev/null; then
    echo "[1/4] 安装 Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source $HOME/.cargo/env
    echo "✓ Rust 安装完成"
else
    echo "✓ Rust 已安装: $(rustc --version)"
fi

# 检查并安装 Solana CLI
if ! command -v solana &> /dev/null; then
    echo "[2/4] 安装 Solana CLI..."
    sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
    export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
    echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc
    echo "✓ Solana CLI 安装完成"
else
    echo "✓ Solana CLI 已安装: $(solana --version)"
fi

# 检查并安装 Anchor CLI
if ! command -v anchor &> /dev/null; then
    echo "[3/4] 安装 Anchor CLI (这需要几分钟)..."
    source $HOME/.cargo/env
    cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
    $HOME/.cargo/bin/avm install latest
    $HOME/.cargo/bin/avm use latest
    echo "✓ Anchor CLI 安装完成"
else
    echo "✓ Anchor CLI 已安装: $(anchor --version)"
fi

# 配置 Solana
echo "[4/4] 配置 Solana 环境..."
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
source $HOME/.cargo/env

solana config set --url devnet
solana config set --keypair /mnt/c/Users/nate/.config/solana/id.json

echo ""
echo "=== 环境配置完成 ==="
echo "当前配置:"
solana config get
echo ""
echo "钱包余额:"
solana balance

echo ""
echo "如果余额不足，请执行: solana airdrop 2"
echo ""
echo "准备部署，请在 anchor 目录中执行:"
echo "  cd /mnt/e/Work/BS/hac/hackathon/exo-protocol/anchor"
echo "  anchor build"
echo "  anchor deploy --provider.cluster devnet"
