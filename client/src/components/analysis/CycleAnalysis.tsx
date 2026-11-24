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
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Repeat className="w-4 h-4 text-red-600" />
              Elementary Cycle & Circular Laundering Detection (Johnson's Algorithm)
            </h3>
            <p className="text-xs text-slate-500">
              Identifies circular transaction structures where illicit funds loop back to conceal origin
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-semibold">Max Loop Length:</span>
            <select
              value={maxLength}
              onChange={(e) => setMaxLength(Number(e.target.value))}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-mono"
            >
              <option value="3">3 Hops (Triangle)</option>
              <option value="4">4 Hops (Square)</option>
              <option value="5">5 Hops (Pentagon)</option>
              <option value="6">6 Hops (Extended Layering)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-600">
          <div>
            Identified Rings: <span className="font-mono font-bold text-red-600">{cycles.length}</span>
          </div>
          <div>
            Total Trapped Volume: <span className="font-mono font-bold text-slate-900">{formatCurrency(720200)}</span>
          </div>
        </div>
      </div>

      {/* Main Analysis Layout: Split Canvas & Detected Loops List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Cycle Cards List */}
        <div className="lg:col-span-5 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
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
                    ? 'bg-red-50/70 border-red-400 ring-2 ring-red-200 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-red-600">{c.cycleId}</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                      Risk {c.riskScore}/100
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {c.durationHours} hrs
                  </span>
                </div>

                <div className="text-xs font-bold text-slate-900 mb-1">{c.patternType}</div>
                <p className="text-xs text-slate-500 mb-3">{c.explanation}</p>

                {/* Node Ring Flow */}
                <div className="flex items-center flex-wrap gap-1 p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs mb-3 text-slate-700">
                  {c.nodeIds.map((node, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <span className="text-red-600 font-bold">{node}</span>
                      {i < c.nodeIds.length - 1 && <ArrowRight className="w-3 h-3 text-slate-400" />}
                    </span>
                  ))}
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-3 pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-slate-500 block text-[10px] font-medium">Total Volume</span>
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(c.totalAmount)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] font-medium">Retention Ratio</span>
                    <span className="font-mono font-bold text-emerald-700">{((c.retentionRatio ?? 0.9) * 100).toFixed(1)}%</span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectCycle(c);
                    }}
                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition cursor-pointer"
                  >
                    Highlight in Canvas
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateInvestigation(c);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 !text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5 !text-white shrink-0" />
                    <span className="!text-white font-semibold">+ Case</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Interactive Canvas displaying the active cycle */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs h-[540px] flex flex-col">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              Circular Transaction Topology (Cycle Pulse View)
            </span>
            <span className="text-xs text-rose-600 font-bold font-mono">
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
