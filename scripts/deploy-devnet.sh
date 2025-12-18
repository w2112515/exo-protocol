#!/bin/bash
set -e

# Setup environment
export PATH="$HOME/.local/share/solana/install/active_release/bin:$HOME/.cargo/bin:$PATH"
source "$HOME/.cargo/env" 2>/dev/null || true

echo "=== Environment Check ==="
solana --version
anchor --version

echo -e "\n=== Configure Solana ==="
solana config set --url devnet
solana config set --keypair /mnt/c/Users/nate/.config/solana/id.json
solana balance

echo -e "\n=== Building Contracts ==="
cd /mnt/e/Work/BS/hac/hackathon/exo-protocol/anchor
anchor build

echo -e "\n=== Deploying to Devnet ==="
anchor deploy --provider.cluster devnet

echo -e "\n=== Deployment Complete ==="
echo "Program IDs:"
cat target/deploy/*.json 2>/dev/null | head -20 || echo "Check Anchor.toml for program IDs"
