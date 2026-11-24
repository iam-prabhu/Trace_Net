import { Radio } from 'lucide-react';
import { useCollaboration } from '../../hooks/useCollaboration';
import { useAuthStore } from '../../store/auth.store';

interface CollaboratorPresenceProps {
  investigationId: string;
}

export function CollaboratorPresence({ investigationId }: CollaboratorPresenceProps) {
  const { collaborators } = useCollaboration(investigationId);
  const currentUser = useAuthStore((s) => s.user);

  // If socket hasn't registered self yet, display current logged-in investigator
  const displayUsers =
    collaborators.length > 0
      ? collaborators
      : currentUser
      ? [
          {
            userId: currentUser.id,
            email: currentUser.email,
            name: currentUser.name || currentUser.email.split('@')[0],
            color: '#3B82F6',
            activity: 'Viewing Canvas',
            role: currentUser.role,
          },
        ]
      : [];

  return (
    <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-slate-200 text-xs shadow-xs">
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 font-semibold text-[11px] border border-emerald-200 shrink-0">
        <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
        <span>Live Presence</span>
        <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-emerald-200/60 text-emerald-800 text-[10px] font-mono">
          {displayUsers.length}
        </span>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto max-w-xs sm:max-w-md py-0.5">
        {displayUsers.map((u) => {
          const isMe = currentUser && (u.userId === currentUser.id || u.email === currentUser.email);
          return (
            <div
              key={u.userId || u.socketId || u.email}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 shrink-0 transition"
              title={`${u.email} (${u.activity || 'Active'})`}
            >
              <span
                className="w-2 h-2 rounded-full ring-2 ring-white shrink-0"
                style={{ backgroundColor: u.color || '#3B82F6' }}
              />
              <span className="font-semibold text-xs text-slate-900">
                {u.name || u.email.split('@')[0]}
                {isMe ? ' (You)' : ''}
              </span>
              <span className="text-[10px] text-slate-500 hidden md:inline">
                • {u.activity || 'Viewing'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
