import { create } from 'zustand';

export interface StepNode {
  id: string;
  type: 'aiTap' | 'aiInput' | 'aiWaitFor' | 'aiAssert' | 'aiNavigate';
  position: { x: number; y: number };
  data: {
    label: string;
    params: {
      target?: string;
      value?: string;
      url?: string;
      selector?: string;
      timeout?: number;
    };
  };
}

interface NodesStore {
  nodes: StepNode[];
  edges: never[];
  addNode: (node: StepNode) => void;
  updateNode: (id: string, updates: Partial<StepNode>) => void;
  deleteNode: (id: string) => void;
  setNodes: (nodes: StepNode[]) => void;
  clearNodes: () => void;
  reorderNodes: (fromIndex: number, toIndex: number) => void;
}

export const useNodesStore = create<NodesStore>((set) => ({
  nodes: [],
  edges: [],

  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),

  updateNode: (id, updates) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, ...updates } : node
      ),
    })),

  deleteNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
    })),

  clearNodes: () => set({ nodes: [], edges: [] }),

  setNodes: (newNodes: StepNode[]) => set({ nodes: newNodes, edges: [] }),

  reorderNodes: (fromIndex, toIndex) =>
    set((state) => {
      const newNodes = [...state.nodes];
      const [removed] = newNodes.splice(fromIndex, 1);
      newNodes.splice(toIndex, 0, removed);
      return { nodes: newNodes };
    }),
}));
