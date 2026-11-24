import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Compass,
  Repeat,
  Share2,
  Gauge,
  Radar,
  Brain,
} from 'lucide-react';
import { MultiHopAnalysis } from '../components/analysis/MultiHopAnalysis';
import { CycleAnalysis } from '../components/analysis/CycleAnalysis';
import { CommunityAnalysis } from '../components/analysis/CommunityAnalysis';
import { GCNAnalysis } from '../components/analysis/GCNAnalysis';
import { EvaluationMetrics } from '../components/analysis/EvaluationMetrics';

type TabKey = 'traversal' | 'cycles' | 'communities' | 'gcn' | 'evaluation';

export default function FraudAnalysis() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabKey) || 'traversal';
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  useEffect(() => {
    const t = searchParams.get('tab') as TabKey;
    if (t && ['traversal', 'cycles', 'communities', 'gcn', 'evaluation'].includes(t)) {
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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Radar className="w-6 h-6 text-blue-600" />
            Fraud Detection & Graph Algorithms Workspace
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Execute directed multi-hop traversals, elementary circular circuits, Louvain partitions, and GCN ML inference
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 border border-slate-200 rounded-2xl overflow-x-auto">
        <button
          onClick={() => handleTabChange('traversal')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'traversal'
              ? 'bg-blue-600 !text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white font-semibold'
          }`}
        >
          <Compass className="w-4 h-4 shrink-0" />
          <span>Multi-Hop Traversal (BFS / DFS)</span>
        </button>

        <button
          onClick={() => handleTabChange('cycles')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'cycles'
              ? 'bg-red-600 !text-white shadow-md shadow-red-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white font-semibold'
          }`}
        >
          <Repeat className="w-4 h-4 shrink-0" />
          <span>Cycle Detection (Johnson's)</span>
        </button>

        <button
          onClick={() => handleTabChange('communities')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'communities'
              ? 'bg-purple-600 !text-white shadow-md shadow-purple-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white font-semibold'
          }`}
        >
          <Share2 className="w-4 h-4 shrink-0" />
          <span>Community Detection (Louvain)</span>
        </button>

        <button
          onClick={() => handleTabChange('gcn')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'gcn'
              ? 'bg-indigo-600 !text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white font-semibold'
          }`}
        >
          <Brain className="w-4 h-4 shrink-0" />
          <span>GCN Risk Prediction (Neural ML)</span>
        </button>
      </div>

      {/* Secret / Direct URL notice when viewing hidden Evaluation tab */}
      {activeTab === 'evaluation' && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-emerald-600" />
            <span className="font-bold">Private Administrator View:</span>
            <span className="text-emerald-700 font-medium">Algorithm Benchmark & ROC-AUC Validation Suite (Hidden from public tabs)</span>
          </div>
          <button
            onClick={() => handleTabChange('traversal')}
            className="text-emerald-700 hover:text-emerald-950 font-semibold underline text-xs cursor-pointer ml-4"
          >
            Switch to Public Tabs
          </button>
        </div>
      )}

      {/* Tab Panels */}
      <div>
        {activeTab === 'traversal' && <MultiHopAnalysis />}
        {activeTab === 'cycles' && <CycleAnalysis />}
        {activeTab === 'communities' && <CommunityAnalysis />}
        {activeTab === 'gcn' && <GCNAnalysis />}
        {activeTab === 'evaluation' && <EvaluationMetrics />}
      </div>
    </div>
  );
}
