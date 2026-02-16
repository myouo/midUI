import { useCallback, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
  type NodeChange,
  Controls,
  Background,
  BackgroundVariant,
  useReactFlow,
} from '@xyflow/react';

import { useNodesStore, type StepNode } from '../store/nodes';
import { useTestCasesStore } from '../store/test-cases';
import { NodeToolbar } from './NodeToolbar';
import { RunTestButton } from './RunTestButton';
import {
  AiTapNode,
  AiInputNode,
  AiWaitForNode,
  AiAssertNode,
  AiNavigateNode,
} from './nodes';

const nodeTypes = {
  aiTap: AiTapNode,
  aiInput: AiInputNode,
  aiWaitFor: AiWaitForNode,
  aiAssert: AiAssertNode,
  aiNavigate: AiNavigateNode,
};

export const FlowCanvas = () => {
  const nodesStore = useNodesStore();
  const { selectedTestCase, updateTestCase } = useTestCasesStore();
  const { nodes, edges } = nodesStore;
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const { screenToFlowPosition } = useReactFlow();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);
  const [baseUrl, setBaseUrl] = useState(selectedTestCase?.baseUrl || '');
  const prevStepsRef = useRef<string>('');

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    const nodeType = event.dataTransfer?.getData('application/reactflow');
    if (!nodeType || !reactFlowInstance) {
      console.warn('Drop failed: invalid node type or reactFlow instance not ready');
      return;
    }

    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    const newNode: StepNode = {
      id: `${nodeType}-${Date.now()}`,
      type: nodeType as StepNode['type'],
      position,
      data: {
        label: nodeType,
        params: {} as StepNode['data']['params'],
      },
    };

    nodesStore.addNode(newNode);
  }, [reactFlowInstance, screenToFlowPosition, nodesStore]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: StepNode) => {
    event.preventDefault();

    const pixelPosition = {
      x: event.clientX,
      y: event.clientY,
    };

    setContextMenu({
      ...pixelPosition,
      nodeId: node.id,
    });
  }, []);

  const onPaneClick = useCallback(() => {
    setContextMenu(null);
  }, []);

  const onCanvasClick = useCallback(() => {
    setContextMenu(null);
  }, []);

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

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      for (const change of changes) {
        if (change.type === 'position' && 'position' in change && change.position) {
          nodesStore.updateNode(change.id, { position: change.position });
        }
      }
    },
    [nodesStore]
  );

  const handleDeleteNode = (nodeId: string) => {
    nodesStore.deleteNode(nodeId);
    setContextMenu(null);
  };

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
        nodesStore.setNodes(testCaseNodes);
        prevStepsRef.current = stepsJson;
      }
    } else {
      nodesStore.clearNodes();
      setBaseUrl('');
      prevStepsRef.current = '';
    }
  }, [selectedTestCase]);

  return (
    <div className="h-full w-full flex flex-col">
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
          {selectedTestCase && (
            <RunTestButton testCaseId={selectedTestCase.id} />
          )}
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-md flex items-center gap-2"
          >
            <span>保存</span>
          </button>
        </div>
      </div>

      <div className="flex-1 relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeContextMenu={onNodeContextMenu}
          onPaneClick={onPaneClick}
          onClick={onCanvasClick}
          nodeTypes={nodeTypes as any}
          defaultEdgeOptions={{ animated: false }}
          fitView
          fitViewOptions={{ padding: 0.2, minZoom: 0.5, maxZoom: 2 }}
          proOptions={{ hideAttribution: true }}
          nodesDraggable={true}
          nodesConnectable={false}
          elementsSelectable={true}
          selectNodesOnDrag={false}
          panOnScroll={true}
          zoomOnScroll={true}
          zoomOnDoubleClick={false}
          selectionOnDrag={false}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          <Controls />
        </ReactFlow>

        {contextMenu && (
          <div
            className="fixed bg-white rounded-lg shadow-lg border border-slate-200 py-1 min-w-[120px] z-50"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              onClick={() => handleDeleteNode(contextMenu.nodeId)}
            >
              删除节点
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
