import { performance } from 'perf_hooks';
import {
  BFSOptions,
  BFSResult,
  TraversalDirection,
  TraversalFilterOptions,
  TraversalTransactionEdge,
} from '../../types/graph.types';
import { AdjacencyGraph, buildAdjacencyGraph, NormalizedEdge } from '../graph-adapter';

/**
 * Checks if a normalized edge satisfies the given filter options.
 */
export function matchesFilter(edge: NormalizedEdge, filter?: TraversalFilterOptions): boolean {
  if (!filter) return true;

  if (filter.minAmount !== undefined && edge.amount < filter.minAmount) {
    return false;
  }

  if (filter.maxAmount !== undefined && edge.amount > filter.maxAmount) {
    return false;
  }

  if (filter.transactionTypes && filter.transactionTypes.length > 0) {
    if (!edge.type || !filter.transactionTypes.includes(edge.type)) {
      return false;
    }
  }

  if (filter.dateRange && edge.timestamp) {
    const edgeTime = new Date(edge.timestamp).getTime();
    if (!isNaN(edgeTime)) {
      if (filter.dateRange.startDate) {
        const start = new Date(filter.dateRange.startDate).getTime();
        if (!isNaN(start) && edgeTime < start) return false;
      }
      if (filter.dateRange.endDate) {
        const end = new Date(filter.dateRange.endDate).getTime();
        if (!isNaN(end) && edgeTime > end) return false;
      }
    }
  }

  return true;
}

interface BFSQueueItem {
  accountId: string;
  depth: number;
  path: string[];
  edgePath: NormalizedEdge[];
}

/**
 * Executes a Directed Breadth-First Search (BFS) starting from a specific account.
 */
export async function bfs(options: BFSOptions): Promise<BFSResult> {
  const startTime = performance.now();

  const {
    startAccountId,
    direction = 'OUTGOING',
    maxDepth = 3,
    limit = 100,
    filterOptions,
    graph: rawGraph,
  } = options;

  const graph = rawGraph instanceof AdjacencyGraph ? rawGraph : buildAdjacencyGraph(rawGraph);

  const normalizedDirection: TraversalDirection =
    direction.toUpperCase() === 'INCOMING'
      ? 'INCOMING'
      : direction.toUpperCase() === 'BOTH'
      ? 'BOTH'
      : 'OUTGOING';

  const paths: string[][] = [];
  const reachableAccountsSet = new Set<string>();
  const visitedNodesSet = new Set<string>();
  const uniqueTransactions = new Map<string, TraversalTransactionEdge>();

  let edgesTraversedCount = 0;

  // If start node does not exist in graph, return empty result
  if (!graph.getNode(startAccountId)) {
    const endTime = performance.now();
    return {
      startAccountId,
      direction: normalizedDirection,
      maxDepth,
      reachableAccounts: [],
      paths: [],
      transactions: [],
      nodesVisitedCount: 0,
      edgesTraversedCount: 0,
      executionTimeMs: Math.round((endTime - startTime) * 100) / 100,
    };
  }

  visitedNodesSet.add(startAccountId);

  // Queue stores items to explore level by level
  const queue: BFSQueueItem[] = [
    {
      accountId: startAccountId,
      depth: 0,
      path: [startAccountId],
      edgePath: [],
    },
  ];

  // Map to track the minimum depth at which each node was discovered
  const minDepthDiscovered = new Map<string, number>();
  minDepthDiscovered.set(startAccountId, 0);

  while (queue.length > 0 && paths.length < limit) {
    const current = queue.shift()!;

    if (current.depth >= maxDepth) {
      continue;
    }

    const nextDepth = current.depth + 1;
    const neighbors = graph.getNeighbors(current.accountId, normalizedDirection);

    for (const { neighborId, edge } of neighbors) {
      edgesTraversedCount++;

      // Check filters
      if (!matchesFilter(edge, filterOptions)) {
        continue;
      }

      // Check for cycles along the current branch
      if (current.path.includes(neighborId)) {
        continue;
      }

      const nextPath = [...current.path, neighborId];
      const nextEdgePath = [...current.edgePath, edge];

      // Record path if within limit
      if (paths.length < limit) {
        paths.push(nextPath);
      }

      reachableAccountsSet.add(neighborId);
      visitedNodesSet.add(neighborId);
      uniqueTransactions.set(edge.id, edge);

      // Only enqueue if we have not visited this node at an equal or lower depth,
      // and we are not exceeding maxDepth
      const prevDepth = minDepthDiscovered.get(neighborId);
      if (prevDepth === undefined || nextDepth < prevDepth) {
        minDepthDiscovered.set(neighborId, nextDepth);
        if (nextDepth < maxDepth) {
          queue.push({
            accountId: neighborId,
            depth: nextDepth,
            path: nextPath,
            edgePath: nextEdgePath,
          });
        }
      }
    }
  }

  const endTime = performance.now();
  const executionTimeMs = Math.round((endTime - startTime) * 100) / 100;

  return {
    startAccountId,
    direction: normalizedDirection,
    maxDepth,
    reachableAccounts: Array.from(reachableAccountsSet),
    paths,
    transactions: Array.from(uniqueTransactions.values()),
    nodesVisitedCount: visitedNodesSet.size,
    edgesTraversedCount,
    executionTimeMs,
  };
}
