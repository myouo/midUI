import { memo } from 'react';
import type { StepNode } from '../store/nodes';

const NODE_CONFIG: Record<StepNode['type'], { color: string; label: string; focusClass: string }> = {
  aiTap: { color: 'bg-blue-500', label: '点击', focusClass: 'focus:border-blue-500' },
  aiInput: { color: 'bg-green-500', label: '输入', focusClass: 'focus:border-green-500' },
  aiWaitFor: { color: 'bg-yellow-500', label: '等待', focusClass: 'focus:border-yellow-500' },
  aiAssert: { color: 'bg-red-500', label: '断言', focusClass: 'focus:border-red-500' },
  aiNavigate: { color: 'bg-purple-500', label: '导航', focusClass: 'focus:border-purple-500' },
};

const PARAM_FIELDS: Record<StepNode['type'], { key: keyof StepNode['data']['params']; placeholder: string }[]> = {
  aiTap: [{ key: 'target', placeholder: '元素选择器或描述' }],
  aiInput: [{ key: 'target', placeholder: '元素选择器' }, { key: 'value', placeholder: '输入值' }],
  aiWaitFor: [{ key: 'target', placeholder: '等待元素选择器' }, { key: 'timeout', placeholder: '超时时间(ms)' }],
  aiAssert: [{ key: 'target', placeholder: '元素选择器' }, { key: 'value', placeholder: '期望值' }],
  aiNavigate: [{ key: 'url', placeholder: 'URL地址' }],
};

interface StepCardProps {
  node: StepNode;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<StepNode>) => void;
  dragHandleProps?: Record<string, unknown>;
}

export const StepCard = memo(({ node, onDelete, onUpdate, dragHandleProps }: StepCardProps) => {
  const config = NODE_CONFIG[node.type];
  const fields = PARAM_FIELDS[node.type];

  const handleParamChange = (key: string, value: string) => {
    const processedValue = key === 'timeout' && value ? parseInt(value, 10) : value;
    onUpdate(node.id, {
      data: { ...node.data, params: { ...node.data.params, [key]: processedValue } }
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md border-2 border-slate-200 w-[170px] flex-shrink-0">
      <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-slate-100 rounded-t-lg flex items-center justify-center border-b border-slate-100">
        <div className="flex gap-0.5">
          <div className="w-1 h-1 rounded-full bg-slate-400" />
          <div className="w-1 h-1 rounded-full bg-slate-400" />
          <div className="w-1 h-1 rounded-full bg-slate-400" />
        </div>
      </div>
      <div className="px-2 pb-2">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-2 h-2 rounded-full ${config.color}`} />
          <span className="text-sm font-semibold text-slate-700">{config.label}</span>
        </div>
        <div className="space-y-1.5">
          {fields.map((field) => (
            <input key={field.key} type="text" value={node.data.params[field.key]?.toString() || ''}
              placeholder={field.placeholder}
              className={`w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none ${config.focusClass}`}
              onChange={(e) => handleParamChange(field.key, e.target.value)}
            />
          ))}
        </div>
        <button onClick={() => onDelete(node.id)} className="mt-2 w-full py-1 text-xs text-slate-500 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
          删除
        </button>
      </div>
    </div>
  );
});

StepCard.displayName = 'StepCard';
