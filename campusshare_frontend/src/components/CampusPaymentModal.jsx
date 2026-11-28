import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  Smartphone, 
  QrCode, 
  CreditCard, 
  Building2, 
  ArrowRight, 
  Clock, 
  Sparkles, 
  RefreshCw, 
  ExternalLink,
  Receipt,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';

const CampusPaymentModal = ({
  isOpen,
  onClose,
  amount = 0,
  item = null,
  rentalDetails = null,
  mode = 'CHECKOUT', // 'CHECKOUT' or 'TOPUP'
  onPaymentSuccess
}) => {
  const [selectedMethod, setSelectedMethod] = useState('UPI_APP'); // 'UPI_APP', 'UPI_QR', 'CAMPUS_NETBANKING'
  const [selectedApp, setSelectedApp] = useState('GPAY'); // 'GPAY', 'PHONEPE', 'PAYTM', 'BHIM', 'CRED'
  const [customAmount, setCustomAmount] = useState(amount || 500);
  const [vpaId, setVpaId] = useState('student.cse@oksbi');
  const [selectedBank, setSelectedBank] = useState('SBI_CAMPUS');
  const [processing, setProcessing] = useState(false);
  const [processStep, setProcessStep] = useState(0);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [txnReceipt, setTxnReceipt] = useState(null);
  const [copiedField, setCopiedField] = useState('');
  const [qrSecondsLeft, setQrSecondsLeft] = useState(299);

  const payableAmount = mode === 'CHECKOUT' 
    ? (rentalDetails?.totalPayable || amount || 0)
    : Number(customAmount || 0);

  useEffect(() => {
    if (amount) {
      setCustomAmount(amount);
    }
  }, [amount]);

  // QR Code expiration countdown
  useEffect(() => {
    if (!isOpen || paymentComplete) return;
    const timer = setInterval(() => {
      setQrSecondsLeft((prev) => (prev > 1 ? prev - 1 : 300));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, paymentComplete]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setProcessing(false);
      setProcessStep(0);
      setPaymentComplete(false);
      setTxnReceipt(null);
      setQrSecondsLeft(299);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatQrTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const upiApps = [
    { id: 'GPAY', name: 'Google Pay', handle: 'oksbi', color: 'from-blue-500 to-indigo-600', icon: 'GPay' },
    { id: 'PHONEPE', name: 'PhonePe', handle: 'ybl', color: 'from-purple-600 to-indigo-700', icon: 'PhonePe' },
    { id: 'PAYTM', name: 'Paytm UPI', handle: 'paytm', color: 'from-sky-500 to-cyan-600', icon: 'Paytm' },
    { id: 'BHIM', name: 'BHIM UPI', handle: 'upi', color: 'from-amber-500 to-orange-600', icon: 'BHIM' },
    { id: 'CRED', name: 'CRED UPI', handle: 'axisbank', color: 'from-slate-800 to-black', icon: 'CRED' },
  ];

  const banks = [
    { id: 'SBI_CAMPUS', name: 'State Bank of India (Campus Branch)' },
    { id: 'HDFC_CAMPUS', name: 'HDFC Bank (University Extension)' },
    { id: 'CANARA_CAMPUS', name: 'Canara Bank (Student Desk)' },
    { id: 'ICICI_CAMPUS', name: 'ICICI Bank (Campus Digital)' },
  ];

  const handleSimulatePayment = () => {
    if (payableAmount <= 0) return;

    setProcessing(true);
    setProcessStep(1);

    // Step 1: Connecting to UPI Switch
    setTimeout(() => {
      setProcessStep(2);
    }, 450);

    // Step 2: Escrow Authorization
    setTimeout(() => {
      setProcessStep(3);
    }, 900);

    // Step 3: Success & Receipt Generation
    setTimeout(() => {
      const activeApp = upiApps.find(a => a.id === selectedApp)?.name || 'Campus UPI';
      const receipt = {
        transaction_ref: `TXN_UPI_${Date.now().toString().slice(-8)}`,
        utr_number: `43${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        escrow_lock_id: `ESC_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        amount: payableAmount,
        payment_method: selectedMethod === 'UPI_QR' ? 'UPI_DYNAMIC_QR' : selectedMethod === 'CAMPUS_NETBANKING' ? 'CAMPUS_NETBANKING' : `UPI_${selectedApp}`,
        gateway_app: selectedMethod === 'UPI_QR' ? 'Scan & Pay QR' : selectedMethod === 'CAMPUS_NETBANKING' ? banks.find(b => b.id === selectedBank)?.name : activeApp,
        vpa_id: vpaId,
        timestamp: new Date().toISOString(),
        deposit_status: 'HELD_IN_ESCROW',
        item_title: item?.title || (mode === 'TOPUP' ? 'Campus Escrow Wallet Top-Up' : 'Equipment Rental')
      };

      setTxnReceipt(receipt);
      setProcessing(false);
      setPaymentComplete(true);

      if (onPaymentSuccess) {
        onPaymentSuccess(receipt);
      }
    }, 1350);
  };

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const dynamicQrString = `upi://pay?pa=peergear.escrow@icici&pn=PeerGear%20Campus%20Escrow&am=${payableAmount}&cu=INR&tn=${encodeURIComponent(item?.title || 'Campus Escrow')}`;

  return (
    <div 
      className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in-up"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-zinc-950 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200/90 dark:border-zinc-800 animate-scale-in max-h-[94vh] flex flex-col relative text-zinc-900 dark:text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gateway Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-5 sm:p-6 relative shrink-0 border-b border-indigo-900/40">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition p-1.5 rounded-full hover:bg-white/10 cursor-pointer"
            title="Cancel"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 mb-1.5">
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>NPCI Sandbox • Instant Escrow</span>
            </span>
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Lock className="w-2.5 h-2.5" />
              <span>256-Bit SSL</span>
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <span>PeerGear Campus UPI</span>
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            {mode === 'CHECKOUT' 
              ? 'Authorized payment & security deposit reservation gateway'
              : 'Add funds securely to your campus peer-to-peer escrow balance'}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto no-scrollbar flex-1">
          {processing ? (
            /* Animated NPCI Switch Processing Screen */
            <div className="py-12 px-4 text-center space-y-6">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div>
                <div className="absolute inset-2 rounded-full border-4 border-emerald-100 border-b-emerald-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.2s' }}></div>
                <div className="absolute inset-0 flex items-center justify-center text-indigo-700">
                  <ShieldCheck className="w-8 h-8" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-zinc-100 mb-1">Processing Campus Payment</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xs mx-auto">
                  Do not refresh or close this window while NPCI verifies the transaction.
                </p>
              </div>

              {/* Progress Steps */}
              <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 text-left max-w-sm mx-auto space-y-2.5 text-xs">
                <div className={`flex items-center space-x-2.5 ${processStep >= 1 ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-400 dark:text-zinc-500'}`}>
                  <RefreshCw className={`w-4 h-4 shrink-0 ${processStep === 1 ? 'animate-spin text-indigo-600 dark:text-indigo-400' : ''}`} />
                  <span>1. Connecting to NPCI Campus Switch...</span>
                </div>
                <div className={`flex items-center space-x-2.5 ${processStep >= 2 ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-400 dark:text-zinc-500'}`}>
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>2. Verifying Virtual Payment Address & Balance...</span>
                </div>
                <div className={`flex items-center space-x-2.5 ${processStep >= 3 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400 dark:text-zinc-500'}`}>
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>3. Locking Security Deposit in Smart Escrow...</span>
                </div>
              </div>
            </div>
          ) : paymentComplete && txnReceipt ? (
            /* Payment Success Digital Receipt */
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center mx-auto mb-2 text-emerald-600 dark:text-emerald-400 shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-zinc-100">Payment & Escrow Authorized!</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Amount ₹{txnReceipt.amount.toFixed(2)} settled via {txnReceipt.gateway_app}
                </p>
              </div>

              {/* Digital Transaction Receipt Card */}
              <div className="bg-gradient-to-b from-slate-50 to-indigo-50/40 dark:from-zinc-900 dark:to-zinc-850 border border-indigo-100 dark:border-zinc-800 rounded-2xl p-4 text-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-zinc-750">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider flex items-center space-x-1">
                    <Receipt className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Official Campus Receipt</span>
                  </span>
                  <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 px-2 py-0.5 rounded-full">
                    TRANSACTION SUCCESS
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-zinc-400">
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">Transaction Reference</span>
                    <div className="flex items-center space-x-1 font-mono font-bold text-slate-800 dark:text-zinc-200 text-[11px]">
                      <span>{txnReceipt.transaction_ref}</span>
                      <button 
                        type="button"
                        onClick={() => copyToClipboard(txnReceipt.transaction_ref, 'ref')}
                        className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer p-0.5"
                      >
                        {copiedField === 'ref' ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">Bank UTR Number</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-zinc-200 text-[11px]">{txnReceipt.utr_number}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-zinc-400">
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">Payment Method</span>
                    <span className="font-semibold text-slate-800 dark:text-zinc-200">{txnReceipt.gateway_app}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">Escrow Lock ID</span>
                    <span className="font-mono font-bold text-indigo-700 dark:text-indigo-400">{txnReceipt.escrow_lock_id}</span>
                  </div>
                </div>

                {rentalDetails?.securityDeposit > 0 && (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 flex items-start space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-[11px]">
                      <strong>100% Security Deposit (₹{rentalDetails.securityDeposit.toFixed(2)}) Secured in Escrow</strong>
                      <p className="text-[10px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                        This deposit is locked and will automatically refund back to the renter when the item is returned undamaged.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm rounded-xl transition cursor-pointer shadow-md flex items-center justify-center space-x-2"
              >
                <span>{mode === 'CHECKOUT' ? 'View Dynamic QR Handover Pass' : 'Done & Return to Ledger'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Gateway Selection & Checkout Form */
            <div className="space-y-4">
              
              {/* Order Summary Pill */}
              <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-3.5">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-500 dark:text-zinc-400 font-medium">Order Purpose</span>
                  <span className="font-bold text-slate-900 dark:text-zinc-100">
                    {mode === 'CHECKOUT' ? (item?.title || 'Equipment Rental') : 'Escrow Wallet Recharge'}
                  </span>
                </div>

                {mode === 'CHECKOUT' && rentalDetails && (
                  <div className="space-y-1 text-xs border-t border-slate-200 dark:border-zinc-800 pt-2 my-2 text-slate-600 dark:text-zinc-400">
                    <div className="flex justify-between">
                      <span>Rental Fee ({rentalDetails.rentalDays} {rentalDetails.rentalDays === 1 ? 'day' : 'days'}):</span>
                      <span className="font-semibold text-slate-800 dark:text-zinc-200">₹{rentalDetails.rentalFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-medium">
                      <span className="flex items-center space-x-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Refundable Security Deposit:</span>
                      </span>
                      <span className="font-bold text-emerald-800 dark:text-emerald-300">₹{rentalDetails.securityDeposit.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {mode === 'TOPUP' && (
                  <div className="my-2">
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                      Select Top-Up Amount
                    </label>
                    <div className="grid grid-cols-4 gap-1.5 mb-2">
                      {[200, 500, 1000, 2000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setCustomAmount(amt)}
                          className={`py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
                            Number(customAmount) === amt
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700'
                          }`}
                        >
                          ₹{amt}
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-bold text-slate-400 dark:text-zinc-500">₹</span>
                      <input
                        type="number"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        placeholder="Enter amount"
                        min="50"
                        className="w-full pl-7 pr-3 py-1.5 bg-white dark:bg-zinc-850 border border-slate-300 dark:border-zinc-700 rounded-xl text-xs font-bold text-slate-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                )}

                <div className="border-t border-slate-200 dark:border-zinc-800 pt-2 flex items-baseline justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">Total Payable Now:</span>
                  <span className="text-xl font-black text-indigo-700 dark:text-indigo-400">₹{payableAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Methods Tabs */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('UPI_APP')}
                    className={`p-2.5 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                      selectedMethod === 'UPI_APP'
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-600 dark:border-indigo-500 text-indigo-900 dark:text-indigo-300 font-bold shadow-xs'
                        : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-750 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-[11px] font-bold leading-tight">UPI Apps</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('UPI_QR')}
                    className={`p-2.5 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                      selectedMethod === 'UPI_QR'
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-600 dark:border-indigo-500 text-indigo-900 dark:text-indigo-300 font-bold shadow-xs'
                        : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-750 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <QrCode className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-[11px] font-bold leading-tight">Scan QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('CAMPUS_NETBANKING')}
                    className={`p-2.5 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                      selectedMethod === 'CAMPUS_NETBANKING'
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-600 dark:border-indigo-500 text-indigo-900 dark:text-indigo-300 font-bold shadow-xs'
                        : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-750 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-[11px] font-bold leading-tight">Campus Bank</span>
                  </button>
                </div>
              </div>

              {/* METHOD 1: UPI APPS */}
              {selectedMethod === 'UPI_APP' && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {upiApps.map((app) => (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => {
                          setSelectedApp(app.id);
                          setVpaId(`student.cse@${app.handle}`);
                        }}
                        className={`p-2 rounded-xl border flex flex-col items-center justify-center space-y-1 transition cursor-pointer ${
                          selectedApp === app.id
                            ? 'bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-600 dark:border-indigo-500 text-indigo-900 dark:text-indigo-300 font-black shadow-xs ring-1 ring-indigo-500'
                            : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-750 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${app.color} text-white flex items-center justify-center font-bold text-[10px] shadow-xs`}>
                          {app.icon}
                        </div>
                        <span className="text-[10px] font-bold truncate max-w-full">{app.name}</span>
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      Student UPI Virtual ID (VPA)
                    </label>
                    <input
                      type="text"
                      value={vpaId}
                      onChange={(e) => setVpaId(e.target.value)}
                      placeholder="e.g. rollnumber@oksbi"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-850 border border-slate-300 dark:border-zinc-700 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:bg-white dark:focus:bg-zinc-850 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5 block">
                      Sandbox simulated handle • No actual bank deduction occurs
                    </span>
                  </div>
                </div>
              )}

              {/* METHOD 2: DYNAMIC UPI QR */}
              {selectedMethod === 'UPI_QR' && (
                <div className="text-center p-3 bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-3 animate-in fade-in duration-150">
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-full text-[10px] font-bold text-slate-600 dark:text-zinc-300 shadow-2xs">
                    <Clock className="w-3 h-3 text-amber-500" />
                    <span>QR Active for: <strong className="text-slate-900 dark:text-zinc-100 font-mono">{formatQrTime(qrSecondsLeft)}</strong></span>
                  </div>

                  <div className="w-40 h-40 bg-white p-2.5 rounded-2xl shadow-md border border-slate-200 dark:border-zinc-700 mx-auto flex items-center justify-center">
                    <QRCodeSVG
                      value={dynamicQrString}
                      size={144}
                      level="H"
                      includeMargin={false}
                    />
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-zinc-400 max-w-xs mx-auto">
                    Scan with <strong>Google Pay</strong>, <strong>PhonePe</strong>, <strong>Paytm</strong>, or any UPI app to simulate instant campus payment.
                  </p>
                </div>
              )}

              {/* METHOD 3: CAMPUS NETBANKING */}
              {selectedMethod === 'CAMPUS_NETBANKING' && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      Select University Partner Bank
                    </label>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-850 border border-slate-300 dark:border-zinc-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    >
                      {banks.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-xl text-xs text-indigo-900 dark:text-indigo-300">
                    <span className="font-bold block mb-0.5">Campus Student Direct Debit</span>
                    <span>Direct ledger settlement tied to student campus roll number. No convenience charges apply.</span>
                  </div>
                </div>
              )}

              {/* Security Escrow Notice */}
              <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl text-[11px] text-emerald-900 dark:text-emerald-300 flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Escrow Guarantee:</strong> Security deposits are securely held in peer escrow and automatically refunded to the student's wallet immediately upon return verification.
                </span>
              </div>

              {/* Primary Action Button */}
              <button
                type="button"
                onClick={handleSimulatePayment}
                disabled={payableAmount <= 0}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white rounded-xl font-black text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>
                  Approve Sandbox Payment (₹{payableAmount.toFixed(2)})
                </span>
              </button>

              <p className="text-[10px] text-center text-slate-400">
                PeerGear Sandbox Environment • Designed for Academic Evaluation & Viva Demonstration
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampusPaymentModal;
