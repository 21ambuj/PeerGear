import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { rentalsApi } from '../api/client';
import { useToast } from '../context/ToastContext';
import { 
  X, 
  KeyRound, 
  Camera, 
  AlertCircle, 
  CheckCircle2, 
  QrCode, 
  Sparkles, 
  Upload,
  RefreshCw,
  SwitchCamera
} from 'lucide-react';

const PickupVerifyModal = ({ rental, onClose, onSuccess }) => {
  const { showToast } = useToast();
  
  // Verification mode: 'qr' or 'manual'
  const [verifyMode, setVerifyMode] = useState('qr');
  const [otp, setOtp] = useState('');
  const [notes, setNotes] = useState('Item physically inspected and handed over in full working condition.');
  const [photoUrl, setPhotoUrl] = useState(rental.item?.image || 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&auto=format&fit=crop&q=80');
  
  const [scanning, setScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [cameras, setCameras] = useState([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const qrRegionId = "peergear-qr-reader";
  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);

  // Stop QR Camera cleanly
  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn("Scanner stop warning:", err);
      }
      setScanning(false);
    }
  };

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Start QR Camera Scanner with automatic camera detection and fallback
  const startScanner = async (cameraIdx = currentCameraIndex) => {
    setCameraError('');
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(qrRegionId);
      }

      // Check available cameras
      let detectedCameras = cameras;
      if (!detectedCameras || detectedCameras.length === 0) {
        try {
          detectedCameras = await Html5Qrcode.getCameras();
          setCameras(detectedCameras || []);
        } catch (e) {
          console.warn("Camera enum error:", e);
        }
      }

      const config = { 
        fps: 15, 
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1.0
      };

      if (detectedCameras && detectedCameras.length > 0) {
        const targetCam = detectedCameras[cameraIdx % detectedCameras.length];
        await html5QrCodeRef.current.start(
          targetCam.id,
          config,
          (decodedText) => handleQrCodeScanned(decodedText),
          () => {} // frame scan ignore
        );
      } else {
        // Fallback: request default camera
        await html5QrCodeRef.current.start(
          { facingMode: "environment" },
          config,
          (decodedText) => handleQrCodeScanned(decodedText),
          () => {}
        );
      }
      setScanning(true);
    } catch (err) {
      console.warn("Primary camera start failed, attempting user-facing fallback:", err);
      try {
        await html5QrCodeRef.current.start(
          { facingMode: "user" },
          { fps: 15, qrbox: { width: 220, height: 220 } },
          (decodedText) => handleQrCodeScanned(decodedText),
          () => {}
        );
        setScanning(true);
      } catch (fallbackErr) {
        console.warn("Camera access failed completely:", fallbackErr);
        setCameraError('Camera access unavailable or permission not granted. You can scan by uploading a QR screenshot or enter the 4-digit OTP manually below.');
        setScanning(false);
      }
    }
  };

  const handleSwitchCamera = async () => {
    if (cameras.length <= 1) return;
    await stopScanner();
    const nextIdx = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIdx);
    startScanner(nextIdx);
  };

  useEffect(() => {
    if (verifyMode === 'qr' && !scanSuccess) {
      startScanner();
    } else {
      stopScanner();
    }
    return () => {
      stopScanner();
    };
  }, [verifyMode, scanSuccess]);

  const handleQrCodeScanned = (decodedText) => {
    try {
      let extractedOtp = '';
      const trimmed = decodedText.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        const payload = JSON.parse(trimmed);
        extractedOtp = String(payload.otp || '');
      } else {
        const match = trimmed.match(/\b\d{4}\b/);
        extractedOtp = match ? match[0] : trimmed;
      }

      if (extractedOtp) {
        setOtp(extractedOtp);
        setScanSuccess(true);
        stopScanner();
        showToast(`QR Code Verified! Handover OTP: ${extractedOtp}`, 'success', 'QR Verified');
      }
    } catch (e) {
      setOtp(decodedText.trim());
      setScanSuccess(true);
      stopScanner();
    }
  };

  // Upload and scan image file (for screenshots or testing without webcam)
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCameraError('');
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(qrRegionId);
      }
      const decodedText = await html5QrCodeRef.current.scanFile(file, true);
      handleQrCodeScanned(decodedText);
    } catch (err) {
      setCameraError('Could not find a valid QR code in the uploaded image. Please ensure the QR pass is clear or enter the OTP manually.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedOtp = String(otp).trim();
    if (!trimmedOtp || trimmedOtp.length !== 4) {
      setError('Please provide a valid 4-digit Handover OTP.');
      return;
    }

    try {
      setSubmitting(true);
      await rentalsApi.verifyPickup(rental._id, {
        otp: trimmedOtp,
        photos: [photoUrl],
        notes: notes.trim(),
      });
      showToast('Pickup verified! Rental is now ACTIVE.', 'success', 'Handover Activated');
      if (onSuccess) onSuccess();
      handleClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Handover verification failed. Please check OTP.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in-up"
      onClick={handleClose}
    >
      <div 
        className="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-zinc-800 animate-scale-in max-h-[92vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl text-white shadow-md shadow-indigo-500/25">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-zinc-100 text-base">Verify Pickup Handover</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">{rental.item?.title || 'Resource'}</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs: QR Code vs Manual OTP */}
        <div className="flex bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-2xl border border-slate-200/80 dark:border-zinc-700/80 mb-4">
          <button
            type="button"
            onClick={() => {
              setVerifyMode('qr');
              setScanSuccess(false);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer ${
              verifyMode === 'qr'
                ? 'bg-white dark:bg-zinc-900 text-indigo-700 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Scan Renter's QR Pass</span>
          </button>
          
          <button
            type="button"
            onClick={() => {
              stopScanner();
              setVerifyMode('manual');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer ${
              verifyMode === 'manual'
                ? 'bg-white dark:bg-zinc-900 text-indigo-700 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Type 4-Digit OTP</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 px-3.5 py-2.5 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          
          {/* QR SCANNER VIEWPORT */}
          {verifyMode === 'qr' && (
            <div className="p-4 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/90 dark:border-zinc-700/80 rounded-2xl text-center">
              
              {scanSuccess ? (
                <div className="py-4 text-center">
                  <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="font-extrabold text-slate-900 dark:text-zinc-100 text-sm">QR Pass Verified!</h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mb-2">Handover code matched:</p>
                  <span className="font-mono text-3xl font-black tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800 inline-block">
                    {otp}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setScanSuccess(false);
                      setOtp('');
                    }}
                    className="mt-3 text-[11px] text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 underline block mx-auto cursor-pointer"
                  >
                    Rescan Another Code
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-slate-600 dark:text-zinc-300 font-medium">
                      Point camera at <strong>PeerGear QR Pass</strong> on <span className="font-bold text-slate-800 dark:text-zinc-200">{rental.renter?.name || 'renter'}'s</span> screen:
                    </p>

                    {cameras.length > 1 && (
                      <button
                        type="button"
                        onClick={handleSwitchCamera}
                        className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold flex items-center space-x-1 bg-white dark:bg-zinc-800 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-lg cursor-pointer shadow-2xs"
                        title="Switch Camera"
                      >
                        <SwitchCamera className="w-3 h-3" />
                        <span>Flip Cam</span>
                      </button>
                    )}
                  </div>

                  {/* HTML5 QR Camera Element */}
                  <div 
                    id={qrRegionId} 
                    className="w-full max-w-[280px] mx-auto rounded-2xl overflow-hidden border-2 border-indigo-300 dark:border-indigo-700 shadow-md bg-black min-h-[220px]"
                  />

                  {cameraError && (
                    <div className="mt-3 p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[11px] rounded-xl text-left">
                      {cameraError}
                    </div>
                  )}

                  {/* Scan QR from Image File Upload (Real-world convenience fallback) */}
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-zinc-700 flex items-center justify-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="qr-file-upload-input"
                    />
                    <label
                      htmlFor="qr-file-upload-input"
                      className="px-3.5 py-1.5 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-700 transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Upload QR Code Image</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MANUAL OTP INPUT */}
          {verifyMode === 'manual' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                4-Digit Renter Handover OTP <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                maxLength="4"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 5421"
                className="w-full text-center text-3xl font-mono font-black tracking-widest px-3 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 rounded-xl focus:bg-white dark:focus:bg-zinc-850 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                required
              />
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
                Ask the renter (<strong>{rental.renter?.name}</strong>) for the 4-digit code shown on their dynamic screen.
              </p>
            </div>
          )}

          {/* Condition Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Initial Condition Notes</label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-850 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Photo URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Handover Photo Evidence (URL)</label>
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-850 border border-slate-300 dark:border-zinc-700 rounded-xl text-xs font-mono text-slate-600 dark:text-zinc-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">Captures initial cosmetic condition to prevent return damage disputes.</p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !otp || otp.length !== 4}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-md cursor-pointer ${
                otp && otp.length === 4
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Activating Rental...' : 'Confirm & Hand Over'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default PickupVerifyModal;
