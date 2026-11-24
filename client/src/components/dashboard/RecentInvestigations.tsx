import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, ArrowRight, User, CheckCircle2, Clock } from 'lucide-react';
import { getInvestigations } from '../../services/investigation.service';
import { getSocket } from '../../services/socket';
import { formatDate } from '../../utils/format';
import type { Investigation } from '../../types/investigation.types';

export function RecentInvestigations() {
  const navigate = useNavigate();
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active'>('active');

  const fetchCases = () => {
    getInvestigations().then((data) => {
      if (data) {
        setInvestigations(data);
      }
      setIsLoading(false);
    });
  };

  useEffect(() => {
    fetchCases();

    let socket: any = null;
    try {
      socket = getSocket();

      // Listen for status updates in real-time
      socket.on('investigation:status-updated', (data: { id?: string; investigationId?: string; status: string }) => {
        const caseId = data.id || data.investigationId;
        if (!caseId) return;

        setInvestigations((prev) =>
          prev.map((inv) =>
            inv.id === caseId ? { ...inv, status: data.status as any, updatedAt: new Date().toISOString() } : inv
          )
        );
      });

      // Listen for new investigations created in real-time
      socket.on('investigation:created', () => {
        fetchCases();
      });
    } catch (err) {
      console.warn('Socket listener warning:', err);
    }

    return () => {
      if (socket) {
        socket.off('investigation:status-updated');
        socket.off('investigation:created');
      }
    };
  }, []);

  const activeCount = investigations.filter(
    (inv) => inv.status.toLowerCase() === 'open' || inv.status.toLowerCase() === 'in_progress'
  ).length;

  const displayedCases = investigations.filter((inv) => {
    if (filter === 'active') {
      const s = inv.status.toLowerCase();
      return s === 'open' || s === 'in_progress';
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    switch (s) {
      case 'in_progress':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'open':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'closed':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'archived':
        return 'bg-slate-50 text-slate-400 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col h-full text-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-amber-600" />
            Investigation Cases ({investigations.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {filter === 'active'
              ? `${activeCount} active case${activeCount === 1 ? '' : 's'} under analytical review`
              : 'All registered cases and audit dossiers'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Active / All Toggle Filter */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setFilter('active')}
              className={`px-2 py-0.5 rounded-md font-medium text-[11px] transition cursor-pointer ${
                filter === 'active'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-2 py-0.5 rounded-md font-medium text-[11px] transition cursor-pointer ${
                filter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All ({investigations.length})
            </button>
          </div>

          <button
            onClick={() => navigate('/investigations')}
            className="text-xs text-blue-600 hover:text-blue-500 font-semibold flex items-center gap-1 transition cursor-pointer ml-1"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading cases...</div>
        ) : displayedCases.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            <CheckCircle2 className="w-5 h-5 text-slate-300 mx-auto mb-1" />
            No {filter} cases to display.
          </div>
        ) : (
          displayedCases.map((inv) => (
            <div
              key={inv.id}
              onClick={() => navigate(`/investigations/${inv.id}`)}
              className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-600">{inv.id}</span>
                  <span className="font-semibold text-xs text-slate-900 truncate">{inv.title}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-1">{inv.description}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate max-w-[120px]">{inv.assignedTo || inv.createdBy || 'Unassigned'}</span>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(
                    inv.status
                  )}`}
                >
                  {inv.status.replace('_', ' ')}
                </span>

                <span className="text-[11px] font-mono text-slate-400 hidden md:inline">
                  {formatDate(inv.updatedAt || inv.createdAt)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
