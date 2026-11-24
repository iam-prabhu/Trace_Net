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
    <div className="space-y-6 max-w-5xl mx-auto pb-8 text-slate-800">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-blue-600" />
          Settings & System Configuration
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          User access control, engine connectivity, permissions and visual styling
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: User Profile & Security */}
        <div className="lg:col-span-6 space-y-6">
          {/* User Profile Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              Authenticated Investigator Profile
            </h3>

            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-500/20">
                {user?.name?.[0] || user?.firstName?.[0] || 'S'}
              </div>
              <div>
                <h4 className="font-bold text-base text-slate-900">
                  {user?.name || `${user?.firstName || 'Sarah'} ${user?.lastName || 'Lin'}`}
                </h4>
                <p className="text-xs text-slate-500">{user?.email || 'sarah.lin@nexusfraud.io'}</p>
                <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                  <Shield className="w-3 h-3" />
                  <span>Role: {user?.role || 'Admin'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs border-t border-slate-100 pt-4">
              <div className="flex justify-between text-slate-500">
                <span>Account Status</span>
                <span className="text-emerald-600 font-bold">Active & Verified</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Session Security</span>
                <span className="font-mono text-slate-700">JWT Bearer (HS256)</span>
              </div>
            </div>
          </div>

          {/* Permissions Matrix */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Key className="w-4 h-4 text-purple-600" />
              Assigned Security Permissions
            </h3>

            <div className="space-y-2.5">
              {permissions.map((perm, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-900 block">{perm.name}</span>
                    <span className="text-[11px] text-slate-500">{perm.desc}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    perm.granted ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
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
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-600" />
              System Architecture & Infrastructure Status
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 text-blue-600" />
                  <div>
                    <span className="font-bold text-slate-900 block">Neo4j Graph Database</span>
                    <span className="text-[10px] text-slate-500">Bolt Protocol • Port 7687</span>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> ONLINE
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Server className="w-4 h-4 text-purple-600" />
                  <div>
                    <span className="font-bold text-slate-900 block">PostgreSQL Dossier Store</span>
                    <span className="text-[10px] text-slate-500">Relational Cases • Port 5432</span>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> ONLINE
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Radio className="w-4 h-4 text-amber-600" />
                  <div>
                    <span className="font-bold text-slate-900 block">Socket.IO Gateway</span>
                    <span className="text-[10px] text-slate-500">{WS_URL}</span>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> CONNECTED
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-pink-600" />
                  <div>
                    <span className="font-bold text-slate-900 block">High-Fidelity Offline Mock Engine</span>
                    <span className="text-[10px] text-slate-500">Automatic fallback for zero-downtime demo</span>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  READY
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-500 flex justify-between">
              <span>API Base: {API_URL}</span>
              <span>Client Build: v1.0.0-PROD</span>
            </div>
          </div>

          {/* Theme & Visual Options */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Palette className="w-4 h-4 text-blue-600" />
              Theme & Presentation Settings
            </h3>

            <div className="grid grid-cols-3 gap-3 text-xs">
              {[
                { id: 'light', label: 'Crisp Light (Default)', bg: 'bg-white border-slate-300' },
                { id: 'slate', label: 'Slate Minimal', bg: 'bg-slate-100 border-slate-300' },
                { id: 'cool', label: 'Cool Sky Tint', bg: 'bg-blue-50 border-blue-200' },
              ].map((th) => (
                <button
                  key={th.id}
                  onClick={() => setSelectedTheme(th.id as any)}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-2 cursor-pointer ${
                    selectedTheme === th.id
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg ${th.bg} border shadow-xs`} />
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
