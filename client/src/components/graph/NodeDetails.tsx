import { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Compass,
  PlusCircle,
  FolderPlus,
  ArrowDownLeft,
  ArrowUpRight,
  X,
  Layers,
  Calendar,
  DollarSign,
} from 'lucide-react';
import type { GraphNode } from '../../types/graph.types';
import { formatCurrency, formatDate } from '../../utils/format';
import { getNeighbors } from '../../services/graph.service';
import { useGraphStore } from '../../store/graph.store';

interface NodeDetailsProps {
  node: GraphNode;
  onClose: () => void;
  onStartTraversal?: (accountId: string) => void;
  onAddToInvestigation?: (accountId: string) => void;
}

export function NodeDetails({
  node,
  onClose,
  onStartTraversal,
  onAddToInvestigation,
}: NodeDetailsProps) {
  const { addNodesAndEdges, setHighlightedPath } = useGraphStore();
  const [isExpanding, setIsExpanding] = useState(false);
  const [isFlagged, setIsFlagged] = useState(node.status === 'flagged');

  const handleExpand = async (direction: 'ALL' | 'INCOMING' | 'OUTGOING' = 'ALL') => {
    setIsExpanding(true);
    try {
      const result = await getNeighbors(node.id, 1);
      // Filter by direction if requested
      let filteredEdges = result.edges;
      if (direction === 'INCOMING') {
        filteredEdges = result.edges.filter(e => e.target === node.id);
      } else if (direction === 'OUTGOING') {
        filteredEdges = result.edges.filter(e => e.source === node.id);
      }
      addNodesAndEdges(result.nodes, filteredEdges);
    } catch (err) {
      console.error('Failed to expand node neighbors:', err);
    } finally {
      setIsExpanding(false);
    }
  };

  const toggleFlag = () => {
    setIsFlagged(!isFlagged);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 text-slate-200 w-80 sm:w-96 p-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${
            isFlagged ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
          }`}>
            {isFlagged ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-mono font-bold text-base text-white">{node.id}</h3>
            <span className="text-xs text-slate-400 capitalize">
              {node.accountType?.replace('_', ' ') || 'Commercial Account'}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 my-4">
        <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Balance</span>
          </div>
          <div className="text-base font-bold text-white">
            {formatCurrency(node.balance ?? 125000)}
          </div>
        </div>

        <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span>Risk Score</span>
          </div>
          <div className={`text-base font-bold ${
            (node.riskScore ?? 0) >= 75 ? 'text-red-400' :
            (node.riskScore ?? 0) >= 50 ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {node.riskScore ?? 45}/100
          </div>
        </div>
      </div>

      {/* Account Details List */}
      <div className="space-y-2.5 text-xs mb-4">
        <div className="flex justify-between py-1 border-b border-slate-800/60">
          <span className="text-slate-400">Status</span>
          <span className={`font-semibold capitalize px-2 py-0.5 rounded text-[11px] ${
            isFlagged ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
          }`}>
            {isFlagged ? 'FLAGGED' : (node.status || 'NORMAL')}
          </span>
        </div>

        <div className="flex justify-between py-1 border-b border-slate-800/60">
          <span className="text-slate-400">Community Cluster</span>
          <span className="font-mono text-purple-400 font-medium">
            Cluster #{node.communityId ?? 1}
          </span>
        </div>

        <div className="flex justify-between py-1 border-b border-slate-800/60">
          <span className="text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-500" /> Created Date
          </span>
          <span className="text-slate-300">
            {node.createdAt ? formatDate(node.createdAt) : 'Jan 15, 2025'}
          </span>
        </div>

        <div className="flex justify-between py-1 border-b border-slate-800/60">
          <span className="text-slate-400 flex items-center gap-1">
            <ArrowDownLeft className="w-3 h-3 text-emerald-400" /> Incoming Volume
          </span>
          <span className="text-slate-300 font-medium">
            {formatCurrency(node.incomingAmount ?? 295000)} ({node.incomingCount ?? 6} txns)
          </span>
        </div>

        <div className="flex justify-between py-1 border-b border-slate-800/60">
          <span className="text-slate-400 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3 text-orange-400" /> Outgoing Volume
          </span>
          <span className="text-slate-300 font-medium">
            {formatCurrency(node.outgoingAmount ?? 284000)} ({node.outgoingCount ?? 5} txns)
          </span>
        </div>
      </div>

      {/* Direct Neighbors */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-blue-400" /> Connected Accounts (Degree: {node.degree ?? 3})
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['ACC-102', 'ACC-104', 'ACC-401'].map(id => (
            <button
              key={id}
              onClick={() => setHighlightedPath([node.id, id])}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono text-xs border border-slate-700 transition"
            >
              {id}
            </button>
          ))}
        </div>
      </div>

      {/* Expand Connected Accounts Action Buttons */}
      <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 mb-4">
        <div className="text-xs font-semibold text-slate-300 mb-2">Expand 1-Hop Neighbors</div>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => handleExpand('INCOMING')}
            disabled={isExpanding}
            className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-xs font-medium border border-slate-700 transition flex items-center justify-center gap-1"
          >
            <ArrowDownLeft className="w-3 h-3" /> Incoming
          </button>
          <button
            onClick={() => handleExpand('OUTGOING')}
            disabled={isExpanding}
            className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-orange-400 rounded-lg text-xs font-medium border border-slate-700 transition flex items-center justify-center gap-1"
          >
            <ArrowUpRight className="w-3 h-3" /> Outgoing
          </button>
          <button
            onClick={() => handleExpand('ALL')}
            disabled={isExpanding}
            className="px-2 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded-lg text-xs font-medium border border-blue-500/40 transition flex items-center justify-center gap-1"
          >
            <PlusCircle className="w-3 h-3" /> All
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 mt-auto pt-3 border-t border-slate-800">
        <button
          onClick={() => onStartTraversal?.(node.id)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-xs shadow-lg shadow-blue-500/20 transition"
        >
          <Compass className="w-4 h-4" /> Run Traversal from Account
        </button>

        <button
          onClick={() => onAddToInvestigation?.(node.id)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium text-xs border border-slate-700 transition"
        >
          <FolderPlus className="w-4 h-4 text-amber-400" /> Add to Investigation Case
        </button>

        <button
          onClick={toggleFlag}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium text-xs border transition ${
            isFlagged
              ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
        >
          <ShieldAlert className="w-4 h-4" /> {isFlagged ? 'Account Flagged (Remove Flag)' : 'Flag as Suspicious'}
        </button>
      </div>
    </div>
  );
}
