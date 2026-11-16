import { performance } from 'perf_hooks';
import {
  Cycle,
  CycleDetectionOptions,
  CycleDetectionResult,
  StronglyConnectedComponent,
  TraversalTransactionEdge,
} from '../../types/graph.types';
import { AdjacencyGraph, buildAdjacencyGraph, NormalizedEdge } from '../graph-adapter';
import { matchesFilter } from '../traversal/bfs';

/**
 * Computes Strongly Connected Components (SCCs) using Tarjan's algorithm.
 */
export function computeSCCs(graphInput: unknown): StronglyConnectedComponent[] {
  const graph = graphInput instanceof AdjacencyGraph ? graphInput : buildAdjacencyGraph(graphInput);
  const nodeIds = graph.getNodeIds();

  const dfn = new Map<string, number>();
  const low = new Map<string, number>();
  const inStack = new Set<string>();
  const stack: string[] = [];
  let timer = 0;
  const components: string[][] = [];

  function strongConnect(u: string): void {
    dfn.set(u, ++timer);
    low.set(u, timer);
    stack.push(u);
    inStack.add(u);

    const outEdges = graph.getOutgoing(u);
    for (const edge of outEdges) {
      const v = edge.target;
      if (!dfn.has(v)) {
        strongConnect(v);
        low.set(u, Math.min(low.get(u)!, low.get(v)!));
      } else if (inStack.has(v)) {
        low.set(u, Math.min(low.get(u)!, dfn.get(v)!));
      }
    }

    if (low.get(u) === dfn.get(u)) {
      const component: string[] = [];
      let w: string;
      do {
        w = stack.pop()!;
        inStack.delete(w);
        component.push(w);
      } while (w !== u);
      components.push(component);
    }
  }

  for (const id of nodeIds) {
    if (!dfn.has(id)) {
      strongConnect(id);
    }
  }

  return components.map((accs, idx) => ({
    id: idx + 1,
    accountIds: accs,
    size: accs.length,
  }));
}

/**
 * Internal Tarjan's SCC implementation on a filtered set of vertices and edges.
 */
function tarjanSCCFiltered(
  vertexSubset: Set<string>,
  adj: Map<string, string[]>
): string[][] {
  const dfn = new Map<string, number>();
  const low = new Map<string, number>();
  const inStack = new Set<string>();
  const stack: string[] = [];
  let timer = 0;
  const sccs: string[][] = [];

  function strongConnect(u: string): void {
    dfn.set(u, ++timer);
    low.set(u, timer);
    stack.push(u);
    inStack.add(u);

    const neighbors = adj.get(u) || [];
    for (const v of neighbors) {
      if (!vertexSubset.has(v)) continue;

      if (!dfn.has(v)) {
        strongConnect(v);
        low.set(u, Math.min(low.get(u)!, low.get(v)!));
      } else if (inStack.has(v)) {
        low.set(u, Math.min(low.get(u)!, dfn.get(v)!));
      }
    }

    if (low.get(u) === dfn.get(u)) {
      const component: string[] = [];
      let w: string;
      do {
        w = stack.pop()!;
        inStack.delete(w);
        component.push(w);
      } while (w !== u);
      sccs.push(component);
    }
  }

  for (const v of vertexSubset) {
    if (!dfn.has(v)) {
      strongConnect(v);
    }
  }

  return sccs;
}

/**
 * Executes Directed Cycle Detection using Johnson's Elementary Circuits Algorithm.
 */
export async function detectCycles(options: CycleDetectionOptions = {}): Promise<CycleDetectionResult> {
  const startTime = performance.now();

  const {
    graph: rawGraph,
    startAccountId,
    accountIdSubset,
    minLength = 3,
    maxLength = 6,
    limit = 100,
    minAmount,
    maxAmount,
    dateRange,
  } = options;

  const graph = rawGraph instanceof AdjacencyGraph ? rawGraph : buildAdjacencyGraph(rawGraph);

  // Compute all SCCs on full graph for auxiliary analytics
  const allSCCs = computeSCCs(graph);

  // Determine subset of nodes to inspect
  let targetNodes: string[] = graph.getNodeIds();
  if (accountIdSubset && accountIdSubset.length > 0) {
    const filterSet = new Set(accountIdSubset);
    targetNodes = targetNodes.filter(id => filterSet.has(id));
  }

  // Build adjacency list taking filters into account
  const filterOptions = { minAmount, maxAmount, dateRange };
  const adj = new Map<string, string[]>();
  const edgeLookup = new Map<string, NormalizedEdge[]>();

  for (const u of targetNodes) {
    const validNeighbors: string[] = [];
    const outEdges = graph.getOutgoing(u);

    for (const edge of outEdges) {
      if (!matchesFilter(edge, filterOptions)) continue;
      const v = edge.target;
      if (!targetNodes.includes(v)) continue;

      validNeighbors.push(v);
      const key = `${u}->${v}`;
      const existing = edgeLookup.get(key) || [];
      existing.push(edge);
      edgeLookup.set(key, existing);
    }

    adj.set(u, validNeighbors);
  }

  // Johnson's Algorithm Setup
  const orderedVertices = [...targetNodes];
  const vertexIndex = new Map<string, number>();
  orderedVertices.forEach((v, i) => vertexIndex.set(v, i));

  const rawCycles: string[][] = [];
  let sIndex = 0;

  while (sIndex < orderedVertices.length && rawCycles.length < limit) {
    // 1. Build vertex subset V_s = { v_i | i >= sIndex }
    const subset = new Set<string>();
    for (let i = sIndex; i < orderedVertices.length; i++) {
      subset.add(orderedVertices[i]);
    }

    // 2. Compute SCCs in V_s
    const sccs = tarjanSCCFiltered(subset, adj);

    // 3. Find SCC with minimum vertex index >= sIndex
    let minSCC: string[] | null = null;
    let minVertex = '';
    let minVIndex = Infinity;

    for (const scc of sccs) {
      // For cycle of length >= 2, SCC must have size >= 2.
      // If minLength <= 1, allow size 1 (self loop check).
      const hasSelfLoop = scc.length === 1 && (adj.get(scc[0]) || []).includes(scc[0]);
      if (scc.length >= 2 || (minLength <= 1 && hasSelfLoop)) {
        for (const v of scc) {
          const idx = vertexIndex.get(v)!;
          if (idx < minVIndex) {
            minVIndex = idx;
            minVertex = v;
            minSCC = scc;
          }
        }
      }
    }

    if (!minSCC || minVIndex === Infinity) {
      break;
    }

    sIndex = minVIndex;
    const startV = minVertex;
    const sccSet = new Set(minSCC);

    // Build sub-adjacency only within this SCC
    const sccAdj = new Map<string, string[]>();
    for (const u of minSCC) {
      const neighbors = (adj.get(u) || []).filter(v => sccSet.has(v));
      sccAdj.set(u, neighbors);
    }

    // Johnson's circuit search
    const blocked = new Set<string>();
    const B = new Map<string, Set<string>>();
    const stack: string[] = [];

    function unblock(u: string): void {
      blocked.delete(u);
      const bSet = B.get(u);
      if (bSet) {
        for (const w of Array.from(bSet)) {
          bSet.delete(w);
          if (blocked.has(w)) {
            unblock(w);
          }
        }
      }
    }

    function circuit(v: string, depth: number): boolean {
      if (rawCycles.length >= limit) return false;

      let closed = false;
      stack.push(v);
      blocked.add(v);

      const neighbors = sccAdj.get(v) || [];

      for (const w of neighbors) {
        if (rawCycles.length >= limit) break;

        if (w === startV) {
          // Found cycle
          const cycleLen = stack.length;
          if (cycleLen >= minLength && cycleLen <= maxLength) {
            rawCycles.push([...stack, startV]);
            closed = true;
          }
        } else if (!blocked.has(w)) {
          if (depth < maxLength) {
            if (circuit(w, depth + 1)) {
              closed = true;
            }
          }
        }
      }

      if (closed) {
        unblock(v);
      } else {
        for (const w of neighbors) {
          let bSet = B.get(w);
          if (!bSet) {
            bSet = new Set<string>();
            B.set(w, bSet);
          }
          bSet.add(v);
        }
      }

      stack.pop();
      return closed;
    }

    circuit(startV, 1);
    sIndex++;
  }

  // Filter cycles if startAccountId was specifically requested
  let filteredRawCycles = rawCycles;
  if (startAccountId) {
    filteredRawCycles = rawCycles.filter(cycle => cycle.includes(startAccountId));
  }

  // Enrich each detected cycle with transaction metadata, statistics, risk scores, and explainability
  const cycles: Cycle[] = [];
  let totalVolume = 0;
  let highRiskCount = 0;
  let totalLength = 0;

  for (let i = 0; i < filteredRawCycles.length; i++) {
    const nodeSeq = filteredRawCycles[i];
    const cycleLength = nodeSeq.length - 1;
    const cycleEdgeList: TraversalTransactionEdge[] = [];
    const edgeIds: string[] = [];
    const amounts: number[] = [];
    const timestamps: number[] = [];

    for (let j = 0; j < nodeSeq.length - 1; j++) {
      const u = nodeSeq[j];
      const v = nodeSeq[j + 1];
      const key = `${u}->${v}`;
      const matchingEdges = edgeLookup.get(key) || [];

      // Pick highest amount matching edge
      const chosenEdge = matchingEdges.length > 0
        ? matchingEdges.reduce((prev, curr) => (curr.amount > prev.amount ? curr : prev), matchingEdges[0])
        : {
            id: `edge-${u}-${v}-${j}`,
            source: u,
            target: v,
            amount: 0,
            properties: {},
          };

      cycleEdgeList.push(chosenEdge);
      edgeIds.push(chosenEdge.id);
      amounts.push(chosenEdge.amount);

      if (chosenEdge.timestamp) {
        const t = new Date(chosenEdge.timestamp).getTime();
        if (!isNaN(t)) timestamps.push(t);
      }
    }

    const cycleTotalAmount = amounts.reduce((sum, a) => sum + a, 0);
    const cycleMinAmount = amounts.length > 0 ? Math.min(...amounts) : 0;
    const cycleMaxAmount = amounts.length > 0 ? Math.max(...amounts) : 0;
    const avgAmount = amounts.length > 0 ? cycleTotalAmount / amounts.length : 0;
    const retentionRatio = cycleMaxAmount > 0 ? cycleMinAmount / cycleMaxAmount : 1.0;

    let startTimeStr: string | undefined;
    let endTimeStr: string | undefined;
    let durationMs: number | undefined;
    let durationHours: number | undefined;

    if (timestamps.length > 0) {
      const minT = Math.min(...timestamps);
      const maxT = Math.max(...timestamps);
      startTimeStr = new Date(minT).toISOString();
      endTimeStr = new Date(maxT).toISOString();
      durationMs = maxT - minT;
      durationHours = Math.round((durationMs / (1000 * 60 * 60)) * 10) / 10;
    }

    // Risk scoring
    let riskScore = 40;
    if (retentionRatio >= 0.85) riskScore += 25;
    else if (retentionRatio >= 0.70) riskScore += 15;

    if (durationHours !== undefined) {
      if (durationHours <= 24) riskScore += 20;
      else if (durationHours <= 72) riskScore += 10;
    }

    if (cycleTotalAmount >= 50000) riskScore += 10;
    else if (cycleTotalAmount >= 10000) riskScore += 5;

    if (cycleLength >= 3 && cycleLength <= 5) riskScore += 5;
    riskScore = Math.min(99, Math.max(10, riskScore));

    if (riskScore >= 75) highRiskCount++;

    // Classification
    let classification = 'CIRCULAR_FUNDS_FLOW';
    if (durationHours !== undefined && durationHours <= 24 && retentionRatio >= 0.8) {
      classification = 'HIGH_VELOCITY_CIRCULAR_ROUTING';
    } else if (cycleLength >= 4) {
      classification = 'MULTI_HOP_LAYERING_RING';
    }

    // Explanation narrative
    const participantsList = nodeSeq.slice(0, -1).join(' -> ') + ' -> ' + nodeSeq[0];
    const durationText = durationHours !== undefined ? ` within ${durationHours} hours` : '';
    const retentionText = `${Math.round(retentionRatio * 100)}% capital retention`;
    const explanation = `Suspicious circular transaction flow detected along ${cycleLength} hops (${participantsList}) totaling $${cycleTotalAmount.toLocaleString()}${durationText} with ${retentionText}. Pattern strongly correlates with structured layering to obscure illicit origins.`;

    totalVolume += cycleTotalAmount;
    totalLength += cycleLength;

    cycles.push({
      id: `CYCLE-${String(i + 1).padStart(3, '0')}-${cycleLength}HOP`,
      nodeIds: nodeSeq,
      edgeIds,
      transactions: cycleEdgeList,
      length: cycleLength,
      totalAmount: Math.round(cycleTotalAmount * 100) / 100,
      averageAmount: Math.round(avgAmount * 100) / 100,
      minAmount: cycleMinAmount,
      maxAmount: cycleMaxAmount,
      retentionRatio: Math.round(retentionRatio * 1000) / 1000,
      startTime: startTimeStr,
      endTime: endTimeStr,
      durationMs,
      durationHours,
      riskScore,
      classification,
      explanation,
    });
  }

  const endTime = performance.now();
  const executionTimeMs = Math.round((endTime - startTime) * 100) / 100;

  return {
    cycles,
    totalCyclesFound: cycles.length,
    sccs: allSCCs,
    executionTimeMs,
    summary: {
      totalVolume: Math.round(totalVolume * 100) / 100,
      highRiskCyclesCount: highRiskCount,
      averageCycleLength: cycles.length > 0 ? Math.round((totalLength / cycles.length) * 10) / 10 : 0,
    },
  };
}
