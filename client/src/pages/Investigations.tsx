import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  User,
  Clock,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { getInvestigations, createInvestigation } from '../services/investigation.service';
import type { Investigation } from '../types/investigation.types';
import { formatDate } from '../utils/format';
import { CreateInvestigationModal } from '../components/investigation/CreateInvestigationModal';
import { MOCK_INVESTIGATIONS } from '../services/mock-data';

export default function Investigations() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [investigations, setInvestigations] = useState<Investigation[]>(MOCK_INVESTIGATIONS);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const initialAccount = searchParams.get('addFinding') || searchParams.get('createFromCycle') || '';

  useEffect(() => {
    let mounted = true;
    getInvestigations().then((res: Investigation[]) => {
      if (mounted && res.length > 0) {
        setInvestigations(res);
      }
    });

    if (initialAccount) {
      setIsModalOpen(true);
    }

    return () => {
      mounted = false;
    };
  }, [initialAccount]);

  const filteredCases = useMemo(() => {
    return investigations.filter((inv) => {
      const matchesTab =
        activeTab === 'all' || inv.status.toLowerCase() === activeTab.toLowerCase();
      const matchesQuery =
        inv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesQuery;
    });
  }, [investigations, activeTab, searchQuery]);

  const handleCreateSubmit = async (data: Partial<Investigation>) => {
    const created = await createInvestigation(data);
    setInvestigations([created, ...investigations]);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8 text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-amber-500" />
            Financial Crime Investigations & Case Dossiers
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Collaborative case workspace for SAR filing, evidence clustering, and audit trails
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 !text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/25 transition shrink-0 cursor-pointer active:scale-[0.99]"
        >
          <Plus className="w-4 h-4 !text-white shrink-0" />
          <span className="!text-white font-bold">New Investigation Case</span>
        </button>
      </div>

      {/* Filter and Tab Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs overflow-x-auto">
          {[
            { id: 'all', label: 'All Cases' },
            { id: 'open', label: 'Open' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'closed', label: 'Closed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-blue-600 !text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dossier by ID or title..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Case Dossiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCases.map((inv) => (
          <div
            key={inv.id}
            onClick={() => navigate(`/investigations/${inv.id}`)}
            className="p-5 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 shadow-xl transition cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-md border border-blue-500/20">
                  {inv.id}
                </span>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    inv.status === 'in_progress'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : inv.status === 'open'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {inv.status.replace('_', ' ')}
                </span>
              </div>

              <h3 className="font-bold text-sm text-white group-hover:text-blue-400 transition mb-1 line-clamp-1">
                {inv.title}
              </h3>
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {inv.description}
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span className="truncate max-w-[120px]">{inv.assignedTo || inv.createdBy}</span>
              </div>

              <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
                <Clock className="w-3 h-3" />
                <span>{formatDate(inv.createdAt)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      <CreateInvestigationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateSubmit}
        initialAccount={initialAccount}
      />
    </div>
  );
}
