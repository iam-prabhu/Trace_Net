import { CheckCircle2, ShieldAlert, FileText, UserPlus, ArrowRight } from 'lucide-react';

interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  description: string;
  author: string;
  type: 'creation' | 'finding' | 'note' | 'status';
}

const DEFAULT_TIMELINE: TimelineEvent[] = [
  {
    id: 'tl-1',
    time: '2025-03-10 16:00',
    title: 'Case Dossier Created',
    description: 'Investigation initiated from FinCEN SAR high-priority queue.',
    author: 'Sarah Lin',
    type: 'creation',
  },
  {
    id: 'tl-2',
    time: '2025-03-10 16:45',
    title: 'Evidence Finding Attached: Johnson Loop',
    description: '4-node circular circuit flagged with volume $578k.',
    author: 'Algorithmic Engine',
    type: 'finding',
  },
  {
    id: 'tl-3',
    time: '2025-03-11 09:15',
    title: 'Investigator Annotation Recorded',
    description: 'Cross-referenced shell addresses with corporate registrar filings.',
    author: 'Marcus Vance',
    type: 'note',
  },
  {
    id: 'tl-4',
    time: '2025-03-11 11:30',
    title: 'Case Escalated to IN_PROGRESS',
    description: 'Status updated and assigned to senior financial intelligence team.',
    author: 'Sarah Lin',
    type: 'status',
  },
];

export function InvestigationTimeline({ events = DEFAULT_TIMELINE }: { events?: TimelineEvent[] }) {
  return (
    <div className="space-y-4">
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {events.map((evt) => (
          <div key={evt.id} className="relative text-xs">
            <div className="absolute -left-6 top-0 w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-blue-400">
              {evt.type === 'creation' ? <UserPlus className="w-2.5 h-2.5" /> :
               evt.type === 'finding' ? <ShieldAlert className="w-2.5 h-2.5 text-red-400" /> :
               evt.type === 'status' ? <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> :
               <FileText className="w-2.5 h-2.5 text-amber-400" />}
            </div>
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-bold text-white">{evt.title}</span>
                <span className="text-[10px] text-slate-500 font-mono">{evt.time}</span>
              </div>
              <p className="text-slate-400">{evt.description}</p>
              <span className="text-[10px] text-blue-400 mt-1 block">Author: {evt.author}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
