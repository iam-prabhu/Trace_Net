import { useEffect, useState } from 'react';
import {
  Users,
  CreditCard,
  Briefcase,
  ShieldAlert,
  Repeat,
  Share2,
} from 'lucide-react';
import { StatCard } from '../components/dashboard/StatCard';
import { TransactionChart } from '../components/dashboard/TransactionChart';
import { MiniGraphView } from '../components/dashboard/MiniGraphView';
import { RecentFindings } from '../components/dashboard/RecentFindings';
import { RecentInvestigations } from '../components/dashboard/RecentInvestigations';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import { getStatistics } from '../services/graph.service';
import type { GraphStatistics } from '../types/graph.types';
import { MOCK_STATISTICS } from '../services/mock-data';

export default function Overview() {
  const [stats, setStats] = useState<GraphStatistics>(MOCK_STATISTICS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getStatistics().then((res) => {
      if (mounted) {
        setStats(res);
        setIsLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Page Title & Operational Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Intelligence Overview
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time graph analytics, circular laundering rings & collaborative case monitoring
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono">
            Modularity Score: <span className="text-purple-400 font-bold">{stats.modularityScore}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
            {isLoading ? 'Syncing...' : 'Connected Engine'}
          </div>
        </div>
      </div>

      {/* 6 Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          title="Total Accounts"
          value={stats.totalAccounts.toLocaleString()}
          icon={Users}
          change="+12.4%"
          colorScheme="blue"
          subtitle="indexed"
        />
        <StatCard
          title="Total Txns"
          value={stats.totalTransactions.toLocaleString()}
          icon={CreditCard}
          change="+8.1%"
          colorScheme="blue"
          subtitle="directed edges"
        />
        <StatCard
          title="Active Cases"
          value={stats.activeInvestigations}
          icon={Briefcase}
          change="+2"
          colorScheme="amber"
          subtitle="under review"
        />
        <StatCard
          title="Flagged Accounts"
          value={stats.flaggedAccounts}
          icon={ShieldAlert}
          change="+5.8%"
          isPositive={false}
          colorScheme="red"
          subtitle="high risk"
        />
        <StatCard
          title="Identified Cycles"
          value={stats.identifiedCycles}
          icon={Repeat}
          change="+3 new"
          isPositive={false}
          colorScheme="red"
          subtitle="laundering rings"
        />
        <StatCard
          title="Louvain Clusters"
          value={stats.detectedCommunities}
          icon={Share2}
          change="Q=0.64"
          colorScheme="purple"
          subtitle="communities"
        />
      </div>

      {/* Primary Analytics Section: Chart + Mini Graph View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 h-[360px]">
          <TransactionChart />
        </div>
        <div className="lg:col-span-5 h-[360px]">
          <MiniGraphView />
        </div>
      </div>

      {/* Secondary Tables: Findings & Investigations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <RecentFindings />
        </div>
        <div className="lg:col-span-5">
          <RecentInvestigations />
        </div>
      </div>

      {/* Bottom Timeline: Activity Feed */}
      <div>
        <ActivityFeed />
      </div>
    </div>
  );
}
