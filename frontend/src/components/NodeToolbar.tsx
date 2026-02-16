import { memo, useCallback } from 'react';
import { useNodesStore } from '../store/nodes';
import type { StepNode } from '../store/nodes';

export interface NodeTypeConfig {
  type: 'aiTap' | 'aiInput' | 'aiWaitFor' | 'aiAssert' | 'aiNavigate';
  label: string;
  color: string;
}

const NODE_TYPES: NodeTypeConfig[] = [
  { type: 'aiTap', label: '点击', color: 'bg-blue-500' },
  { type: 'aiInput', label: '输入', color: 'bg-green-500' },
  { type: 'aiWaitFor', label: '等待', color: 'bg-yellow-500' },
  { type: 'aiAssert', label: '断言', color: 'bg-red-500' },
  { type: 'aiNavigate', label: '导航', color: 'bg-purple-500' },
];

export const NodeToolbar = memo(() => {
  const addNode = useNodesStore((state) => state.addNode);

  const handleClick = useCallback(
    (nodeType: NodeTypeConfig['type']) => {
      const newNode: StepNode = {
        id: `${nodeType}-${Date.now()}`,
        type: nodeType,
        position: { x: 250, y: 100 },
        data: {
          label: nodeType,
          params: {},
        },
      };
      addNode(newNode);
    },
    [addNode]
  );

  return (
    <div className="flex gap-2 p-4 bg-white border border-slate-200 rounded-xl">
      {NODE_TYPES.map((nodeType) => (
        <div
          key={nodeType.type}
          onClick={() => handleClick(nodeType.type)}
          className="group flex items-center gap-2 px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 hover:bg-white cursor-pointer hover:shadow-md active:scale-95"
        >
          <div className={`w-3 h-3 rounded-full ${nodeType.color}`} />
          <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
            {nodeType.label}
          </span>
        </div>
      ))}
    </div>
  );
});

NodeToolbar.displayName = 'NodeToolbar';
