import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

type TimeRange = '24h' | '7d' | '30d';

const DATA_BY_RANGE: Record<TimeRange, Array<{ time: string; normal: number; suspicious: number }>> = {
  '24h': [
    { time: '00:00', normal: 120, suspicious: 4 },
    { time: '04:00', normal: 80, suspicious: 2 },
    { time: '08:00', normal: 340, suspicious: 12 },
    { time: '12:00', normal: 680, suspicious: 28 },
    { time: '16:00', normal: 590, suspicious: 19 },
    { time: '20:00', normal: 420, suspicious: 15 },
  ],
  '7d': [
    { time: 'Mon', normal: 2400, suspicious: 95 },
    { time: 'Tue', normal: 3100, suspicious: 120 },
    { time: 'Wed', normal: 2900, suspicious: 140 },
    { time: 'Thu', normal: 3500, suspicious: 180 },
    { time: 'Fri', normal: 4200, suspicious: 230 },
    { time: 'Sat', normal: 1800, suspicious: 75 },
    { time: 'Sun', normal: 1500, suspicious: 60 },
  ],
  '30d': [
    { time: 'Week 1', normal: 14200, suspicious: 540 },
    { time: 'Week 2', normal: 16800, suspicious: 720 },
    { time: 'Week 3', normal: 18900, suspicious: 810 },
    { time: 'Week 4', normal: 17400, suspicious: 690 },
  ],
};

export function TransactionChart() {
  const [range, setRange] = useState<TimeRange>('7d');
  const data = DATA_BY_RANGE[range];

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col h-full">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900">Transaction Activity & Anomaly Ingestion</h3>
          <p className="text-xs text-slate-500">Normal vs Suspicious transaction volumes over time</p>
        </div>

        {/* Range Selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
          {(['24h', '7d', '30d'] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                range === r
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 w-full min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="normalGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="suspiciousGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: '#e2e8f0',
                borderRadius: '12px',
                color: '#0f172a',
                fontSize: '12px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            <Area
              type="monotone"
              dataKey="normal"
              name="Normal Txns"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#normalGrad)"
            />
            <Area
              type="monotone"
              dataKey="suspicious"
              name="Suspicious Txns"
              stroke="#ef4444"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#suspiciousGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Cleared / Normal Flow</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span>Anomalous / Suspicious Spike</span>
        </div>
      </div>
    </div>
  );
}
