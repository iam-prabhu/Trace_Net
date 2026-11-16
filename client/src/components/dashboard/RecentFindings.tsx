import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowRight, Layers } from 'lucide-react';
import { MOCK_FINDINGS } from '../../services/mock-data';
import { formatDate } from '../../utils/format';

export function RecentFindings() {
  const navigate = useNavigate();

  return (
    <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            Recent Suspicious Graph Findings
          </h3>
          <p className="text-xs text-slate-400">Algorithmic detections requiring investigator review</p>
        </div>

        <button
          onClick={() => navigate('/analysis')}
          className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition"
        >
          View all findings <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="pb-3 font-semibold">Finding / Title</th>
              <th className="pb-3 font-semibold">Severity</th>
              <th className="pb-3 font-semibold">Involved Entities</th>
              <th className="pb-3 font-semibold">Detected At</th>
              <th className="pb-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {MOCK_FINDINGS.map((finding) => (
              <tr key={finding.id} className="hover:bg-slate-800/40 transition">
                <td className="py-3 pr-4">
                  <div className="font-semibold text-white">{finding.title}</div>
                  <div className="text-[11px] text-slate-400 truncate max-w-xs">{finding.description}</div>
                </td>
                <td className="py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                      finding.severity === 'critical'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : finding.severity === 'high'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    {finding.severity}
                  </span>
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-1 text-slate-300 font-mono text-[11px]">
                    <Layers className="w-3 h-3 text-slate-500" />
                    <span>{finding.nodeIds.length} Nodes, {finding.edgeIds.length} Edges</span>
                  </div>
                </td>
                <td className="py-3 text-slate-400 font-mono text-[11px]">
                  {formatDate(finding.createdAt)}
                </td>
                <td className="py-3 text-right">
                  <button
                    onClick={() => navigate(`/investigations/${finding.investigationId}`)}
                    className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/40 rounded-lg text-xs font-semibold transition"
                  >
                    Investigate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
