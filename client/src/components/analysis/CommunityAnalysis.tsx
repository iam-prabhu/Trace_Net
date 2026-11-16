import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Share2,
  Layers,
  Sparkles,
  PlusCircle,
  Eye,
} from 'lucide-react';
import { detectCommunities } from '../../services/graph.service';
import type { CommunityFinding } from '../../types/graph.types';
import { formatCurrency } from '../../utils/format';
import { useGraphStore } from '../../store/graph.store';
import { GraphCanvas } from '../graph/GraphCanvas';
import { MOCK_GRAPH, MOCK_COMMUNITIES } from '../../services/mock-data';

export function CommunityAnalysis() {
  const navigate = useNavigate();
  const {
    colorByCommunity,
    setColorByCommunity,
    setHighlightedPath,
  } = useGraphStore();

  const [modularity, setModularity] = useState(0.642);
  const [communities, setCommunities] = useState<CommunityFinding[]>(MOCK_COMMUNITIES);
  const [isDetecting, setIsDetecting] = useState(false);
  const [activeCommId, setActiveCommId] = useState<number>(1);

  useEffect(() => {
    setColorByCommunity(true);
    return () => {
      setColorByCommunity(false);
    };
  }, []);

  const handleRunDetection = async () => {
    setIsDetecting(true);
    try {
      const res = await detectCommunities();
      setModularity(res.modularity);
      setCommunities(res.communities);
    } catch (err) {
      console.error('Community detection failed:', err);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSelectCommunity = (comm: CommunityFinding) => {
    setActiveCommId(comm.communityId);
    setHighlightedPath(comm.nodeIds);
  };

  const handleCreateCase = (comm: CommunityFinding) => {
    navigate(`/investigations?createFromCommunity=${comm.communityId}&title=${encodeURIComponent(`Investigation: Louvain Cluster #${comm.communityId} (${comm.dominantRiskLevel} Risk)`)}`);
  };

  return (
    <div className="space-y-6">
      {/* Configuration Header Card */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Share2 className="w-4 h-4 text-purple-400" />
            Louvain Multi-Level Modularity Optimization
          </h3>
          <p className="text-xs text-slate-400">
            Uncovers hidden syndicates, money mule clusters, and merchant payment hubs
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono">
            Modularity Score (Q): <span className="font-bold text-white">{modularity}</span>
          </div>

          <button
            onClick={handleRunDetection}
            disabled={isDetecting}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/20 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isDetecting ? 'Partitioning...' : 'Run Louvain Clustering'}
          </button>
        </div>
      </div>

      {/* Main Layout: Split Communities List & Graph Overlay */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Community Cards */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              Detected Partitions ({communities.length})
            </h4>

            <button
              onClick={() => setColorByCommunity(!colorByCommunity)}
              className="text-xs text-purple-400 hover:underline flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5" />
              {colorByCommunity ? 'Community Colors On' : 'Status Colors On'}
            </button>
          </div>

          {communities.map((comm) => {
            const isSelected = comm.communityId === activeCommId;
            return (
              <div
                key={comm.communityId}
                onClick={() => handleSelectCommunity(comm)}
                className={`p-4 rounded-2xl border transition cursor-pointer ${
                  isSelected
                    ? 'bg-purple-950/20 border-purple-500 shadow-xl shadow-purple-500/10'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-purple-500" />
                    <span className="font-bold text-xs text-white">Cluster #{comm.communityId}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      comm.dominantRiskLevel === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      comm.dominantRiskLevel === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {comm.dominantRiskLevel} RISK
                    </span>
                  </div>

                  <span className="font-mono text-xs text-slate-400">
                    {comm.size} Accounts
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs my-2.5">
                  <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800/80">
                    <span className="text-slate-500 text-[10px] block">Cluster Volume</span>
                    <span className="font-mono font-bold text-white">{formatCurrency(comm.totalVolume)}</span>
                  </div>
                  <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800/80">
                    <span className="text-slate-500 text-[10px] block">Density Index</span>
                    <span className="font-mono font-bold text-purple-300">{(comm.density * 100).toFixed(0)}%</span>
                  </div>
                </div>

                {/* Account Pills */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {comm.nodeIds.map((id) => (
                    <span
                      key={id}
                      className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-mono border border-slate-700"
                    >
                      {id}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectCommunity(comm);
                    }}
                    className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition"
                  >
                    Highlight Cluster
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateCase(comm);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/40 rounded-lg text-xs font-semibold transition"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Case
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Interactive Canvas showing Community overlay */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-2xl h-[540px] flex flex-col">
          <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Share2 className="w-4 h-4 text-purple-400" />
              Community Partitioning Visualization
            </span>
            <span className="text-xs text-purple-300 font-mono">
              Cluster #{activeCommId} Highlighted
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
