import { useNavigate } from 'react-router-dom';
import { Briefcase, ArrowRight, User } from 'lucide-react';
import { MOCK_INVESTIGATIONS } from '../../services/mock-data';
import { formatDate } from '../../utils/format';

export function RecentInvestigations() {
  const navigate = useNavigate();

  return (
    <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-amber-400" />
            Active Investigation Cases
          </h3>
          <p className="text-xs text-slate-400">Open dossiers currently under analytical review</p>
        </div>

        <button
          onClick={() => navigate('/investigations')}
          className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition"
        >
          View all cases <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-3">
        {MOCK_INVESTIGATIONS.map((inv) => (
          <div
            key={inv.id}
            onClick={() => navigate(`/investigations/${inv.id}`)}
            className="p-3.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/50 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-400">{inv.id}</span>
                <span className="font-semibold text-xs text-white">{inv.title}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1 line-clamp-1">{inv.description}</p>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>{inv.assignedTo || 'Unassigned'}</span>
              </div>

              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  inv.status === 'in_progress'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}
              >
                {inv.status.replace('_', ' ')}
              </span>

              <span className="text-[11px] font-mono text-slate-500 hidden md:inline">
                {formatDate(inv.updatedAt)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
