import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Briefcase,
  LogOut,
  ChevronDown,
  User,
  Shield,
  Radio,
} from 'lucide-react';
import NotificationBell from './NotificationBell';
import { useAuthStore } from '../../store/auth.store';
import { useCollaborationStore } from '../../store/collaboration.store';

export default function Header() {
  const { user, clearAuth } = useAuthStore();
  const { activeInvestigationId } = useCollaborationStore();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/explorer?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const role = (user?.role || '').toLowerCase();
  const roleBadgeColor =
    role.includes('admin')
      ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
      : role.includes('analyst') || role.includes('investigator')
      ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      : 'bg-slate-700/60 text-slate-300 border-slate-600/40';

  return (
    <header className="h-16 bg-[#091126]/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 z-20 text-slate-200 select-none">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Account ID (ACC-101) or Txn ID (TXN-101)..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
          />
        </div>
      </form>

      {/* Right Controls */}
      <div className="flex items-center gap-4 ml-4">
        {/* Active Investigation Case Badge */}
        <button
          onClick={() => navigate(`/investigations/${activeInvestigationId || 'INV-2025-001'}`)}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium hover:bg-amber-500/20 transition"
        >
          <Briefcase className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] uppercase tracking-wider text-amber-400/80 font-bold">Active Case:</span>
          <span className="font-mono font-semibold">{activeInvestigationId || 'INV-2025-001'}</span>
        </button>

        {/* Real-time Socket Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300">
          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span className="font-semibold text-emerald-400">Live Sync</span>
        </div>

        {/* Notifications */}
        <NotificationBell />

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800/80 transition"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-blue-500/20">
              {user?.firstName?.[0] || user?.name?.[0] || 'S'}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-white leading-tight">
                {user?.name || `${user?.firstName || 'Sarah'} ${user?.lastName || 'Lin'}`}
              </span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider border w-fit ${roleBadgeColor}`}>
                {user?.role || 'Lead Analyst'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-2 z-50 text-xs">
              <div className="px-4 py-2 border-b border-slate-800">
                <p className="font-semibold text-white">{user?.name || 'Sarah Lin'}</p>
                <p className="text-slate-400 text-[11px] truncate">{user?.email || 'sarah.lin@nexusfraud.io'}</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/settings');
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2.5"
                >
                  <User className="w-4 h-4 text-blue-400" /> Profile & Credentials
                </button>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/settings');
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2.5"
                >
                  <Shield className="w-4 h-4 text-purple-400" /> Security Permissions
                </button>
              </div>

              <div className="border-t border-slate-800 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-500/10 flex items-center gap-2.5 font-medium transition"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
