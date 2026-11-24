import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  RotateCcw,
  SlidersHorizontal,
  Compass,
  Repeat,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { GraphCanvas } from '../components/graph/GraphCanvas';
import { NodeDetails } from '../components/graph/NodeDetails';
import { EdgeDetails } from '../components/graph/EdgeDetails';
import { useGraphStore } from '../store/graph.store';
import { getGraph } from '../services/graph.service';
import type { GraphNode, GraphEdge, GraphData } from '../types/graph.types';
import { MOCK_GRAPH } from '../services/mock-data';

export default function TransactionExplorer() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const {
    selectedNode,
    selectedEdge,
    setSelectedNode,
    setSelectedEdge,
    setHighlightedPath,
    setHighlightedCycle,
    colorByCommunity,
    setColorByCommunity,
    clearHighlights,
    cyInstance,
    addNodesAndEdges,
  } = useGraphStore();

  const [rawGraphData, setRawGraphData] = useState<GraphData>(MOCK_GRAPH);

  // Filters State
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [accountType, setAccountType] = useState('ALL');
  const [minAmount, setMinAmount] = useState<number>(0);
  const [maxAmount, setMaxAmount] = useState<number>(1000000);
  const hopDepth = 2;
  const [suspiciousOnly, setSuspiciousOnly] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<string>('ALL');

  // Load graph data on mount
  useEffect(() => {
    let mounted = true;
    getGraph().then((data) => {
      if (mounted && data?.nodes?.length > 0) {
        setRawGraphData(data);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Sync search param if changed externally
  useEffect(() => {
    const q = searchParams.get('search');
    if (q) setSearchQuery(q);
  }, [searchParams]);

  // Extract distinct communities present in the loaded dataset
  const availableCommunities = useMemo(() => {
    const counts = new Map<number, number>();
    for (const n of rawGraphData.nodes) {
      const cId = n.communityId ?? (n.properties as any)?.communityId;
      if (typeof cId === 'number' && !isNaN(cId)) {
        counts.set(cId, (counts.get(cId) || 0) + 1);
      }
    }
    return Array.from(counts.entries()).sort((a, b) => a[0] - b[0]);
  }, [rawGraphData]);

  const getCommunityLabel = (id: number, count: number) => {
    switch (id) {
      case 1:
        return `Cluster 1: Offshore Shell Ring (${count} nodes)`;
      case 2:
        return `Cluster 2: Mediterranean Syndicate (${count} nodes)`;
      case 3:
        return `Cluster 3: Sub-Threshold Smurfing (${count} nodes)`;
      case 4:
        return `Cluster 4: Rapid Capital Dispersion (${count} nodes)`;
      case 5:
        return `Cluster 5: Multi-Hop Layering Rings (${count} nodes)`;
      default:
        return `Cluster ${id}: Merchant & Retail Partition (${count} nodes)`;
    }
  };

  // Filtered Graph Data Calculation
  const filteredGraph = useMemo(() => {
    let nodes = rawGraphData.nodes;
    let edges = rawGraphData.edges;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchedNodeIds = new Set(
        nodes.filter(n => n.id.toLowerCase().includes(q)).map(n => n.id)
      );
      // Include 1-hop connected edges and nodes
      const connectedNodeIds = new Set(matchedNodeIds);
      edges.forEach(e => {
        if (matchedNodeIds.has(e.source) || matchedNodeIds.has(e.target)) {
          connectedNodeIds.add(e.source);
          connectedNodeIds.add(e.target);
        }
      });
      nodes = nodes.filter(n => connectedNodeIds.has(n.id));
      edges = edges.filter(e => connectedNodeIds.has(e.source) && connectedNodeIds.has(e.target));
    }

    if (accountType !== 'ALL') {
      nodes = nodes.filter(n => {
        const type = n.accountType || (n.properties as any)?.accountType;
        return type === accountType;
      });
      const remainingIds = new Set(nodes.map(n => n.id));
      edges = edges.filter(e => remainingIds.has(e.source) && remainingIds.has(e.target));
    }

    if (suspiciousOnly) {
      nodes = nodes.filter(n => {
        const rawStatus = String(n.status || (n.properties as any)?.status || '').toLowerCase();
        const risk = Number(n.riskScore ?? (n.properties as any)?.riskScore ?? 0);
        const isFlagged = Boolean((n as any).isFlagged || (n.properties as any)?.isFlagged);
        return rawStatus === 'flagged' || rawStatus === 'suspicious' || isFlagged || risk >= 75;
      });
      const remainingIds = new Set(nodes.map(n => n.id));
      edges = edges.filter(e => remainingIds.has(e.source) && remainingIds.has(e.target));
    }

    if (selectedCommunity !== 'ALL') {
      const commId = Number(selectedCommunity);
      nodes = nodes.filter(n => {
        const cId = n.communityId ?? (n.properties as any)?.communityId;
        return cId === commId;
      });
      const remainingIds = new Set(nodes.map(n => n.id));
      edges = edges.filter(e => remainingIds.has(e.source) && remainingIds.has(e.target));
    }

    if (minAmount > 0 || maxAmount < 1000000) {
      edges = edges.filter(e => e.amount >= minAmount && e.amount <= maxAmount);
    }

    return { nodes, edges };
  }, [rawGraphData, searchQuery, accountType, suspiciousOnly, selectedCommunity, minAmount, maxAmount]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setAccountType('ALL');
    setMinAmount(0);
    setMaxAmount(1000000);
    setSuspiciousOnly(false);
    setSelectedCommunity('ALL');
    clearHighlights();
  };

  const handleHighlightTopCycle = () => {
    // Quick action: highlight cycle 1
    setHighlightedCycle(['ACC-101', 'ACC-102', 'ACC-103', 'ACC-104']);
  };

  const handleRunTraversal = (accountId: string) => {
    navigate(`/analysis?tab=traversal&start=${accountId}&depth=${hopDepth}`);
  };

  const handleAddToCase = (id: string) => {
    navigate(`/investigations?addFinding=${id}`);
  };

  // Connected accounts of selected node
  const connectedAccountIds = useMemo(() => {
    if (!selectedNode) return [];
    const neighbors = new Set<string>();
    rawGraphData.edges.forEach((e) => {
      const src = e.source || (e as any).startNodeId;
      const tgt = e.target || (e as any).endNodeId;
      if (src === selectedNode.id && tgt) neighbors.add(tgt);
      if (tgt === selectedNode.id && src) neighbors.add(src);
    });
    return Array.from(neighbors);
  }, [selectedNode, rawGraphData.edges]);

  // Expand 1-hop neighbors handler
  const handleExpandNeighbors = (newNodes: GraphNode[], newEdges: GraphEdge[], neighborIds: string[]) => {
    // If a community filter is currently isolating another cluster, reset to ALL
    if (selectedCommunity !== 'ALL') {
      setSelectedCommunity('ALL');
    }

    setRawGraphData((prev) => {
      const existingNodeIds = new Set(prev.nodes.map((n) => n.id));
      const existingEdgeIds = new Set(prev.edges.map((e) => e.id));

      const mergedNodes = [...prev.nodes];
      for (const n of newNodes) {
        if (!existingNodeIds.has(n.id)) {
          mergedNodes.push(n);
          existingNodeIds.add(n.id);
        }
      }

      const mergedEdges = [...prev.edges];
      for (const e of newEdges) {
        if (!existingEdgeIds.has(e.id)) {
          mergedEdges.push(e);
          existingEdgeIds.add(e.id);
        }
      }

      return { nodes: mergedNodes, edges: mergedEdges };
    });

    addNodesAndEdges(newNodes, newEdges);
    setHighlightedPath(neighborIds);

    // Zoom and center smoothly on the expanded cluster
    if (cyInstance && neighborIds.length > 0) {
      setTimeout(() => {
        const eles = cyInstance.nodes().filter((n) => neighborIds.includes(n.id()));
        if (eles.length > 0) {
          cyInstance.animate({
            center: { eles },
            zoom: Math.min(cyInstance.zoom() * 1.15, 1.4),
            duration: 400,
          });
        }
      }, 120);
    }
  };

  // Real-time node status & color update handler
  const handleUpdateNode = (nodeId: string, updates: Partial<GraphNode>) => {
    // 1. Update rawGraphData state so filters and lists retain the update
    setRawGraphData((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => {
        if (n.id === nodeId) {
          return {
            ...n,
            ...updates,
            status: updates.status || n.status,
            riskScore: updates.riskScore ?? n.riskScore,
            isFlagged: updates.isFlagged ?? (n as any).isFlagged,
            properties: {
              ...(n.properties || {}),
              ...updates,
            },
            data: {
              ...(n as any).data,
              ...updates,
            },
          };
        }
        return n;
      }),
    }));

    // 2. Update selectedNode view immediately
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode({ ...selectedNode, ...updates });
    }

    // 3. Immediately repaint Cytoscape canvas element in real time
    if (cyInstance) {
      const ele = cyInstance.getElementById(nodeId);
      if (ele.length > 0) {
        const isSus = Boolean(
          updates.isFlagged ||
          updates.status === 'flagged' ||
          (updates.riskScore ?? 0) >= 75
        );
        const color = isSus ? '#ef4444' : '#3b82f6';
        const borderColor = isSus ? '#b91c1c' : '#2563eb';
        ele.data('status', updates.status);
        ele.data('riskScore', updates.riskScore);
        ele.data('isFlagged', updates.isFlagged);
        ele.data('bgColor', color);
        ele.style({
          'background-color': color,
          'border-color': borderColor,
          'border-width': isSus ? 3 : 2,
        });
      }
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5.5rem)] -m-4 sm:-m-6 bg-slate-50 overflow-hidden text-slate-800">
      {/* Top Explorer Filter & Quick Action Bar */}
      <div className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between gap-4 z-10 shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-400" />
            Transaction Graph Explorer
          </h2>
          <span className="text-xs text-slate-400 font-mono hidden md:inline">
            ({filteredGraph.nodes.length} nodes, {filteredGraph.edges.length} edges active)
          </span>
        </div>

        {/* Quick Traversal / Highlighting Action Pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleHighlightTopCycle}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition cursor-pointer"
          >
            <Repeat className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">Highlight Shell Loop</span>
          </button>

          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs transition border border-slate-200 cursor-pointer"
            title="Reset All Filters"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Main 3-Panel Workspace */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Left Filter Panel */}
        <div className="w-64 sm:w-72 bg-white border-r border-slate-200 p-4 flex flex-col gap-4 overflow-y-auto shrink-0 z-10 text-xs shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" /> Graph Filters
            </span>
            <button
              onClick={handleResetFilters}
              className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
            >
              Reset
            </button>
          </div>

          {/* Account ID Search */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Account ID / Entity</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. ACC-101"
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 font-mono text-xs"
              />
            </div>
          </div>

          {/* Account Type */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Account Type</label>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 text-xs"
            >
              <option value="ALL">All Account Types</option>
              <option value="CHECKING">Checking Account</option>
              <option value="SAVINGS">Savings Account</option>
              <option value="BUSINESS">Business Entity</option>
              <option value="SHELL_COMPANY">Shell Company (High Risk)</option>
              <option value="CRYPTO_EXCHANGE">Crypto Exchange Gateway</option>
              <option value="MERCHANT">Commercial Merchant</option>
            </select>
          </div>

          {/* Amount Range */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Min Transaction Amount</label>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">$</span>
              <input
                type="number"
                min="0"
                step="5000"
                value={minAmount}
                onChange={(e) => setMinAmount(Number(e.target.value))}
                className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs font-mono focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Community Filter */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Louvain Community</label>
            <select
              value={selectedCommunity}
              onChange={(e) => setSelectedCommunity(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 text-xs font-medium"
            >
              <option value="ALL">All Communities</option>
              {availableCommunities.length > 0 ? (
                availableCommunities.map(([id, count]) => (
                  <option key={id} value={String(id)}>
                    {getCommunityLabel(id, count)}
                  </option>
                ))
              ) : (
                <>
                  <option value="1">Cluster 1: Offshore Shell Ring (10 nodes)</option>
                  <option value="2">Cluster 2: Mediterranean Syndicate (12 nodes)</option>
                  <option value="3">Cluster 3: Sub-Threshold Smurfing (11 nodes)</option>
                  <option value="4">Cluster 4: Rapid Capital Dispersion (16 nodes)</option>
                  <option value="5">Cluster 5: Multi-Hop Layering Rings</option>
                </>
              )}
            </select>
          </div>

          {/* Suspicious Only Toggle */}
          <div className="pt-2 border-t border-slate-200">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={suspiciousOnly}
                onChange={(e) => setSuspiciousOnly(e.target.checked)}
                className="rounded border-slate-300 bg-white text-red-600 focus:ring-red-500"
              />
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                Suspicious / Flagged Only
              </span>
            </label>
          </div>
        </div>

        {/* Center Panel: Interactive Cytoscape Canvas */}
        <div className="flex-1 relative h-full">
          <GraphCanvas
            graphData={filteredGraph}
            onNodeSelect={(node: GraphNode | null) => setSelectedNode(node)}
            onEdgeSelect={(edge: GraphEdge | null) => setSelectedEdge(edge)}
          />
        </div>

        {/* Right Details Drawer */}
        {selectedNode ? (
          <NodeDetails
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
            onStartTraversal={handleRunTraversal}
            onAddToInvestigation={handleAddToCase}
            onExpandNeighbors={handleExpandNeighbors}
            onUpdateNode={handleUpdateNode}
            connectedAccountIds={connectedAccountIds}
          />
        ) : selectedEdge ? (
          <EdgeDetails
            edge={selectedEdge}
            onClose={() => setSelectedEdge(null)}
            onAddToInvestigation={handleAddToCase}
          />
        ) : (
          <div className="w-80 bg-white border-l border-slate-200 p-6 hidden xl:flex flex-col items-center justify-center text-center text-slate-500 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3 border border-slate-200">
              <Info className="w-6 h-6 text-blue-500" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">Entity Details Inspection</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
              Click on any account node to inspect balance, community cluster, expand neighbors, or flag suspicious activity in real time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
