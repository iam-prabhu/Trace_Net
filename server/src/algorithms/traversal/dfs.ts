import { performance } from 'perf_hooks';
import {
  DFSOptions,
  DFSResult,
  TraversalDirection,
  TraversalTransactionEdge,
} from '../../types/graph.types';
import { AdjacencyGraph, buildAdjacencyGraph } from '../graph-adapter';
import { matchesFilter } from './bfs';

/**
 * Executes a Directed Depth-First Search (DFS) exploring paths deeply with backtracking up to maxDepth.
 */
export async function dfs(options: DFSOptions): Promise<DFSResult> {
  const startTime = performance.now();

  const {
    startAccountId,
    direction = 'OUTGOING',
    maxDepth = 5,
    limit = 100,
    targetAccountId,
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
  let cyclesEncountered = 0;

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
      cyclesEncountered: 0,
    };
  }

  visitedNodesSet.add(startAccountId);

  const currentPath: string[] = [startAccountId];
  const inStack = new Set<string>([startAccountId]);

  function explore(currentId: string, currentDepth: number): void {
    if (paths.length >= limit || currentDepth >= maxDepth) {
      return;
    }

    const neighbors = graph.getNeighbors(currentId, normalizedDirection);

    for (const { neighborId, edge } of neighbors) {
      if (paths.length >= limit) break;

      edgesTraversedCount++;

      // Apply filter
      if (!matchesFilter(edge, filterOptions)) {
        continue;
      }

      // Check recursion stack for cycle avoidance
      if (inStack.has(neighborId)) {
        cyclesEncountered++;
        continue;
      }

      visitedNodesSet.add(neighborId);
      reachableAccountsSet.add(neighborId);
      uniqueTransactions.set(edge.id, edge);

      const nextPath = [...currentPath, neighborId];

      if (targetAccountId) {
        if (neighborId === targetAccountId) {
          paths.push(nextPath);
          continue; // Reached target, do not continue past target
        }
      } else {
        paths.push(nextPath);
      }

      // Recurse deeper with backtracking
      if (currentDepth + 1 < maxDepth && paths.length < limit) {
        inStack.add(neighborId);
        currentPath.push(neighborId);

        explore(neighborId, currentDepth + 1);

        currentPath.pop();
        inStack.delete(neighborId);
      }
    }
  }

  explore(startAccountId, 0);

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
    cyclesEncountered,
  };
}
