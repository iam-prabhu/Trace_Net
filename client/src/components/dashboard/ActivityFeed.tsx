import { Clock, ShieldAlert, GitCommit, FileText, CheckCircle2 } from 'lucide-react';

interface FeedItem {
  id: string;
  time: string;
  icon: typeof ShieldAlert;
  color: string;
  title: string;
  detail: string;
}

const ACTIVITIES: FeedItem[] = [
  {
    id: 'act-1',
    time: '12 mins ago',
    icon: ShieldAlert,
    color: 'text-red-400 bg-red-500/10 border-red-500/20',
    title: 'Cycle Algorithm Auto-Flagged 4 Accounts',
    detail: 'Johnson elementary circuit detector found 4-node ring on ACC-101 with volume $578k.',
  },
  {
    id: 'act-2',
    time: '35 mins ago',
    icon: FileText,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    title: 'SAR Narrative Drafted',
    detail: 'Sarah Lin updated case notes on INV-2025-001 regarding FinCEN offshore addresses.',
  },
  {
    id: 'act-3',
    time: '1 hour ago',
    icon: GitCommit,
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    title: 'Louvain Modularity Partition Generated',
    detail: 'Detected 8 distinct community clusters with modularity Q = 0.642 across 1,842 accounts.',
  },
  {
    id: 'act-4',
    time: '3 hours ago',
    icon: CheckCircle2,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    title: 'Merchant Cleared from High-Risk List',
    detail: 'ACC-301 reviewed by Compliance, verified as legitimate merchant payment gateway.',
  },
];

export function ActivityFeed() {
  return (
    <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            Live Intelligence Activity Timeline
          </h3>
          <p className="text-xs text-slate-400">Chronological security and analytical operations</p>
        </div>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
        {ACTIVITIES.map((act) => {
          const Icon = act.icon;
          return (
            <div key={act.id} className="relative">
              <div
                className={`absolute -left-6 top-0 w-5 h-5 rounded-full flex items-center justify-center border ${act.color}`}
              >
                <Icon className="w-2.5 h-2.5" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">{act.title}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{act.time}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{act.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
