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
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    iconBg: 'bg-blue-100 text-blue-600',
  },
  red: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    iconBg: 'bg-red-100 text-red-600',
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    iconBg: 'bg-amber-100 text-amber-600',
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    iconBg: 'bg-purple-100 text-purple-600',
  },
  emerald: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    iconBg: 'bg-emerald-100 text-emerald-600',
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
    <div className={`p-4 rounded-2xl bg-white border ${scheme.border} shadow-sm transition hover:shadow-md flex flex-col justify-between`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">{title}</span>
        <div className={`p-2 rounded-xl ${scheme.iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div>
        <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">{value}</div>
        {(change || subtitle) && (
          <div className="flex items-center gap-2 mt-2 text-xs">
            {change && (
              <span className={`inline-flex items-center gap-0.5 font-bold ${
                isPositive ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {change}
              </span>
            )}
            {subtitle && <span className="text-slate-500">{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
