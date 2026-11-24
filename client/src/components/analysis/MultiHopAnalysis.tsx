import { useState, useEffect, useMemo } from 'react';
import {
  Compass,
  ArrowRight,
  Clock,
  Layers,
  Send,
  Sparkles,
  Info,
} from 'lucide-react';
import { runBFS, runDFS, getGraph, getNeighbors } from '../../services/graph.service';
import type { TraversalResult, GraphNode, GraphEdge, GraphData } from '../../types/graph.types';
import { formatCurrency } from '../../utils/format';
import { useGraphStore } from '../../store/graph.store';
import { GraphCanvas } from '../graph/GraphCanvas';
import { NodeDetails } from '../graph/NodeDetails';
import { MOCK_GRAPH } from '../../services/mock-data';

export function MultiHopAnalysis() {
  const { setHighlightedPath } = useGraphStore();

  const [startAccount, setStartAccount] = useState('ACC-101');
  const [algorithm, setAlgorithm] = useState<'BFS' | 'DFS'>('BFS');
  const [direction, setDirection] = useState<'OUTGOING' | 'INCOMING' | 'BOTH'>('OUTGOING');
  const [depth, setDepth] = useState<number>(3);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<TraversalResult | null>(null);

  // Canvas graph data and node selection for NodeDetails drawer
  const [canvasGraphData, setCanvasGraphData] = useState<GraphData>(MOCK_GRAPH);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // Fetch real graph data on mount
  useEffect(() => {
    getGraph({ limit: 300 }).then((data) => {
      if (data && data.nodes && data.nodes.length > 0) {
        setCanvasGraphData((prev) => {
          const existingNodeIds = new Set(prev.nodes.map((n) => n.id));
          const existingEdgeIds = new Set(prev.edges.map((e) => e.id));
          const mergedNodes = [...prev.nodes];
          data.nodes.forEach((n) => {
            if (!existingNodeIds.has(n.id)) {
              mergedNodes.push(n);
              existingNodeIds.add(n.id);
            }
          });
          const mergedEdges = [...prev.edges];
          data.edges.forEach((e) => {
            if (!existingEdgeIds.has(e.id)) {
              mergedEdges.push(e);
              existingEdgeIds.add(e.id);
            }
          });
          return { nodes: mergedNodes, edges: mergedEdges };
        });
      }
    });
  }, []);

  const handleRunTraversal = async () => {
    setIsRunning(true);
    try {
      const opts = {
        startNodeId: startAccount.trim() || 'ACC-101',
        direction,
        maxDepth: depth,
      };
      const res = algorithm === 'BFS' ? await runBFS(opts) : await runDFS(opts);
      setResult(res);

      // Merge any traversed subgraph elements into canvasGraphData so all paths render on canvas
      if (res.graph && res.graph.nodes && res.graph.nodes.length > 0) {
        setCanvasGraphData((prev) => {
          const existingNodeIds = new Set(prev.nodes.map((n) => n.id));
          const existingEdgeIds = new Set(prev.edges.map((e) => e.id));

          const newNodes = [...prev.nodes];
          res.graph!.nodes.forEach((n) => {
            if (!existingNodeIds.has(n.id)) {
              newNodes.push(n);
              existingNodeIds.add(n.id);
            }
          });

          const newEdges = [...prev.edges];
          res.graph!.edges.forEach((e) => {
            if (!existingEdgeIds.has(e.id)) {
              newEdges.push(e);
              existingEdgeIds.add(e.id);
            }
          });

          return { nodes: newNodes, edges: newEdges };
        });
      }

      if (res.paths && res.paths.length > 0) {
        // Automatically highlight first or longest discovered path
        setHighlightedPath(res.paths[0].path);
      }
    } catch (err) {
      console.error('Traversal failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleNodeClick = (nodeId: string) => {
    const found = canvasGraphData.nodes.find((n) => n.id === nodeId);
    if (found) {
      setSelectedNode(found);
    } else {
      // Fetch neighbor details if not present in canvas
      getNeighbors(nodeId, 1).then((data) => {
        if (data && data.nodes && data.nodes.length > 0) {
          const fetched = data.nodes.find((n) => n.id === nodeId) || data.nodes[0];
          setSelectedNode(fetched);
          setCanvasGraphData((prev) => {
            const existingNodeIds = new Set(prev.nodes.map((n) => n.id));
            const existingEdgeIds = new Set(prev.edges.map((e) => e.id));
            return {
              nodes: [...prev.nodes, ...data.nodes.filter((n) => !existingNodeIds.has(n.id))],
              edges: [...prev.edges, ...data.edges.filter((e) => !existingEdgeIds.has(e.id))],
            };
          });
        }
      });
    }
  };

  const connectedAccountIds = useMemo(() => {
    if (!selectedNode) return [];
    const connected = new Set<string>();
    canvasGraphData.edges.forEach((e) => {
      if (e.source === selectedNode.id) connected.add(e.target);
      if (e.target === selectedNode.id) connected.add(e.source);
    });
    return Array.from(connected);
  }, [selectedNode, canvasGraphData.edges]);

  const allAccountsList = useMemo(() => {
    return canvasGraphData.nodes.map((n) => ({
      id: n.id,
      type: n.accountType ?? 'CHECKING',
      risk: n.riskScore ?? 0,
      status: n.status ?? 'normal',
    }));
  }, [canvasGraphData.nodes]);

  return (
    <div className="space-y-6">
      {/* Parameter Control Panel */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-600" />
              Multi-Hop Graph Traversal Engine (BFS & DFS)
            </h3>
            <p className="text-xs text-slate-500">
              Discover downstream fund laundering paths, cash-out points, and reachable counterparties
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Cycle-Safe Exploration
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {/* Starting Account */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Starting Account ID</label>
            <input
              type="text"
              list="account-list"
              value={startAccount}
              onChange={(e) => setStartAccount(e.target.value)}
              placeholder="Search or select account…"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-xs focus:outline-none focus:border-blue-500"
            />
            <datalist id="account-list">
              {allAccountsList.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id} — {a.type} | Risk {a.risk} | {a.status}
                </option>
              ))}
            </datalist>
          </div>

          {/* Algorithm Type */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Traversal Algorithm</label>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value as 'BFS' | 'DFS')}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="BFS">Breadth-First Search (Level-by-Level)</option>
              <option value="DFS">Depth-First Search (Deep Path Backtracking)</option>
            </select>
          </div>

          {/* Direction */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Flow Direction</label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="OUTGOING">Outgoing Transactions (Source &rarr; Dest)</option>
              <option value="INCOMING">Incoming Transactions (Source &larr; Dest)</option>
              <option value="BOTH">Bidirectional Traversal</option>
            </select>
          </div>

          {/* Hop Depth */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-slate-600 font-semibold">Max Hop Depth: {depth}</label>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer mt-1.5"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleRunTraversal}
            disabled={isRunning}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 !text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 transition cursor-pointer active:scale-[0.99] disabled:opacity-50"
          >
            <Send className="w-4 h-4 !text-white shrink-0" />
            <span className="!text-white font-bold">{isRunning ? 'Traversing Graph...' : 'Run Traversal Algorithm'}</span>
          </button>
        </div>
      </div>

      {/* Traversal Execution Results */}
      {result && (
        <div className="space-y-6">
          {/* Metrics summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 mb-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Execution Time</span>
              </div>
              <div className="text-xl font-mono font-bold text-slate-900">{result.executionTimeMs} ms</div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 mb-1">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>Nodes Visited</span>
              </div>
              <div className="text-xl font-mono font-bold text-emerald-700">{result.nodesVisitedCount}</div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 mb-1">
                <Compass className="w-3.5 h-3.5 text-amber-600" />
                <span>Reachable Accounts</span>
              </div>
              <div className="text-xl font-mono font-bold text-amber-700">{result.reachableAccounts.length}</div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>Discovered Paths</span>
              </div>
              <div className="text-xl font-mono font-bold text-purple-700">{result.paths.length}</div>
            </div>
          </div>

          {/* Interactive Graph Canvas displaying traversed path & Node Details Drawer */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Compass className="w-4 h-4 text-blue-600" />
                Traversed Path Visualization
              </span>
              <span className="text-xs text-slate-500">
                Click any row below to highlight path • Click nodes on canvas to inspect Node Details
              </span>
            </div>

            <div className="flex flex-col lg:flex-row h-[480px]">
              {/* Canvas Viewport */}
              <div className="flex-1 relative h-full">
                <GraphCanvas
                  graphData={canvasGraphData}
                  onNodeSelect={(node) => setSelectedNode(node)}
                  focusNodeId={selectedNode?.id}
                />
              </div>

              {/* Node Details Panel when node is clicked */}
              {selectedNode && (
                <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-200 bg-white overflow-y-auto">
                  <NodeDetails
                    node={selectedNode}
                    onClose={() => setSelectedNode(null)}
                    onStartTraversal={(id) => {
                      setStartAccount(id);
                      setSelectedNode(null);
                    }}
                    onExpandNeighbors={(newNodes, newEdges) => {
                      setCanvasGraphData((prev) => {
                        const existingNodeIds = new Set(prev.nodes.map((n) => n.id));
                        const existingEdgeIds = new Set(prev.edges.map((e) => e.id));
                        return {
                          nodes: [...prev.nodes, ...newNodes.filter((n) => !existingNodeIds.has(n.id))],
                          edges: [...prev.edges, ...newEdges.filter((e) => !existingEdgeIds.has(e.id))],
                        };
                      });
                    }}
                    connectedAccountIds={connectedAccountIds}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Discovered Paths Table */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs overflow-x-auto">
            <h4 className="text-sm font-bold text-slate-900 mb-3">Reachable Hop Sequences & Cash-Out Paths</h4>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 font-semibold">Hop Depth</th>
                  <th className="pb-3 font-semibold">Target Account</th>
                  <th className="pb-3 font-semibold">Path Traversal Route</th>
                  <th className="pb-3 font-semibold">Cumulative Volume</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.paths.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 text-[11px]">
                        Depth {p.depth}
                      </span>
                    </td>
                    <td className="py-2.5 font-mono font-semibold text-slate-900">
                      <button
                        onClick={() => handleNodeClick(p.targetAccountId)}
                        className="hover:text-blue-600 hover:underline cursor-pointer font-bold"
                        title="Click to inspect node details"
                      >
                        {p.targetAccountId}
                      </button>
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-1 font-mono text-[11px] text-slate-700 flex-wrap">
                        {p.path.map((node, i) => (
                          <span key={i} className="flex items-center gap-1">
                            <button
                              onClick={() => handleNodeClick(node)}
                              className={`cursor-pointer hover:underline ${
                                i === 0
                                  ? 'text-blue-700 font-bold'
                                  : i === p.path.length - 1
                                  ? 'text-amber-700 font-bold'
                                  : 'text-slate-700'
                              }`}
                              title={`Click to view details of ${node}`}
                            >
                              {node}
                            </button>
                            {i < p.path.length - 1 && <ArrowRight className="w-3 h-3 text-slate-400" />}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 font-mono text-slate-700">
                      {formatCurrency(p.totalAmount ?? 120000)}
                    </td>
                    <td className="py-2.5 text-right space-x-1.5">
                      <button
                        onClick={() => setHighlightedPath(p.path)}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold transition cursor-pointer"
                      >
                        Highlight Path
                      </button>
                      <button
                        onClick={() => handleNodeClick(p.targetAccountId)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
