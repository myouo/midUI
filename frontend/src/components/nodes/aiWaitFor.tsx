import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { useNodesStore } from '../../store/nodes';
import type { StepNode } from '../../store/nodes';

type Props = NodeProps<StepNode>;

export const AiWaitForNode = memo(({ id, data, selected }: Props) => {
  const updateNode = useNodesStore((state) => state.updateNode);

  const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateNode(id, {
      data: {
        ...data,
        params: {
          ...data.params,
          target: e.target.value,
        },
      },
    });
  };

  const handleTimeoutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeout = e.target.value ? parseInt(e.target.value, 10) : undefined;
    updateNode(id, {
      data: {
        ...data,
        params: {
          ...data.params,
          timeout,
        },
      },
    });
  };

  return (
    <div
      className={`
        bg-white rounded-lg shadow-md p-3 border-2 w-[170px]
        ${selected ? 'border-yellow-500 ring-2 ring-yellow-200' : 'border-slate-200'}
      `}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-yellow-500" />
        <span className="text-sm font-semibold text-slate-700">等待</span>
      </div>
      <input
        type="text"
        value={data.params.target || ''}
        placeholder="等待元素选择器"
        className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:border-yellow-500 mb-2"
        onChange={handleTargetChange}
      />
      <input
        type="text"
        value={data.params.timeout?.toString() || ''}
        placeholder="超时时间(ms)"
        className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:border-yellow-500"
        onChange={handleTimeoutChange}
      />
    </div>
  );
});

AiWaitForNode.displayName = 'AiWaitForNode';
