import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Repeat,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Clock,
  PlusCircle,
  Sparkles,
} from 'lucide-react';
import { detectCycles } from '../../services/graph.service';
import type { CycleFinding } from '../../types/graph.types';
import { formatCurrency } from '../../utils/format';
import { useGraphStore } from '../../store/graph.store';
import { GraphCanvas } from '../graph/GraphCanvas';
import { MOCK_GRAPH, MOCK_CYCLES } from '../../services/mock-data';

export function CycleAnalysis() {
  const navigate = useNavigate();
  const { setHighlightedCycle } = useGraphStore();

  const [maxLength, setMaxLength] = useState<number>(4);
  const [cycles, setCycles] = useState<CycleFinding[]>(MOCK_CYCLES);
  const [isDetecting, setIsDetecting] = useState(false);
  const [selectedCycleId, setSelectedCycleId] = useState<string>('CYC-001');

  useEffect(() => {
    // Automatically highlight top cycle initially
    if (cycles.length > 0) {
      setHighlightedCycle(cycles[0].nodeIds);
    }
  }, []);

  const handleRunDetection = async () => {
    setIsDetecting(true);
    try {
      const res = await detectCycles({ maxLength });
      setCycles(res);
      if (res.length > 0) {
        setSelectedCycleId(res[0].cycleId);
        setHighlightedCycle(res[0].nodeIds);
      }
    } catch (err) {
      console.error('Cycle detection failed:', err);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSelectCycle = (cycle: CycleFinding) => {
    setSelectedCycleId(cycle.cycleId);
    setHighlightedCycle(cycle.nodeIds);
  };

  const handleCreateInvestigation = (cycle: CycleFinding) => {
    navigate(`/investigations?createFromCycle=${cycle.cycleId}&title=${encodeURIComponent(`Investigation: ${cycle.patternType} (${cycle.cycleId})`)}`);
  };

  return (
    <div className="space-y-6">
      {/* Controls Card */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Repeat className="w-4 h-4 text-red-400" />
              Elementary Cycle & Circular Laundering Detection (Johnson's Algorithm)
            </h3>
            <p className="text-xs text-slate-400">
              Identifies circular transaction structures where illicit funds loop back to conceal origin
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">Max Loop Length:</span>
            <select
              value={maxLength}
              onChange={(e) => setMaxLength(Number(e.target.value))}
              className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono"
            >
              <option value="3">3 Hops (Triangle)</option>
              <option value="4">4 Hops (Square)</option>
              <option value="5">5 Hops (Pentagon)</option>
              <option value="6">6 Hops (Extended Layering)</option>
            </select>

            <button
              onClick={handleRunDetection}
              disabled={isDetecting}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-red-600/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isDetecting ? 'Scanning Graph...' : 'Run Cycle Detection'}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400">
          <div>
            Identified Rings: <span className="font-mono font-bold text-red-400">{cycles.length}</span>
          </div>
          <div>
            Total Trapped Volume: <span className="font-mono font-bold text-white">{formatCurrency(720200)}</span>
          </div>
        </div>
      </div>

      {/* Main Analysis Layout: Split Canvas & Detected Loops List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Cycle Cards List */}
        <div className="lg:col-span-5 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            Detected Elementary Rings ({cycles.length})
          </h4>

          {cycles.map((c) => {
            const isSelected = c.cycleId === selectedCycleId;
            return (
              <div
                key={c.cycleId}
                onClick={() => handleSelectCycle(c)}
                className={`p-4 rounded-2xl border transition cursor-pointer ${
                  isSelected
                    ? 'bg-red-950/20 border-red-500 shadow-xl shadow-red-500/10'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-red-400">{c.cycleId}</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                      Risk {c.riskScore}/100
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {c.durationHours} hrs
                  </span>
                </div>

                <div className="text-xs font-semibold text-white mb-1">{c.patternType}</div>
                <p className="text-xs text-slate-400 mb-3">{c.explanation}</p>

                {/* Node Ring Flow */}
                <div className="flex items-center flex-wrap gap-1 p-2 bg-slate-950/80 rounded-xl border border-slate-800/80 font-mono text-xs mb-3 text-slate-300">
                  {c.nodeIds.map((node, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <span className="text-red-400 font-semibold">{node}</span>
                      {i < c.nodeIds.length - 1 && <ArrowRight className="w-3 h-3 text-slate-600" />}
                    </span>
                  ))}
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-3 pt-2 border-t border-slate-800">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Total Volume</span>
                    <span className="font-mono font-bold text-white">{formatCurrency(c.totalAmount)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Retention Ratio</span>
                    <span className="font-mono font-bold text-emerald-400">{((c.retentionRatio ?? 0.9) * 100).toFixed(1)}%</span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectCycle(c);
                    }}
                    className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition"
                  >
                    Highlight in Canvas
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateInvestigation(c);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-500/40 rounded-lg text-xs font-semibold transition"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Case
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Interactive Canvas displaying the active cycle */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-2xl h-[540px] flex flex-col">
          <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              Circular Transaction Topology (Cycle Pulse View)
            </span>
            <span className="text-xs text-rose-400 font-mono">
              Active: {selectedCycleId}
            </span>
          </div>

          <div className="flex-1 relative">
            <GraphCanvas graphData={MOCK_GRAPH} />
          </div>
        </div>
      </div>
    </div>
  );
}
