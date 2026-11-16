import { useState } from 'react';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useGraphStore } from '../../store/graph.store';

export function GraphLegend() {
  const [isExpanded, setIsExpanded] = useState(true);
  const { colorByCommunity } = useGraphStore();

  return (
    <div className="absolute bottom-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl text-slate-200 text-xs w-64 transition-all">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-3 py-2 cursor-pointer border-b border-slate-800/80 select-none hover:bg-slate-800/50 rounded-t-xl"
      >
        <div className="flex items-center gap-1.5 font-semibold text-slate-200">
          <Info className="w-3.5 h-3.5 text-blue-400" />
          <span>Graph Legend</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
        )}
      </div>

      {isExpanded && (
        <div className="p-3 space-y-3">
          {/* Node Status / Community Section */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              {colorByCommunity ? 'Louvain Communities' : 'Account Status'}
            </div>
            {colorByCommunity ? (
              <div className="grid grid-cols-2 gap-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />
                  <span>Cluster 1 (Offshore)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EC4899]" />
                  <span>Cluster 2 (P2P Ring)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4]" />
                  <span>Cluster 3 (Merchant)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]" />
                  <span>Cluster 4 (Retail)</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
                  <span>Normal Account</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                  <span>Flagged / High Risk</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                  <span>Investigating</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                  <span>Reviewed / Clear</span>
                </div>
              </div>
            )}
          </div>

          {/* Edge Types Section */}
          <div className="border-t border-slate-800/80 pt-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Transaction Links
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-4 h-0.5 bg-slate-500 rounded" />
                <span>Standard Flow (Arrow = Direction)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-0.5 bg-red-500 rounded" />
                <span>Suspicious / Flagged Transaction</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-0.5 bg-amber-400 rounded" />
                <span>Highlighted Path / Traversal</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-1 bg-rose-500 rounded animate-pulse" />
                <span>Circular Routing Cycle</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
