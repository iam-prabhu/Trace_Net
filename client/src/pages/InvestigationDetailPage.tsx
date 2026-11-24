import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  ArrowLeft,
  ShieldAlert,
  Clock,
  User,
  CheckCircle2,
  Share2,
  FileDown,
  Layers,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import {
  getInvestigation,
  updateInvestigation,
  getFindings,
  getNotes,
} from '../services/investigation.service';
import type { Investigation, Finding, Note, InvestigationStatus } from '../types/investigation.types';
import { formatDate, formatDateTime } from '../utils/format';
import { CollaboratorPresence } from '../components/investigation/CollaboratorPresence';
import { InvestigationNotes } from '../components/investigation/InvestigationNotes';
import { GraphCanvas } from '../components/graph/GraphCanvas';
import { useGraphStore } from '../store/graph.store';
import { useCollaborationStore } from '../store/collaboration.store';
import { getSocket } from '../services/socket';
import { MOCK_GRAPH } from '../services/mock-data';

export default function InvestigationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { setHighlightedPath } = useGraphStore();
  const { setActiveInvestigation } = useCollaborationStore();

  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const investigationId = id || 'INV-2025-001';

  // Setup Socket connection & join room
  useEffect(() => {
    setActiveInvestigation(investigationId);

    try {
      const socket = getSocket();
      socket.emit('investigation:join', investigationId);

      socket.on('investigation:status-updated', (data: { status: string }) => {
        setInvestigation((prev: Investigation | null) => prev ? { ...prev, status: data.status as InvestigationStatus } : null);
      });

      socket.on('investigation:note-created', (data: { note: Note }) => {
        setNotes((prev: Note[]) => [...prev, data.note]);
      });
    } catch (err) {
      console.warn('Socket setup warning:', err);
    }

    // Load Case Data
    Promise.all([
      getInvestigation(investigationId),
      getFindings(investigationId),
      getNotes(investigationId),
    ]).then(([invRes, fndRes, notRes]) => {
      setInvestigation(invRes);
      setFindings(fndRes);
      setNotes(notRes);
      setIsLoading(false);
    });

    return () => {
      try {
        const socket = getSocket();
        socket.emit('investigation:leave', investigationId);
        socket.off('investigation:status-updated');
        socket.off('investigation:note-created');
      } catch {}
      setActiveInvestigation(null);
    };
  }, [investigationId]);

  const handleStatusChange = async (newStatus: InvestigationStatus) => {
    if (!investigation) return;
    try {
      const updated = await updateInvestigation(investigation.id, { status: newStatus });
      setInvestigation(updated);

      // Broadcast status update
      const socket = getSocket();
      socket.emit('investigation:status-updated', {
        investigationId: investigation.id,
        status: newStatus,
      });
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleNoteAdded = (newNote: Note) => {
    setNotes([...notes, newNote]);
  };

  const handleExportDossier = () => {
    const reportText = `INVESTIGATION REPORT: ${investigation?.id}
Title: ${investigation?.title}
Status: ${investigation?.status}
Assigned: ${investigation?.assignedTo}
Created: ${investigation?.createdAt}

NARRATIVE:
${investigation?.description}

ATTACHED FINDINGS:
${findings.map(f => `- [${f.severity.toUpperCase()}] ${f.title}: ${f.description}`).join('\n')}

INVESTIGATOR NOTES:
${notes.map(n => `- [${n.createdAt}] ${n.authorId}: ${n.content}`).join('\n')}
`;
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `case-dossier-${investigation?.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !investigation) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-400 text-xs">
        Loading investigation case dossier...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8 text-slate-200">
      {/* Top Navigation & Presence Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/investigations')}
            className="p-2 bg-slate-900 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white border border-slate-800 transition"
            title="Back to Cases"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {investigation.id}
              </span>
              <h1 className="text-xl font-black text-slate-900">{investigation.title}</h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{investigation.description}</p>
          </div>
        </div>

        {/* Real-time active investigator presence pills */}
        <div className="flex items-center gap-3 shrink-0">
          <CollaboratorPresence investigationId={investigation.id} />

          {/* Status changer dropdown */}
          <select
            value={investigation.status}
            onChange={(e) => handleStatusChange(e.target.value as InvestigationStatus)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 uppercase tracking-wider shadow-xs cursor-pointer"
          >
            <option value="open">STATUS: OPEN</option>
            <option value="in_progress">STATUS: IN PROGRESS</option>
            <option value="closed">STATUS: CLOSED</option>
            <option value="archived">STATUS: ARCHIVED</option>
          </select>

          <button
            onClick={handleExportDossier}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition cursor-pointer"
            title="Export Case Dossier Report"
          >
            <FileDown className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Export Dossier</span>
          </button>
        </div>
      </div>

      {/* Primary Split: Subgraph Canvas & Collaborative Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Associated Subgraph Canvas */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col h-[420px]">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 text-xs">
              <span className="font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                Associated Evidentiary Subgraph
              </span>
              <span className="text-slate-500 font-mono text-[11px]">
                Interactive Subgraph Canvas
              </span>
            </div>

            <div className="flex-1 relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
              <GraphCanvas
                graphData={MOCK_GRAPH}
                hideLegend
              />
            </div>
          </div>

          {/* Attached Findings Explainability Cards */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Attached Forensic Findings ({findings.length})
              </h4>
            </div>

            <div className="space-y-3">
              {findings.map((finding) => (
                <div
                  key={finding.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[11px] font-bold text-slate-500">{finding.id}</span>
                      <span className="font-semibold text-xs text-slate-900">{finding.title}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                        {finding.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{finding.description}</p>
                  </div>

                  <button
                    onClick={() => setHighlightedPath(finding.nodeIds)}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer"
                  >
                    Highlight Evidence in Canvas
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Collaborative Notes & Annotations Feed */}
        <div className="lg:col-span-5 h-[720px]">
          <InvestigationNotes
            investigationId={investigation.id}
            notes={notes}
            onNoteAdded={handleNoteAdded}
          />
        </div>
      </div>
    </div>
  );
}
