import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { 
  X, Bell, CheckCircle2, ShieldCheck, AlertTriangle, Sparkles, 
  XCircle, Wallet, Lock, Unlock, TrendingUp, PackageCheck 
} from 'lucide-react';

const NotificationsModal = ({ onClose }) => {
  const { fetchNotifications } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await analyticsApi.getNotifications();
      setNotifications(res.data.notifications || []);
      // Mark as read
      await analyticsApi.markNotificationsRead();
      fetchNotifications();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'DEMAND_MATCH':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      case 'DEPOSIT_REFUNDED':
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      case 'ID_VERIFIED':
      case 'ID_APPROVED':
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      case 'ID_REJECTED':
        return <XCircle className="w-4 h-4 text-rose-600" />;
      case 'ACCOUNT_BLOCKED':
        return <Lock className="w-4 h-4 text-rose-600" />;
      case 'ACCOUNT_RESTORED':
        return <Unlock className="w-4 h-4 text-emerald-600" />;
      case 'NEW_BOOKING':
        return <PackageCheck className="w-4 h-4 text-indigo-600" />;
      case 'RENTAL_ACTIVE':
        return <CheckCircle2 className="w-4 h-4 text-blue-600" />;
      case 'RENTAL_EARNING':
        return <TrendingUp className="w-4 h-4 text-emerald-600" />;
      case 'WALLET_TOPUP':
        return <Wallet className="w-4 h-4 text-indigo-600" />;
      case 'DISPUTE_RAISED':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'DISPUTE_RESOLVED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in-up"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full max-h-[80vh] flex flex-col shadow-2xl border border-slate-200 dark:border-zinc-800 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-900 dark:text-zinc-100 font-bold">
            <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Campus Activity Alerts</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <p className="text-xs text-center text-slate-400 dark:text-zinc-500 py-8">Checking activity alerts...</p>
          ) : notifications.length === 0 ? (
            <div className="text-center py-10 text-slate-400 dark:text-zinc-500">
              <Bell className="w-8 h-8 mx-auto mb-2 stroke-slate-300 dark:stroke-zinc-700" />
              <p className="text-xs">No notifications right now.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif._id}
                className={`p-3 rounded-2xl border transition ${
                  notif.is_read ? 'bg-slate-50/70 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-750' : 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/60'
                }`}
              >
                <div className="flex items-start space-x-2.5">
                  <div className="p-1.5 bg-white dark:bg-zinc-800 rounded-lg shadow-xs shrink-0 mt-0.5 border border-slate-100 dark:border-zinc-700">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-baseline">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">{notif.title}</h4>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                        {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-zinc-300 mt-1 leading-snug">{notif.message}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-850 rounded-b-3xl text-center">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-100 cursor-pointer"
          >
            Close Alerts
          </button>
        </div>

      </div>
    </div>
  );
};

export default NotificationsModal;
