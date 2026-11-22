import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { rentalsApi } from '../api/client';
import { 
  X, 
  Calendar, 
  ShieldCheck, 
  ShieldAlert,
  Wallet, 
  AlertCircle, 
  CheckCircle2, 
  MapPin, 
  Lock,
  QrCode,
  Smartphone,
  Sparkles,
  PlusCircle,
  Upload,
  Clock
} from 'lucide-react';

const BookingModal = ({ item, onClose, onSuccess, onOpenAuth }) => {
  const { user, refreshUser, topupWallet } = useAuth();
  const { showToast } = useToast();
  
  // Default to today and tomorrow
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(tomorrowStr);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toppingUp, setToppingUp] = useState(false);
  const [error, setError] = useState('');
  const [bookingResult, setBookingResult] = useState(null);

  // Calculate duration and charges
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.max(0, end - start);
  const rentalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const ratePerDay = Number(item.rental_rate_per_day || 0);
  const securityDeposit = Number(item.security_deposit || 0);
  const rentalFee = ratePerDay * rentalDays;
  const totalPayable = rentalFee + securityDeposit;

  const walletBalance = Number(user?.wallet_balance || 0);
  const hasEnoughBalance = walletBalance >= totalPayable;
  const isOwner = user && String(item.owner_id || item.owner_info?.id) === String(user._id);

  const deficit = Math.max(0, totalPayable - walletBalance);
  const suggestedTopup = Math.max(200, Math.ceil((deficit + 50) / 100) * 100);

  const handleQuickTopup = async (amount = suggestedTopup) => {
    try {
      setToppingUp(true);
      await topupWallet(amount);
      await refreshUser();
      showToast(`₹${amount} added to your campus wallet! You can now reserve this item.`, 'success', 'Wallet Recharged');
      setError('');
    } catch (err) {
      showToast('Failed to top up wallet. Please try again.', 'error', 'Top-Up Failed');
    } finally {
      setToppingUp(false);
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setError('');

    if (user?.is_blocked) {
      const errMsg = `Account Suspended: ${user.blocked_reason || 'Access restricted by campus administration'}`;
      setError(errMsg);
      showToast(errMsg, 'error', 'Action Restricted');
      return;
    }

    if (user?.role !== 'ADMIN' && user?.id_card_status !== 'VERIFIED') {
      const isPending = user?.id_card_status === 'PENDING_VERIFICATION';
      const errMsg = isPending
        ? 'Your Student ID Card is currently pending administrative approval. You cannot book equipment yet.'
        : 'Student ID Verification Required: Please upload your College ID card to reserve gear.';
      setError(errMsg);
      showToast(errMsg, 'error', 'ID Verification Required');
      return;
    }

    if (isOwner) {
      const errMsg = 'You are the owner of this resource. You cannot rent your own item.';
      setError(errMsg);
      showToast(errMsg, 'error', 'Owner Safeguard');
      return;
    }

    if (end < start) {
      const errMsg = 'Return date must be on or after pickup date.';
      setError(errMsg);
      showToast(errMsg, 'error', 'Invalid Date');
      return;
    }

    if (!hasEnoughBalance) {
      // Auto top-up for the user or prompt them clearly
      const errMsg = `Insufficient wallet balance. You need ₹${totalPayable} but have ₹${walletBalance}. Auto-adding ₹${suggestedTopup}...`;
      setError(errMsg);
      showToast(`Adding ₹${suggestedTopup} to wallet to cover deposit...`, 'info', 'Auto Recharging');
      try {
        await handleQuickTopup(suggestedTopup);
      } catch (e) {
        return;
      }
    }

    try {
      setSubmitting(true);
      const res = await rentalsApi.book({
        item_id: item._id,
        start_date: startDate,
        end_date: endDate,
        notes: notes,
      });

      setBookingResult(res.data);
      await refreshUser();
      showToast(`Reserved '${item.title}'! Handover OTP: ${res.data.handover_otp}`, 'success', 'Booking Confirmed');
      if (onSuccess) onSuccess();
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to complete booking.';
      setError(errMsg);
      showToast(errMsg, 'error', 'Reservation Failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white transition cursor-pointer p-1 rounded-full hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Lock className="w-3.5 h-3.5" />
            <span>Escrow Protected Rental</span>
          </div>
          <h2 className="text-xl font-bold text-white line-clamp-1">{item.title}</h2>
          <div className="flex items-center space-x-1.5 text-slate-300 text-xs mt-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>Pickup at: {item.pickup_location}</span>
          </div>
        </div>

        {isOwner ? (
          /* Owner View Safeguard */
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-purple-600 shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1">Your Published Resource</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed max-w-sm mx-auto">
              You are the registered owner of this item. You cannot rent your own resource. You can monitor bookings and active handovers from the <span className="font-bold text-slate-800">My Listed Items</span> tab.
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Back to Campus Catalog
            </button>
          </div>
        ) : bookingResult ? (
          /* Booking Success State with PeerGear Dynamic QR Handover Pass */
          <div className="p-6 text-center">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-600 shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-1">Booking Confirmed!</h3>
            <p className="text-xs text-slate-500 mb-4">
              Security deposit of <strong className="text-slate-800 font-bold">₹{securityDeposit}</strong> held securely in 100% refundable escrow.
            </p>

            {/* Dynamic QR Handover Pass Box */}
            <div className="bg-gradient-to-b from-indigo-50/80 to-purple-50/80 border border-indigo-200/80 rounded-3xl p-4 mb-4 text-center">
              <div className="inline-flex items-center space-x-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full mb-3 shadow-xs">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>PeerGear Dynamic QR Pass</span>
              </div>

              {/* QR Code Container */}
              <div className="w-44 h-44 bg-white p-3 rounded-2xl shadow-md border border-slate-200 mx-auto mb-3 flex items-center justify-center">
                <QRCodeSVG
                  value={JSON.stringify({
                    app: "PeerGear",
                    type: "HANDOVER_VERIFY",
                    rental_id: String(bookingResult._id || item._id),
                    otp: String(bookingResult.handover_otp),
                    item_title: item.title,
                  })}
                  size={152}
                  level="H"
                  includeMargin={false}
                />
              </div>

              {/* Handover OTP */}
              <div className="bg-white/90 border border-indigo-100 rounded-xl py-2 px-3 inline-block shadow-2xs mb-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Handover Code
                </span>
                <span className="text-3xl font-black font-mono tracking-widest text-indigo-700">
                  {bookingResult.handover_otp}
                </span>
              </div>

              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Show this QR code to the owner during physical handover. They can scan it with their camera to instantly activate the rental.
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
            >
              Go to My Rentals
            </button>
          </div>
        ) : (
          /* Booking Form */
          <form onSubmit={handleBooking} className="p-6 overflow-y-auto no-scrollbar">
            {error && (
              <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Date Selection */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pickup Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    min={todayStr}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Return Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Notes to Owner */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pickup Notes / Timeslot</label>
              <input
                type="text"
                placeholder="e.g. Free after 4 PM practicals, will collect at hostel lobby"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Escrow Fee Breakdown Card */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-5 text-xs">
              <div className="flex justify-between py-1 text-slate-600">
                <span>Rental Duration:</span>
                <span className="font-semibold text-slate-900">{rentalDays} {rentalDays === 1 ? 'day' : 'days'}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-600">
                <span>Rental Charge (₹{ratePerDay}/day):</span>
                <span className="font-semibold text-slate-900">₹{rentalFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 text-emerald-700 font-medium">
                <span className="flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Refundable Security Deposit:</span>
                </span>
                <span className="font-bold text-emerald-800">₹{securityDeposit.toFixed(2)}</span>
              </div>

              <div className="border-t border-slate-200 my-2 pt-2 flex justify-between items-baseline font-bold">
                <span className="text-slate-900 text-sm">Total Payable Now:</span>
                <span className="text-indigo-600 text-lg">₹{totalPayable.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center pt-1 text-[11px] text-slate-500">
                <span>Your Wallet Balance:</span>
                <span className={hasEnoughBalance ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                  ₹{walletBalance.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Quick 1-Click Top-Up Assistance if low balance */}
            {!hasEnoughBalance && (
              <div className="mb-4 p-3.5 bg-amber-50/90 border border-amber-200/90 rounded-2xl">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Wallet Deposit Top-Up Needed</span>
                  </span>
                  <span className="text-[10px] font-black text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded-full">
                    Short by ₹{deficit.toFixed(0)}
                  </span>
                </div>
                <p className="text-[11px] text-amber-700 leading-relaxed mb-3">
                  This rental requires a 100% refundable security deposit of ₹{securityDeposit}. Add funds with 1 click:
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={toppingUp}
                    onClick={() => handleQuickTopup(suggestedTopup)}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{toppingUp ? 'Adding...' : `+ Add ₹${suggestedTopup} (Recommended)`}</span>
                  </button>
                  <button
                    type="button"
                    disabled={toppingUp}
                    onClick={() => handleQuickTopup(500)}
                    className="py-2 px-3 bg-white hover:bg-indigo-50 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition cursor-pointer shadow-2xs"
                  >
                    <span>+ ₹500</span>
                  </button>
                </div>
              </div>
            )}

            {/* Account Suspended Notice */}
            {user?.is_blocked && (
              <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-900 flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-red-800">Account Suspended</span>
                  <p className="text-[11px] text-red-700 leading-relaxed">
                    Your campus account is suspended by administration.
                    {user?.blocked_reason && <span className="italic block mt-0.5">"{user.blocked_reason}"</span>}
                    You cannot reserve or rent equipment.
                  </p>
                </div>
              </div>
            )}

            {/* Student ID Card Verification Warning */}
            {user?.role !== 'ADMIN' && user?.id_card_status !== 'VERIFIED' && (
              <div className="mb-4 p-3.5 bg-amber-50/90 border border-amber-200/90 rounded-2xl text-xs space-y-2">
                <div className="flex items-center space-x-1.5 font-bold text-amber-900">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>College ID Card Required to Rent</span>
                </div>
                <p className="text-[11px] text-amber-800/90 leading-relaxed">
                  {user?.id_card_status === 'PENDING_VERIFICATION' ? (
                    '⏳ Your submitted College ID card is under review by campus administration. Equipment renting will unlock as soon as moderation approves it.'
                  ) : user?.id_card_status === 'REJECTED' ? (
                    `❌ Your ID card was rejected (${user?.id_card_rejection_reason || 'Unreadable document'}). Please upload a valid ID proof.`
                  ) : (
                    '🔒 For campus trust and theft prevention, all students must complete College ID Card verification before borrowing equipment.'
                  )}
                </p>
                {user?.id_card_status !== 'PENDING_VERIFICATION' && onOpenAuth && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAuth('register', 'ID_CARD');
                    }}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center space-x-1.5 shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload College ID Card Now →</span>
                  </button>
                )}
              </div>
            )}

            {/* Submit Action */}
            <button
              type="submit"
              disabled={submitting || user?.is_blocked || (user?.role !== 'ADMIN' && user?.id_card_status !== 'VERIFIED')}
              className={`w-full py-3 rounded-xl font-black text-xs sm:text-sm transition flex items-center justify-center space-x-2 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                hasEnoughBalance
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/25'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {submitting
                  ? 'Confirming with Escrow...'
                  : user?.is_blocked
                  ? 'Account Suspended'
                  : (user?.role !== 'ADMIN' && user?.id_card_status !== 'VERIFIED')
                  ? 'ID Card Verification Required'
                  : hasEnoughBalance
                  ? `Pay & Reserve (₹${totalPayable.toFixed(0)})`
                  : `Top Up ₹${suggestedTopup} & Reserve Now`}
              </span>
            </button>
            <p className="text-[10px] text-center text-slate-400 mt-2">
              100% of the ₹{securityDeposit} deposit is instantly refunded upon returning the item in agreed condition.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default BookingModal;
