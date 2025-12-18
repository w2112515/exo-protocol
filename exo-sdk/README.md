# @exo/sdk

TypeScript SDK for Exo Protocol - Skill-Native PayFi for Agent Economy on Solana.

## Installation

```bash
npm install @exo/sdk
# or
pnpm add @exo/sdk
```

## Quick Start

```typescript
import { ExoClient } from '@exo/sdk';
import { Connection } from '@solana/web3.js';

// 创建客户端
const client = new ExoClient({
    connection: new Connection('https://api.devnet.solana.com'),
    wallet: walletAdapter, // 兼容 @solana/wallet-adapter
});

// 使用 skill 命名空间注册 Skill
const nameHash = client.pda.hash('my-awesome-skill');
const contentHash = client.pda.hash('skill-content-v1');
const { publicKey: skillPda } = client.skill.derivePdaFromName('my-awesome-skill');

const registerIx = client.skill.register(nameHash, contentHash, 100_000_000); // 0.1 SOL
const result = await client.sendAndConfirm([registerIx]);
console.log('Skill registered:', result.signature);

// 使用 agent 命名空间创建 Identity
const createIx = client.agent.create();
await client.sendAndConfirm([createIx]);
console.log('Agent PDA:', client.agent.agentPda.toBase58());

// 使用 escrow 命名空间创建托管
const nonce = BigInt(Date.now());
const escrowIx = client.escrow.create(skillPda, 100_000_000, nonce);
await client.sendAndConfirm([escrowIx]);

const { publicKey: escrowPda } = client.escrow.derivePda(skillPda, nonce);
console.log('Escrow PDA:', escrowPda.toBase58());
```

## Namespaces

### `client.skill`

- `derivePda(nameHash)` - 推导 Skill PDA
- `derivePdaFromName(name)` - 从名称推导 Skill PDA
- `register(nameHash, contentHash, price)` - 注册 Skill 指令
- `update(skillAccount, contentHash, price)` - 更新 Skill 指令
- `deprecate(skillAccount)` - 下架 Skill 指令
- `registerAndSend(...)` - 注册并发送交易

### `client.agent`

- `derivePda(owner?)` - 推导 Agent PDA
- `agentPda` - 当前用户的 Agent PDA (缓存)
- `create(metadata?)` - 创建 Identity 指令
- `update(metadata, agentAccount?)` - 更新 Profile 指令
- `close(agentAccount?)` - 关闭 Identity 指令
- `createAndSend(...)` - 创建并发送交易

### `client.escrow`

- `derivePda(skillPda, nonce)` - 推导 Escrow PDA
- `forSkill(skillPda)` - 获取特定 Skill 的 Builder
- `create(skillPda, amount, nonce, expiresAt?)` - 创建 Escrow 指令
- `fund(escrowAccount, amount)` - 注资 Escrow 指令
- `release(escrowAccount, skillPda, resultHash, skillAuthority, executor?)` - 释放指令
- `cancel(escrowAccount)` - 取消 Escrow 指令

### `client.pda`

- `skill(authority, nameHash)` - 推导 Skill PDA
- `skillFromName(authority, name)` - 从名称推导 Skill PDA
- `agent(owner)` - 推导 Agent PDA
- `escrow(buyer, skillPda, nonce)` - 推导 Escrow PDA
- `config()` - 推导 Protocol Config PDA
- `hash(input)` - 哈希字符串 (Browser 兼容)

## Transaction Helpers

```typescript
// 发送并确认交易
const result = await client.sendAndConfirm([ix1, ix2], additionalSigners, options);

// 模拟交易
const sim = await client.simulate([ix1, ix2]);
console.log('Logs:', sim.logs);
console.log('CU:', sim.unitsConsumed);

// 使用不同钱包
const otherClient = client.withWallet(newWallet);
```

## License

MIT
