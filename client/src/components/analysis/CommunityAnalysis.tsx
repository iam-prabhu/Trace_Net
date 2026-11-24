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

const CLUSTER_TYPOLOGIES: Record<number, string> = {
  1: 'Offshore Shell Entity Ring',
  2: 'Retail Smurfing & P2P Layering',
  3: 'Commercial Merchant Hub',
  4: 'Inter-Community Bridge Network',
  5: 'Crypto High-Velocity Funnel',
  6: 'Payroll & Structured Distribution',
};

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
    const clusterName = (comm as any).name || CLUSTER_TYPOLOGIES[comm.communityId] || `Cluster #${comm.communityId}`;
    navigate(`/investigations?createFromCommunity=${comm.communityId}&title=${encodeURIComponent(`Investigation: ${clusterName} (${comm.dominantRiskLevel} Risk)`)}`);
  };

  return (
    <div className="space-y-6">
      {/* Configuration Header Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-purple-600" />
            Louvain Multi-Level Modularity Optimization
          </h3>
          <p className="text-xs text-slate-500">
            Uncovers hidden syndicates, money mule clusters, and merchant payment hubs
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 text-xs font-mono font-medium">
            Modularity Score (Q): <span className="font-bold text-purple-900">{modularity}</span>
          </div>
        </div>
      </div>

      {/* Main Layout: Split Communities List & Graph Overlay */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Community Cards */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              Detected Partitions ({communities.length})
            </h4>

            <button
              onClick={() => setColorByCommunity(!colorByCommunity)}
              className="text-xs text-purple-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              {colorByCommunity ? 'Community Colors On' : 'Status Colors On'}
            </button>
          </div>

          {communities.map((comm) => {
            const isSelected = comm.communityId === activeCommId;
            const clusterName = (comm as any).name || CLUSTER_TYPOLOGIES[comm.communityId] || `Subnetwork #${comm.communityId}`;
            return (
              <div
                key={comm.communityId}
                onClick={() => handleSelectCommunity(comm)}
                className={`p-4 rounded-2xl border transition cursor-pointer ${
                  isSelected
                    ? 'bg-purple-50/70 border-purple-400 ring-2 ring-purple-200 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-3 h-3 rounded-full bg-purple-600 shrink-0" />
                    <span className="font-bold text-xs text-slate-900">
                      Cluster #{comm.communityId}: <span className="font-semibold text-purple-900">{clusterName}</span>
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      comm.dominantRiskLevel === 'CRITICAL' ? 'bg-red-50 text-red-700 border border-red-200' :
                      comm.dominantRiskLevel === 'HIGH' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {comm.dominantRiskLevel} RISK
                    </span>
                  </div>

                  <span className="font-mono text-xs text-slate-500 font-medium shrink-0">
                    {comm.size} Accounts
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs my-2.5">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 text-[10px] block font-medium">Cluster Volume</span>
                    <span className="font-mono font-bold text-slate-900 text-xs">{formatCurrency(comm.totalVolume)}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 text-[10px] block font-medium">Density Index</span>
                    <span className="font-mono font-bold text-purple-700 text-xs">{(comm.density * 100).toFixed(0)}%</span>
                  </div>
                </div>

                {/* Account Pills */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {comm.nodeIds.map((id) => (
                    <span
                      key={id}
                      className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-mono border border-slate-200 hover:border-slate-300 font-medium"
                    >
                      {id}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectCommunity(comm);
                    }}
                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition cursor-pointer"
                  >
                    Highlight Cluster
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateCase(comm);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 !text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5 !text-white shrink-0" />
                    <span className="!text-white font-semibold">+ Case</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Interactive Canvas showing Community overlay */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs h-[540px] flex flex-col">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-purple-600" />
              Community Partitioning Visualization
            </span>
            <span className="text-xs text-purple-700 font-semibold font-mono">
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
