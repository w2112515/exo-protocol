// P3B-03: AgentFlowGraph 节点图组件
// 设计规范: P3-FRONTEND-DESIGN.md Section 6.1 Agent Flow
// 约束: 禁用 zoom/pan/drag, 仅 fitView
'use client';

import ReactFlow, {
    Background,
    type Node,
    type Edge,
    ConnectionMode,
    MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useMemo } from 'react';

import { FlowNode, type FlowNodeData } from './flow-nodes';
import { cn } from '@/lib/utils';
import { calculateFlowAmounts } from '@/lib/api';
import type { Skill } from '@/lib/mock-data';

interface AgentFlowGraphProps {
    className?: string;
    skills?: Skill[];
}

// 自定义节点类型
const nodeTypes = {
    flowNode: FlowNode,
};

export function AgentFlowGraph({ className, skills = [] }: AgentFlowGraphProps) {
    const amounts = calculateFlowAmounts(skills);

    // 动态节点: sublabel 显示累计金额
    const dynamicNodes: Node<FlowNodeData>[] = useMemo(() => [
        {
            id: 'user',
            type: 'flowNode',
            position: { x: 0, y: 150 },
            data: { label: 'User', icon: 'user' },
        },
        {
            id: 'protocol',
            type: 'flowNode',
            position: { x: 200, y: 150 },
            data: { label: 'Protocol', sublabel: 'Escrow', icon: 'protocol' },
        },
        {
            id: 'executor',
            type: 'flowNode',
            position: { x: 400, y: 50 },
            data: { 
                label: 'Executor', 
                sublabel: `${amounts.executor} SOL`,
                percentage: '85%', 
                icon: 'executor' 
            },
        },
        {
            id: 'creator',
            type: 'flowNode',
            position: { x: 400, y: 180 },
            data: { 
                label: 'Creator', 
                sublabel: `${amounts.creator} SOL`,
                percentage: '10%', 
                icon: 'creator' 
            },
        },
        {
            id: 'fee',
            type: 'flowNode',
            position: { x: 400, y: 300 },
            data: { 
                label: 'Protocol Fee', 
                sublabel: `${amounts.fee} SOL`,
                percentage: '5%', 
                icon: 'fee' 
            },
        },
    ], [amounts]);

    // 动态边定义: 增强动画效果
    const dynamicEdges: Edge[] = useMemo(() => [
        {
            id: 'user-protocol',
            source: 'user',
            target: 'protocol',
            animated: true,
            style: { 
                stroke: 'var(--color-primary)', 
                strokeWidth: 2,
                strokeDasharray: '5,5',
            },
            markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--color-primary)' },
        },
        {
            id: 'protocol-executor',
            source: 'protocol',
            target: 'executor',
            animated: true,
            style: { stroke: 'var(--color-success)', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--color-success)' },
        },
        {
            id: 'protocol-creator',
            source: 'protocol',
            target: 'creator',
            animated: true,
            style: { stroke: '#a855f7', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#a855f7' },
        },
        {
            id: 'protocol-fee',
            source: 'protocol',
            target: 'fee',
            animated: true,
            style: { stroke: '#eab308', strokeWidth: 1.5 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#eab308' },
        },
    ], []);

    return (
        <div className={cn('w-full h-full min-h-[400px]', className)}>
            <ReactFlow
                nodes={dynamicNodes}
                edges={dynamicEdges}
                nodeTypes={nodeTypes}
                connectionMode={ConnectionMode.Loose}
                fitView
                fitViewOptions={{ padding: 0.3 }}
                // 禁用所有交互 (设计要求)
                zoomOnScroll={false}
                zoomOnPinch={false}
                panOnScroll={false}
                panOnDrag={false}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                // 背景
                proOptions={{ hideAttribution: true }}
            >
                <Background
                    color="rgba(255,255,255,0.03)"
                    gap={24}
                    size={1}
                />
            </ReactFlow>
        </div>
    );
}
