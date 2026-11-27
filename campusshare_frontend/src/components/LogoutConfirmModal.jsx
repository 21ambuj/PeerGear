import React from 'react';
import { LogOut, X, AlertTriangle } from 'lucide-react';

const LogoutConfirmModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in-up"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-zinc-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-zinc-800 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Animated Icon Container */}
        <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/60 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-600 dark:text-rose-400 shadow-inner">
          <LogOut className="w-7 h-7" />
        </div>

        <div className="text-center mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100 mb-1.5">Sign Out of PeerGear?</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed max-w-xs mx-auto">
            Are you sure you want to log out? Any active rentals, listed items, and wallet deposits will remain safely stored.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            Stay Logged In
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Yes, Sign Out</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default LogoutConfirmModal;
