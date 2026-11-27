import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  X, 
  Wallet, 
  ShieldCheck, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Smartphone, 
  Building2, 
  CreditCard, 
  CheckCircle2, 
  Lock, 
  Sparkles, 
  RefreshCw, 
  Receipt, 
  AlertCircle,
  Copy,
  Check,
  Clock,
  ArrowLeft
} from 'lucide-react';

const ManageMoneyModal = ({ isOpen, onClose, initialView = 'CHOICE', onSuccess }) => {
  const { user, topupWallet, withdrawFunds, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [currentView, setCurrentView] = useState(initialView); // 'CHOICE', 'ADD', 'WITHDRAW'
  
  // Top-Up State
  const [topupAmount, setTopupAmount] = useState(500);
  const [selectedUpiApp, setSelectedUpiApp] = useState('GPAY');
  const [topupMethod, setTopupMethod] = useState('UPI_APP'); // 'UPI_APP', 'UPI_QR'
  const [topupProcessing, setTopupProcessing] = useState(false);
  const [topupStep, setTopupStep] = useState(0);
  const [topupReceipt, setTopupReceipt] = useState(null);

  // Withdraw State
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('UPI'); // 'UPI', 'BANK'
  const [destinationUpi, setDestinationUpi] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankIfsc, setBankIfsc] = useState('SBIN0001234');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [withdrawProcessing, setWithdrawProcessing] = useState(false);
  const [withdrawStep, setWithdrawStep] = useState(0);
  const [withdrawReceipt, setWithdrawReceipt] = useState(null);
  const [withdrawError, setWithdrawError] = useState('');

  const [copiedField, setCopiedField] = useState('');

  const walletBalance = Number(user?.wallet_balance || 0);

  // Reset or initialize state
  useEffect(() => {
    if (isOpen) {
      setCurrentView(initialView);
      setTopupAmount(500);
      setTopupProcessing(false);
      setTopupStep(0);
      setTopupReceipt(null);

      setWithdrawAmount('');
      setWithdrawProcessing(false);
      setWithdrawStep(0);
      setWithdrawReceipt(null);
      setWithdrawError('');

      if (user) {
        const defaultUpi = user.college_id 
          ? `${user.college_id.toLowerCase()}@oksbi`
          : `${user.email?.split('@')[0] || 'student'}@oksbi`;
        setDestinationUpi(defaultUpi);
        setBeneficiaryName(user.name || 'Student Account');
      }
    }
  }, [isOpen, initialView, user]);

  if (!isOpen) return null;

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const upiApps = [
    { id: 'GPAY', name: 'Google Pay', handle: 'oksbi', color: 'from-blue-500 to-indigo-600', icon: 'GPay' },
    { id: 'PHONEPE', name: 'PhonePe', handle: 'ybl', color: 'from-purple-600 to-indigo-700', icon: 'PhonePe' },
    { id: 'PAYTM', name: 'Paytm UPI', handle: 'paytm', color: 'from-sky-500 to-cyan-600', icon: 'Paytm' },
    { id: 'BHIM', name: 'BHIM UPI', handle: 'upi', color: 'from-amber-500 to-orange-600', icon: 'BHIM' },
    { id: 'CRED', name: 'CRED UPI', handle: 'axisbank', color: 'from-slate-800 to-black', icon: 'CRED' },
  ];

  // EXECUTE TOP-UP
  const handleSimulateTopup = async () => {
    const amt = Number(topupAmount);
    if (!amt || amt <= 0) return;

    setTopupProcessing(true);
    setTopupStep(1);

    setTimeout(() => setTopupStep(2), 450);
    setTimeout(() => setTopupStep(3), 900);

    setTimeout(async () => {
      const activeAppName = upiApps.find(a => a.id === selectedUpiApp)?.name || 'Campus UPI';
      const txnRef = `TXN_UPI_${Date.now().toString().slice(-8)}`;
      const utr = `43${Math.floor(1000000000 + Math.random() * 9000000000)}`;

      try {
        await topupWallet(amt, {
          payment_method: topupMethod === 'UPI_QR' ? 'UPI_DYNAMIC_QR' : `UPI_${selectedUpiApp}`,
          gateway_app: topupMethod === 'UPI_QR' ? 'Scan & Pay QR' : activeAppName,
          transaction_ref: txnRef,
          utr_number: utr
        });
        await refreshUser();

        setTopupReceipt({
          transaction_ref: txnRef,
          utr_number: utr,
          amount: amt,
          gateway_app: topupMethod === 'UPI_QR' ? 'Dynamic UPI QR' : activeAppName,
          timestamp: new Date().toISOString()
        });

        showToast(`₹${amt.toFixed(2)} credited to your campus wallet!`, 'success', 'Wallet Recharged');
        if (onSuccess) onSuccess();
      } catch (err) {
        showToast('Top-up failed. Please retry.', 'error', 'Error');
      } finally {
        setTopupProcessing(false);
      }
    }, 1350);
  };

  // EXECUTE WITHDRAWAL
  const handleSimulateWithdrawal = async (e) => {
    e.preventDefault();
    setWithdrawError('');

    if (user?.is_blocked) {
      setWithdrawError('Account Suspended: Cannot withdraw funds while under restriction.');
      return;
    }

    if (user?.role !== 'ADMIN' && user?.id_card_status !== 'VERIFIED') {
      setWithdrawError('Student ID Verification Required: Please verify your college ID to withdraw earnings.');
      return;
    }

    const amt = Number(withdrawAmount);
    if (isNaN(amt) || amt < 50) {
      setWithdrawError('Minimum withdrawal amount is ₹50.00.');
      return;
    }

    if (amt > walletBalance) {
      setWithdrawError(`Insufficient funds. Your current available balance is ₹${walletBalance.toFixed(2)}.`);
      return;
    }

    setWithdrawProcessing(true);
    setWithdrawStep(1);

    setTimeout(() => setWithdrawStep(2), 500);
    setTimeout(() => setWithdrawStep(3), 950);

    setTimeout(async () => {
      const payoutRef = `PAYOUT_IMPS_${Date.now().toString().slice(-8)}`;
      const utr = `43${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      const destination = payoutMethod === 'UPI' 
        ? destinationUpi 
        : `A/C ...${bankAccount.slice(-4) || 'Bank'} (${bankIfsc})`;

      try {
        const res = await withdrawFunds({
          amount: amt,
          payout_method: payoutMethod === 'UPI' ? 'UPI_IMPS' : 'BANK_IMPS',
          destination_upi: destinationUpi,
          bank_account: bankAccount,
          bank_ifsc: bankIfsc,
          beneficiary_name: beneficiaryName,
          transaction_ref: payoutRef,
          utr_number: utr
        });

        await refreshUser();

        setWithdrawReceipt({
          transaction_ref: payoutRef,
          utr_number: utr,
          amount: amt,
          destination: destination,
          timestamp: new Date().toISOString(),
          balance_after: res.wallet_balance
        });

        showToast(`₹${amt.toFixed(2)} successfully disbursed to ${destination}!`, 'success', 'Payout Dispatched');
        if (onSuccess) onSuccess();
      } catch (err) {
        const msg = err.response?.data?.error || 'Failed to process payout.';
        setWithdrawError(msg);
        showToast(msg, 'error', 'Withdrawal Failed');
      } finally {
        setWithdrawProcessing(false);
      }
    }, 1400);
  };

  const dynamicQrString = `upi://pay?pa=peergear.escrow@icici&pn=PeerGear%20Campus%20Escrow&am=${topupAmount}&cu=INR&tn=Campus%20Escrow%20Recharge`;

  return (
    <div 
      className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in-up"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200/90 animate-scale-in max-h-[94vh] flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-5 sm:p-6 relative shrink-0 border-b border-indigo-900/40">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition p-1.5 rounded-full hover:bg-white/10 cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 mb-1.5">
            {currentView !== 'CHOICE' && (
              <button
                type="button"
                onClick={() => setCurrentView('CHOICE')}
                className="text-xs font-bold text-indigo-300 hover:text-white flex items-center space-x-1 cursor-pointer bg-white/10 px-2 py-0.5 rounded-lg transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>B-Money Home</span>
              </button>
            )}
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Campus Treasury • NPCI & IMPS</span>
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <span>B-Money Portal</span>
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Peer-to-peer escrow balance, wallet top-ups & instant earnings withdrawal
          </p>
        </div>

        {/* Live Balance Card Banner */}
        <div className="bg-gradient-to-r from-slate-50 via-indigo-50/30 to-emerald-50/40 p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-700 shadow-inner">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Total Available B-Money
              </span>
              <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                ₹{walletBalance.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
              <span>Escrow Protected</span>
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Ready for Rentals & Payout</span>
          </div>
        </div>

        {/* Body Container */}
        <div className="p-5 sm:p-6 overflow-y-auto no-scrollbar flex-1">
          
          {/* VIEW 1: CHOICE DASHBOARD (ADD vs WITHDRAW) */}
          {currentView === 'CHOICE' && (
            <div className="space-y-4">
              <div className="text-center max-w-sm mx-auto mb-2">
                <h3 className="text-base font-black text-slate-900">Manage Your Campus Funds</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Deposit funds for gear rentals or withdraw your lending profits directly to your bank account.
                </p>
              </div>

              {/* TWO LARGE ACTION CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* 1. ADD MONEY */}
                <button
                  type="button"
                  onClick={() => setCurrentView('ADD')}
                  className="p-5 rounded-2xl border-2 border-emerald-500/30 hover:border-emerald-600 bg-gradient-to-b from-emerald-50/60 to-white text-left transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-0.5 cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                      <ArrowDownLeft className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      Instant Top-Up
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                      + Add Money
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Recharge balance via Google Pay, PhonePe, Paytm, or dynamic QR code for gear security deposits.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-emerald-100 flex items-center justify-between text-xs font-bold text-emerald-700">
                    <span>Recharge with UPI</span>
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </button>

                {/* 2. WITHDRAW MONEY */}
                <button
                  type="button"
                  onClick={() => setCurrentView('WITHDRAW')}
                  className="p-5 rounded-2xl border-2 border-indigo-500/30 hover:border-indigo-600 bg-gradient-to-b from-indigo-50/60 to-white text-left transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-0.5 cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                      <ArrowUpRight className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                      Direct Payout
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 group-hover:text-indigo-700 transition-colors">
                      ↑ Withdraw Money
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Transfer lending earnings directly into your personal bank account or UPI ID via instant IMPS.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-indigo-100 flex items-center justify-between text-xs font-bold text-indigo-700">
                    <span>Cash Out to Bank</span>
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </button>

              </div>

              {/* Escrow Guarantee Footer Note */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-600 flex items-center space-x-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  <strong>Zero Platform Commission:</strong> 100% of rental earnings belong to student lenders. Security deposits are returned in full with zero deduction upon safe item handover.
                </span>
              </div>
            </div>
          )}

          {/* VIEW 2: ADD MONEY (TOP-UP VIA UPI) */}
          {currentView === 'ADD' && (
            <div>
              {topupProcessing ? (
                /* Animated Processing Screen */
                <div className="py-10 text-center space-y-5">
                  <div className="relative w-16 h-16 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-emerald-700">
                      <ArrowDownLeft className="w-7 h-7" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Authorizing Campus Top-Up</h3>
                    <p className="text-xs text-slate-500">Connecting to NPCI Campus Switch...</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-left max-w-sm mx-auto space-y-2 text-xs">
                    <div className={`flex items-center space-x-2 ${topupStep >= 1 ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
                      <RefreshCw className={`w-3.5 h-3.5 ${topupStep === 1 ? 'animate-spin' : ''}`} />
                      <span>1. Handshake with UPI Banking Switch...</span>
                    </div>
                    <div className={`flex items-center space-x-2 ${topupStep >= 2 ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>2. Validating Escrow Reserve Allocation...</span>
                    </div>
                    <div className={`flex items-center space-x-2 ${topupStep >= 3 ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>3. Crediting B-Money Wallet Balance...</span>
                    </div>
                  </div>
                </div>
              ) : topupReceipt ? (
                /* Success Digital Receipt */
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2 text-emerald-600 shadow-inner">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900">₹{topupReceipt.amount.toFixed(2)} Added Successfully!</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Credited via {topupReceipt.gateway_app}</p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2.5">
                    <div className="flex justify-between pb-2 border-b border-slate-200">
                      <span className="text-slate-500">Transaction Ref:</span>
                      <span className="font-mono font-bold text-slate-900">{topupReceipt.transaction_ref}</span>
                    </div>
                    <div className="flex justify-between pb-2 border-b border-slate-200">
                      <span className="text-slate-500">Bank UTR Number:</span>
                      <span className="font-mono font-bold text-slate-900">{topupReceipt.utr_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Updated B-Money:</span>
                      <span className="font-mono font-black text-emerald-700">₹{walletBalance.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Done & Back to Platform
                  </button>
                </div>
              ) : (
                /* Top-Up Form */
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Select Top-Up Amount (₹)
                    </label>
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {[200, 500, 1000, 2000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setTopupAmount(amt)}
                          className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                            Number(topupAmount) === amt
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          ₹{amt}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      value={topupAmount}
                      onChange={(e) => setTopupAmount(e.target.value)}
                      placeholder="Enter custom amount"
                      min="50"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Method Tabs */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTopupMethod('UPI_APP')}
                      className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                        topupMethod === 'UPI_APP'
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-900'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <Smartphone className="w-4 h-4 text-emerald-600" />
                      <span>UPI Apps (GPay / PhonePe)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTopupMethod('UPI_QR')}
                      className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                        topupMethod === 'UPI_QR'
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-900'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <QRCodeSVG className="w-4 h-4 text-emerald-600" value="preview" size={16} />
                      <span>Scan Dynamic QR</span>
                    </button>
                  </div>

                  {topupMethod === 'UPI_APP' ? (
                    <div className="grid grid-cols-5 gap-2">
                      {upiApps.map((app) => (
                        <button
                          key={app.id}
                          type="button"
                          onClick={() => setSelectedUpiApp(app.id)}
                          className={`p-2 rounded-xl border flex flex-col items-center justify-center space-y-1 transition cursor-pointer ${
                            selectedUpiApp === app.id
                              ? 'bg-emerald-50 border-emerald-600 text-emerald-900 font-bold ring-1 ring-emerald-500'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${app.color} text-white flex items-center justify-center font-bold text-[9px]`}>
                            {app.icon}
                          </div>
                          <span className="text-[10px] truncate max-w-full">{app.name}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                      <div className="w-32 h-32 bg-white p-2 rounded-xl shadow-xs border border-slate-200 mx-auto flex items-center justify-center">
                        <QRCodeSVG value={dynamicQrString} size={112} level="H" />
                      </div>
                      <span className="text-[10px] text-slate-500 block">Scan with any UPI app to simulate recharge</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleSimulateTopup}
                    disabled={!topupAmount || Number(topupAmount) <= 0}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition cursor-pointer disabled:opacity-50"
                  >
                    Approve Top-Up (₹{Number(topupAmount || 0).toFixed(2)})
                  </button>
                </div>
              )}
            </div>
          )}

          {/* VIEW 3: WITHDRAW MONEY (DIRECT PAYOUT TO BANK/UPI) */}
          {currentView === 'WITHDRAW' && (
            <div>
              {withdrawProcessing ? (
                /* Animated Payout Processing Screen */
                <div className="py-10 text-center space-y-5">
                  <div className="relative w-16 h-16 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-indigo-700">
                      <ArrowUpRight className="w-7 h-7" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Disbursing Instant Payout</h3>
                    <p className="text-xs text-slate-500">Connecting to NPCI IMPS Payout Switch...</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-left max-w-sm mx-auto space-y-2 text-xs">
                    <div className={`flex items-center space-x-2 ${withdrawStep >= 1 ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
                      <RefreshCw className={`w-3.5 h-3.5 ${withdrawStep === 1 ? 'animate-spin' : ''}`} />
                      <span>1. Validating Beneficiary UPI VPA / Account...</span>
                    </div>
                    <div className={`flex items-center space-x-2 ${withdrawStep >= 2 ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>2. Authorizing Debit from Escrow Reserve...</span>
                    </div>
                    <div className={`flex items-center space-x-2 ${withdrawStep >= 3 ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>3. IMPS Direct Bank Payout Dispatched!</span>
                    </div>
                  </div>
                </div>
              ) : withdrawReceipt ? (
                /* Success Digital Payout Voucher */
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-2 text-indigo-600 shadow-inner">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900">₹{withdrawReceipt.amount.toFixed(2)} Disbursed to Bank!</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Instant transfer completed via IMPS</p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2.5">
                    <div className="flex justify-between pb-2 border-b border-slate-200">
                      <span className="text-slate-500">Payout Reference:</span>
                      <div className="flex items-center space-x-1 font-mono font-bold text-slate-800">
                        <span>{withdrawReceipt.transaction_ref}</span>
                        <button 
                          type="button" 
                          onClick={() => copyToClipboard(withdrawReceipt.transaction_ref, 'payout_ref')}
                          className="text-slate-400 hover:text-indigo-600 p-0.5 cursor-pointer"
                        >
                          {copiedField === 'payout_ref' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between pb-2 border-b border-slate-200">
                      <span className="text-slate-500">Bank UTR Number:</span>
                      <span className="font-mono font-bold text-slate-900">{withdrawReceipt.utr_number}</span>
                    </div>
                    <div className="flex justify-between pb-2 border-b border-slate-200">
                      <span className="text-slate-500">Destination Account:</span>
                      <span className="font-semibold text-slate-800">{withdrawReceipt.destination}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Remaining Balance:</span>
                      <span className="font-mono font-black text-slate-900">₹{Number(withdrawReceipt.balance_after || 0).toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Done & Return to Catalog
                  </button>
                </div>
              ) : (
                /* Withdrawal Form */
                <form onSubmit={handleSimulateWithdrawal} className="space-y-4">
                  {withdrawError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{withdrawError}</span>
                    </div>
                  )}

                  {/* Amount to Withdraw */}
                  <div>
                    <div className="flex justify-between items-baseline mb-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Amount to Withdraw (₹)
                      </label>
                      <span className="text-[11px] text-slate-500">
                        Max Withdrawable: <strong className="text-slate-800">₹{walletBalance.toFixed(2)}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 mb-2">
                      {[100, 200, 500].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setWithdrawAmount(String(amt))}
                          disabled={walletBalance < amt}
                          className={`py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                            String(withdrawAmount) === String(amt)
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          ₹{amt}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setWithdrawAmount(String(Math.floor(walletBalance)))}
                        disabled={walletBalance <= 0}
                        className="py-1.5 text-xs font-bold rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition cursor-pointer disabled:opacity-40"
                      >
                        All (100%)
                      </button>
                    </div>

                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="Enter amount to withdraw (min ₹50)"
                      min="50"
                      max={walletBalance}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Destination Method Tabs */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Payout Destination
                    </label>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => setPayoutMethod('UPI')}
                        className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                          payoutMethod === 'UPI'
                            ? 'bg-indigo-50 border-indigo-600 text-indigo-900'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <Smartphone className="w-4 h-4 text-indigo-600" />
                        <span>Instant UPI VPA</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPayoutMethod('BANK')}
                        className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                          payoutMethod === 'BANK'
                            ? 'bg-indigo-50 border-indigo-600 text-indigo-900'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <Building2 className="w-4 h-4 text-indigo-600" />
                        <span>Direct Bank (IMPS)</span>
                      </button>
                    </div>

                    {payoutMethod === 'UPI' ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={destinationUpi}
                          onChange={(e) => setDestinationUpi(e.target.value)}
                          placeholder="e.g. yourname@oksbi"
                          required
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="flex gap-1.5">
                          {['@oksbi', '@okhdfcbank', '@paytm', '@ybl'].map((h) => (
                            <button
                              key={h}
                              type="button"
                              onClick={() => {
                                const base = destinationUpi.split('@')[0] || 'student';
                                setDestinationUpi(`${base}${h}`);
                              }}
                              className="px-2 py-0.5 rounded-lg bg-slate-100 text-[10px] font-mono text-slate-600 hover:bg-slate-200 cursor-pointer"
                            >
                              {h}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={bankAccount}
                          onChange={(e) => setBankAccount(e.target.value)}
                          placeholder="Bank Account Number"
                          required
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={bankIfsc}
                            onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                            placeholder="IFSC Code (e.g. SBIN0001234)"
                            required
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                          />
                          <input
                            type="text"
                            value={beneficiaryName}
                            onChange={(e) => setBeneficiaryName(e.target.value)}
                            placeholder="Account Holder Name"
                            required
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submit Payout Button */}
                  <button
                    type="submit"
                    disabled={!withdrawAmount || Number(withdrawAmount) < 50 || Number(withdrawAmount) > walletBalance}
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/20 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>
                      {Number(withdrawAmount) > walletBalance 
                        ? 'Insufficient Balance' 
                        : `Initiate Instant Payout (₹${Number(withdrawAmount || 0).toFixed(2)})`}
                    </span>
                  </button>

                  <p className="text-[10px] text-center text-slate-400">
                    Instant IMPS Payout • Processed in accordance with campus lending policy
                  </p>
                </form>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ManageMoneyModal;
