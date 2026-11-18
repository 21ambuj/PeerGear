import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'success', title = '') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    
    // Default titles based on type if not provided
    let defaultTitle = title;
    if (!defaultTitle) {
      if (type === 'success') defaultTitle = 'Success';
      else if (type === 'error') defaultTitle = 'Action Failed';
      else if (type === 'warning') defaultTitle = 'Attention';
      else defaultTitle = 'Notice';
    }

    const newToast = { id, message, type, title: defaultTitle };

    setToasts((prev) => [...prev, newToast]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      
      {/* Isolated Popups: Strictly Top-Center with space at the top */}
      <div 
        className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center space-y-2.5 pointer-events-none max-w-md w-full px-4"
        style={{ isolation: 'isolate' }}
      >
        {toasts.map((toast) => {
          let bgClass = 'bg-slate-900 text-white border border-slate-700 shadow-2xl shadow-slate-900/40';
          let icon = <Info className="w-5 h-5 text-white shrink-0 mt-0.5" />;
          let titleColor = 'text-white';
          let msgColor = 'text-slate-200';
          let closeBtn = 'text-slate-300 hover:text-white hover:bg-white/10';

          if (toast.type === 'success') {
            // Vivid, unmistakable GREEN for success
            bgClass = 'bg-emerald-600 text-white border border-emerald-500 shadow-2xl shadow-emerald-950/30';
            icon = <CheckCircle2 className="w-5 h-5 text-white shrink-0 mt-0.5" />;
            titleColor = 'text-white';
            msgColor = 'text-emerald-100';
            closeBtn = 'text-emerald-200 hover:text-white hover:bg-emerald-500/50';
          } else if (toast.type === 'error') {
            // Vivid, unmistakable RED for failed
            bgClass = 'bg-rose-600 text-white border border-rose-500 shadow-2xl shadow-rose-950/30';
            icon = <AlertCircle className="w-5 h-5 text-white shrink-0 mt-0.5" />;
            titleColor = 'text-white';
            msgColor = 'text-rose-100';
            closeBtn = 'text-rose-200 hover:text-white hover:bg-rose-500/50';
          } else if (toast.type === 'warning') {
            bgClass = 'bg-amber-600 text-white border border-amber-500 shadow-2xl shadow-amber-950/30';
            icon = <AlertTriangle className="w-5 h-5 text-white shrink-0 mt-0.5" />;
            titleColor = 'text-white';
            msgColor = 'text-amber-100';
            closeBtn = 'text-amber-200 hover:text-white hover:bg-amber-500/50';
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto w-full flex items-start justify-between p-4 rounded-2xl transition-all duration-300 animate-in slide-in-from-top-4 zoom-in-95 fade-in duration-200 ${bgClass}`}
            >
              <div className="flex items-start space-x-3 mr-2">
                <div>{icon}</div>
                <div>
                  <h4 className={`text-xs font-black uppercase tracking-wider ${titleColor}`}>
                    {toast.title}
                  </h4>
                  <p className={`text-xs mt-0.5 leading-snug font-medium ${msgColor}`}>
                    {toast.message}
                  </p>
                </div>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className={`p-1 rounded-lg transition-colors cursor-pointer shrink-0 ${closeBtn}`}
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
