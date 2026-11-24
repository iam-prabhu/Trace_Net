import { useState, useEffect } from 'react';
import { Bell, AlertOctagon, RefreshCw, X, ShieldAlert, PlusCircle, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getSocket } from '../../services/socket';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  severity: 'critical' | 'high' | 'info';
  link?: string;
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    let socket: ReturnType<typeof getSocket> | null = null;
    try {
      socket = getSocket();

      socket.on('investigation:created', (data: any) => {
        const severity = data.priority === 'CRITICAL' ? 'critical' : data.priority === 'HIGH' ? 'high' : 'info';
        setNotifications(prev => [
          {
            id: `notif-inv-${Date.now()}`,
            title: 'New Investigation Opened',
            message: `"${data.title}" created by ${data.createdBy}`,
            time: 'just now',
            severity,
            link: `/investigations/${data.id}`,
          },
          ...prev,
        ]);
      });

      socket.on('investigation:note-created', (data: any) => {
        setNotifications(prev => [
          {
            id: `notif-note-${Date.now()}`,
            title: 'Investigation Note Added',
            message: data.note?.content?.slice(0, 90) || 'A new note was attached to a case.',
            time: 'just now',
            severity: 'info',
            link: data.note?.investigationId ? `/investigations/${data.note.investigationId}` : '/investigations',
          },
          ...prev,
        ]);
      });

      socket.on('investigation:status-updated', (data: any) => {
        setNotifications(prev => [
          {
            id: `notif-status-${Date.now()}`,
            title: 'Investigation Status Changed',
            message: `Case ${data.id ?? ''} moved to ${data.status ?? 'unknown'}`,
            time: 'just now',
            severity: 'high',
            link: data.id ? `/investigations/${data.id}` : '/investigations',
          },
          ...prev,
        ]);
      });
    } catch {
      // Socket not available (server offline) — stay silent
    }

    return () => {
      if (socket) {
        socket.off('investigation:created');
        socket.off('investigation:note-created');
        socket.off('investigation:status-updated');
      }
    };
  }, []);

  const unreadCount = notifications.length;

  const handleClear = () => setNotifications([]);

  const handleNotificationClick = (link?: string) => {
    setIsOpen(false);
    if (link) navigate(link);
  };

  const severityIcon = (sev: NotificationItem['severity']) => {
    if (sev === 'critical') return <AlertOctagon className="w-4 h-4" />;
    if (sev === 'high') return <ShieldAlert className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 text-slate-800 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span className="font-semibold text-xs text-slate-900">Live Alerts</span>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-full font-mono font-medium">
                {unreadCount}
              </span>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleClear}
                className="text-[11px] text-slate-500 hover:text-slate-800 transition font-medium"
              >
                Clear all
              </button>
            )}
          </div>

          {/* List */}
          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <PlusCircle className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No notifications yet.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Create an investigation to see live alerts.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n.link)}
                  className="p-3 hover:bg-slate-50 transition cursor-pointer flex items-start gap-3"
                >
                  <div
                    className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      n.severity === 'critical'
                        ? 'bg-red-50 text-red-600 border border-red-200'
                        : n.severity === 'high'
                        ? 'bg-amber-50 text-amber-600 border border-amber-200'
                        : 'bg-blue-50 text-blue-600 border border-blue-200'
                    }`}
                  >
                    {severityIcon(n.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-xs text-slate-900 truncate">{n.title}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setNotifications(notifications.filter((x) => x.id !== n.id));
                    }}
                    className="text-slate-400 hover:text-slate-600 p-0.5 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
