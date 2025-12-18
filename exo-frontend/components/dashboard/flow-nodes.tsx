// P3B-03: 自定义 Flow 节点样式
// 设计规范: P3-FRONTEND-DESIGN.md Section 6.1 Agent Flow
'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { cn } from '@/lib/utils';
import { User, Server, Bot, Palette, Percent } from 'lucide-react';

interface FlowNodeData {
    label: string;
    sublabel?: string;
    icon: 'user' | 'protocol' | 'executor' | 'creator' | 'fee';
    percentage?: string;
}

// 图标映射
const iconMap = {
    user: User,
    protocol: Server,
    executor: Bot,
    creator: Palette,
    fee: Percent,
} as const;

// 节点颜色
const iconColors = {
    user: 'text-cyan-400',
    protocol: 'text-primary',
    executor: 'text-success',
    creator: 'text-purple-400',
    fee: 'text-yellow-400',
} as const;

function FlowNodeComponent({ data }: NodeProps<FlowNodeData>) {
    const Icon = iconMap[data.icon];

    return (
        <div
            className={cn(
                'glass-card rounded-lg p-4 min-w-[120px]',
                'border border-border/50 bg-background/80 backdrop-blur-sm',
                'transition-all duration-300',
                'hover:border-primary/50 hover:shadow-[0_0_20px_rgba(20,241,149,0.1)]'
            )}
        >
            {/* 输入连接点 */}
            <Handle
                type="target"
                position={Position.Left}
                className="!bg-primary !border-primary/50 !w-2 !h-2"
            />

            {/* 节点内容 */}
            <div className="flex flex-col items-center gap-2">
                <div className={cn('p-2 rounded-full bg-white/5', iconColors[data.icon])}>
                    <Icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-mono font-medium text-foreground">
                    {data.label}
                </span>
                {data.sublabel && (
                    <span className="text-xs text-muted-foreground font-mono">
                        {data.sublabel}
                    </span>
                )}
                {data.percentage && (
                    <span className="text-xs text-success font-mono font-bold">
                        {data.percentage}
                    </span>
                )}
            </div>

            {/* 输出连接点 */}
            <Handle
                type="source"
                position={Position.Right}
                className="!bg-primary !border-primary/50 !w-2 !h-2"
            />
        </div>
    );
}

export const FlowNode = memo(FlowNodeComponent);
export type { FlowNodeData };
