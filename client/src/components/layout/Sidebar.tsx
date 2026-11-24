import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Network,
  Briefcase,
  Radar,
  Users,
  Database,
  Shield,
  ChevronLeft,
  ChevronRight,
  Globe,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import FraudLogo from '../common/FraudLogo';

const navItems = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/explorer', label: 'Transaction Explorer', icon: Network },
  { to: '/investigations', label: 'Investigations', icon: Briefcase, badge: '3' },
  { to: '/analysis', label: 'Fraud Analysis', icon: Radar },
  { to: '/geospatial', label: 'Geospatial Intelligence', icon: Globe },
  { to: '/collaboration', label: 'Collaboration', icon: Users, isLive: true },
  { to: '/data', label: 'Data Management', icon: Database },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'relative bg-white text-slate-800 border-r border-slate-200 flex flex-col transition-all duration-300 z-30 select-none shadow-sm',
        isCollapsed ? 'w-18' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-3.5 border-b border-slate-200 bg-slate-50/50">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <FraudLogo size={36} className="w-9 h-9" />
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-black text-xs tracking-tight text-slate-900 leading-tight">
                Fraud Detection Console
              </span>
              <span className="text-[10px] text-blue-600 truncate tracking-wider uppercase font-semibold">
                Security & Intelligence
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
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
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative',
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('w-4 h-4 shrink-0 transition-transform group-hover:scale-110', isActive ? 'text-white' : 'text-slate-500')} />
                {!isCollapsed && <span className="truncate">{label}</span>}

                {/* Badge or Live pulse */}
                {!isCollapsed && badge && (
                  <span className={cn(
                    'ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                    isActive ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'
                  )}>
                    {badge}
                  </span>
                )}

                {!isCollapsed && isLive && (
                  <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
