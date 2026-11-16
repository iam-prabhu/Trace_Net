import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Compass,
  Repeat,
  Share2,
  Gauge,
  Radar,
} from 'lucide-react';
import { MultiHopAnalysis } from '../components/analysis/MultiHopAnalysis';
import { CycleAnalysis } from '../components/analysis/CycleAnalysis';
import { CommunityAnalysis } from '../components/analysis/CommunityAnalysis';
import { EvaluationMetrics } from '../components/analysis/EvaluationMetrics';

type TabKey = 'traversal' | 'cycles' | 'communities' | 'evaluation';

export default function FraudAnalysis() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabKey) || 'traversal';
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  useEffect(() => {
    const t = searchParams.get('tab') as TabKey;
    if (t && ['traversal', 'cycles', 'communities', 'evaluation'].includes(t)) {
      setActiveTab(t);
    }
  }, [searchParams]);

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    setSearchParams({ tab: key });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8 text-slate-200">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Radar className="w-6 h-6 text-blue-500" />
            Fraud Detection & Graph Algorithms Workspace
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Execute directed multi-hop traversals, elementary circular circuit identification, and Louvain clustering
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto">
        <button
          onClick={() => handleTabChange('traversal')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'traversal'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Multi-Hop Traversal (BFS / DFS)</span>
        </button>

        <button
          onClick={() => handleTabChange('cycles')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'cycles'
              ? 'bg-red-600 text-white shadow-lg shadow-red-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Repeat className="w-4 h-4" />
          <span>Cycle Detection (Johnson's)</span>
        </button>

        <button
          onClick={() => handleTabChange('communities')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'communities'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>Community Detection (Louvain)</span>
        </button>

        <button
          onClick={() => handleTabChange('evaluation')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'evaluation'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Gauge className="w-4 h-4" />
          <span>Evaluation & Benchmark</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'traversal' && <MultiHopAnalysis />}
        {activeTab === 'cycles' && <CycleAnalysis />}
        {activeTab === 'communities' && <CommunityAnalysis />}
        {activeTab === 'evaluation' && <EvaluationMetrics />}
      </div>
    </div>
  );
}
