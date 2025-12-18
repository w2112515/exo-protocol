# P7-FIX-01: 对齐 Program ID 至 Devnet 部署版本

## Meta
- **Type**: `Critical / Config Sync`
- **Risk Level**: 🔴 High
- **depends_on**: None (首个任务)
- **CSA Dispatch**: 2025-12-18 12:46 UTC+8

## Input Files
- `exo-frontend/lib/log-parser.ts` (L5)
- `scripts/seed-demo-data.ts` (L104, L112, L120, L128, L136, L152, L160)
- `exo-frontend/public/demo-data/logs.json` (7处 programId 字段)
- `docs/HACKATHON_SUBMISSION_GUIDE.md` (L39, L45)

## External Dependencies
| 资源 | 类型 | 状态 |
|------|------|------|
| 无外部依赖 | N/A | ✅ 已确认 |

## Background
审计发现 Program ID 存在不一致：
- **正确 ID** (Devnet 部署): `CdamAXn5fCros3MktPxmbQKXtxd34XHATTLmh9jkn7DT`
- **错误 ID** (旧版本): `AhG24crsnAa1HoF31U2BLtM3uQuhuRCytkbtSK8CpXjZ`

此不一致导致 LogParser 无法识别 Devnet 链上事件，影响 Dashboard TerminalFeed 的实时日志显示。

## Action Steps
1. **修改 log-parser.ts L5**:
   ```typescript
   // 将
   export const EXO_CORE_PROGRAM_ID = "AhG24crsnAa1HoF31U2BLtM3uQuhuRCytkbtSK8CpXjZ";
   // 改为
   export const EXO_CORE_PROGRAM_ID = "CdamAXn5fCros3MktPxmbQKXtxd34XHATTLmh9jkn7DT";
   ```

2. **修改 seed-demo-data.ts 7处 programId**:
   - L104, L112, L120, L128, L136, L152, L160
   - 将所有 `'AhG24crsnAa1HoF31U2BLtM3uQuhuRCytkbtSK8CpXjZ'` 替换为 `'CdamAXn5fCros3MktPxmbQKXtxd34XHATTLmh9jkn7DT'`

3. **重新生成 demo 数据**:
   ```bash
   cd e:/Work/BS/hac/hackathon/exo-protocol
   npx ts-node scripts/seed-demo-data.ts
   ```
   这将自动更新 `exo-frontend/public/demo-data/logs.json`

4. **修改 HACKATHON_SUBMISSION_GUIDE.md**:
   - L39: 更新命令中的 Program ID
   - L45: 更新表格中的 exo_core ID

## Constraints
- **仅替换 exo_core**: `exo_hooks` Program ID (`C1iSwHyPWRR48pxbiztvQ6wt92mB7WfebgpEBdTv78kw`) 保持不变
- **禁止修改合约代码**: 仅修改前端/脚本/文档中的硬编码 ID

## Verification
- **Unit**: 
  ```bash
  grep -r "AhG24crsnAa1HoF31U2BLtM3uQuhuRCytkbtSK8CpXjZ" --include="*.ts" --include="*.json" --include="*.md" exo-frontend scripts docs
  ```
  预期输出: 无结果 (除了可能的注释或历史记录)

- **Integration**: 
  1. 启动前端 `cd exo-frontend && npm run dev`
  2. 打开 Dashboard http://localhost:3000/dashboard
  3. 确认 WebSocket 连接 Devnet 后能识别 exo_core 事件

- **Evidence**: 
  - grep 命令输出为空的截图
  - Dashboard TerminalFeed 显示绿色/青色事件的截图

## Rollback
```bash
git checkout -- exo-frontend/lib/log-parser.ts scripts/seed-demo-data.ts docs/HACKATHON_SUBMISSION_GUIDE.md exo-frontend/public/demo-data/logs.json
```
