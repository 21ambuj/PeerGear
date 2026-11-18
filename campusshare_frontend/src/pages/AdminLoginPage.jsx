import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  ArrowLeft, 
  AlertCircle, 
  KeyRound, 
  Building2,
  CheckCircle2,
  Loader2
} from 'lucide-react';

const AdminLoginPage = ({ onLoginSuccess, onBackToStudent }) => {
  const { adminLogin } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please provide both administrator email and password.');
      return;
    }

    try {
      setLoading(true);
      const adminUser = await adminLogin(email.trim().toLowerCase(), password);
      showToast(
        `Welcome, ${adminUser.name || 'Administrator'}! Moderation console unlocked.`,
        'success',
        'Admin Portal Authenticated'
      );
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Invalid administrative credentials or insufficient privileges.';
      setError(errMsg);
      showToast(errMsg, 'error', 'Admin Access Denied');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemoAdmin = () => {
    setEmail('admin@college.edu');
    setPassword('AdminPassword123!');
    setError('');
    showToast('Demo administrator credentials filled. Click "Sign In to Admin Console".', 'info', 'Demo Admin');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      <div className="max-w-md w-full">
        
        {/* Back Link */}
        <div className="mb-6 flex justify-between items-center">
          <button
            type="button"
            onClick={onBackToStudent}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Student Portal</span>
          </button>
          
          <span className="text-[11px] font-mono font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2.5 py-1 rounded-full flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Admin Gateway v2.4</span>
          </span>
        </div>

        {/* Card */}
        <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-8 shadow-2xl text-slate-100">
          
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30 border border-indigo-400/30">
              <ShieldCheck className="w-9 h-9 text-white stroke-[2.2]" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Campus Admin Console</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Restricted portal for Student ID Card verification, account moderation, and dispute settlement.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 bg-rose-950/80 border border-rose-800 text-rose-300 px-3.5 py-3 rounded-2xl text-xs flex items-center space-x-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Official Administrative Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@college.edu"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Administrative Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/30 cursor-pointer flex items-center justify-center space-x-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Admin Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo Admin Quick Button */}
          <div className="mt-5 pt-4 border-t border-slate-700/80 text-center">
            <button
              type="button"
              onClick={handleFillDemoAdmin}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer inline-flex items-center space-x-1 hover:underline"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Fill Demo Admin Credentials (Prof. D. Sen)</span>
            </button>
          </div>

          {/* Security Features Info Box */}
          <div className="mt-6 bg-slate-900/70 border border-slate-800 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-300">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Campus Security Protections Active:</span>
            </div>
            <ul className="text-[11px] text-slate-400 space-y-1 pl-5 list-disc">
              <li>Role-based access control strictly enforced (Role: ADMIN).</li>
              <li>Student passwords and hashes are permanently redacted.</li>
              <li>All moderation decisions (Approve, Reject, Block) are audit-logged.</li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
