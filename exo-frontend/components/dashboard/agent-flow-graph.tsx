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

import { FlowNode, type FlowNodeData } from './flow-nodes';
import { cn } from '@/lib/utils';

interface AgentFlowGraphProps {
    className?: string;
}

// 自定义节点类型
const nodeTypes = {
    flowNode: FlowNode,
};

// 节点定义: User → Protocol → Executor(85%) / Creator(10%) / Fee(5%)
const nodes: Node<FlowNodeData>[] = [
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
        data: { label: 'Executor', sublabel: 'Agent', percentage: '85%', icon: 'executor' },
    },
    {
        id: 'creator',
        type: 'flowNode',
        position: { x: 400, y: 180 },
        data: { label: 'Creator', percentage: '10%', icon: 'creator' },
    },
    {
        id: 'fee',
        type: 'flowNode',
        position: { x: 400, y: 300 },
        data: { label: 'Protocol Fee', percentage: '5%', icon: 'fee' },
    },
];

// 边定义: 动画虚线
const edges: Edge[] = [
    {
        id: 'user-protocol',
        source: 'user',
        target: 'protocol',
        animated: true,
        style: { stroke: 'var(--color-primary)', strokeWidth: 2 },
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
];

export function AgentFlowGraph({ className }: AgentFlowGraphProps) {
    return (
        <div className={cn('w-full h-full min-h-[400px]', className)}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
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
