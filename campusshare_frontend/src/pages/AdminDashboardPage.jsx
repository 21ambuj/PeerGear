import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Users, 
  ShieldCheck, 
  Clock, 
  Ban, 
  Search, 
  Filter, 
  RefreshCw, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Eye, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  ExternalLink, 
  X, 
  UserX, 
  UserCheck, 
  Check, 
  Lock, 
  Download,
  Calendar,
  Building,
  Phone,
  Mail,
  Wallet,
  Star,
  ShieldAlert,
  Loader2
} from 'lucide-react';

const getDocumentUrl = (filePath) => {
  if (!filePath) return '';
  if (filePath.startsWith('data:') || filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  return filePath.startsWith('/') ? filePath : `/${filePath}`;
};

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [students, setStudents] = useState([]);
  const [metrics, setMetrics] = useState({
    total_students: 0,
    pending_verifications: 0,
    verified_students: 0,
    blocked_accounts: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [idStatus, setIdStatus] = useState('ALL');
  const [accountStatus, setAccountStatus] = useState('ALL');

  // Modals
  const [inspectStudent, setInspectStudent] = useState(null);
  const [blockModalStudent, setBlockModalStudent] = useState(null);
  const [blockAction, setBlockAction] = useState('BLOCK'); // 'BLOCK' or 'UNBLOCK'
  const [blockReason, setBlockReason] = useState('Unreturned rental equipment after multiple notices');
  const [customBlockReason, setCustomBlockReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // ID Inspector Controls
  const [rejectReason, setRejectReason] = useState('Photo is blurry or unreadable');
  const [customRejectReason, setCustomRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [imgZoom, setImgZoom] = useState(1);
  const [imgRotate, setImgRotate] = useState(0);

  const fetchDirectory = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getUsers({
        search: search.trim(),
        id_status: idStatus,
        account_status: accountStatus,
      });
      setStudents(res.data.students || []);
      if (res.data.metrics) {
        setMetrics(res.data.metrics);
      }
    } catch (err) {
      console.error('Failed to fetch admin student directory:', err);
      showToast('Failed to load student moderation directory.', 'error', 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectory();
  }, [idStatus, accountStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDirectory();
  };

  // Open ID Inspection
  const handleOpenInspect = (student) => {
    setInspectStudent(student);
    setShowRejectInput(false);
    setRejectReason('Photo is blurry or unreadable');
    setCustomRejectReason('');
    setImgZoom(1);
    setImgRotate(0);
  };

  // Handle ID Verification (Approve or Reject)
  const handleVerifyIdCard = async (action) => {
    if (!inspectStudent) return;

    let finalReason = '';
    if (action === 'REJECT') {
      finalReason = rejectReason === 'OTHER' ? customRejectReason.trim() : rejectReason;
      if (!finalReason) {
        showToast('Please provide a specific rejection reason.', 'error', 'Reason Required');
        return;
      }
    }

    try {
      setActionLoading(true);
      const res = await adminApi.verifyId(inspectStudent._id, {
        action,
        reason: finalReason,
      });

      showToast(res.data.message, 'success', action === 'APPROVE' ? 'ID Approved' : 'ID Rejected');
      setInspectStudent(null);
      fetchDirectory();
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to update ID verification status.';
      showToast(errMsg, 'error', 'Action Failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Block / Unblock Modal
  const handleOpenBlockModal = (student, action) => {
    setBlockModalStudent(student);
    setBlockAction(action);
    setBlockReason('Unreturned rental equipment after multiple notices');
    setCustomBlockReason('');
  };

  // Execute Block / Unblock
  const handleExecuteToggleBlock = async () => {
    if (!blockModalStudent) return;

    let finalReason = '';
    if (blockAction === 'BLOCK') {
      finalReason = blockReason === 'OTHER' ? customBlockReason.trim() : blockReason;
      if (!finalReason) {
        showToast('Please provide a reason for account suspension.', 'error', 'Reason Required');
        return;
      }
    }

    try {
      setActionLoading(true);
      const res = await adminApi.toggleBlock(blockModalStudent._id, {
        action: blockAction,
        reason: finalReason,
      });

      showToast(res.data.message, 'success', blockAction === 'BLOCK' ? 'Account Suspended' : 'Account Restored');
      setBlockModalStudent(null);
      fetchDirectory();
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to toggle account block status.';
      showToast(errMsg, 'error', 'Action Failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 px-3 py-1 rounded-full text-xs font-semibold mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Campus Security &amp; Moderation Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Student Identity &amp; Account Moderation
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Review uploaded Student ID cards (photo or PDF), verify university credentials, and manage account suspensions with zero credential leakage.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/10 px-4 py-3 rounded-2xl text-right">
          <p className="text-[11px] text-slate-300 uppercase tracking-wider font-bold">Logged In Administrator</p>
          <p className="text-sm font-black text-white">{user?.name || 'Prof. D. Sen'}</p>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-md inline-block mt-1">
            System Admin Clearance
          </span>
        </div>
      </div>

      {/* KPI Stat Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Students */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-inner">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Registered</p>
            <p className="text-2xl font-black text-slate-900">{metrics.total_students}</p>
            <p className="text-[11px] text-slate-400">Campus Students</p>
          </div>
        </div>

        {/* Pending Review */}
        <div className="bg-white rounded-2xl p-5 border border-amber-200 bg-amber-50/20 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 shadow-inner">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-800">Pending ID Review</p>
            <p className="text-2xl font-black text-amber-900">{metrics.pending_verifications}</p>
            <p className="text-[11px] text-amber-700 font-medium">Awaiting Verification</p>
          </div>
        </div>

        {/* Verified Students */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-200 bg-emerald-50/20 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0 shadow-inner">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-800">Verified Members</p>
            <p className="text-2xl font-black text-emerald-900">{metrics.verified_students}</p>
            <p className="text-[11px] text-emerald-700 font-medium">Tier-2 Credentials Approved</p>
          </div>
        </div>

        {/* Suspended Accounts */}
        <div className="bg-white rounded-2xl p-5 border border-rose-200 bg-rose-50/20 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700 shrink-0 shadow-inner">
            <Ban className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-rose-800">Suspended / Blocked</p>
            <p className="text-2xl font-black text-rose-900">{metrics.blocked_accounts}</p>
            <p className="text-[11px] text-rose-700 font-medium">Access Restricted</p>
          </div>
        </div>

      </div>

      {/* Directory Search & Filter Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 justify-between items-center">
          
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, email, roll number..."
              className="w-full pl-9 pr-20 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Filters & Refresh */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            
            {/* ID Status Filter */}
            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
              <span className="text-slate-500 font-semibold">ID Status:</span>
              <select
                value={idStatus}
                onChange={(e) => setIdStatus(e.target.value)}
                className="bg-transparent font-bold text-slate-800 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING_VERIFICATION">Pending Review ⏳</option>
                <option value="VERIFIED">Verified ✓</option>
                <option value="REJECTED">Rejected ✗</option>
                <option value="NOT_UPLOADED">Not Uploaded</option>
              </select>
            </div>

            {/* Account Status Filter */}
            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
              <span className="text-slate-500 font-semibold">Account:</span>
              <select
                value={accountStatus}
                onChange={(e) => setAccountStatus(e.target.value)}
                className="bg-transparent font-bold text-slate-800 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">All Accounts</option>
                <option value="ACTIVE">Active Only</option>
                <option value="BLOCKED">Suspended Only 🚫</option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={fetchDirectory}
              disabled={loading}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-600 transition cursor-pointer"
              title="Refresh Directory"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

          </div>
        </div>
      </div>

      {/* Student Directory Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[720px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Student Information</th>
                <th className="py-3.5 px-4">Campus Credentials</th>
                <th className="py-3.5 px-4">ID Card Status</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4">Trust &amp; Wallet</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                    <span>Loading student records...</span>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">No student accounts matched your query.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Try clearing your search or switching filter categories.</p>
                  </td>
                </tr>
              ) : (
                students.map((st) => {
                  const isBlocked = !!st.is_blocked;
                  const isVerified = st.id_card_status === 'VERIFIED';
                  const isPending = st.id_card_status === 'PENDING_VERIFICATION';
                  const isRejected = st.id_card_status === 'REJECTED';

                  return (
                    <tr key={st._id} className={`hover:bg-slate-50/60 transition ${isBlocked ? 'bg-rose-50/30' : ''}`}>
                      
                      {/* Student Info */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center space-x-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isBlocked ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'
                          }`}>
                            {st.name?.slice(0, 2)?.toUpperCase() || 'ST'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 flex items-center space-x-1.5">
                              <span>{st.name}</span>
                              {st.is_email_verified && (
                                <span title="Email Verified" className="text-emerald-600 inline-block">✓</span>
                              )}
                            </p>
                            <p className="text-slate-500 text-[11px]">{st.email}</p>
                            <p className="text-slate-400 text-[10px]">{st.phone || 'No phone recorded'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Campus Credentials */}
                      <td className="py-4 px-4">
                        <p className="font-mono font-bold text-slate-800">{st.college_id}</p>
                        <p className="text-slate-500 text-[11px] truncate max-w-[160px]">
                          {st.hostel_block || 'Campus Resident'}
                        </p>
                      </td>

                      {/* ID Card Status & Thumbnail */}
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2.5">
                          {st.id_card_file && (
                            <div 
                              onClick={() => handleOpenInspect(st)}
                              className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 shadow-2xs cursor-pointer hover:scale-105 transition-transform shrink-0 bg-slate-100 flex items-center justify-center group relative"
                              title="Click to inspect uploaded ID proof"
                            >
                              {st.id_card_filetype === 'pdf' || st.id_card_file?.toLowerCase().includes('.pdf') ? (
                                <FileText className="w-5 h-5 text-rose-600" />
                              ) : (
                                <img
                                  src={getDocumentUrl(st.id_card_file)}
                                  alt="Thumbnail"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              )}
                              <span className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Eye className="w-3.5 h-3.5 text-white" />
                              </span>
                            </div>
                          )}

                          <div>
                            {isPending && (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                <Clock className="w-3 h-3 animate-pulse" />
                                <span>Pending Review</span>
                              </span>
                            )}
                            {isVerified && (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Verified ID</span>
                              </span>
                            )}
                            {isRejected && (
                              <div>
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                  <XCircle className="w-3 h-3 text-rose-600" />
                                  <span>Rejected</span>
                                </span>
                                {st.id_card_rejection_reason && (
                                  <p className="text-[10px] text-rose-700 mt-1 italic max-w-[150px] truncate" title={st.id_card_rejection_reason}>
                                    "{st.id_card_rejection_reason}"
                                  </p>
                                )}
                              </div>
                            )}
                            {st.id_card_status === 'NOT_UPLOADED' && (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                <span>Not Uploaded</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Account Status (Active vs Suspended) */}
                      <td className="py-4 px-4">
                        {isBlocked ? (
                          <div>
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-600 text-white shadow-xs">
                              <Ban className="w-3 h-3" />
                              <span>SUSPENDED</span>
                            </span>
                            {st.blocked_reason && (
                              <p className="text-[10px] text-rose-800 mt-1 max-w-[140px] truncate" title={st.blocked_reason}>
                                {st.blocked_reason}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Active Account</span>
                          </span>
                        )}
                      </td>

                      {/* Trust & Wallet */}
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-1 font-bold text-slate-800">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{st.trust_score?.toFixed(1) || '5.0'}</span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          Wallet: <span className="font-semibold text-slate-700">₹{st.wallet_balance || 0}</span>
                        </p>
                      </td>

                      {/* Moderation Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right space-x-2">
                        
                        {/* Review ID Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenInspect(st)}
                          className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                            isPending 
                              ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                              : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                          }`}
                          title="Review Student ID Card"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isPending ? 'Verify ID' : 'View ID'}</span>
                        </button>

                        {/* Block / Unblock Button */}
                        {isBlocked ? (
                          <button
                            type="button"
                            onClick={() => handleOpenBlockModal(st, 'UNBLOCK')}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 transition shadow-xs cursor-pointer"
                            title="Restore Account Access"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Unblock</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenBlockModal(st, 'BLOCK')}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition shadow-xs cursor-pointer"
                            title="Suspend Student Account"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>Block</span>
                          </button>
                        )}

                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: STUDENT ID CARD INSPECTION & VERIFICATION MODAL                  */}
      {/* ========================================================================= */}
      {inspectStudent && (
        <div 
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
          onClick={() => setInspectStudent(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Student ID Verification Review</h3>
                  <p className="text-xs text-slate-500">
                    Inspecting credentials for: <span className="font-bold text-slate-800">{inspectStudent.name}</span> ({inspectStudent.email})
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setInspectStudent(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200/60 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Split Screen */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: ID Document Viewer Canvas */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Submitted Document</span>
                  
                  {/* Canvas Controls */}
                  {inspectStudent.id_card_file && inspectStudent.id_card_filetype !== 'pdf' && (
                    <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
                      <button 
                        onClick={() => setImgZoom((prev) => Math.max(0.5, prev - 0.2))}
                        className="p-1 hover:bg-white rounded text-slate-600 cursor-pointer" 
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => { setImgZoom(1); setImgRotate(0); }}
                        className="px-1.5 py-0.5 hover:bg-white rounded text-[10px] font-bold text-slate-600 cursor-pointer" 
                        title="Reset"
                      >
                        Reset
                      </button>
                      <button 
                        onClick={() => setImgZoom((prev) => Math.min(3, prev + 0.2))}
                        className="p-1 hover:bg-white rounded text-slate-600 cursor-pointer" 
                        title="Zoom In"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => setImgRotate((prev) => (prev + 90) % 360)}
                        className="p-1 hover:bg-white rounded text-slate-600 cursor-pointer" 
                        title="Rotate"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Document Display Box */}
                {(() => {
                  const docUrl = getDocumentUrl(inspectStudent.id_card_file);
                  const isPdf = inspectStudent.id_card_filetype === 'pdf' || 
                                (docUrl && (docUrl.toLowerCase().endsWith('.pdf') || docUrl.includes('.pdf?'))) ||
                                (inspectStudent.id_card_filename && inspectStudent.id_card_filename.toLowerCase().endsWith('.pdf'));

                  return (
                    <div className="border-2 border-slate-200 rounded-2xl bg-slate-900/5 min-h-[320px] max-h-[420px] flex items-center justify-center overflow-hidden relative">
                      {docUrl ? (
                        isPdf ? (
                          <div className="w-full text-center p-6 space-y-4">
                            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                              <FileText className="w-9 h-9 stroke-[2.2]" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-sm truncate max-w-[320px] mx-auto">
                                {inspectStudent.id_card_filename || 'Student_University_ID.pdf'}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">Official Student ID Card (PDF Document)</p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                              <a
                                href={docUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Open PDF in Full Screen</span>
                              </a>
                              <a
                                href={docUrl}
                                download={inspectStudent.id_card_filename || 'student_id.pdf'}
                                className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-300 cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download PDF</span>
                              </a>
                            </div>
                            <p className="text-[11px] text-slate-400">
                              Opens full resolution document directly in a secure view tab.
                            </p>
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
                            <img
                              src={docUrl}
                              alt="Student ID Card Preview"
                              style={{
                                transform: `scale(${imgZoom}) rotate(${imgRotate}deg)`,
                                transition: 'transform 0.2s ease',
                              }}
                              className="max-h-[360px] max-w-full object-contain rounded-xl shadow-xs"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fb = document.getElementById('id-fallback-box');
                                if (fb) fb.style.display = 'block';
                              }}
                            />
                            <div id="id-fallback-box" style={{ display: 'none' }} className="text-center p-6 space-y-2">
                              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                              <p className="font-bold text-slate-800 text-xs">Preview could not be displayed directly</p>
                              <a href={docUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-1 text-indigo-600 font-bold text-xs underline">
                                <span>Open Image in New Window</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="text-center p-8 space-y-2 text-slate-400">
                          <FileText className="w-12 h-12 mx-auto stroke-1 text-slate-300" />
                          <p className="font-bold text-slate-700 text-xs">No ID Card Document on Record</p>
                          <p className="text-[11px] text-slate-400">This student has not yet submitted an ID card file.</p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {inspectStudent.id_card_filename && (
                  <p className="text-[11px] text-slate-400 text-center font-mono">
                    File: {inspectStudent.id_card_filename}
                  </p>
                )}
              </div>

              {/* Right Column: Student Profile Details & Privacy Banner */}
              <div className="space-y-4">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block">
                  Student Verification Profile
                </span>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-slate-500">Student Name:</span>
                    <span className="font-bold text-slate-900">{inspectStudent.name}</span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-slate-500">Email Address:</span>
                    <span className="font-mono font-semibold text-slate-800">{inspectStudent.email}</span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-slate-500">College Roll / Reg ID:</span>
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {inspectStudent.college_id}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-slate-500">Hostel &amp; Room:</span>
                    <span className="font-medium text-slate-800">{inspectStudent.hostel_block || 'N/A'}</span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-slate-500">Contact Phone:</span>
                    <span className="font-medium text-slate-800">{inspectStudent.phone || 'N/A'}</span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-slate-500">Trust Score:</span>
                    <span className="font-bold text-amber-600 flex items-center space-x-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{inspectStudent.trust_score?.toFixed(1) || '5.0'} / 5.0</span>
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Wallet Balance:</span>
                    <span className="font-bold text-emerald-700">₹{inspectStudent.wallet_balance || 0}</span>
                  </div>
                </div>

                {/* Strict Zero Password Exposure Banner */}
                <div className="bg-slate-900 text-slate-200 p-3.5 rounded-2xl text-[11px] space-y-1 border border-slate-800">
                  <div className="flex items-center space-x-1.5 text-emerald-400 font-bold">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Strict Privacy &amp; Credential Protection</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Student passwords and cryptographic hashes are permanently excluded from moderation records. System administrators can only inspect academic identity documents.
                  </p>
                </div>

                {/* Reject Reason Selector Form */}
                {showRejectInput && (
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-2 animate-in fade-in">
                    <label className="block text-xs font-bold text-rose-900">
                      Select Rejection Reason (Notified to Student):
                    </label>
                    <select
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="w-full p-2 bg-white border border-rose-300 rounded-xl text-xs font-semibold text-rose-900 focus:outline-hidden"
                    >
                      <option value="Photo is blurry or unreadable">Photo is blurry or unreadable</option>
                      <option value="ID card appears expired or invalid academic session">ID card appears expired or invalid academic session</option>
                      <option value="Name on ID does not match registration name">Name on ID does not match registration name</option>
                      <option value="Uploaded document is not an official university ID or fee slip">Uploaded document is not an official university ID or fee slip</option>
                      <option value="ID card appears altered or tampered">ID card appears altered or tampered</option>
                      <option value="OTHER">Other Custom Reason</option>
                    </select>

                    {rejectReason === 'OTHER' && (
                      <input
                        type="text"
                        value={customRejectReason}
                        onChange={(e) => setCustomRejectReason(e.target.value)}
                        placeholder="Type custom rejection instructions for student..."
                        className="w-full p-2 bg-white border border-rose-300 rounded-xl text-xs focus:outline-hidden"
                        required
                      />
                    )}

                    <div className="flex justify-end space-x-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowRejectInput(false)}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleVerifyIdCard('REJECT')}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer flex items-center space-x-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Confirm Rejection</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>

            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
              <span className="text-xs text-slate-500 font-medium">
                Current Status: <strong className="text-slate-800">{inspectStudent.id_card_status}</strong>
              </span>

              <div className="flex items-center space-x-2.5 w-full sm:w-auto">
                {!showRejectInput && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => setShowRejectInput(true)}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Reject ID</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={actionLoading || inspectStudent.id_card_status === 'VERIFIED'}
                  onClick={() => handleVerifyIdCard('APPROVE')}
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-md cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>{inspectStudent.id_card_status === 'VERIFIED' ? 'Already Verified' : 'Approve Student ID'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ACCOUNT SUSPENSION (BLOCK / UNBLOCK) CONFIRMATION MODAL          */}
      {/* ========================================================================= */}
      {blockModalStudent && (
        <div 
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
          onClick={() => setBlockModalStudent(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`p-6 text-white text-center ${
              blockAction === 'BLOCK' ? 'bg-gradient-to-r from-rose-600 to-red-700' : 'bg-gradient-to-r from-emerald-600 to-teal-700'
            }`}>
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3 shadow-inner">
                {blockAction === 'BLOCK' ? <UserX className="w-7 h-7 text-white" /> : <UserCheck className="w-7 h-7 text-white" />}
              </div>
              <h3 className="text-xl font-black">
                {blockAction === 'BLOCK' ? 'Suspend Student Account' : 'Restore Student Account'}
              </h3>
              <p className="text-xs text-white/90 mt-1">
                {blockModalStudent.name} ({blockModalStudent.email})
              </p>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4 text-xs">
              {blockAction === 'BLOCK' ? (
                <>
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl space-y-1">
                    <p className="font-bold flex items-center space-x-1">
                      <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Administrative Suspension Warning</span>
                    </p>
                    <p className="text-[11px] text-rose-700 leading-relaxed">
                      Suspending this account will immediately terminate active sessions and block the student from logging in or booking items on PeerGear.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Select Administrative Suspension Reason:
                    </label>
                    <select
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden"
                    >
                      <option value="Unreturned rental equipment after multiple notices">Unreturned rental equipment after multiple notices</option>
                      <option value="Academic misconduct or campus honor code violation">Academic misconduct or campus honor code violation</option>
                      <option value="Fraudulent identity or altered student ID submission">Fraudulent identity or altered student ID submission</option>
                      <option value="Dispute escrow abuse / malicious equipment damage">Dispute escrow abuse / malicious equipment damage</option>
                      <option value="OTHER">Other Custom Reason</option>
                    </select>
                  </div>

                  {blockReason === 'OTHER' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Custom Reason:</label>
                      <textarea
                        rows="2"
                        value={customBlockReason}
                        onChange={(e) => setCustomBlockReason(e.target.value)}
                        placeholder="Document violation details..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-hidden"
                        required
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl space-y-1">
                  <p className="font-bold flex items-center space-x-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Restore Full Platform Access</span>
                  </p>
                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    Lifting suspension will immediately allow <strong>{blockModalStudent.name}</strong> to sign in, rent gear, and access their campus wallet.
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setBlockModalStudent(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={actionLoading}
                onClick={handleExecuteToggleBlock}
                className={`px-5 py-2 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center space-x-1.5 ${
                  blockAction === 'BLOCK' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>{blockAction === 'BLOCK' ? 'Suspend Student' : 'Confirm Restoration'}</span>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboardPage;
