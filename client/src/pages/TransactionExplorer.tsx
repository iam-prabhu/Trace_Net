import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  RotateCcw,
  SlidersHorizontal,
  Compass,
  Repeat,
  Palette,
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
  } = useGraphStore();

  const [rawGraphData, setRawGraphData] = useState<GraphData>(MOCK_GRAPH);

  // Filters State
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [accountType, setAccountType] = useState('ALL');
  const [minAmount, setMinAmount] = useState<number>(0);
  const [maxAmount, setMaxAmount] = useState<number>(1000000);
  const [hopDepth, setHopDepth] = useState<number>(2);
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
      nodes = nodes.filter(n => n.accountType === accountType);
      const remainingIds = new Set(nodes.map(n => n.id));
      edges = edges.filter(e => remainingIds.has(e.source) && remainingIds.has(e.target));
    }

    if (suspiciousOnly) {
      nodes = nodes.filter(n => n.status === 'flagged' || n.status === 'suspicious' || (n.riskScore ?? 0) >= 70);
      const remainingIds = new Set(nodes.map(n => n.id));
      edges = edges.filter(e => remainingIds.has(e.source) && remainingIds.has(e.target));
    }

    if (selectedCommunity !== 'ALL') {
      const commId = Number(selectedCommunity);
      nodes = nodes.filter(n => n.communityId === commId);
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
    setHopDepth(2);
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

  return (
    <div className="flex flex-col h-[calc(100vh-5.5rem)] -m-4 sm:-m-6 bg-[#070b14] overflow-hidden text-slate-200">
      {/* Top Explorer Filter & Quick Action Bar */}
      <div className="h-14 bg-slate-900/90 border-b border-slate-800 px-4 flex items-center justify-between gap-4 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
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
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold transition"
          >
            <Repeat className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Highlight Shell Loop</span>
          </button>

          <button
            onClick={() => setColorByCommunity(!colorByCommunity)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
              colorByCommunity
                ? 'bg-purple-600/30 text-purple-300 border-purple-500/50'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Communities</span>
          </button>

          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition border border-slate-700"
            title="Reset All Filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Main 3-Panel Workspace */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Left Filter Panel */}
        <div className="w-64 sm:w-72 bg-slate-900/95 border-r border-slate-800 p-4 flex flex-col gap-4 overflow-y-auto shrink-0 z-10 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" /> Graph Filters
            </span>
            <button
              onClick={handleResetFilters}
              className="text-[11px] text-blue-400 hover:underline"
            >
              Reset
            </button>
          </div>

          {/* Account ID Search */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Account ID / Entity</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. ACC-101"
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 font-mono text-xs"
              />
            </div>
          </div>

          {/* Account Type */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Account Type</label>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 text-xs"
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

          {/* Hop Depth Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-400 font-semibold">Max Exploration Depth</label>
              <span className="font-mono text-blue-400 font-bold">{hopDepth} Hops</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={hopDepth}
              onChange={(e) => setHopDepth(Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
            </div>
          </div>

          {/* Amount Range */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Min Transaction Amount</label>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">$</span>
              <input
                type="number"
                min="0"
                step="5000"
                value={minAmount}
                onChange={(e) => setMinAmount(Number(e.target.value))}
                className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono"
              />
            </div>
          </div>

          {/* Community Filter */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Louvain Community</label>
            <select
              value={selectedCommunity}
              onChange={(e) => setSelectedCommunity(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 text-xs"
            >
              <option value="ALL">All Communities</option>
              <option value="1">Cluster 1 (Offshore Shell Ring)</option>
              <option value="2">Cluster 2 (Rapid P2P Triangle)</option>
              <option value="3">Cluster 3 (Merchant Clearing)</option>
            </select>
          </div>

          {/* Suspicious Only Toggle */}
          <div className="pt-2 border-t border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={suspiciousOnly}
                onChange={(e) => setSuspiciousOnly(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-red-500 focus:ring-red-500"
              />
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
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
          />
        ) : selectedEdge ? (
          <EdgeDetails
            edge={selectedEdge}
            onClose={() => setSelectedEdge(null)}
            onAddToInvestigation={handleAddToCase}
          />
        ) : (
          <div className="w-80 bg-slate-900 border-l border-slate-800 p-6 hidden xl:flex flex-col items-center justify-center text-center text-slate-500">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-400 mb-3 border border-slate-700">
              <Info className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-300">Entity Details Inspection</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Click on any account node to inspect balance, community cluster, and neighbor expansion, or select an edge to inspect transaction flow details.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
