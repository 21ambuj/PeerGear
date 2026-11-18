import React, { useState, useEffect } from 'react';
import { rentalsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  Gavel, 
  UserX, 
  Camera, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

const DisputesPage = () => {
  const { user, refreshUser } = useAuth();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState(null);

  // Resolution form state
  const [deductAmount, setDeductAmount] = useState('200');
  const [resolutionNotes, setResolutionNotes] = useState('Deducted minor damage repair cost; remaining balance refunded.');
  const [suspendRenter, setSuspendRenter] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const res = await rentalsApi.getDisputes();
      setDisputes(res.data.disputes || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!selectedDispute) return;

    try {
      setSubmitting(true);
      await rentalsApi.resolveDispute(selectedDispute._id, {
        deduct_amount: parseFloat(deductAmount),
        notes: resolutionNotes,
        suspend_renter: suspendRenter,
      });

      setSuccessMsg("Dispute settled! Security deposit adjusted and remaining balance refunded to student.");
      setSelectedDispute(null);
      await refreshUser();
      fetchDisputes();
    } catch (e) {
      alert(e.response?.data?.error || "Failed to resolve dispute. Admin privileges required.");
    } finally {
      setSubmitting(false);
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      
      {/* Header */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>Fair Resolution & Deposit Escrow Protection</span>
          </div>
          <h1 className="text-2xl font-bold">Campus Dispute Management</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Transparent dispute ledger with before-and-after photo inspection. Repair and replacement deductions are settled from the refundable security deposit.
          </p>
        </div>

        {isAdmin ? (
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-3 py-1.5 rounded-xl self-start sm:self-auto flex items-center space-x-1">
            <Gavel className="w-4 h-4" />
            <span>Logged in as Dispute Officer</span>
          </span>
        ) : (
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold px-3 py-1.5 rounded-xl self-start sm:self-auto flex items-center space-x-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-300" />
            <span>Admin Clearance Required to Settle Claims</span>
          </span>
        )}
      </div>

      {successMsg && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Disputes List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-40 bg-slate-100 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : disputes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
          <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
          <h3 className="text-base font-bold text-slate-800 mb-1">Zero Open Disputes</h3>
          <p className="text-xs text-slate-500">All campus rentals have returned peacefully with 100% deposit refunds!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {disputes.map((d) => {
            const isResolved = d.status === 'RESOLVED';
            const evidence = d.evidence_photos || {};

            return (
              <div
                key={d._id}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* Dispute Card Header */}
                <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      isResolved ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800 animate-pulse'
                    }`}>
                      {d.status}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm">{d.item_title}</h3>
                  </div>

                  <div className="text-xs">
                    <span className="text-slate-500">Claimed Damage: </span>
                    <strong className="text-rose-600 font-bold">₹{d.claimed_amount}</strong>
                  </div>
                </div>

                <div className="p-5">
                  <div className="grid md:grid-cols-2 gap-4 mb-4 text-xs">
                    <div>
                      <p className="text-slate-500 mb-1">
                        Reported By Owner: <strong>{d.owner_name}</strong>
                      </p>
                      <p className="text-slate-500">
                        Against Student: <strong>{d.renter_name}</strong>
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1">Reason for Claim:</p>
                      <p className="font-semibold text-slate-800 bg-slate-50 p-2 rounded-xl border border-slate-200">
                        {d.description || "Damage reported during physical return inspection."}
                      </p>
                    </div>
                  </div>

                  {/* Evidence Photos: Before vs After */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-4">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                      <Camera className="w-4 h-4 text-slate-500" />
                      <span>Photo Evidence Ledger</span>
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] font-semibold text-slate-500 block mb-1">Before Handover (Pickup)</span>
                        <div className="aspect-16/9 rounded-xl overflow-hidden bg-slate-200 border border-slate-300">
                          <img
                            src={evidence.before_pickup?.[0] || 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&auto=format&fit=crop&q=80'}
                            alt="Pickup evidence"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-rose-500 block mb-1">After Return (Inspection Damage)</span>
                        <div className="aspect-16/9 rounded-xl overflow-hidden bg-slate-200 border border-rose-300">
                          <img
                            src={evidence.after_return?.[0] || 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&auto=format&fit=crop&q=80'}
                            alt="Return evidence"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Resolution status / Action */}
                  {isResolved ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900">
                      <div className="flex items-center space-x-1.5 font-bold mb-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Resolved by {d.admin_resolution?.resolved_by || 'Admin'}</span>
                      </div>
                      <p>
                        ₹{d.admin_resolution?.deducted_from_deposit} deducted for repairs and paid to owner • ₹{d.admin_resolution?.refunded_to_renter} refunded to renter.
                      </p>
                      <p className="text-emerald-700 text-[11px] mt-1 italic">"{d.admin_resolution?.notes}"</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-xs text-slate-500">Security deposit is currently locked in escrow.</p>
                      <button
                        onClick={() => {
                          setSelectedDispute(d);
                          setDeductAmount(String(d.claimed_amount));
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-sm cursor-pointer flex items-center space-x-1.5"
                      >
                        <Gavel className="w-4 h-4" />
                        <span>Review & Settle Dispute</span>
                      </button>
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Settle Dispute Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-lg mb-1">Settle Dispute & Deposit Escrow</h3>
            <p className="text-xs text-slate-500 mb-4">{selectedDispute.item_title}</p>

            <form onSubmit={handleResolve} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deduct from Security Deposit (Award to Owner for Repairs)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-rose-500 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    value={deductAmount}
                    onChange={(e) => setDeductAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-rose-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Settlement Notes</label>
                <textarea
                  rows="2"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* Repeat Violator Suspension Toggle */}
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="suspend"
                  checked={suspendRenter}
                  onChange={(e) => setSuspendRenter(e.target.checked)}
                  className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <label htmlFor="suspend" className="text-xs text-rose-900 font-medium cursor-pointer">
                  Penalize Student Trust Score (Deduct -1.0) & flag account for rental policy violation.
                </label>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDispute(null)}
                  className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition shadow-md cursor-pointer flex items-center justify-center space-x-1"
                >
                  <Gavel className="w-4 h-4" />
                  <span>{submitting ? 'Settling...' : 'Confirm Resolution'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default DisputesPage;
