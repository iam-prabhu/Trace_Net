import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  isPositive?: boolean;
  colorScheme?: 'blue' | 'red' | 'amber' | 'purple' | 'emerald';
  subtitle?: string;
}

const colorMap = {
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    text: 'text-blue-400',
    iconBg: 'bg-blue-600/20 text-blue-400',
  },
  red: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    text: 'text-red-400',
    iconBg: 'bg-red-600/20 text-red-400',
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    text: 'text-amber-400',
    iconBg: 'bg-amber-600/20 text-amber-400',
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    text: 'text-purple-400',
    iconBg: 'bg-purple-600/20 text-purple-400',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    text: 'text-emerald-400',
    iconBg: 'bg-emerald-600/20 text-emerald-400',
  },
};

export function StatCard({
  title,
  value,
  icon: Icon,
  change,
  isPositive = true,
  colorScheme = 'blue',
  subtitle,
}: StatCardProps) {
  const scheme = colorMap[colorScheme];

  return (
    <div className={`p-4 rounded-2xl bg-slate-900/80 border ${scheme.border} shadow-lg backdrop-blur-sm transition hover:border-slate-600 flex flex-col justify-between`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">{title}</span>
        <div className={`p-2 rounded-xl ${scheme.iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div>
        <div className="text-2xl font-black text-white tracking-tight font-mono">{value}</div>
        {(change || subtitle) && (
          <div className="flex items-center gap-2 mt-2 text-xs">
            {change && (
              <span className={`inline-flex items-center gap-0.5 font-bold ${
                isPositive ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {change}
              </span>
            )}
            {subtitle && <span className="text-slate-400">{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
