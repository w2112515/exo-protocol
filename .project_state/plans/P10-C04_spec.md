# P10-C04: 更新 SkillBlinkCard 组件显示增强字段

## Meta
- **Type**: `Critical / UI`
- **Risk Level**: 🔴 High (核心展示组件)
- **depends_on**: P10-C03

## Input Files
- `exo-frontend/components/blinks/skill-blink-card.tsx` (88 行)
- `exo-frontend/app/skills/page.tsx` (136 行)

## External Dependencies
| 资源 | 类型 | 状态 |
|------|------|------|
| 无外部依赖 | - | ✓ |

## Action Steps

### Step 1: 辅助函数与配置 (直接在组件文件顶部定义)

为了保持组件自包含，请直接在 `skill-blink-card.tsx` 的 imports 下方定义以下内容。

**需要导入的图标**:
```typescript
import { 
  Terminal, MessageSquareText, BarChart3, Eye, Database, Briefcase, BrainCircuit, // Categories
  User, CheckCircle2, TrendingUp, Zap, Rocket // UI Elements
} from "lucide-react";
```

**辅助代码**:
```typescript
// 1. 价格格式化
function formatPrice(lamports: number): string {
  const sol = lamports / 1_000_000_000;
  if (sol < 0.0001) {
    return `${lamports} Lamports`;
  }
  return `${sol.toFixed(6).replace(/\.?0+$/, "")} SOL`;
}

// 2. 类别图标映射
const CATEGORY_ICONS: Record<string, any> = {
  "dev-tools": Terminal,
  "nlp": MessageSquareText,
  "analytics": BarChart3,
  "vision": Eye,
  "data": Database,
  "business": Briefcase,
  "default": BrainCircuit
};
```

### Step 2: 重构 SkillBlinkCard 组件 UI

**布局策略**: Grid 布局，严格控制间距。

```tsx
export function SkillBlinkCard({ skill }: { skill: Skill }) {
  const [copied, setCopied] = useState(false);
  const IconComponent = CATEGORY_ICONS[skill.category] || CATEGORY_ICONS.default;

  const handleCopy = async () => {
    // ... copy logic
  };

  return (
    <GlassCard className="flex flex-col relative overflow-hidden group border-white/5 bg-black/40 backdrop-blur-md h-full">
      
      {/* Header: Title & Identity */}
      <div className="p-4 pb-2 flex items-start gap-4">
        {/* Dynamic Icon */}
        <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 flex-shrink-0">
          <IconComponent className="w-6 h-6 text-white/70" />
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Title - Large & Truncated */}
          <h3 className="font-bold text-lg text-white font-mono tracking-tight truncate" title={skill.name}>
            {skill.name}
          </h3>
          {/* Meta Row */}
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center justify-center rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] text-white/40 font-mono">
              v{skill.version}
            </span>
            <span className="text-xs text-white/40 capitalize">{skill.category}</span>
          </div>
        </div>
      </div>
    
      {/* Description */}
      <div className="px-4 pb-3 min-h-[3rem]">
        <p className="text-white/50 text-xs line-clamp-2 leading-relaxed">
          {skill.description}
        </p>
      </div>
    
      {/* Creator & Price Row (Separated) */}
      <div className="px-4 py-2 bg-white/2 border-y border-white/5 flex items-center justify-between">
        <a href={getSolscanUrl(skill.creator_address)} target="_blank" className="flex items-center gap-1.5 group/creator">
          <div className="h-5 w-5 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
            <User className="w-3 h-3 text-white/60" />
          </div>
          <span className="font-mono text-[10px] text-white/40 group-hover/creator:text-white/70 transition-colors">
            {truncateAddress(skill.creator_address)}
          </span>
          {skill.on_chain_verified && (
            <CheckCircle2 className="w-3 h-3 text-green-500/50" />
          )}
        </a>
        
        <div className="text-right">
          <div className="font-mono text-sm font-bold text-green-400">
            {formatPrice(skill.price_lamports)}
          </div>
        </div>
      </div>
    
      {/* Stats Grid (Visualized) */}
      <div className="px-4 py-3 grid grid-cols-2 gap-3">
        {/* Success Rate */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] uppercase text-white/30 font-medium">
            <span>Success Rate</span>
            <span>{(skill.success_rate * 100).toFixed(1)}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${skill.success_rate > 0.9 ? 'bg-green-500/50' : 'bg-yellow-500/50'}`} 
              style={{ width: `${skill.success_rate * 100}%` }}
            />
          </div>
        </div>
    
        {/* Executions */}
        <div className="space-y-1">
          <span className="text-[10px] uppercase text-white/30 font-medium block">Executions</span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-sm text-white/80">{skill.execution_count.toLocaleString()}</span>
            <TrendingUp className="w-3 h-3 text-white/20" />
          </div>
        </div>

        {/* Avg Latency */}
        <div className="space-y-1">
          <span className="text-[10px] uppercase text-white/30 font-medium block">Avg Latency</span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-sm text-white/80">{skill.avg_latency_ms}ms</span>
          </div>
        </div>

        {/* Royalties Earned */}
        <div className="space-y-1">
          <span className="text-[10px] uppercase text-white/30 font-medium block">Royalties</span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-sm text-green-400/80">
              {(skill.total_royalties_earned / 1e9).toFixed(3)} SOL
            </span>
          </div>
        </div>
      </div>
    
      {/* Footer: Tags & Actions */}

  <div className="mt-auto p-4 pt-0 space-y-4">
    {/* Tags */}
    <div className="flex flex-wrap gap-1.5">
      {skill.tags?.slice(0, 3).map(tag => (
        <span key={tag} className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-white/40 border border-white/5">
          #{tag}
        </span>
      ))}
    </div>

    {/* Actions: Dual Button */}
    <div className="grid grid-cols-2 gap-3">
       <button
           onClick={handleCopy}
           className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs font-bold text-yellow-400 hover:bg-yellow-500/20 transition-all"
       >
           {copied ? (
               <>
                   <CheckCircle2 className="w-3.5 h-3.5" />
                   <span>Copied</span>
               </>
           ) : (
               <>
                   <Zap className="w-3.5 h-3.5" />
                   <span>Copy Blink</span>
               </>
           )}
       </button>
       
       <a
           href={`https://dial.to/?action=solana-action:${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}/api/actions/skill/${skill.skill_id}` : '')}&cluster=devnet`}
           target="_blank"
           rel="noopener noreferrer"
           className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-white/50 hover:bg-white/10 hover:text-white transition-all"
       >
           <Rocket className="w-3.5 h-3.5" />
           <span>Try Now</span>
       </a>
    </div>
  </div>

</GlassCard>
```

### Step 3: 样式细节调整
- **Grid Layout**: `h-full` 确保卡片等高。
- **Price**: 独立行，靠右对齐，不再与标题争抢空间。
- **Typography**: Title `text-lg` (18px)，Price `text-sm` (14px) 但颜色醒目。
- **Visuals**: 进度条增加可读性，Trend icon 增加动态感。
- **Icons**: 引入 `Rocket`, `Zap`, `CheckCircle2` 等图标。

### Step 4: 辅助函数 (API Integration)
(保持不变)


```typescript
// 截断地址
function truncateAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

// Solscan 链接
function getSolscanUrl(address: string): string {
  return `https://solscan.io/account/${address}?cluster=devnet`;
}
```

### Step 5: 页面级优化 (app/skills/page.tsx)

**Filter Bar 样式增强**:
- 未选中状态: `text-white/50` -> `text-white/70 font-medium` (提高亮度)
- Hover 状态: `hover:bg-white/10 hover:text-white`
- 选中状态: 保持 `bg-purple-500/20 text-purple-300` 但增加 `font-bold`

```tsx
// 优化后的 className 逻辑
className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all ${
    selectedCategory === cat.id
        ? "bg-purple-500/20 border border-purple-500/30 text-purple-300 font-bold shadow-[0_0_10px_rgba(168,85,247,0.2)]"
        : "bg-white/5 border border-white/10 text-white/70 font-medium hover:bg-white/10 hover:text-white hover:border-white/20"
}`}
```

## Constraints
- 不破坏现有功能 (Copy Blink URL 必须正常工作)
- 响应式设计：移动端隐藏部分指标
- 性能：避免不必要的 re-render

## Verification
- **Unit**: `npx tsc --noEmit --skipLibCheck`
- **Integration**: 
  - 访问 `/skills` 页面
  - 验证所有卡片显示新字段
  - 点击创作者地址跳转 Solscan
  - Copy Blink URL 功能正常
- **Evidence**: 截图对比修改前后

## Rollback
- `git checkout -- exo-frontend/components/blinks/skill-blink-card.tsx`
