import { performance } from 'perf_hooks';
import {
  BridgingTransaction,
  Community,
  CommunityDetectionOptions,
  CommunityDetectionResult,
} from '../../types/graph.types';
import { AdjacencyGraph, buildAdjacencyGraph, NormalizedEdge } from '../graph-adapter';

interface WeightedEdge {
  target: number;
  weight: number;
}

/**
 * Executes Community Detection & Clustering using the Louvain Modularity Optimization Algorithm.
 */
export async function detectCommunities(
  options: CommunityDetectionOptions = {}
): Promise<CommunityDetectionResult> {
  const startTime = performance.now();

  const {
    graph: rawGraph,
    resolution = 1.0,
    weightProperty = 'amount',
    minCommunitySize = 1,
    maxIterations = 20,
  } = options;

  const graph = rawGraph instanceof AdjacencyGraph ? rawGraph : buildAdjacencyGraph(rawGraph);
  const nodeIds = graph.getNodeIds();
  const N = nodeIds.length;

  if (N === 0) {
    const endTime = performance.now();
    return {
      modularity: 0,
      communities: [],
      totalCommunities: 0,
      bridgingTransactions: [],
      executionTimeMs: Math.round((endTime - startTime) * 100) / 100,
    };
  }

  // Node ID to index mapping
  const nodeToIndex = new Map<string, number>();
  nodeIds.forEach((id, i) => nodeToIndex.set(id, i));

  // Build undirected weighted projection
  const adjMap = new Map<number, Map<number, number>>();
  const selfLoopWeights = new Float64Array(N);

  for (let i = 0; i < N; i++) {
    adjMap.set(i, new Map());
  }

  const allEdges: NormalizedEdge[] = [];
  for (const u of nodeIds) {
    const outEdges = graph.getOutgoing(u);
    for (const edge of outEdges) {
      allEdges.push(edge);
      const uIdx = nodeToIndex.get(edge.source);
      const vIdx = nodeToIndex.get(edge.target);

      if (uIdx === undefined || vIdx === undefined) continue;

      const weight = weightProperty === 'amount'
        ? Math.max(0.01, edge.amount > 0 ? edge.amount : 1.0)
        : 1.0;

      if (uIdx === vIdx) {
        selfLoopWeights[uIdx] += weight;
      } else {
        const uNeighbors = adjMap.get(uIdx)!;
        uNeighbors.set(vIdx, (uNeighbors.get(vIdx) || 0) + weight);

        const vNeighbors = adjMap.get(vIdx)!;
        vNeighbors.set(uIdx, (vNeighbors.get(uIdx) || 0) + weight);
      }
    }
  }

  // Compute total degrees k_i and total network weight 2m
  const degrees = new Float64Array(N);
  let totalWeight2m = 0;

  for (let i = 0; i < N; i++) {
    let deg = selfLoopWeights[i] * 2;
    for (const [, w] of adjMap.get(i)!) {
      deg += w;
    }
    degrees[i] = deg;
    totalWeight2m += deg;
  }

  if (totalWeight2m === 0) {
    // No edges at all: every node in its own community
    const communities: Community[] = nodeIds.map((id, idx) => ({
      id: idx,
      nodeIds: [id],
      size: 1,
      totalVolume: 0,
      internalEdgeCount: 0,
      internalVolume: 0,
      internalDensity: 1.0,
      externalEdgeCount: 0,
      externalVolume: 0,
      riskScore: 10,
    }));

    const endTime = performance.now();
    return {
      modularity: 0,
      communities,
      totalCommunities: communities.length,
      bridgingTransactions: [],
      executionTimeMs: Math.round((endTime - startTime) * 100) / 100,
    };
  }

  // Louvain Multi-Level Optimization
  let currentN = N;
  let currentAdj: WeightedEdge[][] = [];
  for (let i = 0; i < N; i++) {
    const edges: WeightedEdge[] = [];
    for (const [target, weight] of adjMap.get(i)!) {
      edges.push({ target, weight });
    }
    currentAdj.push(edges);
  }
  let currentSelfLoops = Float64Array.from(selfLoopWeights);
  let currentDegrees = Float64Array.from(degrees);

  // Tracks mapping from original node index (0..N-1) to current community
  let nodeToCommunity = new Int32Array(N);
  for (let i = 0; i < N; i++) {
    nodeToCommunity[i] = i;
  }

  let pass = 0;
  const maxPasses = 10;

  while (pass < maxPasses) {
    pass++;
    // Phase 1: Local Moving of Nodes
    const community = new Int32Array(currentN);
    const totDegree = new Float64Array(currentN);
    const inDegree = new Float64Array(currentN);

    for (let i = 0; i < currentN; i++) {
      community[i] = i;
      totDegree[i] = currentDegrees[i];
      inDegree[i] = currentSelfLoops[i] * 2;
    }

    let improvement = true;
    let iteration = 0;

    while (improvement && iteration < maxIterations) {
      improvement = false;
      iteration++;

      for (let i = 0; i < currentN; i++) {
        const currentC = community[i];
        const ki = currentDegrees[i];
        const selfLoopI = currentSelfLoops[i];

        // Weights from node i to neighboring communities
        const commWeightMap = new Map<number, number>();
        for (const edge of currentAdj[i]) {
          const c = community[edge.target];
          commWeightMap.set(c, (commWeightMap.get(c) || 0) + edge.weight);
        }

        // Remove node i from community currentC
        const k_i_in_current = commWeightMap.get(currentC) || 0;
        totDegree[currentC] -= ki;
        inDegree[currentC] -= (2 * k_i_in_current + 2 * selfLoopI);

        // Find candidate community that maximizes modularity gain
        let bestComm = currentC;
        let bestGain = 0;

        for (const [candComm, k_i_in_cand] of commWeightMap) {
          // Delta Q gain formulation:
          // gain = k_i_in_cand - resolution * (totDegree[candComm] * ki) / (2m)
          const gain = k_i_in_cand - resolution * ((totDegree[candComm] * ki) / totalWeight2m);

          if (gain > bestGain) {
            bestGain = gain;
            bestComm = candComm;
          }
        }

        // If keeping in current community is best
        const stayGain = k_i_in_current - resolution * ((totDegree[currentC] * ki) / totalWeight2m);
        if (stayGain >= bestGain) {
          bestComm = currentC;
        }

        // Place node i into best community
        community[i] = bestComm;
        const k_i_in_best = commWeightMap.get(bestComm) || 0;
        totDegree[bestComm] += ki;
        inDegree[bestComm] += (2 * k_i_in_best + 2 * selfLoopI);

        if (bestComm !== currentC) {
          improvement = true;
        }
      }
    }

    // Renumber communities to 0..newN-1
    const commRenumber = new Map<number, number>();
    let newN = 0;
    for (let i = 0; i < currentN; i++) {
      const c = community[i];
      if (!commRenumber.has(c)) {
        commRenumber.set(c, newN++);
      }
    }

    // Update global node-to-community mapping
    for (let i = 0; i < N; i++) {
      const oldComm = nodeToCommunity[i];
      const newComm = commRenumber.get(community[oldComm])!;
      nodeToCommunity[i] = newComm;
    }

    // If no communities were merged, Phase 1 reached an optimal partition
    if (newN === currentN) {
      break;
    }

    // Phase 2: Aggregate Graph for next level
    const newAdjMap = new Map<number, Map<number, number>>();
    const newSelfLoops = new Float64Array(newN);
    const newDegrees = new Float64Array(newN);

    for (let c = 0; c < newN; c++) {
      newAdjMap.set(c, new Map());
    }

    for (let i = 0; i < currentN; i++) {
      const ci = commRenumber.get(community[i])!;
      newSelfLoops[ci] += currentSelfLoops[i];

      for (const edge of currentAdj[i]) {
        const cj = commRenumber.get(community[edge.target])!;
        if (ci === cj) {
          newSelfLoops[ci] += edge.weight / 2; // Each undirected edge counted twice in adj
        } else {
          const map = newAdjMap.get(ci)!;
          map.set(cj, (map.get(cj) || 0) + edge.weight);
        }
      }
    }

    for (let c = 0; c < newN; c++) {
      let deg = newSelfLoops[c] * 2;
      for (const [, w] of newAdjMap.get(c)!) {
        deg += w;
      }
      newDegrees[c] = deg;
    }

    currentN = newN;
    currentDegrees = newDegrees;
    currentSelfLoops = newSelfLoops;
    currentAdj = [];
    for (let c = 0; c < newN; c++) {
      const edges: WeightedEdge[] = [];
      for (const [target, weight] of newAdjMap.get(c)!) {
        edges.push({ target, weight });
      }
      currentAdj.push(edges);
    }
  }

  // Calculate final Modularity Q
  // Q = sum_c [ (in_deg / 2m) - (tot_deg / 2m)^2 ]
  const finalCommTot = new Map<number, number>();
  const finalCommIn = new Map<number, number>();

  for (let i = 0; i < N; i++) {
    const c = nodeToCommunity[i];
    finalCommTot.set(c, (finalCommTot.get(c) || 0) + degrees[i]);
    finalCommIn.set(c, (finalCommIn.get(c) || 0) + selfLoopWeights[i] * 2);

    for (const [neighbor, w] of adjMap.get(i)!) {
      if (nodeToCommunity[neighbor] === c) {
        finalCommIn.set(c, (finalCommIn.get(c) || 0) + w);
      }
    }
  }

  let modularityQ = 0;
  for (const [c, tot] of finalCommTot) {
    const internal = finalCommIn.get(c) || 0;
    const term1 = internal / totalWeight2m;
    const term2 = Math.pow(tot / totalWeight2m, 2);
    modularityQ += term1 - term2;
  }
  modularityQ = Math.round(Math.max(-1, Math.min(1, modularityQ)) * 10000) / 10000;

  // Group accounts by community
  const communityMembers = new Map<number, string[]>();
  for (let i = 0; i < N; i++) {
    const c = nodeToCommunity[i];
    const members = communityMembers.get(c) || [];
    members.push(nodeIds[i]);
    communityMembers.set(c, members);
  }

  // Sort communities by size descending
  const sortedCommunityEntries = Array.from(communityMembers.entries())
    .sort((a, b) => b[1].length - a[1].length);

  // Build clean sequential community ID map
  const cleanIdMap = new Map<number, number>();
  sortedCommunityEntries.forEach(([oldId], idx) => cleanIdMap.set(oldId, idx));

  // Fast account to final clean community ID map
  const accountCommunityMap = new Map<string, number>();
  for (let i = 0; i < N; i++) {
    const oldC = nodeToCommunity[i];
    const cleanId = cleanIdMap.get(oldC)!;
    accountCommunityMap.set(nodeIds[i], cleanId);
  }

  // Calculate detailed community statistics and find bridging transactions
  const communities: Community[] = [];
  const bridgingTransactions: BridgingTransaction[] = [];

  for (let cleanId = 0; cleanId < sortedCommunityEntries.length; cleanId++) {
    const members = sortedCommunityEntries[cleanId][1];
    const memberSet = new Set(members);

    let internalEdgeCount = 0;
    let internalVolume = 0;
    let externalEdgeCount = 0;
    let externalVolume = 0;

    for (const accountId of members) {
      const outEdges = graph.getOutgoing(accountId);
      for (const edge of outEdges) {
        if (memberSet.has(edge.target)) {
          internalEdgeCount++;
          internalVolume += edge.amount;
        } else {
          externalEdgeCount++;
          externalVolume += edge.amount;
        }
      }

      const inEdges = graph.getIncoming(accountId);
      for (const edge of inEdges) {
        if (!memberSet.has(edge.source)) {
          externalEdgeCount++;
          externalVolume += edge.amount;
        }
      }
    }

    const size = members.length;
    const maxPossibleInternalEdges = size > 1 ? size * (size - 1) : 1;
    const internalDensity = size > 1
      ? Math.round((internalEdgeCount / maxPossibleInternalEdges) * 1000) / 1000
      : 1.0;

    const totalVolume = Math.round((internalVolume + externalVolume) * 100) / 100;

    // Risk scoring based on insulation and high internal density
    let riskScore = 20;
    if (internalDensity >= 0.3 && size >= 3) riskScore += 25;
    if (internalVolume > externalVolume && internalVolume > 50000) riskScore += 25;
    if (size >= 4 && size <= 15) riskScore += 15;
    riskScore = Math.min(95, Math.max(10, riskScore));

    communities.push({
      id: cleanId,
      nodeIds: members,
      size,
      totalVolume,
      internalEdgeCount,
      internalVolume: Math.round(internalVolume * 100) / 100,
      internalDensity,
      externalEdgeCount,
      externalVolume: Math.round(externalVolume * 100) / 100,
      riskScore,
    });
  }

  // Collect bridging transactions
  const seenBridgingTxns = new Set<string>();
  for (const edge of allEdges) {
    const fromComm = accountCommunityMap.get(edge.source);
    const toComm = accountCommunityMap.get(edge.target);

    if (fromComm !== undefined && toComm !== undefined && fromComm !== toComm) {
      if (!seenBridgingTxns.has(edge.id)) {
        seenBridgingTxns.add(edge.id);
        bridgingTransactions.push({
          transactionId: edge.id,
          senderAccountId: edge.source,
          receiverAccountId: edge.target,
          amount: edge.amount,
          timestamp: edge.timestamp,
          fromCommunityId: fromComm,
          toCommunityId: toComm,
        });
      }
    }
  }

  // Filter communities by minCommunitySize if requested
  const filteredCommunities = minCommunitySize > 1
    ? communities.filter(c => c.size >= minCommunitySize)
    : communities;

  const endTime = performance.now();
  const executionTimeMs = Math.round((endTime - startTime) * 100) / 100;

  return {
    modularity: modularityQ,
    communities: filteredCommunities,
    totalCommunities: filteredCommunities.length,
    bridgingTransactions,
    executionTimeMs,
  };
}
