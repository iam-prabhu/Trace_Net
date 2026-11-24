import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowRight, Layers } from 'lucide-react';
import { getFindings } from '../../services/investigation.service';
import { formatDate } from '../../utils/format';
import type { Finding } from '../../types/investigation.types';
import { MOCK_FINDINGS } from '../../services/mock-data';

export function RecentFindings() {
  const navigate = useNavigate();
  const [findings, setFindings] = useState<Finding[]>(MOCK_FINDINGS);

  useEffect(() => {
    getFindings().then((data) => {
      if (data && data.length > 0) {
        setFindings(data);
      }
    });
  }, []);

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm text-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            Recent Suspicious Graph Findings
          </h3>
          <p className="text-xs text-slate-500">Algorithmic detections requiring investigator review</p>
        </div>

        <button
          onClick={() => navigate('/analysis')}
          className="text-xs text-blue-600 hover:text-blue-500 font-semibold flex items-center gap-1 transition cursor-pointer"
        >
          View all findings <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-500">
              <th className="pb-3 font-semibold">Finding / Title</th>
              <th className="pb-3 font-semibold">Severity</th>
              <th className="pb-3 font-semibold">Involved Entities</th>
              <th className="pb-3 font-semibold">Detected At</th>
              <th className="pb-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {findings.map((finding) => (
              <tr key={finding.id} className="hover:bg-slate-50/80 transition">
                <td className="py-3 pr-4">
                  <div className="font-semibold text-slate-900">{finding.title}</div>
                  <div className="text-[11px] text-slate-500 truncate max-w-xs">{finding.description}</div>
                </td>
                <td className="py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                      finding.severity === 'critical'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : finding.severity === 'high'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}
                  >
                    {finding.severity}
                  </span>
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-1 text-slate-600 font-mono text-[11px]">
                    <Layers className="w-3 h-3 text-slate-400" />
                    <span>{finding.nodeIds.length} Nodes, {finding.edgeIds.length} Edges</span>
                  </div>
                </td>
                <td className="py-3 text-slate-500 font-mono text-[11px]">
                  {formatDate(finding.createdAt)}
                </td>
                <td className="py-3 text-right">
                  <button
                    onClick={() => navigate(`/investigations/${finding.investigationId}`)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition cursor-pointer"
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
