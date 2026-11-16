import { create } from 'zustand';
import type { GraphData, GraphNode, GraphEdge } from '../types/graph.types';
import type cytoscape from 'cytoscape';

interface GraphState {
  graphData: GraphData;
  selectedNode: GraphNode | null;
  selectedEdge: GraphEdge | null;
  highlightedPath: string[];
  highlightedCycle: string[];
  colorByCommunity: boolean;
  activeCommunityId: number | null;
  layoutName: 'cose' | 'concentric' | 'circle' | 'breadthfirst' | 'cola';
  isLoading: boolean;
  cyInstance: cytoscape.Core | null;

  setGraphData: (data: GraphData) => void;
  addNodesAndEdges: (newNodes: GraphNode[], newEdges: GraphEdge[]) => void;
  setSelectedNode: (node: GraphNode | null) => void;
  setSelectedEdge: (edge: GraphEdge | null) => void;
  setHighlightedPath: (nodeIds: string[]) => void;
  setHighlightedCycle: (nodeIds: string[]) => void;
  setColorByCommunity: (enabled: boolean) => void;
  setActiveCommunityId: (id: number | null) => void;
  setLayoutName: (layout: 'cose' | 'concentric' | 'circle' | 'breadthfirst' | 'cola') => void;
  setCyInstance: (cy: cytoscape.Core | null) => void;
  setLoading: (loading: boolean) => void;
  clearSelection: () => void;
  clearHighlights: () => void;
  resetGraph: () => void;
}

export const useGraphStore = create<GraphState>()((set, get) => ({
  graphData: { nodes: [], edges: [] },
  selectedNode: null,
  selectedEdge: null,
  highlightedPath: [],
  highlightedCycle: [],
  colorByCommunity: false,
  activeCommunityId: null,
  layoutName: 'cose',
  isLoading: false,
  cyInstance: null,

  setGraphData: (data) => set({ graphData: data }),

  addNodesAndEdges: (newNodes, newEdges) => {
    const current = get().graphData;
    const existingNodeIds = new Set(current.nodes.map(n => n.id));
    const existingEdgeIds = new Set(current.edges.map(e => e.id));

    const mergedNodes = [...current.nodes];
    for (const node of newNodes) {
      if (!existingNodeIds.has(node.id)) {
        mergedNodes.push(node);
        existingNodeIds.add(node.id);
      }
    }

    const mergedEdges = [...current.edges];
    for (const edge of newEdges) {
      if (!existingEdgeIds.has(edge.id)) {
        mergedEdges.push(edge);
        existingEdgeIds.add(edge.id);
      }
    }

    set({ graphData: { nodes: mergedNodes, edges: mergedEdges } });
  },

  setSelectedNode: (node) => set({ selectedNode: node, selectedEdge: null }),
  setSelectedEdge: (edge) => set({ selectedEdge: edge, selectedNode: null }),
  setHighlightedPath: (path) => set({ highlightedPath: path, highlightedCycle: [] }),
  setHighlightedCycle: (cycle) => set({ highlightedCycle: cycle, highlightedPath: [] }),
  setColorByCommunity: (enabled) => set({ colorByCommunity: enabled }),
  setActiveCommunityId: (id) => set({ activeCommunityId: id }),
  setLayoutName: (layout) => set({ layoutName: layout }),
  setCyInstance: (cy) => set({ cyInstance: cy }),
  setLoading: (loading) => set({ isLoading: loading }),
  clearSelection: () => set({ selectedNode: null, selectedEdge: null }),
  clearHighlights: () => set({ highlightedPath: [], highlightedCycle: [], activeCommunityId: null }),
  resetGraph: () => set({
    selectedNode: null,
    selectedEdge: null,
    highlightedPath: [],
    highlightedCycle: [],
    activeCommunityId: null,
    colorByCommunity: false,
  }),
}));
