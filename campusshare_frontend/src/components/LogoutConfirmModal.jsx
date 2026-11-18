import React from 'react';
import { LogOut, X, AlertTriangle } from 'lucide-react';

const LogoutConfirmModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Animated Icon Container */}
        <div className="w-14 h-14 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-600 shadow-inner">
          <LogOut className="w-7 h-7" />
        </div>

        <div className="text-center mb-6">
          <h3 className="text-lg font-bold text-slate-900 mb-1.5">Sign Out of PeerGear?</h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            Are you sure you want to log out? Any active rentals, listed items, and wallet deposits will remain safely stored.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
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
