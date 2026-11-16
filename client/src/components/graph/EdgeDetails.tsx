import { ArrowRight, AlertTriangle, CheckCircle, X, DollarSign, Calendar, Tag } from 'lucide-react';
import type { GraphEdge } from '../../types/graph.types';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { useGraphStore } from '../../store/graph.store';

interface EdgeDetailsProps {
  edge: GraphEdge;
  onClose: () => void;
  onAddToInvestigation?: (edgeId: string) => void;
}

export function EdgeDetails({ edge, onClose, onAddToInvestigation }: EdgeDetailsProps) {
  const { setHighlightedPath } = useGraphStore();
  const isHighRisk = (edge.riskScore ?? 0) >= 70 || edge.status === 'FLAGGED';

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 text-slate-200 w-80 sm:w-96 p-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${
            isHighRisk ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
          }`}>
            {isHighRisk ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-mono font-bold text-base text-white">{edge.id}</h3>
            <span className="text-xs text-slate-400">Transaction Details</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Amount Hero */}
      <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/50 my-4 text-center">
        <div className="text-xs text-slate-400 mb-1 flex items-center justify-center gap-1">
          <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Transferred Amount
        </div>
        <div className="text-2xl font-black text-white">
          {formatCurrency(edge.amount)}
        </div>
        <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-slate-700/80 text-slate-300">
          <Tag className="w-3 h-3 text-blue-400" />
          {edge.transactionType || edge.type || 'WIRE'}
        </div>
      </div>

      {/* Counterparties Flow */}
      <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 mb-4 space-y-2">
        <div className="text-xs font-semibold text-slate-400">Flow Route</div>
        <div className="flex items-center justify-between gap-2 p-2 bg-slate-900 rounded-lg border border-slate-800 font-mono text-xs">
          <div className="text-blue-400 font-semibold">{edge.source}</div>
          <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
          <div className="text-purple-400 font-semibold">{edge.target}</div>
        </div>
      </div>

      {/* Attributes List */}
      <div className="space-y-2.5 text-xs mb-4">
        <div className="flex justify-between py-1 border-b border-slate-800/60">
          <span className="text-slate-400">Status</span>
          <span className={`font-semibold capitalize px-2 py-0.5 rounded text-[11px] ${
            isHighRisk ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
          }`}>
            {edge.status || 'COMPLETED'}
          </span>
        </div>

        <div className="flex justify-between py-1 border-b border-slate-800/60">
          <span className="text-slate-400">Risk Assessment</span>
          <span className={`font-bold ${isHighRisk ? 'text-red-400' : 'text-slate-300'}`}>
            {edge.riskScore ?? 30}/100
          </span>
        </div>

        <div className="flex justify-between py-1 border-b border-slate-800/60">
          <span className="text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-500" /> Timestamp
          </span>
          <span className="text-slate-300 font-mono">
            {edge.timestamp ? formatDateTime(edge.timestamp) : '2025-03-10 14:22'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2 mt-auto pt-3 border-t border-slate-800">
        <button
          onClick={() => setHighlightedPath([edge.source, edge.target])}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-xs transition"
        >
          Highlight Flow in Canvas
        </button>

        <button
          onClick={() => onAddToInvestigation?.(edge.id)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium text-xs border border-slate-700 transition"
        >
          Add Transaction to Case
        </button>
      </div>
    </div>
  );
}
