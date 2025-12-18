#!/bin/bash

# Set up environment
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
source $HOME/.cargo/env

cd /mnt/e/Work/BS/hac/hackathon/exo-protocol/anchor

echo "=== Current Directory ==="
pwd

echo -e "\n=== Building Contracts ==="
anchor build

if [ $? -eq 0 ]; then
    echo -e "\n✓ Build successful!"
    echo -e "\n=== Deploying to Devnet ==="
    anchor deploy --provider.cluster devnet
    
    if [ $? -eq 0 ]; then
        echo -e "\n✓ Deployment successful!"
        echo -e "\n=== Verifying deployment ==="
        solana program show CdamAXn5fCros3MktPxmbQKXtxd34XHATTLmh9jkn7DT --url devnet
    else
        echo -e "\n✗ Deployment failed"
        exit 1
    fi
else
    echo -e "\n✗ Build failed"
    exit 1
fi
