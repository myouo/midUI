import { useCallback, useEffect, useState, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Play, CheckCircle, XCircle, Loader2 } from 'lucide-react';

import { useNodesStore, type StepNode } from '../store/nodes';
import { useTestCasesStore } from '../store/test-cases';
import { NodeToolbar } from './NodeToolbar';
import { StepCard } from './StepCard';

interface ExecutionStatus {
  status: 'idle' | 'running' | 'passed' | 'failed';
  duration?: number;
  error?: string;
  midsceneReportDir?: string;
  executedSteps?: Array<{
    stepId: string;
    stepType: string;
    status: 'passed' | 'failed';
    duration: number;
    error?: string;
  }>;
}

interface SortableStepCardProps {
  node: StepNode;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<StepNode>) => void;
}

const SortableStepCard = ({ node, onDelete, onUpdate }: SortableStepCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <StepCard
        node={node}
        onDelete={onDelete}
        onUpdate={onUpdate}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
};

export const StepsList = () => {
  const nodesStore = useNodesStore();
  const { selectedTestCase, updateTestCase } = useTestCasesStore();
  const { nodes, updateNode, deleteNode, setNodes, reorderNodes } = nodesStore;
  const [baseUrl, setBaseUrl] = useState(selectedTestCase?.baseUrl || '');
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus>({ status: 'idle' });
  const prevStepsRef = useRef<string>('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 当选中的测试用例变化时，加载该用例的steps到nodes store
  useEffect(() => {
    if (selectedTestCase) {
      const stepsJson = JSON.stringify(selectedTestCase.steps);

      if (stepsJson !== prevStepsRef.current) {
        setBaseUrl(selectedTestCase.baseUrl || '');
        const testCaseNodes: StepNode[] = selectedTestCase.steps.map((step) => ({
          id: step.id,
          type: step.type as StepNode['type'],
          position: step.position,
          data: {
            label: step.type,
            params: step.params as StepNode['data']['params'],
          },
        }));
        setNodes(testCaseNodes);
        prevStepsRef.current = stepsJson;
      }
    } else {
      setNodes([]);
      setBaseUrl('');
      prevStepsRef.current = '';
    }
  }, [selectedTestCase, setNodes]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = nodes.findIndex((node) => node.id === active.id);
      const newIndex = nodes.findIndex((node) => node.id === over.id);
      reorderNodes(oldIndex, newIndex);
    }
  }, [nodes, reorderNodes]);

  const validateNodes = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    nodes.forEach((node, index) => {
      const nodeLabel = `${node.type}节点${index + 1}`;

      switch (node.type) {
        case 'aiTap':
          if (!node.data.params.target) {
            errors.push(`${nodeLabel}缺少target参数`);
          }
          break;

        case 'aiInput':
          if (!node.data.params.target) {
            errors.push(`${nodeLabel}缺少target参数`);
          }
          if (!node.data.params.value) {
            errors.push(`${nodeLabel}缺少value参数`);
          }
          break;

        case 'aiWaitFor':
          if (!node.data.params.target) {
            errors.push(`${nodeLabel}缺少target参数`);
          }
          break;

        case 'aiAssert':
          if (!node.data.params.target) {
            errors.push(`${nodeLabel}缺少target参数`);
          }
          if (!node.data.params.value) {
            errors.push(`${nodeLabel}缺少value参数`);
          }
          break;

        case 'aiNavigate':
          if (!node.data.params.url) {
            errors.push(`${nodeLabel}缺少url参数`);
          }
          break;
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  };

  const handleSave = async () => {
    if (!selectedTestCase) {
      alert('请先选择一个测试用例');
      return;
    }

    if (!baseUrl.trim()) {
      alert('请输入baseUrl');
      return;
    }

    const { valid, errors } = validateNodes();

    if (!valid) {
      alert('参数验证失败：\n' + errors.join('\n'));
      return;
    }

    try {
      await updateTestCase(selectedTestCase.id, {
        baseUrl: baseUrl.trim(),
        steps: nodes.map((node) => ({
          id: node.id,
          type: node.type,
          params: node.data.params,
          position: node.position,
        })),
      });
      alert('保存成功');
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请查看控制台');
    }
  };

  const handleDelete = useCallback((id: string) => {
    deleteNode(id);
  }, [deleteNode]);

  const handleUpdate = useCallback((id: string, updates: Partial<StepNode>) => {
    updateNode(id, updates);
  }, [updateNode]);

  const handleRunTest = async () => {
    if (!selectedTestCase) return;
    
    setExecutionStatus({ status: 'running' });

    try {
      const response = await fetch(`http://localhost:3001/api/test-cases/${selectedTestCase.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      setExecutionStatus({
        status: result.status === 'passed' ? 'passed' : 'failed',
        duration: result.duration,
        error: result.error,
        midsceneReportDir: result.midsceneReportDir,
        executedSteps: result.executedSteps,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      console.error('执行测试失败:', error);
      setExecutionStatus({ status: 'failed', error: errorMessage });
    }
  };

  return (
    <div className="h-full w-full flex">
      {/* 左侧：步骤编辑区域 */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200">
        <div className="flex-none">
          <NodeToolbar />
          <div className="flex items-center gap-4 px-4 py-3 bg-white/50 border-b border-white/20 backdrop-blur-sm flex-wrap">
            <div className="flex-[2] min-w-[300px]">
              <label className="text-sm font-medium text-slate-700 mb-1 block">Base URL</label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleRunTest}
              disabled={executionStatus.status === 'running'}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-medium rounded-lg shadow-md flex items-center gap-2"
            >
              {executionStatus.status === 'running' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>执行中...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>运行测试</span>
                </>
              )}
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-md flex items-center gap-2"
            >
              <span>保存</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {nodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <div className="text-lg mb-2">暂无步骤</div>
              <div className="text-sm">点击上方按钮添加步骤</div>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={nodes.map((node) => node.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-wrap gap-3 items-start">
                  {nodes.map((node) => (
                    <SortableStepCard
                      key={node.id}
                      node={node}
                      onDelete={handleDelete}
                      onUpdate={handleUpdate}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* 右侧：执行结果区域 */}
      <div className="w-[400px] flex-shrink-0 bg-white overflow-y-auto">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-700">执行结果</h3>
        </div>
        <div className="p-4">
          {executionStatus.status === 'idle' ? (
            <div className="text-center text-slate-400 py-8">
              <Play className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>点击"运行测试"开始执行</p>
            </div>
          ) : executionStatus.status === 'running' ? (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 mx-auto mb-3 text-indigo-600 animate-spin" />
              <p className="text-slate-600">正在执行测试...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 执行状态 */}
              <div className={`flex items-center gap-3 p-4 rounded-lg ${
                executionStatus.status === 'passed' 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                {executionStatus.status === 'passed' ? (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-600" />
                )}
                <div>
                  <div className={`font-semibold ${
                    executionStatus.status === 'passed' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {executionStatus.status === 'passed' ? '测试通过' : '测试失败'}
                  </div>
                  {executionStatus.duration && (
                    <div className="text-sm text-slate-600">
                      耗时: {(executionStatus.duration / 1000).toFixed(2)} 秒
                    </div>
                  )}
                </div>
              </div>

              {/* 错误信息 */}
              {executionStatus.error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="font-medium text-red-700 mb-1">错误信息</div>
                  <div className="text-sm text-red-600 break-words">{executionStatus.error}</div>
                </div>
              )}

              {/* 步骤执行详情 */}
              {executionStatus.executedSteps && executionStatus.executedSteps.length > 0 && (
                <div>
                  <div className="font-medium text-slate-700 mb-2">步骤详情</div>
                  <div className="space-y-2">
                    {executionStatus.executedSteps.map((step, index) => (
                      <div 
                        key={step.stepId} 
                        className={`p-3 rounded-lg border ${
                          step.status === 'passed'
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {step.status === 'passed' ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                            <span className="font-medium text-slate-700">
                              步骤 {index + 1}: {step.stepType}
                            </span>
                          </div>
                          <span className="text-sm text-slate-500">
                            {(step.duration / 1000).toFixed(2)}s
                          </span>
                        </div>
                        {step.error && (
                          <div className="mt-2 text-sm text-red-600">{step.error}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 查看报告链接 */}
              {executionStatus.midsceneReportDir && (
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('http://localhost:3001/api/midscene/latest-report');
                      const data = await res.json();
                      if (data.reportUrl) {
                        window.open(`http://localhost:3001${data.reportUrl}`, '_blank');
                      }
                    } catch (e) {
                      console.error('获取报告失败:', e);
                    }
                  }}
                  className="block text-center py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                >
                  查看报告
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StepsList;
