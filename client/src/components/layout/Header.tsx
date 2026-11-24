import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Briefcase,
  LogOut,
  ChevronDown,
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
      ? 'bg-purple-50 text-purple-700 border-purple-200'
      : role.includes('analyst') || role.includes('investigator')
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 z-20 text-slate-800 select-none shadow-xs">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Account ID (ACC-101) or Txn ID (TXN-101)..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
          />
        </div>
      </form>

      {/* Right Controls */}
      <div className="flex items-center gap-4 ml-4">
        {/* Active Investigation Case Badge */}
        <button
          onClick={() => navigate(`/investigations/${activeInvestigationId || 'INV-2025-001'}`)}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium hover:bg-amber-100 transition"
        >
          <Briefcase className="w-3.5 h-3.5 text-amber-600" />
          <span className="text-[11px] uppercase tracking-wider text-amber-700 font-bold">Active Case:</span>
          <span className="font-mono font-semibold">{activeInvestigationId || 'INV-2025-001'}</span>
        </button>

        {/* Notifications */}
        <NotificationBell />

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 border border-slate-200 transition"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-blue-500/20">
              {user?.firstName?.[0] || user?.name?.[0] || 'S'}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 leading-tight">
                {user?.name || `${user?.firstName || 'Sarah'} ${user?.lastName || 'Lin'}`}
              </span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider border w-fit ${roleBadgeColor}`}>
                {user?.role || 'Lead Analyst'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 text-xs">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="font-semibold text-slate-900">{user?.name || 'Sarah Lin'}</p>
                <p className="text-slate-500 text-[11px] truncate">{user?.email || 'sarah.lin@nexusfraud.io'}</p>
              </div>

              <div className="pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2.5 font-medium transition"
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
