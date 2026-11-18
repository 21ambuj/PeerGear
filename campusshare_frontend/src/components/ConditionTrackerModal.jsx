import React from 'react';
import { X, ShieldCheck, CheckCircle2, AlertTriangle, Clock, Camera } from 'lucide-react';

const ConditionTrackerModal = ({ rental, onClose }) => {
  const tracking = rental.condition_tracking || {};
  const pickup = tracking.pickup_verification || {};
  const returnVer = tracking.return_verification || {};

  return (
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 sticky top-0 z-10 flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Camera className="w-4 h-4" />
              <span>Evidence Ledger & Condition Tracking</span>
            </div>
            <h2 className="text-xl font-bold">{rental.item?.title || 'Item Inspection Record'}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Contract ID: <span className="font-mono text-slate-300">{rental._id}</span> • Deposit Status: <span className="font-semibold text-emerald-400">{rental.deposit_status}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1.5 rounded-full hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Side by Side Comparative Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* 1. Before Handover (Pickup Condition) */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                    <h3 className="font-bold text-slate-900 text-sm">1. Before Handover (Pickup)</h3>
                  </div>
                  {pickup.verified_at ? (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>OTP Verified</span>
                    </span>
                  ) : (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Pending Pickup
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Inspection Timestamp</p>
                    <p className="text-xs text-slate-800 font-medium">
                      {pickup.verified_at ? new Date(pickup.verified_at).toLocaleString() : 'Not recorded yet'}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Condition Notes</p>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-700">
                      {pickup.notes || 'No baseline notes recorded.'}
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Photo Evidence</p>
                    {pickup.photos && pickup.photos.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {pickup.photos.map((url, i) => (
                          <div key={i} className="aspect-4/3 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                            <img src={url} alt={`Pickup evidence ${i+1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No pickup photos submitted.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. After Return (Return Condition) */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-600"></div>
                    <h3 className="font-bold text-slate-900 text-sm">2. After Return (Inspection)</h3>
                  </div>
                  {returnVer.verified_at ? (
                    returnVer.damage_reported ? (
                      <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Damage Reported</span>
                      </span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Clean Return</span>
                      </span>
                    )
                  ) : (
                    <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Rental In Progress
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Return Timestamp</p>
                    <p className="text-xs text-slate-800 font-medium">
                      {returnVer.verified_at ? new Date(returnVer.verified_at).toLocaleString() : 'Pending item return'}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Return Inspection Notes</p>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-700">
                      {returnVer.notes || 'Return inspection will be conducted by owner upon handover.'}
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Return Evidence Photos</p>
                    {returnVer.photos && returnVer.photos.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {returnVer.photos.map((url, i) => (
                          <div key={i} className="aspect-4/3 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                            <img src={url} alt={`Return evidence ${i+1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No return photos yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Escrow Resolution Summary */}
          <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-emerald-950 uppercase">Refundable Escrow Deposit</h4>
                <p className="text-xs text-emerald-800">
                  {rental.deposit_status === 'REFUNDED' 
                    ? `100% of ₹${rental.security_deposit} refunded directly to student wallet upon spotless return.`
                    : rental.deposit_status === 'HELD'
                    ? `₹${rental.security_deposit} currently locked in escrow. Will be refunded automatically upon undamaged return.`
                    : `₹${rental.security_deposit} locked under dispute resolution.`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 font-medium">Escrow Amount</span>
              <p className="text-lg font-black text-emerald-700">₹{rental.security_deposit}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ConditionTrackerModal;
