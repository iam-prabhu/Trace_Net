import { useState } from 'react';
import { Bell, AlertOctagon, RefreshCw, X, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  severity: 'critical' | 'high' | 'info';
  link?: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'High-Velocity Cycle Detected',
    message: 'Johnson algorithm identified 4-hop ring on ACC-101 ($578k volume).',
    time: '4 mins ago',
    severity: 'critical',
    link: '/analysis',
  },
  {
    id: 'notif-2',
    title: 'Mule Bridge Account Flagged',
    message: 'ACC-401 bridging high risk cluster 1 with retail cluster 3.',
    time: '28 mins ago',
    severity: 'high',
    link: '/explorer',
  },
  {
    id: 'notif-3',
    title: 'Investigation Note Added',
    message: 'Marcus Vance attached FinCEN cross-reference to INV-2025-001.',
    time: '1 hour ago',
    severity: 'info',
    link: '/investigations/INV-2025-001',
  },
];

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const navigate = useNavigate();

  const unreadCount = notifications.length;

  const handleClear = () => {
    setNotifications([]);
  };

  const handleNotificationClick = (link?: string) => {
    setIsOpen(false);
    if (link) navigate(link);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
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
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl z-50 text-slate-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/60">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-xs text-white">System Security Alerts</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded-full font-mono">
                {unreadCount}
              </span>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleClear}
                className="text-[11px] text-slate-400 hover:text-slate-200 transition"
              >
                Clear all
              </button>
            )}
          </div>

          {/* List */}
          <div className="divide-y divide-slate-800/80 max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No new notifications or alerts
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n.link)}
                  className="p-3 hover:bg-slate-800/60 transition cursor-pointer flex items-start gap-3"
                >
                  <div
                    className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      n.severity === 'critical'
                        ? 'bg-red-500/20 text-red-400'
                        : n.severity === 'high'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {n.severity === 'critical' ? (
                      <AlertOctagon className="w-4 h-4" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-white truncate">
                        {n.title}
                      </span>
                      <span className="text-[10px] text-slate-500 shrink-0">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                      {n.message}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setNotifications(notifications.filter(x => x.id !== n.id));
                    }}
                    className="text-slate-500 hover:text-slate-300 p-0.5"
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
