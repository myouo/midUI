import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { useNodesStore } from '../../store/nodes';
import type { StepNode } from '../../store/nodes';

type Props = NodeProps<StepNode>;

export const AiAssertNode = memo(({ id, data, selected }: Props) => {
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

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateNode(id, {
      data: {
        ...data,
        params: {
          ...data.params,
          value: e.target.value,
        },
      },
    });
  };

  return (
    <div
      className={`
        bg-white rounded-lg shadow-md p-3 border-2 w-[170px]
        ${selected ? 'border-red-500 ring-2 ring-red-200' : 'border-slate-200'}
      `}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <span className="text-sm font-semibold text-slate-700">断言</span>
      </div>
      <input
        type="text"
        value={data.params.target || ''}
        placeholder="元素选择器"
        className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:border-red-500 mb-2"
        onChange={handleTargetChange}
      />
      <input
        type="text"
        value={data.params.value || ''}
        placeholder="期望值"
        className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:border-red-500"
        onChange={handleValueChange}
      />
    </div>
  );
});

AiAssertNode.displayName = 'AiAssertNode';
