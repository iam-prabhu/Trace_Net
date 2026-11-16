import { useState } from 'react';
import {
  Compass,
  ArrowRight,
  Clock,
  Layers,
  Send,
  Sparkles,
} from 'lucide-react';
import { runBFS, runDFS } from '../../services/graph.service';
import type { TraversalResult } from '../../types/graph.types';
import { formatCurrency } from '../../utils/format';
import { useGraphStore } from '../../store/graph.store';
import { GraphCanvas } from '../graph/GraphCanvas';
import { MOCK_GRAPH } from '../../services/mock-data';

export function MultiHopAnalysis() {
  const { setHighlightedPath } = useGraphStore();

  const [startAccount, setStartAccount] = useState('ACC-101');
  const [algorithm, setAlgorithm] = useState<'BFS' | 'DFS'>('BFS');
  const [direction, setDirection] = useState<'OUTGOING' | 'INCOMING' | 'BOTH'>('OUTGOING');
  const [depth, setDepth] = useState<number>(3);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<TraversalResult | null>(null);

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

      if (res.paths.length > 0) {
        // Automatically highlight longest path
        setHighlightedPath(res.paths[res.paths.length - 1].path);
      }
    } catch (err) {
      console.error('Traversal failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Parameter Control Panel */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-400" />
              Multi-Hop Graph Traversal Engine (BFS & DFS)
            </h3>
            <p className="text-xs text-slate-400">
              Discover downstream fund laundering paths, cash-out points, and reachable counterparties
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            Cycle-Safe Exploration
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {/* Starting Account */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Starting Account ID</label>
            <input
              type="text"
              value={startAccount}
              onChange={(e) => setStartAccount(e.target.value)}
              placeholder="e.g. ACC-101"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Algorithm Type */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Traversal Algorithm</label>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value as 'BFS' | 'DFS')}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="BFS">Breadth-First Search (Level-by-Level)</option>
              <option value="DFS">Depth-First Search (Deep Path Backtracking)</option>
            </select>
          </div>

          {/* Direction */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Flow Direction</label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="OUTGOING">Outgoing Transactions (Source &rarr; Dest)</option>
              <option value="INCOMING">Incoming Transactions (Source &larr; Dest)</option>
              <option value="BOTH">Bidirectional Traversal</option>
            </select>
          </div>

          {/* Hop Depth */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-slate-400 font-semibold">Max Hop Depth: {depth}</label>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer mt-1.5"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleRunTraversal}
            disabled={isRunning}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-500/20 transition"
          >
            <Send className="w-3.5 h-3.5" />
            {isRunning ? 'Traversing Graph...' : 'Run Traversal Algorithm'}
          </button>
        </div>
      </div>

      {/* Traversal Execution Results */}
      {result && (
        <div className="space-y-6">
          {/* Metrics summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mb-1">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>Execution Time</span>
              </div>
              <div className="text-xl font-mono font-bold text-white">{result.executionTimeMs} ms</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mb-1">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Nodes Visited</span>
              </div>
              <div className="text-xl font-mono font-bold text-emerald-400">{result.nodesVisitedCount}</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mb-1">
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                <span>Reachable Accounts</span>
              </div>
              <div className="text-xl font-mono font-bold text-amber-400">{result.reachableAccounts.length}</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Discovered Paths</span>
              </div>
              <div className="text-xl font-mono font-bold text-purple-400">{result.paths.length}</div>
            </div>
          </div>

          {/* Interactive Graph Canvas displaying traversed path */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-2xl">
            <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-400" />
                Traversed Path Visualization
              </span>
              <span className="text-xs text-slate-400">
                Click any row below to highlight path on canvas
              </span>
            </div>
            <div className="h-[320px]">
              <GraphCanvas graphData={MOCK_GRAPH} hideLegend />
            </div>
          </div>

          {/* Discovered Paths Table */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-x-auto">
            <h4 className="text-sm font-bold text-white mb-3">Reachable Hop Sequences & Cash-Out Paths</h4>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Hop Depth</th>
                  <th className="pb-3 font-semibold">Target Account</th>
                  <th className="pb-3 font-semibold">Path Traversal Route</th>
                  <th className="pb-3 font-semibold">Cumulative Volume</th>
                  <th className="pb-3 font-semibold text-right">Canvas Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {result.paths.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px]">
                        Depth {p.depth}
                      </span>
                    </td>
                    <td className="py-2.5 font-mono font-semibold text-white">
                      {p.targetAccountId}
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-1 font-mono text-[11px] text-slate-300">
                        {p.path.map((node, i) => (
                          <span key={i} className="flex items-center gap-1">
                            <span className={i === 0 ? 'text-blue-400 font-bold' : i === p.path.length - 1 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                              {node}
                            </span>
                            {i < p.path.length - 1 && <ArrowRight className="w-3 h-3 text-slate-600" />}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 font-mono text-slate-300">
                      {formatCurrency(p.totalAmount ?? 120000)}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => setHighlightedPath(p.path)}
                        className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold transition"
                      >
                        Highlight Path
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
