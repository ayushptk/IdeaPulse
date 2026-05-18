"use client";

import { useState, useRef, useEffect } from 'react';
import { Search, Bell, Menu, Check, Trash2, Clock, Info, Lightbulb, AlertCircle, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'idea';
  read: boolean;
}

export function Header() {
  const { data: session } = useSession();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const firstName = session?.user?.name?.split(' ')[0] || 'User';
  const avatarUrl = session?.user?.image || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex';

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <Check className="w-4 h-4 text-emerald-400" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-amber-400" />;
      case 'idea': return <Lightbulb className="w-4 h-4 text-indigo-400" />;
      default: return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <header className="h-20 bg-[#09090b]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 md:px-10 sticky top-0 z-10 transition-all">
      <div className="flex items-center gap-4">
        <button className="md:hidden text-slate-400 hover:text-white transition-colors">
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex-1 max-w-xl hidden md:block">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            </div>
            <input 
              type="text" 
              placeholder="Search ideas, problems, or tags..." 
              className="block w-64 lg:w-96 pl-10 pr-4 py-2 bg-white/5 border border-white/5 rounded-lg text-sm text-white placeholder-slate-500 focus:border-indigo-500/50 focus:bg-white/10 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={`relative p-2 rounded-full transition-all duration-200 ${
              isNotificationsOpen ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(99,102,241,0.8)] border-2 border-[#09090b]">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {isNotificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute right-0 mt-3 w-80 md:w-96 bg-[#121214] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl"
              >
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                  <h3 className="font-semibold text-white">Notifications</h3>
                  <div className="flex items-center gap-2">
                    {notifications.length > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        className="text-[11px] font-medium text-slate-400 hover:text-indigo-400 transition-colors uppercase tracking-wider"
                      >
                        Mark all read
                      </button>
                    )}
                    <button 
                      onClick={() => setIsNotificationsOpen(false)}
                      className="p-1 hover:bg-white/5 rounded-md transition-colors"
                    >
                      <X className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                </div>

                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                  {notifications.length > 0 ? (
                    <div className="divide-y divide-white/5">
                      {notifications.map((notification) => (
                        <div 
                          key={notification.id}
                          className={`p-4 flex gap-4 hover:bg-white/5 transition-colors relative group ${!notification.read ? 'bg-indigo-500/5' : ''}`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                            notification.type === 'idea' ? 'bg-indigo-500/20' : 
                            notification.type === 'success' ? 'bg-emerald-500/20' :
                            notification.type === 'warning' ? 'bg-amber-500/20' : 'bg-blue-500/20'
                          }`}>
                            {getIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className={`text-sm font-medium leading-none ${notification.read ? 'text-slate-300' : 'text-white'}`}>
                                {notification.title}
                              </p>
                              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {notification.time}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                              {notification.description}
                            </p>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 hover:text-red-400 text-slate-500 rounded-md transition-all duration-200"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          {!notification.read && (
                            <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-full" />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-center px-6">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                        <Bell className="w-6 h-6 text-slate-600" />
                      </div>
                      <p className="text-sm font-medium text-slate-400">All caught up!</p>
                      <p className="text-xs text-slate-500 mt-1">No new notifications at the moment.</p>
                    </div>
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="p-3 border-t border-white/5 bg-white/5">
                    <button 
                      onClick={clearAll}
                      className="w-full py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Clear all notifications
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="w-px h-6 bg-white/10 hidden md:block"></div>

        <button className="flex items-center gap-3 hover:opacity-80 transition-opacity rounded-full p-1 pr-3 bg-white/5 border border-white/5">
          <div className="h-8 w-8 rounded-full overflow-hidden bg-slate-800">
            <img src={avatarUrl} alt="User avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div className="text-left hidden md:block">
            <p className="text-sm font-medium text-white leading-tight">{firstName}</p>
          </div>
        </button>
      </div>
    </header>
  );
}
