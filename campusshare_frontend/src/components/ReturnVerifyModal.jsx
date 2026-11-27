import React, { useState } from 'react';
import { rentalsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { X, ShieldCheck, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';

const ReturnVerifyModal = ({ rental, onClose, onSuccess }) => {
  const { refreshUser } = useAuth();
  const [damageReported, setDamageReported] = useState(false);
  const [claimedAmount, setClaimedAmount] = useState('200');
  const [notes, setNotes] = useState('Item received in clean, fully working condition.');
  const [photoUrl, setPhotoUrl] = useState(rental.item?.image || 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&auto=format&fit=crop&q=80');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleReturn = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setSubmitting(true);
      await rentalsApi.verifyReturn(rental._id, {
        damage_reported: damageReported,
        damage_claimed_amount: damageReported ? parseFloat(claimedAmount) : 0,
        notes: notes.trim(),
        photos: [photoUrl],
      });

      await refreshUser();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to complete return verification.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in-up"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-zinc-800 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-2.5">
            <div className={`p-2 rounded-xl ${damageReported ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400' : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'}`}>
              {damageReported ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-zinc-100">Return & Inspection Verification</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">{rental.item?.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 px-3 py-2 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleReturn} className="space-y-4">
          {/* Condition Radio Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-2">Item Return Inspection Result</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setDamageReported(false);
                  setNotes('Item received back in clean, undamaged condition.');
                }}
                className={`p-3 rounded-2xl border text-left cursor-pointer transition ${
                  !damageReported
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700/60'
                }`}
              >
                <div className="flex items-center space-x-1.5 text-xs font-bold mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>No Damage</span>
                </div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  Full 100% refund of ₹{rental.security_deposit} returned to renter immediately.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDamageReported(true);
                  setNotes('Damage discovered on return. Cracked/scratched component.');
                }}
                className={`p-3 rounded-2xl border text-left cursor-pointer transition ${
                  damageReported
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 ring-2 ring-rose-500/20'
                    : 'border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700/60'
                }`}
              >
                <div className="flex items-center space-x-1.5 text-xs font-bold mb-1">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>Report Damage</span>
                </div>
                <p className="text-[11px] text-rose-700 dark:text-rose-300">
                  Lock deposit in escrow and deduct repair/replacement cost.
                </p>
              </button>
            </div>
          </div>

          {/* If damage reported, ask for claimed cost */}
          {damageReported && (
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-3 rounded-2xl space-y-2">
              <label className="block text-xs font-bold text-rose-900 dark:text-rose-200">
                Claimed Repair/Replacement Amount (Max ₹{rental.security_deposit})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-rose-500 font-bold text-xs">₹</span>
                <input
                  type="number"
                  max={rental.security_deposit}
                  min="50"
                  value={claimedAmount}
                  onChange={(e) => setClaimedAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-1.5 bg-white dark:bg-zinc-900 border border-rose-300 dark:border-rose-700 rounded-xl text-xs font-semibold text-rose-900 dark:text-rose-100 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>
              <p className="text-[11px] text-rose-600 dark:text-rose-400">
                Remaining deposit balance (₹{Math.max(0, rental.security_deposit - Number(claimedAmount))}) will be refunded to renter.
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Inspection Notes</label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-850 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Photo URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Return Condition Photo Evidence (URL)</label>
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-850 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="pt-2 flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`flex-1 py-2.5 text-white rounded-xl text-xs font-semibold transition shadow-md cursor-pointer flex items-center justify-center space-x-1 ${
                damageReported ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Processing...' : damageReported ? 'Submit Dispute Claim' : 'Complete Return & Refund Deposit'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default ReturnVerifyModal;
