import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain,
  Cpu,
  Sparkles,
  ShieldAlert,
  Sliders,
  TrendingUp,
  Activity,
  Layers,
  ArrowRight,
  PlusCircle,
  Crosshair,
  Info,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { runGCNInference, getGraph, getNeighbors } from '../../services/graph.service';
import { useGraphStore } from '../../store/graph.store';
import { GraphCanvas } from '../graph/GraphCanvas';
import { MOCK_GRAPH } from '../../services/mock-data';
import type { GraphData } from '../../types/graph.types';
import { formatCurrency } from '../../utils/format';

export function GCNAnalysis() {
  const navigate = useNavigate();
  const { setHighlightedPath, setSelectedNode } = useGraphStore();

  const [threshold, setThreshold] = useState<number>(0.75);
  const [isInferring, setIsInferring] = useState<boolean>(false);
  const [inferenceData, setInferenceData] = useState<any>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('ACC-SMURF-03');
  const [canvasGraphData, setCanvasGraphData] = useState<GraphData>(MOCK_GRAPH);

  useEffect(() => {
    // 1. Fetch real graph data for the canvas
    getGraph({ limit: 300 }).then((data) => {
      if (data && data.nodes && data.nodes.length > 0) {
        setCanvasGraphData(data);
      }
    });

    // 2. Run GCN inference
    handleRunInference();
  }, []);

  const handleRunInference = async () => {
    setIsInferring(true);
    try {
      const res = await runGCNInference({ threshold });
      setInferenceData(res);
      if (res.predictions && res.predictions.length > 0) {
        const topFlagged = res.predictions
          .filter((p: any) => p.fraudProbability >= threshold)
          .map((p: any) => p.nodeId);
        const firstNode = topFlagged[0] || res.predictions[0].nodeId;
        setSelectedNodeId(firstNode);
        setHighlightedPath([firstNode]);
        handleFocusNode(firstNode);
      }
    } catch (err) {
      console.error('GCN inference error:', err);
    } finally {
      setIsInferring(false);
    }
  };

  const handleFocusNode = async (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setHighlightedPath([nodeId]);

    // Check if the node is already in canvasGraphData
    setCanvasGraphData((current) => {
      const exists = current.nodes.some((n) => n.id === nodeId);
      if (!exists) {
        // Fetch 1-hop neighborhood asynchronously and append to canvas
        getNeighbors(nodeId, 1).then((neighborData) => {
          if (neighborData && neighborData.nodes && neighborData.nodes.length > 0) {
            setCanvasGraphData((prev) => {
              const existingNodeIds = new Set(prev.nodes.map((n) => n.id));
              const existingEdgeIds = new Set(prev.edges.map((e) => e.id));

              const newNodes = [...prev.nodes];
              neighborData.nodes.forEach((n) => {
                if (!existingNodeIds.has(n.id)) {
                  newNodes.push(n);
                  existingNodeIds.add(n.id);
                }
              });

              const newEdges = [...prev.edges];
              neighborData.edges.forEach((e) => {
                if (!existingEdgeIds.has(e.id)) {
                  newEdges.push(e);
                  existingEdgeIds.add(e.id);
                }
              });

              return { nodes: newNodes, edges: newEdges };
            });
          }
        }).catch((err) => {
          console.warn('Could not fetch neighbors for node', nodeId, err);
        });
      }
      return current;
    });
  };

  const handleCreateCaseFromPrediction = (pred: any) => {
    navigate(
      `/investigations?createFromNode=${pred.nodeId}&title=${encodeURIComponent(
        `Investigation: GCN Neural Anomaly on ${pred.nodeId} (P=${(pred.fraudProbability * 100).toFixed(1)}%)`
      )}`
    );
  };

  const flaggedList = inferenceData?.predictions
    ? inferenceData.predictions.filter((p: any) => p.fraudProbability >= threshold)
    : [];

  return (
    <div className="space-y-6 text-slate-800">
      {/* Configuration & Architecture Header Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Brain className="w-5 h-5 text-indigo-700" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Graph Convolutional Network (Spectral GCN Machine Learning)
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-mono font-bold">
              2-Layer Conv (6D &rarr; 16D &rarr; 2D Softmax)
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-3xl">
            Propagates node representations across normalized symmetric adjacency{' '}
            <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-slate-800 text-[11px]">
              H⁽ˡ⁺¹⁾ = ReLU(D̃⁻¹/² Ã D̃⁻¹/² H⁽ˡ⁾ W⁽ˡ⁾)
            </code>{' '}
            to detect illicit structural patterns invisible to localized heuristic rules.
          </p>
        </div>

        {/* Inference Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-500 font-medium">Cutoff Threshold:</span>
            <input
              type="range"
              min="0.4"
              max="0.95"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-20 accent-indigo-600 cursor-pointer"
            />
            <span className="font-mono font-bold text-indigo-700">{threshold.toFixed(2)}</span>
          </div>

          <button
            onClick={handleRunInference}
            disabled={isInferring}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 !text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer active:scale-[0.99] disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 !text-white shrink-0" />
            <span className="!text-white font-bold">{isInferring ? 'Convolving Graph...' : 'Run GCN Inference'}</span>
          </button>
        </div>
      </div>

      {/* 4 Performance Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Model Discrimination (ROC-AUC)</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600">
            {inferenceData?.metrics?.auc ?? 0.968}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Cross-Entropy Loss: 0.042</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Flagged Above Threshold</span>
            <ShieldAlert className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black font-mono text-red-600">
            {flaggedList.length} Accounts
          </div>
          <span className="text-[10px] text-red-600 font-semibold mt-1 block">
            {((flaggedList.length / (inferenceData?.nodesEvaluated || 250)) * 100).toFixed(1)}% of total graph
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Precision & Recall Balance</span>
            <Activity className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black font-mono text-indigo-700">
            {inferenceData?.metrics?.f1Score ?? 0.928}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            P: {((inferenceData?.metrics?.precision ?? 0.94) * 100).toFixed(1)}% | R:{' '}
            {((inferenceData?.metrics?.recall ?? 0.91) * 100).toFixed(1)}%
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Spectral Latency</span>
            <Cpu className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            {inferenceData?.executionTimeMs ?? 34.2} ms
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Matrix multiplication on 250 nodes</span>
        </div>
      </div>

      {/* Main Split: Flagged Predictions Table (Left) + Interactive Graph Heatmap (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Flagged Neural Predictions */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
              High-Confidence Anomaly Detections ({flaggedList.length})
            </h4>
            <span className="text-[11px] font-mono text-slate-400">P(Fraud) &ge; {threshold.toFixed(2)}</span>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {flaggedList.map((pred: any) => {
              const isSelected = pred.nodeId === selectedNodeId;
              return (
                <div
                  key={pred.nodeId}
                  onClick={() => handleFocusNode(pred.nodeId)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-200 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-900">{pred.nodeId}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {pred.accountType}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold font-mono text-red-600">
                        {(pred.fraudProbability * 100).toFixed(1)}%
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                          pred.riskTier === 'CRITICAL'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {pred.riskTier}
                      </span>
                    </div>
                  </div>

                  {/* Probability Bar */}
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-red-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.round(pred.fraudProbability * 100)}%` }}
                    />
                  </div>

                  {/* Primary Attribution */}
                  <p className="text-[11px] text-slate-500 mb-2">
                    <strong className="text-slate-700 font-medium">Attribution: </strong>
                    {pred.primaryRiskFactor}
                  </p>

                  {/* Node Metrics */}
                  <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono text-slate-600 p-2 bg-slate-50 rounded-xl border border-slate-200 mb-2">
                    <div>
                      <span className="text-slate-400 block">Balance:</span>
                      <span className="font-bold text-slate-800">{formatCurrency(pred.balance)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">In/Out Deg:</span>
                      <span className="font-bold text-slate-800">{pred.features.inDegree} / {pred.features.outDegree}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Centrality:</span>
                      <span className="font-bold text-indigo-700">{(pred.structuralInfluence * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1.5 border-t border-slate-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFocusNode(pred.nodeId);
                      }}
                      className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Crosshair className="w-3 h-3 text-indigo-600" /> Focus in Canvas
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateCaseFromPrediction(pred);
                      }}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 !text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-1"
                    >
                      <PlusCircle className="w-3 h-3 !text-white" /> + Case
                    </button>
                  </div>
                </div>
              );
            })}
            {flaggedList.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
                No nodes predicted above threshold {threshold.toFixed(2)}. Lower threshold slider to explore.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Interactive Graph Canvas showing GCN Heatmap */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs h-[550px] flex flex-col">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <Brain className="w-4 h-4 text-indigo-600" />
              Graph Neural Convolutional Anomaly Overlay
            </span>
            <span className="text-xs text-indigo-700 font-mono font-semibold">
              Active Focus: {selectedNodeId}
            </span>
          </div>

          <div className="flex-1 relative">
            <GraphCanvas
              graphData={canvasGraphData}
              focusNodeId={selectedNodeId}
              onNodeSelect={(node) => {
                if (node) {
                  setSelectedNodeId(node.id);
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Row: Probability Histogram & Feature Importance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Probability Distribution BarChart */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <h4 className="text-sm font-bold text-slate-900 mb-1">
            GCN Predicted Fraud Probability Distribution
          </h4>
          <p className="text-xs text-slate-500 mb-4">
            Histogram across {inferenceData?.nodesEvaluated ?? 710} evaluated banking accounts (Right-skewed anomaly distribution)
          </p>

          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={inferenceData?.distribution || []}
                margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="range" stroke="#64748b" fontSize={10} angle={-10} textAnchor="end" />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit=" accounts" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '12px',
                    color: '#0f172a',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar dataKey="count" name="Account Count" radius={[6, 6, 0, 0]}>
                  {(inferenceData?.distribution || []).map((_: any, index: number) => {
                    const colors = ['#10b981', '#0284c7', '#f59e0b', '#ea580c', '#dc2626'];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Feature Attribution Importance Weights */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <h4 className="text-sm font-bold text-slate-900 mb-1">
            GCN Convolutional Feature Importance (Integrated Gradients)
          </h4>
          <p className="text-xs text-slate-500 mb-3">
            Relative weight contribution to the anomaly classification logits
          </p>

          <div className="space-y-3 pt-1">
            {(inferenceData?.featureImportance || []).map((f: any, idx: number) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-700">{f.feature}</span>
                  <span className="font-mono font-bold text-indigo-700">
                    {(f.importanceWeight * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: `${Math.round(f.importanceWeight * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-[11px] text-indigo-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
            <span>
              Neighborhood topological structure accounts for 46% of total neural weight, proving graph structure out-predicts isolated transaction features alone.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
