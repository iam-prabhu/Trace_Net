import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Network,
  Briefcase,
  Radar,
  Users,
  Database,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  Activity,
  Zap,
} from 'lucide-react';
import { cn } from '../../utils/cn';

const navItems = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/explorer', label: 'Transaction Explorer', icon: Network },
  { to: '/investigations', label: 'Investigations', icon: Briefcase, badge: '3' },
  { to: '/analysis', label: 'Fraud Analysis', icon: Radar },
  { to: '/collaboration', label: 'Collaboration', icon: Users, isLive: true },
  { to: '/data', label: 'Data Management', icon: Database },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'relative bg-[#070d1e] text-slate-200 border-r border-slate-800/80 flex flex-col transition-all duration-300 z-30 select-none shadow-2xl',
        isCollapsed ? 'w-18' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 bg-[#091126]/60">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                NEXUS<span className="text-blue-400 font-mono text-xs">FRAUD</span>
              </span>
              <span className="text-[10px] text-slate-400 truncate tracking-wider uppercase font-semibold">
                Graph Intelligence
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 transition"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, badge, isLive }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all relative',
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('w-4 h-4 shrink-0 transition-transform group-hover:scale-110', isActive ? 'text-white' : 'text-slate-400')} />
                {!isCollapsed && <span className="truncate">{label}</span>}

                {/* Badge or Live pulse */}
                {!isCollapsed && badge && (
                  <span className={cn(
                    'ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                    isActive ? 'bg-blue-800 text-blue-100' : 'bg-slate-800 text-slate-300 border border-slate-700'
                  )}>
                    {badge}
                  </span>
                )}

                {!isCollapsed && isLive && (
                  <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* System Engine Status Footer */}
      {!isCollapsed && (
        <div className="p-3 m-3 bg-slate-900/80 rounded-xl border border-slate-800/80 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-400" /> Engine Graph
            </span>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-400" /> READY
            </span>
          </div>
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Tarjan + Louvain Modularity active</span>
          </div>
        </div>
      )}
    </aside>
  );
}
