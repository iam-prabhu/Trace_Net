import {
  GraphData,
  TraversalOptions,
  TraversalResult,
  CycleResult,
  LouvainResult,
  GraphStatistics,
} from '../types/graph.types';
import { inMemoryStore } from './in-memory.store';

export class GraphRepository {
  async getFullGraph(limit: number = 200): Promise<GraphData> {
    const full = inMemoryStore.getFullGraph();
    if (full.nodes.length <= limit) return full;

    const nodes = full.nodes.slice(0, limit);
    const nodeSet = new Set(nodes.map(n => n.id));
    const edges = full.edges.filter(
      e => nodeSet.has(e.source || e.startNodeId) && nodeSet.has(e.target || e.endNodeId)
    );

    return { nodes, edges };
  }

  async getSubgraph(
    accountIds: string[],
    maxDepth: number = 2,
    minAmount?: number,
    maxAmount?: number
  ): Promise<GraphData> {
    return inMemoryStore.getSubgraph(accountIds, maxDepth, minAmount, maxAmount);
  }

  async getNeighbors(nodeId: string, depth: number = 1): Promise<GraphData> {
    return inMemoryStore.getNeighbors(nodeId, depth);
  }

  async traverse(options: TraversalOptions & { algorithm?: 'BFS' | 'DFS' }): Promise<TraversalResult> {
    const algo = (options.algorithm || 'BFS').toUpperCase();
    if (algo === 'DFS') {
      return inMemoryStore.runDFS(options);
    }
    return inMemoryStore.runBFS(options);
  }

  async detectCycles(minLength: number = 3, maxLength: number = 6): Promise<CycleResult[]> {
    return inMemoryStore.detectCycles(minLength, maxLength);
  }

  async detectCommunities(): Promise<LouvainResult> {
    return inMemoryStore.detectLouvainCommunities();
  }

  async getStatistics(): Promise<GraphStatistics> {
    return inMemoryStore.getStatistics();
  }
}

export const graphRepository = new GraphRepository();
