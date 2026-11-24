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
    <div className="flex flex-col h-full bg-white border-l border-slate-200 text-slate-800 w-80 sm:w-96 p-4 overflow-y-auto shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${
            isHighRisk ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-blue-50 text-blue-600 border border-blue-200'
          }`}>
            {isHighRisk ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-mono font-bold text-base text-slate-900">{edge.id}</h3>
            <span className="text-xs text-slate-500">Transaction Details</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Amount Hero */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 my-4 text-center">
        <div className="text-xs text-slate-500 mb-1 flex items-center justify-center gap-1">
          <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Transferred Amount
        </div>
        <div className="text-2xl font-black text-slate-900">
          {formatCurrency(edge.amount)}
        </div>
        <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-slate-100 text-slate-700 border border-slate-200">
          <Tag className="w-3 h-3 text-blue-600" />
          {edge.transactionType || edge.type || 'WIRE'}
        </div>
      </div>

      {/* Counterparties Flow */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-4 space-y-2">
        <div className="text-xs font-semibold text-slate-600">Flow Route</div>
        <div className="flex items-center justify-between gap-2 p-2 bg-white rounded-lg border border-slate-200 font-mono text-xs">
          <div className="text-blue-600 font-semibold">{edge.source}</div>
          <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="text-purple-600 font-semibold">{edge.target}</div>
        </div>
      </div>

      {/* Attributes List */}
      <div className="space-y-2.5 text-xs mb-4">
        <div className="flex justify-between py-1 border-b border-slate-100">
          <span className="text-slate-500">Status</span>
          <span className={`font-semibold capitalize px-2 py-0.5 rounded text-[11px] ${
            isHighRisk ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            {edge.status || 'COMPLETED'}
          </span>
        </div>

        <div className="flex justify-between py-1 border-b border-slate-100">
          <span className="text-slate-500">Risk Assessment</span>
          <span className={`font-bold ${isHighRisk ? 'text-red-600' : 'text-slate-700'}`}>
            {edge.riskScore ?? 30}/100
          </span>
        </div>

        <div className="flex justify-between py-1 border-b border-slate-100">
          <span className="text-slate-500 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" /> Timestamp
          </span>
          <span className="text-slate-700 font-mono">
            {edge.timestamp ? formatDateTime(edge.timestamp) : '2025-03-10 14:22'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2 mt-auto pt-3 border-t border-slate-200">
        <button
          onClick={() => setHighlightedPath([edge.source, edge.target])}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 !text-white rounded-lg font-bold text-xs transition shadow-md shadow-blue-500/25 cursor-pointer active:scale-[0.99]"
        >
          <span className="!text-white font-bold">Highlight Flow in Canvas</span>
        </button>

        <button
          onClick={() => onAddToInvestigation?.(edge.id)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-medium text-xs border border-slate-200 transition cursor-pointer"
        >
          Add Transaction to Case
        </button>
      </div>
    </div>
  );
}
