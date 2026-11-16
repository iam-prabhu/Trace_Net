import { describe, it, expect } from 'vitest';
import {
  bfs,
  dfs,
  detectCycles,
  computeSCCs,
  detectCommunities,
  buildAdjacencyGraph,
  AdjacencyGraph,
} from '../src/algorithms';

describe('Graph Algorithms Test Suite', () => {
  // =========================================================================
  // 1. Breadth-First Search (BFS)
  // =========================================================================
  describe('Breadth-First Search (BFS)', () => {
    // Chain graph: A -> B -> C -> D -> E
    const chainGraph = buildAdjacencyGraph({
      nodes: [{ id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' }, { id: 'E' }],
      edges: [
        { id: 'tx-1', source: 'A', target: 'B', amount: 100, timestamp: '2026-01-01T10:00:00Z' },
        { id: 'tx-2', source: 'B', target: 'C', amount: 200, timestamp: '2026-01-02T10:00:00Z' },
        { id: 'tx-3', source: 'C', target: 'D', amount: 300, timestamp: '2026-01-03T10:00:00Z' },
        { id: 'tx-4', source: 'D', target: 'E', amount: 400, timestamp: '2026-01-04T10:00:00Z' },
      ],
    });

    it('should explore depth 1 correctly', async () => {
      const result = await bfs({
        startAccountId: 'A',
        direction: 'OUTGOING',
        maxDepth: 1,
        graph: chainGraph,
      });

      expect(result.reachableAccounts).toEqual(['B']);
      expect(result.paths).toEqual([['A', 'B']]);
      expect(result.nodesVisitedCount).toBe(2); // A, B
      expect(result.edgesTraversedCount).toBe(1);
      expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should explore depth 2 correctly', async () => {
      const result = await bfs({
        startAccountId: 'A',
        direction: 'OUTGOING',
        maxDepth: 2,
        graph: chainGraph,
      });

      expect(result.reachableAccounts).toEqual(['B', 'C']);
      expect(result.paths).toEqual([
        ['A', 'B'],
        ['A', 'B', 'C'],
      ]);
      expect(result.nodesVisitedCount).toBe(3); // A, B, C
    });

    it('should explore depth 3 correctly', async () => {
      const result = await bfs({
        startAccountId: 'A',
        direction: 'OUTGOING',
        maxDepth: 3,
        graph: chainGraph,
      });

      expect(result.reachableAccounts).toEqual(['B', 'C', 'D']);
      expect(result.paths).toEqual([
        ['A', 'B'],
        ['A', 'B', 'C'],
        ['A', 'B', 'C', 'D'],
      ]);
      expect(result.nodesVisitedCount).toBe(4);
    });

    it('should handle INCOMING and BOTH directions', async () => {
      // Star graph: In1 -> Center, In2 -> Center, Center -> Out1, Center -> Out2
      const starGraph = buildAdjacencyGraph({
        edges: [
          { id: 't1', source: 'In1', target: 'Center', amount: 50 },
          { id: 't2', source: 'In2', target: 'Center', amount: 60 },
          { id: 't3', source: 'Center', target: 'Out1', amount: 70 },
          { id: 't4', source: 'Center', target: 'Out2', amount: 80 },
        ],
      });

      // INCOMING
      const incoming = await bfs({
        startAccountId: 'Center',
        direction: 'INCOMING',
        maxDepth: 1,
        graph: starGraph,
      });
      expect(incoming.reachableAccounts.sort()).toEqual(['In1', 'In2'].sort());

      // OUTGOING
      const outgoing = await bfs({
        startAccountId: 'Center',
        direction: 'OUTGOING',
        maxDepth: 1,
        graph: starGraph,
      });
      expect(outgoing.reachableAccounts.sort()).toEqual(['Out1', 'Out2'].sort());

      // BOTH
      const both = await bfs({
        startAccountId: 'Center',
        direction: 'BOTH',
        maxDepth: 1,
        graph: starGraph,
      });
      expect(both.reachableAccounts.sort()).toEqual(['In1', 'In2', 'Out1', 'Out2'].sort());
    });

    it('should apply filters on minAmount, maxAmount, and dateRange', async () => {
      const filteredGraph = buildAdjacencyGraph({
        edges: [
          { id: 'e1', source: 'Start', target: 'Low', amount: 50, timestamp: '2026-01-05T00:00:00Z', type: 'WIRE' },
          { id: 'e2', source: 'Start', target: 'Mid', amount: 5000, timestamp: '2026-01-15T00:00:00Z', type: 'ACH' },
          { id: 'e3', source: 'Start', target: 'High', amount: 50000, timestamp: '2026-01-25T00:00:00Z', type: 'SWIFT' },
        ],
      });

      // Min amount filter
      const resMin = await bfs({
        startAccountId: 'Start',
        filterOptions: { minAmount: 1000 },
        graph: filteredGraph,
      });
      expect(resMin.reachableAccounts.sort()).toEqual(['High', 'Mid'].sort());

      // Max amount filter
      const resMax = await bfs({
        startAccountId: 'Start',
        filterOptions: { maxAmount: 10000 },
        graph: filteredGraph,
      });
      expect(resMax.reachableAccounts.sort()).toEqual(['Low', 'Mid'].sort());

      // Date range filter
      const resDate = await bfs({
        startAccountId: 'Start',
        filterOptions: {
          dateRange: {
            startDate: '2026-01-10T00:00:00Z',
            endDate: '2026-01-20T00:00:00Z',
          },
        },
        graph: filteredGraph,
      });
      expect(resDate.reachableAccounts).toEqual(['Mid']);

      // Transaction type filter
      const resType = await bfs({
        startAccountId: 'Start',
        filterOptions: { transactionTypes: ['SWIFT'] },
        graph: filteredGraph,
      });
      expect(resType.reachableAccounts).toEqual(['High']);
    });

    it('should respect result limit', async () => {
      const fanGraph = buildAdjacencyGraph({
        edges: [1, 2, 3, 4, 5].map(i => ({
          id: `fan-${i}`,
          source: 'Hub',
          target: `Leaf-${i}`,
          amount: i * 10,
        })),
      });

      const resLimit = await bfs({
        startAccountId: 'Hub',
        limit: 2,
        graph: fanGraph,
      });

      expect(resLimit.paths.length).toBe(2);
    });

    it('should handle cycles safely without infinite loops', async () => {
      const cycleGraph = buildAdjacencyGraph({
        edges: [
          { id: 'c1', source: 'C_A', target: 'C_B', amount: 100 },
          { id: 'c2', source: 'C_B', target: 'C_C', amount: 100 },
          { id: 'c3', source: 'C_C', target: 'C_A', amount: 100 },
          { id: 'c4', source: 'C_C', target: 'C_Out', amount: 50 },
        ],
      });

      const res = await bfs({
        startAccountId: 'C_A',
        maxDepth: 5,
        graph: cycleGraph,
      });

      expect(res.reachableAccounts.sort()).toEqual(['C_B', 'C_C', 'C_Out'].sort());
    });

    it('should handle non-existent start node gracefully', async () => {
      const res = await bfs({
        startAccountId: 'NON_EXISTENT',
        graph: chainGraph,
      });

      expect(res.reachableAccounts).toEqual([]);
      expect(res.paths).toEqual([]);
      expect(res.nodesVisitedCount).toBe(0);
    });
  });

  // =========================================================================
  // 2. Depth-First Search (DFS)
  // =========================================================================
  describe('Depth-First Search (DFS)', () => {
    // Branching graph:
    // A -> B -> C
    // A -> B -> D
    // A -> E -> F
    const branchingGraph = buildAdjacencyGraph({
      edges: [
        { id: 'e1', source: 'A', target: 'B', amount: 10 },
        { id: 'e2', source: 'B', target: 'C', amount: 20 },
        { id: 'e3', source: 'B', target: 'D', amount: 30 },
        { id: 'e4', source: 'A', target: 'E', amount: 40 },
        { id: 'e5', source: 'E', target: 'F', amount: 50 },
      ],
    });

    it('should explore all simple paths deeply', async () => {
      const result = await dfs({
        startAccountId: 'A',
        maxDepth: 3,
        graph: branchingGraph,
      });

      expect(result.reachableAccounts.sort()).toEqual(['B', 'C', 'D', 'E', 'F'].sort());
      expect(result.paths).toContainEqual(['A', 'B']);
      expect(result.paths).toContainEqual(['A', 'B', 'C']);
      expect(result.paths).toContainEqual(['A', 'B', 'D']);
      expect(result.paths).toContainEqual(['A', 'E']);
      expect(result.paths).toContainEqual(['A', 'E', 'F']);
      expect(result.nodesVisitedCount).toBe(6);
    });

    it('should prevent recursion cycles and track cyclesEncountered', async () => {
      // Loop: X -> Y -> Z -> X, plus Z -> Tail
      const cycleDFSGraph = buildAdjacencyGraph({
        edges: [
          { id: 'cy1', source: 'X', target: 'Y', amount: 100 },
          { id: 'cy2', source: 'Y', target: 'Z', amount: 100 },
          { id: 'cy3', source: 'Z', target: 'X', amount: 100 },
          { id: 'cy4', source: 'Z', target: 'Tail', amount: 200 },
        ],
      });

      const result = await dfs({
        startAccountId: 'X',
        maxDepth: 5,
        graph: cycleDFSGraph,
      });

      expect(result.reachableAccounts.sort()).toEqual(['Tail', 'Y', 'Z'].sort());
      expect(result.cyclesEncountered).toBeGreaterThanOrEqual(1);
    });

    it('should search for specific targetAccountId', async () => {
      const result = await dfs({
        startAccountId: 'A',
        targetAccountId: 'D',
        maxDepth: 4,
        graph: branchingGraph,
      });

      expect(result.paths).toEqual([['A', 'B', 'D']]);
    });
  });

  // =========================================================================
  // 3. Cycle Detection (Johnson / Tarjan)
  // =========================================================================
  describe('Johnson Directed Cycle Detection', () => {
    it('should detect a 3-node directed cycle (A -> B -> C -> A)', async () => {
      const threeNodeGraph = buildAdjacencyGraph({
        edges: [
          { id: 't1', source: 'ACC-01', target: 'ACC-02', amount: 10000, timestamp: '2026-01-01T10:00:00Z' },
          { id: 't2', source: 'ACC-02', target: 'ACC-03', amount: 9800, timestamp: '2026-01-01T12:00:00Z' },
          { id: 't3', source: 'ACC-03', target: 'ACC-01', amount: 9500, timestamp: '2026-01-01T14:00:00Z' },
        ],
      });

      const result = await detectCycles({
        graph: threeNodeGraph,
        minLength: 3,
        maxLength: 5,
      });

      expect(result.totalCyclesFound).toBe(1);
      const cycle = result.cycles[0];
      expect(cycle.length).toBe(3);
      expect(cycle.nodeIds.length).toBe(4); // [ACC-01, ACC-02, ACC-03, ACC-01]
      expect(cycle.nodeIds[0]).toBe(cycle.nodeIds[3]);
      expect(cycle.totalAmount).toBe(29300);
      expect(cycle.retentionRatio).toBeCloseTo(0.95, 2);
      expect(cycle.durationHours).toBe(4);
      expect(cycle.riskScore).toBeGreaterThanOrEqual(75);
      expect(cycle.explanation).toContain('ACC-01');
    });

    it('should detect a 4-node directed cycle ring', async () => {
      const fourNodeGraph = buildAdjacencyGraph({
        edges: [
          { id: 'r1', source: 'R1', target: 'R2', amount: 5000 },
          { id: 'r2', source: 'R2', target: 'R3', amount: 4900 },
          { id: 'r3', source: 'R3', target: 'R4', amount: 4800 },
          { id: 'r4', source: 'R4', target: 'R1', amount: 4700 },
        ],
      });

      const result = await detectCycles({
        graph: fourNodeGraph,
        minLength: 4,
        maxLength: 6,
      });

      expect(result.totalCyclesFound).toBe(1);
      expect(result.cycles[0].length).toBe(4);
      expect(result.cycles[0].classification).toBe('MULTI_HOP_LAYERING_RING');
    });

    it('should detect disjoint cycles independently', async () => {
      const disjointGraph = buildAdjacencyGraph({
        edges: [
          // Cycle 1
          { id: 'c1a', source: 'C1_A', target: 'C1_B', amount: 1000 },
          { id: 'c1b', source: 'C1_B', target: 'C1_C', amount: 1000 },
          { id: 'c1c', source: 'C1_C', target: 'C1_A', amount: 1000 },
          // Bridge (one way)
          { id: 'br', source: 'C1_C', target: 'C2_A', amount: 50 },
          // Cycle 2
          { id: 'c2a', source: 'C2_A', target: 'C2_B', amount: 2000 },
          { id: 'c2b', source: 'C2_B', target: 'C2_C', amount: 2000 },
          { id: 'c2c', source: 'C2_C', target: 'C2_A', amount: 2000 },
        ],
      });

      const result = await detectCycles({
        graph: disjointGraph,
        minLength: 3,
        maxLength: 4,
      });

      expect(result.totalCyclesFound).toBe(2);
      const cycleLengths = result.cycles.map(c => c.length);
      expect(cycleLengths).toEqual([3, 3]);
    });

    it('should detect self-loops when minLength <= 1', async () => {
      const selfLoopGraph = buildAdjacencyGraph({
        edges: [
          { id: 'loop', source: 'SelfNode', target: 'SelfNode', amount: 1000 },
        ],
      });

      // Default minLength 3 should NOT report self-loop
      const resDefault = await detectCycles({
        graph: selfLoopGraph,
        minLength: 3,
      });
      expect(resDefault.totalCyclesFound).toBe(0);

      // minLength 1 SHOULD report self-loop
      const resMin1 = await detectCycles({
        graph: selfLoopGraph,
        minLength: 1,
      });
      expect(resMin1.totalCyclesFound).toBe(1);
      expect(resMin1.cycles[0].nodeIds).toEqual(['SelfNode', 'SelfNode']);
    });

    it('should return 0 cycles on directed acyclic graph (DAG)', async () => {
      const dag = buildAdjacencyGraph({
        edges: [
          { id: 'd1', source: 'N1', target: 'N2', amount: 10 },
          { id: 'd2', source: 'N1', target: 'N3', amount: 20 },
          { id: 'd3', source: 'N2', target: 'N4', amount: 30 },
          { id: 'd4', source: 'N3', target: 'N4', amount: 40 },
        ],
      });

      const result = await detectCycles({ graph: dag });
      expect(result.totalCyclesFound).toBe(0);
    });

    it('should compute Strongly Connected Components (SCCs)', () => {
      const sccGraph = buildAdjacencyGraph({
        edges: [
          // Component 1: A <-> B
          { id: 's1', source: 'A', target: 'B', amount: 10 },
          { id: 's2', source: 'B', target: 'A', amount: 10 },
          // Connector A -> C
          { id: 's3', source: 'A', target: 'C', amount: 10 },
          // Component 2: C <-> D
          { id: 's4', source: 'C', target: 'D', amount: 10 },
          { id: 's5', source: 'D', target: 'C', amount: 10 },
          // Component 3: E (isolated sink)
          { id: 's6', source: 'D', target: 'E', amount: 10 },
        ],
      });

      const sccs = computeSCCs(sccGraph);
      const sccSizes = sccs.map(s => s.size).sort((a, b) => b - a);
      expect(sccSizes).toEqual([2, 2, 1]);
    });
  });

  // =========================================================================
  // 4. Community Detection (Louvain Modularity Optimization)
  // =========================================================================
  describe('Louvain Community Detection', () => {
    it('should correctly partition two dense clusters connected by a single bridge', async () => {
      // Cluster 1: Nodes C1_1, C1_2, C1_3, C1_4 (densely interconnected)
      // Cluster 2: Nodes C2_1, C2_2, C2_3, C2_4 (densely interconnected)
      // Bridge: C1_4 -> C2_1
      const clusteredGraph = buildAdjacencyGraph({
        edges: [
          // Cluster 1 clique
          { id: 'c1_12', source: 'C1_1', target: 'C1_2', amount: 1000 },
          { id: 'c1_21', source: 'C1_2', target: 'C1_1', amount: 1000 },
          { id: 'c1_23', source: 'C1_2', target: 'C1_3', amount: 1000 },
          { id: 'c1_34', source: 'C1_3', target: 'C1_4', amount: 1000 },
          { id: 'c1_41', source: 'C1_4', target: 'C1_1', amount: 1000 },
          { id: 'c1_13', source: 'C1_1', target: 'C1_3', amount: 1000 },
          { id: 'c1_24', source: 'C1_2', target: 'C1_4', amount: 1000 },

          // Cluster 2 clique
          { id: 'c2_12', source: 'C2_1', target: 'C2_2', amount: 1000 },
          { id: 'c2_21', source: 'C2_2', target: 'C2_1', amount: 1000 },
          { id: 'c2_23', source: 'C2_2', target: 'C2_3', amount: 1000 },
          { id: 'c2_34', source: 'C2_3', target: 'C2_4', amount: 1000 },
          { id: 'c2_41', source: 'C2_4', target: 'C2_1', amount: 1000 },
          { id: 'c2_13', source: 'C2_1', target: 'C2_3', amount: 1000 },
          { id: 'c2_24', source: 'C2_2', target: 'C2_4', amount: 1000 },

          // Single bridge edge
          { id: 'bridge-1', source: 'C1_4', target: 'C2_1', amount: 50 },
        ],
      });

      const result = await detectCommunities({
        graph: clusteredGraph,
        resolution: 1.0,
      });

      // Should identify exactly 2 communities
      expect(result.totalCommunities).toBe(2);
      expect(result.communities[0].size).toBe(4);
      expect(result.communities[1].size).toBe(4);

      // Modularity Q should be positive and substantial (> 0.35)
      expect(result.modularity).toBeGreaterThan(0.35);

      // Verify bridging transactions identified
      expect(result.bridgingTransactions.length).toBe(1);
      expect(result.bridgingTransactions[0].transactionId).toBe('bridge-1');
      expect(result.bridgingTransactions[0].senderAccountId).toBe('C1_4');
      expect(result.bridgingTransactions[0].receiverAccountId).toBe('C2_1');

      // Verify internal vs external density
      const comm1 = result.communities[0];
      expect(comm1.internalEdgeCount).toBeGreaterThan(0);
      expect(comm1.internalDensity).toBeGreaterThan(0.5);
    });

    it('should support weightProperty = "count"', async () => {
      const graph = buildAdjacencyGraph({
        edges: [
          { id: 'e1', source: 'U1', target: 'U2', amount: 50000 },
          { id: 'e2', source: 'U2', target: 'U3', amount: 10 },
        ],
      });

      const result = await detectCommunities({
        graph,
        weightProperty: 'count',
      });

      expect(result.totalCommunities).toBeGreaterThanOrEqual(1);
      expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty graph and single node graph', async () => {
      const emptyRes = await detectCommunities({ graph: new AdjacencyGraph() });
      expect(emptyRes.modularity).toBe(0);
      expect(emptyRes.totalCommunities).toBe(0);

      const singleNodeGraph = new AdjacencyGraph();
      singleNodeGraph.addNode('LoneWolf');
      const singleRes = await detectCommunities({ graph: singleNodeGraph });
      expect(singleRes.modularity).toBe(0);
      expect(singleRes.totalCommunities).toBe(1);
      expect(singleRes.communities[0].nodeIds).toEqual(['LoneWolf']);
    });
  });
});
