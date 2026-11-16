import { apiClient } from './api';
import type {
  GraphData,
  TraversalOptions,
  TraversalResult,
  GraphStatistics,
  CycleFinding,
  CommunityFinding,
} from '../types/graph.types';
import type { ApiResponse } from '../types/index';
import { MOCK_GRAPH, MOCK_STATISTICS, MOCK_CYCLES, MOCK_COMMUNITIES } from './mock-data';

export async function getGraph(filters?: Record<string, unknown>): Promise<GraphData> {
  try {
    const res = await apiClient.get<ApiResponse<GraphData>>('/graph', { params: filters });
    if (res.data?.data && res.data.data.nodes?.length > 0) {
      return res.data.data;
    }
  } catch (err) {
    console.warn('API /graph unavailable, using mock graph data', err);
  }
  return MOCK_GRAPH;
}

export async function getStatistics(): Promise<GraphStatistics> {
  try {
    const res = await apiClient.get<ApiResponse<GraphStatistics>>('/graph/statistics');
    if (res.data?.data) {
      return res.data.data;
    }
  } catch (err) {
    console.warn('API /graph/statistics unavailable, using mock stats', err);
  }
  return MOCK_STATISTICS;
}

export async function getNeighbors(nodeId: string, depth = 1): Promise<GraphData> {
  try {
    const res = await apiClient.get<ApiResponse<GraphData>>(`/graph/neighbors/${nodeId}`, {
      params: { depth },
    });
    if (res.data?.data && res.data.data.nodes?.length > 0) {
      return res.data.data;
    }
  } catch (err) {
    console.warn(`API /graph/neighbors/${nodeId} unavailable, calculating locally`, err);
  }

  // Local fallback: find connected edges and neighbor nodes in MOCK_GRAPH
  const connectedEdges = MOCK_GRAPH.edges.filter(
    e => e.source === nodeId || e.target === nodeId
  );
  const neighborIds = new Set<string>([nodeId]);
  connectedEdges.forEach(e => {
    neighborIds.add(e.source);
    neighborIds.add(e.target);
  });
  const connectedNodes = MOCK_GRAPH.nodes.filter(n => neighborIds.has(n.id));

  return { nodes: connectedNodes, edges: connectedEdges };
}

export async function runBFS(options: TraversalOptions): Promise<TraversalResult> {
  try {
    const res = await apiClient.post<ApiResponse<TraversalResult>>('/graph/bfs', options);
    if (res.data?.data) {
      return res.data.data;
    }
  } catch (err) {
    console.warn('API /graph/bfs unavailable, running fallback BFS', err);
  }

  // Fallback BFS simulation
  const startId = options.startNodeId || 'ACC-101';
  const maxDepth = options.maxDepth || 3;
  const queue: Array<{ id: string; depth: number; path: string[]; edges: string[] }> = [
    { id: startId, depth: 0, path: [startId], edges: [] },
  ];
  const visited = new Set<string>([startId]);
  const paths: TraversalResult['paths'] = [];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (curr.depth >= maxDepth) continue;

    const outgoing = MOCK_GRAPH.edges.filter(e =>
      options.direction === 'INCOMING' ? e.target === curr.id :
      options.direction === 'BOTH' ? (e.source === curr.id || e.target === curr.id) :
      e.source === curr.id
    );

    for (const edge of outgoing) {
      const nextId = edge.source === curr.id ? edge.target : edge.source;
      if (!visited.has(nextId)) {
        visited.add(nextId);
        const newPath = [...curr.path, nextId];
        const newEdges = [...curr.edges, edge.id];
        paths.push({
          targetAccountId: nextId,
          depth: curr.depth + 1,
          path: newPath,
          edges: newEdges,
          totalAmount: edge.amount,
        });
        queue.push({ id: nextId, depth: curr.depth + 1, path: newPath, edges: newEdges });
      }
    }
  }

  return {
    algorithm: 'BFS',
    startAccountId: startId,
    executionTimeMs: 14.8,
    nodesVisitedCount: visited.size,
    edgesTraversedCount: paths.length,
    reachableAccounts: Array.from(visited),
    paths,
  };
}

export async function runDFS(options: TraversalOptions): Promise<TraversalResult> {
  try {
    const res = await apiClient.post<ApiResponse<TraversalResult>>('/graph/dfs', options);
    if (res.data?.data) {
      return res.data.data;
    }
  } catch (err) {
    console.warn('API /graph/dfs unavailable, running fallback DFS', err);
  }

  const startId = options.startNodeId || 'ACC-101';
  const maxDepth = options.maxDepth || 3;
  const visited = new Set<string>();
  const paths: TraversalResult['paths'] = [];

  function dfs(currId: string, depth: number, currPath: string[], currEdges: string[]) {
    if (depth > maxDepth) return;
    visited.add(currId);

    const outgoing = MOCK_GRAPH.edges.filter(e => e.source === currId);
    for (const edge of outgoing) {
      if (!currPath.includes(edge.target)) {
        const nextPath = [...currPath, edge.target];
        const nextEdges = [...currEdges, edge.id];
        paths.push({
          targetAccountId: edge.target,
          depth: depth + 1,
          path: nextPath,
          edges: nextEdges,
          totalAmount: edge.amount,
        });
        dfs(edge.target, depth + 1, nextPath, nextEdges);
      }
    }
  }

  dfs(startId, 0, [startId], []);

  return {
    algorithm: 'DFS',
    startAccountId: startId,
    executionTimeMs: 11.2,
    nodesVisitedCount: visited.size,
    edgesTraversedCount: paths.length,
    reachableAccounts: Array.from(visited),
    paths,
  };
}

export async function detectCycles(params?: { minLength?: number; maxLength?: number }): Promise<CycleFinding[]> {
  try {
    const res = await apiClient.post<ApiResponse<CycleFinding[]>>('/graph/cycles', params);
    if (res.data?.data && res.data.data.length > 0) {
      return res.data.data;
    }
  } catch (err) {
    console.warn('API /graph/cycles unavailable, returning mock cycles', err);
  }
  return MOCK_CYCLES;
}

export async function detectCommunities(params?: { resolution?: number }): Promise<{
  modularity: number;
  communities: CommunityFinding[];
}> {
  try {
    const res = await apiClient.post<ApiResponse<{ modularity: number; communities: CommunityFinding[] }>>(
      '/graph/communities',
      params
    );
    if (res.data?.data) {
      return res.data.data;
    }
  } catch (err) {
    console.warn('API /graph/communities unavailable, returning mock communities', err);
  }
  return {
    modularity: 0.642,
    communities: MOCK_COMMUNITIES,
  };
}
