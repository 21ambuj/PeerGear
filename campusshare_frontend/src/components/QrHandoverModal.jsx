import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { rentalsApi } from '../api/client';
import { useToast } from '../context/ToastContext';
import { 
  X, 
  QrCode, 
  KeyRound, 
  ShieldCheck, 
  Copy, 
  Check, 
  Sparkles, 
  Smartphone,
  CheckCircle2,
  Loader2
} from 'lucide-react';

const QrHandoverModal = ({ rental, onClose }) => {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Real-Time Polling: Detects when the owner scans the QR pass & auto-closes modal with success
  useEffect(() => {
    if (!rental?._id || isVerified) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const res = await rentalsApi.getStatus(rental._id);
        const data = res.data;
        if (data && (data.is_active || data.status === 'ACTIVE' || data.pickup_verified)) {
          clearInterval(interval);
          if (isMounted) {
            setIsVerified(true);
            showToast('Handover verified! Equipment transferred successfully.', 'success', 'Pickup Confirmed');
            window.dispatchEvent(new Event('campusshare-rental-updated'));
            // Auto close modal after showing success confirmation
            setTimeout(() => {
              if (isMounted) onClose();
            }, 2000);
          }
        }
      } catch (err) {
        // Silently continue polling
      }
    }, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [rental?._id, isVerified, onClose, showToast]);

  if (!rental) return null;

  // Structured payload for PeerGear Handover Verification
  const qrPayload = JSON.stringify({
    app: "PeerGear",
    type: "HANDOVER_VERIFY",
    rental_id: String(rental._id),
    otp: String(rental.handover_otp),
    item_title: rental.item?.title || "Campus Resource",
    created_at: new Date().toISOString()
  });

  const handleCopyOtp = () => {
    if (rental.handover_otp) {
      navigator.clipboard.writeText(String(rental.handover_otp));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in-up"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-zinc-900 rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-200/90 dark:border-zinc-800 animate-scale-in relative"
        onClick={(e) => e.stopPropagation()}
      >
        {isVerified ? (
          /* ===================================================================== */
          /* REAL-TIME SUCCESS VIEW (Auto-closes in 2 seconds)                      */
          /* ===================================================================== */
          <div className="p-8 text-center bg-gradient-to-b from-emerald-50 via-white to-emerald-50/50 dark:from-emerald-950/40 dark:via-zinc-900 dark:to-emerald-950/20">
            <div className="relative mx-auto w-20 h-20 mb-4 flex items-center justify-center">
              <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-25"></div>
              <div className="w-20 h-20 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
            </div>

            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Handover Confirmed</span>
            </span>

            <h3 className="text-xl font-black text-slate-900 dark:text-zinc-100 mb-1">
              QR Code Scanned!
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 mb-6 leading-relaxed">
              The owner verified the dynamic pass. Your rental contract for <strong className="text-slate-900 dark:text-zinc-100">{rental.item?.title || 'this item'}</strong> is now <strong>ACTIVE</strong>.
            </p>

            <div className="flex items-center justify-center space-x-2 text-xs text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-100/70 dark:bg-emerald-950/40 py-2.5 px-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600 dark:text-emerald-400" />
              <span>Auto-closing pass in 2s...</span>
            </div>
          </div>
        ) : (
          /* ===================================================================== */
          /* ACTIVE QR PRESENTATION VIEW                                           */
          /* ===================================================================== */
          <>
            {/* Header with PeerGear Branding */}
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-purple-950 text-white p-5 relative text-center">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="inline-flex items-center space-x-1.5 bg-indigo-500/20 border border-indigo-400/30 px-3 py-0.5 rounded-full text-indigo-200 text-[10px] font-black uppercase tracking-wider mb-2">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>PeerGear Dynamic Pass</span>
              </div>
              
              <h3 className="text-base font-black text-white leading-tight line-clamp-1">
                {rental.item?.title || 'Resource Handover'}
              </h3>
              <p className="text-[11px] text-slate-300 mt-0.5">Physical Pickup Handover Token</p>
            </div>

            {/* QR Code Presentation Box */}
            <div className="p-6 text-center flex flex-col items-center">
              
              <div className="relative p-4 bg-white rounded-3xl shadow-xl border-2 border-indigo-100 dark:border-indigo-900/40 mb-4 group">
                {/* Ambient scanner border glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl blur-xs opacity-25 group-hover:opacity-40 transition"></div>
                
                <div className="relative bg-white p-3 rounded-2xl">
                  <QRCodeSVG
                    value={qrPayload}
                    size={185}
                    level="H"
                    includeMargin={false}
                  />
                </div>

                {/* Micro instruction badge */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-md flex items-center space-x-1 whitespace-nowrap">
                  <Smartphone className="w-2.5 h-2.5" />
                  <span>Owner Scans This Screen</span>
                </div>
              </div>

              <div className="flex items-center space-x-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-bold mb-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500 dark:text-indigo-400" />
                <span>Waiting for owner scan (Auto-closes)...</span>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-zinc-400 max-w-xs mx-auto mb-4 leading-relaxed">
                Show this QR pass to the owner in person. When they scan it, this screen will verify and close automatically.
              </p>

              {/* Fallback 4-Digit OTP Box */}
              <div className="w-full bg-slate-50 dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700/80 rounded-2xl p-3 mb-4 flex items-center justify-between">
                <div className="text-left">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 block tracking-wider">
                    Or Tell 4-Digit OTP
                  </span>
                  <span className="text-2xl font-black font-mono tracking-widest text-indigo-700 dark:text-indigo-400">
                    {rental.handover_otp}
                  </span>
                </div>

                <button
                  onClick={handleCopyOtp}
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 rounded-xl transition flex items-center space-x-1 cursor-pointer shadow-2xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-700 dark:text-emerald-400 text-[11px]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-400" />
                      <span className="text-[11px]">Copy OTP</span>
                    </>
                  )}
                </button>
              </div>

              {/* Done / Dismiss Button */}
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-slate-900 dark:bg-zinc-800 hover:bg-slate-800 dark:hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md"
              >
                Close Pass
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default QrHandoverModal;
