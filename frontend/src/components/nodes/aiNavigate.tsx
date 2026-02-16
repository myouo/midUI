import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { useNodesStore } from '../../store/nodes';
import type { StepNode } from '../../store/nodes';

type Props = NodeProps<StepNode>;

export const AiNavigateNode = memo(({ id, data, selected }: Props) => {
  const updateNode = useNodesStore((state) => state.updateNode);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateNode(id, {
      data: {
        ...data,
        params: {
          ...data.params,
          url: e.target.value,
        },
      },
    });
  };

  return (
    <div
      className={`
        bg-white rounded-lg shadow-md p-3 border-2 w-[170px]
        ${selected ? 'border-purple-500 ring-2 ring-purple-200' : 'border-slate-200'}
      `}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-purple-500" />
        <span className="text-sm font-semibold text-slate-700">导航</span>
      </div>
      <input
        type="text"
        value={data.params.url || ''}
        placeholder="URL地址"
        className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:border-purple-500"
        onChange={handleUrlChange}
      />
    </div>
  );
});

AiNavigateNode.displayName = 'AiNavigateNode';
