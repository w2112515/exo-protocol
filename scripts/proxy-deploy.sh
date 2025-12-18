#!/bin/bash
set -e

# 1. Get Windows Host IP (nameserver in WSL2)
HOST_IP=$(grep nameserver /etc/resolv.conf | awk '{print $2}')
echo "Windows Host IP: $HOST_IP"

# 2. Set Proxy (Assuming port 7890 for Clash/v2ray)
export http_proxy="http://$HOST_IP:7890"
export https_proxy="http://$HOST_IP:7890"
export all_proxy="socks5://$HOST_IP:7890"

echo "Proxy set to $HOST_IP:7890"

# 3. Test Connectivity
echo "Testing connectivity to google.com..."
if curl -I --max-time 5 https://google.com; then
    echo "✓ Connectivity confirmed!"
else
    echo "✗ Failed to connect via proxy. Please check if 'Allow LAN' is enabled in Clash/v2ray and port is 7890."
    # Fallback: try direct (sometimes TUN mode works without proxy env vars if properly configured)
    unset http_proxy
    unset https_proxy
    unset all_proxy
    echo "Retrying without proxy env vars..."
    if curl -I --max-time 5 https://google.com; then
        echo "✓ Direct connectivity confirmed!"
    else
        echo "✗ Direct connectivity failed."
        exit 1
    fi
fi

# 4. Deploy
echo "=== Deploying exo_hooks to Devnet ==="
export PATH="$HOME/.local/share/solana/install/active_release/bin:$HOME/.cargo/bin:$PATH"

# Check Balance
solana balance --url devnet --keypair /mnt/c/Users/nate/.config/solana/id.json

# Deploy
solana program deploy /mnt/e/Work/BS/hac/hackathon/exo-protocol/anchor/target/deploy/exo_hooks.so \
    --url devnet \
    --keypair /mnt/c/Users/nate/.config/solana/id.json \
    --program-id /mnt/e/Work/BS/hac/hackathon/exo-protocol/anchor/target/deploy/exo_hooks-keypair.json

echo "✓ exo_hooks Deployed Successfully!"
