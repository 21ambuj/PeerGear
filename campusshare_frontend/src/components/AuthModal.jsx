import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authApi } from '../api/client';
import { 
  X, 
  User, 
  Mail, 
  Lock, 
  Phone, 
  AlertCircle, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  FileText, 
  Upload, 
  RefreshCw, 
  KeyRound, 
  Camera,
  Check,
  Loader2
} from 'lucide-react';

const AuthModal = ({ isOpen, onClose, initialMode = 'login', initialStep = 'FORM' }) => {
  const { user, login, register, loginWithVerifiedSession, updateUserState } = useAuth();
  const { showToast } = useToast();
  
  const [mode, setMode] = useState(initialMode); // 'login' or 'register'
  const [regStep, setRegStep] = useState(initialStep); // 'FORM' | 'OTP' | 'ID_CARD' | 'SUCCESS'
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setRegStep(initialStep);
      setError('');
    }
  }, [isOpen, initialMode, initialStep]);
  
  // Registration Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [collegeId, setCollegeId] = useState('');
  const [hostelBlock, setHostelBlock] = useState('');
  const [phone, setPhone] = useState('');
  
  // OTP Verification States
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);
  
  // ID Card Upload States
  const [idCardFile, setIdCardFile] = useState(null);
  const [idCardPreview, setIdCardPreview] = useState('');
  const [idCardFileName, setIdCardFileName] = useState('');
  const [idCardFileType, setIdCardFileType] = useState('image'); // 'image' or 'pdf'
  const [idCardFileSize, setIdCardFileSize] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval = null;
    if (regStep === 'OTP' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [regStep, resendTimer]);

  if (!isOpen) return null;

  // Handle Initial Login or Registration Submit
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (isSubmittingRef.current || loading) return;
    isSubmittingRef.current = true;
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const resData = await login(email.trim(), password);
        if (resData?.requires_otp) {
          // Unverified student attempting login! Route to OTP step
          setMode('register');
          setRegStep('OTP');
          setResendTimer(60);
          showToast(
            resData.error || `A 6-digit verification code has been dispatched to ${email.trim()}. Please enter it to verify.`,
            'info',
            'Verification Required'
          );
          return;
        }
        showToast(
          `Welcome back, ${resData?.name?.split(' ')[0] || 'Student'}! You are now logged in.`,
          'success',
          'Login Successful'
        );
        onClose();
      } else {
        // Step 1: Register Account
        if (!name.trim() || !email.trim() || !password || !collegeId.trim()) {
          const msg = 'Please fill in all mandatory fields.';
          setError(msg);
          showToast(msg, 'error', 'Missing Information');
          return;
        }

        const resData = await register({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          college_id: collegeId.trim(),
          hostel_block: hostelBlock.trim() || 'Campus Hostel',
          phone: phone.trim() || '+91 9876543210',
        });

        // Move to Step 2: OTP Verification (User is NOT logged in yet!)
        setRegStep('OTP');
        setResendTimer(60);
        showToast(
          `Verification code sent to ${email.trim()}! Please enter the 6-digit OTP.`,
          'info',
          'Code Sent'
        );
      }
    } catch (err) {
      if (err.response?.data?.requires_otp) {
        setMode('register');
        setRegStep('OTP');
        setResendTimer(60);
        showToast(
          err.response.data.error || `Verification required. A code was sent to ${email.trim()}.`,
          'info',
          'OTP Verification Required'
        );
        return;
      }
      const errMsg = err.response?.data?.error || (mode === 'login' ? 'Invalid email or password.' : 'Failed to register account.');
      setError(errMsg);
      showToast(errMsg, 'error', mode === 'login' ? 'Login Failed' : 'Registration Failed');
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  // Step 2: Handle OTP Verification
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (isSubmittingRef.current || loading) return;
    setError('');
    // Extract only digits to handle any formatting, spaces, dashes
    const cleanOtp = otp.replace(/\D/g, '').slice(0, 6);
    if (!cleanOtp || cleanOtp.length !== 6) {
      setError('Please enter the full 6-digit verification code sent to your email.');
      return;
    }

    try {
      isSubmittingRef.current = true;
      setLoading(true);
      const res = await authApi.verifyEmailOtp({
        email: email.trim().toLowerCase(),
        otp: cleanOtp
      });

      // ONLY authenticate the student now that OTP is confirmed!
      if (res.data?.token && res.data?.user) {
        loginWithVerifiedSession(res.data.token, res.data.user);
      }

      showToast('Email verified successfully! Now please upload your Student ID Card.', 'success', 'Email Verified');
      // Transition to Step 3: ID Card Upload
      setRegStep('ID_CARD');
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Invalid verification code. Please check your email and try again.';
      setError(errMsg);
      showToast(errMsg, 'error', 'Verification Failed');
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  // Clipboard paste interceptor for OTP input
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text') || '';
    // Strip everything except digits and take up to 6 digits
    const digits = pasted.replace(/\D/g, '').slice(0, 6);
    if (digits) {
      setOtp(digits);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0 || resendLoading || isSubmittingRef.current) return;
    setError('');
    try {
      isSubmittingRef.current = true;
      setResendLoading(true);
      await authApi.resendEmailOtp({ email: email.trim().toLowerCase() });
      setResendTimer(60);
      showToast(`A fresh verification code has been dispatched to ${email.trim()}.`, 'info', 'OTP Resent');
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to resend code. Please try again.';
      setError(errMsg);
      showToast(errMsg, 'error', 'Resend Failed');
    } finally {
      setResendLoading(false);
      isSubmittingRef.current = false;
    }
  };

  // Handle ID Card File Selection (Photo or PDF)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be under 10MB.');
      return;
    }

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    setIdCardFileType(isPdf ? 'pdf' : 'image');
    setIdCardFileName(file.name);
    setIdCardFileSize((file.size / (1024 * 1024)).toFixed(2) + ' MB');
    setIdCardFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setIdCardPreview(reader.result);
    };
    reader.readAsDataURL(file);
    setError('');
  };

  // Step 3: Handle ID Card Upload Submit
  const handleUploadIdCard = async (e) => {
    e.preventDefault();
    if (!idCardPreview) {
      setError('Please select a photo or PDF of your College ID Card.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      let res;
      // If FormData file available, upload via FormData with automatic Base64 fallback
      if (idCardFile) {
        try {
          const formData = new FormData();
          formData.append('id_card', idCardFile);
          res = await authApi.uploadIdCard(formData);
        } catch (uploadErr) {
          if (idCardPreview) {
            res = await authApi.uploadIdCard({
              id_card_data: idCardPreview,
              filename: idCardFileName || idCardFile.name || 'student_id'
            });
          } else {
            throw uploadErr;
          }
        }
      } else {
        res = await authApi.uploadIdCard({
          id_card_data: idCardPreview,
          filename: idCardFileName || 'student_id'
        });
      }

      if (res.data?.user) {
        updateUserState(res.data.user);
      }

      // Step 4: Show Success message and redirect to Home
      setRegStep('SUCCESS');
      showToast('College ID submitted successfully! Moderation will verify soon.', 'success', 'Verification Pending');

      // Auto-close modal after 2 seconds and direct to home page
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to upload ID card. Please try again.';
      setError(errMsg);
      showToast(errMsg, 'error', 'Upload Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in-up"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200/90 dark:border-zinc-800 animate-scale-in max-h-[92vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* ========================================================================= */}
        {/* VIEW 1: STEP SUCCESS (Direct to Home Page)                                */}
        {/* ========================================================================= */}
        {regStep === 'SUCCESS' ? (
          <div className="text-center py-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100">College ID Submitted Successfully!</h2>
              <p className="text-xs text-slate-600 dark:text-zinc-400 mt-2 px-2 leading-relaxed">
                Our campus moderation team will verify your credentials soon. Your account is active and you can now explore the platform.
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <span>Go to Home Page Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500">Directing automatically in 2 seconds...</p>
            </div>
          </div>
        ) : regStep === 'ID_CARD' ? (
          /* ========================================================================= */
          /* VIEW 2: STEP ID CARD UPLOAD (Photo or PDF)                                */
          /* ========================================================================= */
          <div>
            <div className="flex justify-between items-start mb-5">
              <div>
                <div className="flex items-center space-x-1.5 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-700 dark:text-emerald-400">Email Verified &#10003;</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-100">
                  {user?.id_card_status === 'REJECTED' ? 'Re-upload Student ID Card' : 'Upload Student ID Card'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Upload a photo or PDF of your University ID card, library pass, or admission fee slip.
                </p>
              </div>
              <button 
                onClick={onClose} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {user?.id_card_status === 'REJECTED' && user?.id_card_rejection_reason && (
              <div className="mb-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 p-3 rounded-2xl text-xs space-y-1">
                <p className="font-bold text-rose-900 dark:text-rose-100 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Previous ID Submission Rejected:</span>
                </p>
                <p className="pl-5 text-[11px] leading-relaxed text-rose-700 dark:text-rose-300 italic">
                  "{user.id_card_rejection_reason}"
                </p>
                <p className="pl-5 text-[10px] text-rose-600 dark:text-rose-400 font-semibold">
                  Please upload a clearer photo or official document addressing the note above.
                </p>
              </div>
            )}

            {error && (
              <div className="mb-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 px-3 py-2.5 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleUploadIdCard} className="space-y-4">
              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-indigo-200 dark:border-indigo-900/60 hover:border-indigo-400 dark:hover:border-indigo-600 rounded-2xl p-4 bg-indigo-50/40 dark:bg-indigo-950/20 transition text-center relative group">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                />

                {idCardPreview ? (
                  <div className="space-y-2 py-2">
                    {idCardFileType === 'pdf' ? (
                      <div className="flex items-center justify-center space-x-3 bg-white dark:bg-zinc-800 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/60 shadow-2xs">
                        <FileText className="w-8 h-8 text-rose-600 shrink-0" />
                        <div className="text-left overflow-hidden">
                          <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate max-w-[200px]">{idCardFileName}</p>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">PDF Document &bull; {idCardFileSize}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="relative mx-auto max-w-[240px] rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-700 shadow-xs">
                        <img src={idCardPreview} alt="ID Preview" className="w-full h-32 object-cover" />
                        <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                          {idCardFileSize}
                        </div>
                      </div>
                    )}
                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline block pt-1">
                      Click to choose a different photo or PDF
                    </span>
                  </div>
                ) : (
                  <div className="py-6 space-y-2">
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">Click to upload College ID Card</p>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">Supports JPG, PNG, WEBP, or PDF (Max 10MB)</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded-xl p-3 text-[11px] text-amber-800 dark:text-amber-300 flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Your student ID card is securely stored and reviewed solely by campus moderation to ensure community safety.</span>
              </div>

              <button
                type="submit"
                disabled={loading || !idCardPreview}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <span>{loading ? 'Submitting ID...' : 'Submit ID & Complete Verification'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        ) : regStep === 'OTP' ? (
          /* ========================================================================= */
          /* VIEW 3: STEP EMAIL OTP VERIFICATION                                       */
          /* ========================================================================= */
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center space-x-1.5 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <KeyRound className="w-4 h-4" />
                  <span>Email Verification</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-100">Enter Verification Code</h2>
                <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  <span>Sent to: <span className="font-bold text-slate-800 dark:text-zinc-200">{email}</span></span>
                  <button
                    type="button"
                    onClick={() => {
                      setRegStep('FORM');
                      setError('');
                    }}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                  >
                    (Change)
                  </button>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Spam / Junk Notice Box */}
            <div className="mb-4 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800/60 rounded-2xl p-3 text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-amber-950 dark:text-amber-100">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Can't find the email in your Inbox?</span>
              </div>
              <p className="pl-5 text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                Please check your <strong>Spam</strong>, <strong>Junk</strong>, or <strong>Promotions</strong> folder! Google Mail sometimes places automated verification codes from new senders in Spam.
              </p>
            </div>

            {error && (
              <div className="mb-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 px-3 py-2.5 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">Enter 6-Digit Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onPaste={handleOtpPaste}
                  placeholder="000000"
                  className="w-full py-3.5 text-center text-2xl font-mono font-bold tracking-[10px] border-2 border-indigo-200 dark:border-indigo-900/80 focus:border-indigo-600 rounded-2xl focus:outline-hidden bg-slate-50 dark:bg-zinc-800 text-indigo-900 dark:text-indigo-300 shadow-inner"
                  autoFocus
                  required
                />
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1.5 text-center">
                  Valid for 10 minutes &bull; Paste friendly (spaces/dashes handled automatically)
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || otp.replace(/\D/g, '').length !== 6}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <span>{loading ? 'Verifying OTP...' : 'Verify Code & Continue'}</span>
                <Check className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  disabled={resendTimer > 0 || resendLoading}
                  onClick={handleResendOtp}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 disabled:text-slate-400 dark:disabled:text-zinc-600 cursor-pointer disabled:cursor-not-allowed inline-flex items-center space-x-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resendLoading ? 'animate-spin' : ''}`} />
                  <span>
                    {resendTimer > 0 
                      ? `Resend code in ${resendTimer}s` 
                      : 'Resend Verification Code'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* ========================================================================= */
          /* VIEW 4: STEP FORM (Login or Initial Registration)                         */
          /* ========================================================================= */
          <div>
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center space-x-1.5 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Campus Verified</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-100">
                  {mode === 'login' ? 'Welcome Back' : 'Create Student Account'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  {mode === 'login' 
                    ? 'Sign in to access your campus rentals and wallet' 
                    : 'Join with any personal or campus email (OTP verified)'}
                </p>
              </div>
              <button 
                onClick={onClose} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switch Tabs */}
            <div className="flex bg-slate-100 dark:bg-zinc-800/90 p-1 rounded-xl mb-5">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                  mode === 'login' ? 'bg-white dark:bg-zinc-900 text-indigo-700 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                  mode === 'register' ? 'bg-white dark:bg-zinc-900 text-indigo-700 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
                }`}
              >
                Register
              </button>
            </div>

            {error && (
              <div className="mb-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 px-3 py-2.5 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              
              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="e.g. Rahul Sharma"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-850 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 placeholder-zinc-400 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">College Roll / Reg No.</label>
                      <input
                        type="text"
                        placeholder="e.g. 12014522"
                        value={collegeId}
                        onChange={(e) => setCollegeId(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-850 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 placeholder-zinc-400 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Hostel / Campus Room</label>
                      <input
                        type="text"
                        placeholder="e.g. Block B, 304"
                        value={hostelBlock}
                        onChange={(e) => setHostelBlock(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-850 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 placeholder-zinc-400 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="tel"
                        placeholder="e.g. +91 9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-850 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 placeholder-zinc-400 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  {mode === 'register' ? 'Email Address (Personal or University Email)' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    placeholder="e.g. student@gmail.com or student@campus.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-850 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 placeholder-zinc-400 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-850 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 placeholder-zinc-400 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer flex items-center justify-center space-x-1.5 pt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span>{mode === 'login' ? 'Signing In...' : 'Sending Verification Code...'}</span>
                  </>
                ) : (
                  <>
                    <span>
                      {mode === 'login' 
                        ? 'Sign In to PeerGear' 
                        : 'Continue to Email OTP & ID Card'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default AuthModal;
