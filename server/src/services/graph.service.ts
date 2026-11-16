import {
  GraphData,
  TraversalOptions,
  GraphStatistics,
} from '../types/graph.types';
import { inMemoryStore } from '../repositories/in-memory.store';
import { graphRepository } from '../repositories/graph.repository';
import { bfs } from '../algorithms/traversal/bfs';
import { dfs } from '../algorithms/traversal/dfs';
import { detectCycles as runJohnsonCycles } from '../algorithms/cycle-detection/johnson';
import { detectCommunities as runLouvainCommunities } from '../algorithms/community-detection/louvain';
import { buildAdjacencyGraph } from '../algorithms/graph-adapter';

function getActiveGraph() {
  const full = inMemoryStore.getFullGraph();
  return buildAdjacencyGraph({
    accounts: full.nodes.map(n => ({ id: n.id, ...n.properties })),
    transactions: full.edges.map(e => ({
      id: e.id,
      senderAccountId: e.source || e.startNodeId,
      receiverAccountId: e.target || e.endNodeId,
      amount: e.properties.amount,
      timestamp: e.properties.timestamp,
      transactionType: e.properties.transactionType,
      status: e.properties.status,
    })),
  });
}

export async function getGraphData(filters?: any): Promise<GraphData> {
  const limit = filters?.limit ? Number(filters.limit) : 250;
  return graphRepository.getFullGraph(limit);
}

export async function getSubgraph(
  accountIds: string[],
  maxDepth: number = 2,
  minAmount?: number,
  maxAmount?: number
): Promise<GraphData> {
  return graphRepository.getSubgraph(accountIds, maxDepth, minAmount, maxAmount);
}

export async function getNeighbors(nodeId: string, depth: number = 1): Promise<GraphData> {
  return graphRepository.getNeighbors(nodeId, depth);
}

export async function runBFS(options: TraversalOptions): Promise<any> {
  const graph = getActiveGraph();
  const startAccountId = options.startAccountId || options.startNodeId || '';

  const filterOptions = (options.minAmount !== undefined || options.maxAmount !== undefined || options.startDate)
    ? {
        minAmount: options.minAmount,
        maxAmount: options.maxAmount,
        dateRange: options.startDate ? { startDate: options.startDate, endDate: options.endDate } : undefined,
      }
    : undefined;

  const result = await bfs({
    startAccountId,
    direction: options.direction || 'BOTH',
    maxDepth: options.maxDepth || 3,
    limit: options.limit || 100,
    filterOptions,
    graph,
  });

  // Attach Cytoscape-formatted subgraph
  const subgraph = inMemoryStore.getSubgraph(
    [startAccountId, ...result.reachableAccounts],
    0
  );

  return {
    ...result,
    algorithm: 'BFS',
    metrics: {
      executionTimeMs: result.executionTimeMs,
      nodesVisitedCount: result.nodesVisitedCount,
      edgesTraversedCount: result.edgesTraversedCount,
      maxDepthReached: options.maxDepth || 3,
    },
    subgraph,
  };
}

export async function runDFS(options: TraversalOptions): Promise<any> {
  const graph = getActiveGraph();
  const startAccountId = options.startAccountId || options.startNodeId || '';

  const filterOptions = (options.minAmount !== undefined || options.maxAmount !== undefined || options.startDate)
    ? {
        minAmount: options.minAmount,
        maxAmount: options.maxAmount,
        dateRange: options.startDate ? { startDate: options.startDate, endDate: options.endDate } : undefined,
      }
    : undefined;

  const result = await dfs({
    startAccountId,
    direction: options.direction || 'BOTH',
    maxDepth: options.maxDepth || 5,
    limit: options.limit || 100,
    filterOptions,
    graph,
  });

  const subgraph = inMemoryStore.getSubgraph(
    [startAccountId, ...result.reachableAccounts],
    0
  );

  return {
    ...result,
    algorithm: 'DFS',
    metrics: {
      executionTimeMs: result.executionTimeMs,
      nodesVisitedCount: result.nodesVisitedCount,
      edgesTraversedCount: result.edgesTraversedCount,
      cyclesEncountered: result.cyclesEncountered,
      maxDepthReached: options.maxDepth || 5,
    },
    subgraph,
  };
}

export async function detectCycles(options: any = {}): Promise<any> {
  const graph = getActiveGraph();
  return runJohnsonCycles({
    graph,
    startAccountId: options.startAccountId,
    accountIdSubset: options.accountIdSubset,
    minLength: options.minLength || 3,
    maxLength: options.maxLength || 6,
    limit: options.limit || 100,
    minAmount: options.minAmount,
    maxAmount: options.maxAmount,
  });
}

export async function detectCommunities(options: any = {}): Promise<any> {
  const graph = getActiveGraph();
  return runLouvainCommunities({
    graph,
    resolution: options.resolution || 1.0,
    minCommunitySize: options.minCommunitySize || 1,
    maxIterations: options.maxIterations || 20,
  });
}

export async function getStatistics(): Promise<GraphStatistics> {
  return graphRepository.getStatistics();
}
