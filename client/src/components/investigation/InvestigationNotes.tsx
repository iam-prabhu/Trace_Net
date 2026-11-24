import { useState } from 'react';
import { Send, MessageSquare, User, Clock, Link as LinkIcon } from 'lucide-react';
import type { Note } from '../../types/investigation.types';
import { formatDateTime } from '../../utils/format';
import { createNote } from '../../services/investigation.service';
import { getSocket } from '../../services/socket';
import { useAuthStore } from '../../store/auth.store';

interface InvestigationNotesProps {
  investigationId: string;
  notes: Note[];
  onNoteAdded?: (note: Note) => void;
}

export function InvestigationNotes({
  investigationId,
  notes,
  onNoteAdded,
}: InvestigationNotesProps) {
  const currentUser = useAuthStore((s) => s.user);
  const [content, setContent] = useState('');
  const [entityLink, setEntityLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const fullContent = entityLink.trim()
        ? `${content.trim()} [Linked Entity: ${entityLink.trim()}]`
        : content.trim();

      const authorName = currentUser?.name || currentUser?.email || 'Investigator';

      const created = await createNote({
        investigationId,
        content: fullContent,
        authorId: authorName,
      });

      // Broadcast note event to room via socket
      try {
        const socket = getSocket();
        socket.emit('investigation:note-created', {
          investigationId,
          note: created,
        });
      } catch (err) {
        console.warn('Socket note broadcast skipped:', err);
      }

      onNoteAdded?.(created);
      setContent('');
      setEntityLink('');
    } catch (err) {
      console.error('Failed to post note:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 p-4 text-slate-800 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-600" />
          Investigator Annotations & Timeline Notes
        </h4>
        <span className="text-xs text-slate-500 font-mono font-bold">
          {notes.length} Notes
        </span>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {notes.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No notes added yet. Record evidentiary findings below.
          </div>
        ) : (
          notes.map((n) => (
            <div
              key={n.id}
              className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-blue-700">
                  <User className="w-3.5 h-3.5" />
                  <span>{n.authorId || 'Investigator'}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDateTime(n.createdAt)}
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{n.content}</p>
            </div>
          ))
        )}
      </div>

      {/* Note Input Form */}
      <form onSubmit={handleSubmit} className="mt-4 pt-3 border-t border-slate-100 space-y-2">
        <textarea
          rows={2}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add collaborative findings, SAR references, or SAR observations..."
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 resize-none"
        />

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <LinkIcon className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={entityLink}
              onChange={(e) => setEntityLink(e.target.value)}
              placeholder="Tag Account/Txn ID (e.g. ACC-101)..."
              className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono text-[11px] focus:outline-none focus:bg-white focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-3 h-3" />
            <span>Post Note</span>
          </button>
        </div>
      </form>
    </div>
  );
}
