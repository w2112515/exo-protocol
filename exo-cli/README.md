# exo-cli

CLI tool for Exo Protocol - Skill-Native PayFi for Agent Economy

## Installation

```bash
# From project root
cd exo-cli
pnpm install
pnpm build

# Run CLI
npx exo --help
```

## Commands

### Skill Management
```bash
exo skill list              # List all skills
exo skill register -n <name> -p <price>  # Register new skill
exo skill info <address>    # Get skill details
exo skill deprecate <addr>  # Deprecate a skill
```

### Order Management
```bash
exo order create -s <skill> -a <amount>  # Create order
exo order fund <escrow> -a <amount>      # Fund escrow
exo order list              # List your orders
exo order release <escrow> -r <hash>     # Release escrow
exo order cancel <escrow>   # Cancel order
```

### Configuration
```bash
exo config show      # Show current config
exo config networks  # List available networks
```

### Protocol Info
```bash
exo info             # Show protocol info
exo info balance     # Check wallet balance
```

## Options

```bash
-n, --network <network>  Solana network (devnet, mainnet)
-k, --keypair <path>     Path to keypair file
--rpc <url>              Custom RPC endpoint
```

## License

MIT
