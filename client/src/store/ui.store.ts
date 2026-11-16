import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  activeTab: string;
  notifications: Notification[];
  toggleSidebar: () => void;
  setActiveTab: (tab: string) => void;
  addNotification: (n: Notification) => void;
  removeNotification: (id: string) => void;
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export const useUIStore = create<UIState>()(set => ({
  sidebarOpen: true,
  activeTab: 'overview',
  notifications: [],
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  setActiveTab: tab => set({ activeTab: tab }),
  addNotification: n => set(s => ({ notifications: [...s.notifications, n] })),
  removeNotification: id =>
    set(s => ({ notifications: s.notifications.filter(n => n.id !== id) })),
}));
