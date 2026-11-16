import { Radio } from 'lucide-react';
import { useCollaborationStore } from '../../store/collaboration.store';

interface CollaboratorPresenceProps {
  investigationId: string;
}

export function CollaboratorPresence({ investigationId: _investigationId }: CollaboratorPresenceProps) {
  const { collaborators } = useCollaborationStore();

  const demoActiveUsers = collaborators.length > 0 ? collaborators : [
    { userId: 'u-1', email: 'sarah.lin@nexusfraud.io', name: 'Sarah Lin', color: '#3B82F6', activity: 'Viewing Subgraph' },
    { userId: 'u-2', email: 'marcus.vance@nexusfraud.io', name: 'Marcus Vance', color: '#10B981', activity: 'Editing Notes' },
  ];

  return (
    <div className="flex items-center gap-2 p-2 bg-slate-900/90 rounded-2xl border border-slate-800 text-xs">
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-semibold text-[11px] border border-emerald-500/20">
        <Radio className="w-3 h-3 animate-pulse" />
        <span>Live Presence</span>
      </div>

      <div className="flex items-center gap-1.5">
        {demoActiveUsers.map((u) => (
          <div
            key={u.userId}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-200"
            title={`${u.email} (${(u as any).activity || 'Active'})`}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: u.color || '#3B82F6' }}
            />
            <span className="font-semibold text-xs">{(u as any).name || u.email.split('@')[0]}</span>
            <span className="text-[10px] text-slate-400 hidden sm:inline">
              • {(u as any).activity || 'Viewing'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
