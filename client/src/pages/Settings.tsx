import { useState } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Server,
  Database,
  Radio,
  CheckCircle2,
  Lock,
  Palette,
  Moon,
  Sparkles,
  Key,
} from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { API_URL, WS_URL } from '../utils/constants';

export default function Settings() {
  const { user } = useAuthStore();
  const [selectedTheme, setSelectedTheme] = useState<'navy' | 'charcoal' | 'amoled'>('navy');

  const isAdmin = (user?.role || '').toLowerCase().includes('admin');

  const permissions = [
    { name: 'View & Query Graph Networks', granted: true, desc: 'Full Cytoscape canvas access and node expansion' },
    { name: 'Run Johnson Elementary Cycles', granted: true, desc: 'Detect circular transactions up to depth 6' },
    { name: 'Louvain Modularity Partitioning', granted: true, desc: 'Partition graph into community clusters' },
    { name: 'Export Dossiers & Evidence Reports', granted: true, desc: 'Download CSV and TXT audit summaries' },
    { name: 'Dataset Schema Management', granted: isAdmin, desc: 'Ingest and validate new transaction batches' },
    { name: 'Administrative User Governance', granted: isAdmin, desc: 'Manage analyst accounts and role bindings' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8 text-slate-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-blue-500" />
          Settings & System Configuration
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          User access control, engine connectivity, permissions and visual styling
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: User Profile & Security */}
        <div className="lg:col-span-6 space-y-6">
          {/* User Profile Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-400" />
              Authenticated Investigator Profile
            </h3>

            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-500/20">
                {user?.name?.[0] || user?.firstName?.[0] || 'S'}
              </div>
              <div>
                <h4 className="font-bold text-base text-white">
                  {user?.name || `${user?.firstName || 'Sarah'} ${user?.lastName || 'Lin'}`}
                </h4>
                <p className="text-xs text-slate-400">{user?.email || 'sarah.lin@nexusfraud.io'}</p>
                <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  <Shield className="w-3 h-3" />
                  <span>Role: {user?.role || 'Admin'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs border-t border-slate-800 pt-4">
              <div className="flex justify-between text-slate-400">
                <span>Account Status</span>
                <span className="text-emerald-400 font-bold">Active & Verified</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Session Security</span>
                <span className="font-mono text-slate-300">JWT Bearer (HS256)</span>
              </div>
            </div>
          </div>

          {/* Permissions Matrix */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Key className="w-4 h-4 text-purple-400" />
              Assigned Security Permissions
            </h3>

            <div className="space-y-2.5">
              {permissions.map((perm, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-start justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-semibold text-white block">{perm.name}</span>
                    <span className="text-[11px] text-slate-400">{perm.desc}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    perm.granted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {perm.granted ? 'GRANTED' : 'RESTRICTED'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Engine Status & Appearance */}
        <div className="lg:col-span-6 space-y-6">
          {/* Engine Connectivity Status */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              System Architecture & Infrastructure Status
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 text-blue-400" />
                  <div>
                    <span className="font-bold text-white block">Neo4j Graph Database</span>
                    <span className="text-[10px] text-slate-400">Bolt Protocol • Port 7687</span>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" /> ONLINE
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Server className="w-4 h-4 text-purple-400" />
                  <div>
                    <span className="font-bold text-white block">PostgreSQL Dossier Store</span>
                    <span className="text-[10px] text-slate-400">Relational Cases • Port 5432</span>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" /> ONLINE
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Radio className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="font-bold text-white block">Socket.IO Gateway</span>
                    <span className="text-[10px] text-slate-400">{WS_URL}</span>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" /> CONNECTED
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-pink-400" />
                  <div>
                    <span className="font-bold text-white block">High-Fidelity Offline Mock Engine</span>
                    <span className="text-[10px] text-slate-400">Automatic fallback for zero-downtime demo</span>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  READY
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-500 flex justify-between">
              <span>API Base: {API_URL}</span>
              <span>Client Build: v1.0.0-PROD</span>
            </div>
          </div>

          {/* Theme & Visual Options */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Palette className="w-4 h-4 text-blue-400" />
              Theme & Presentation Settings
            </h3>

            <div className="grid grid-cols-3 gap-3 text-xs">
              {[
                { id: 'navy', label: 'Dark Navy (Financial)', bg: 'bg-[#070d1e]' },
                { id: 'charcoal', label: 'Charcoal (Intelligence)', bg: 'bg-[#0f172a]' },
                { id: 'amoled', label: 'AMOLED Black', bg: 'bg-black' },
              ].map((th) => (
                <button
                  key={th.id}
                  onClick={() => setSelectedTheme(th.id as any)}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-2 ${
                    selectedTheme === th.id
                      ? 'border-blue-500 bg-blue-500/10 text-white'
                      : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg ${th.bg} border border-slate-700 shadow-inner`} />
                  <span className="font-semibold text-[11px]">{th.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
