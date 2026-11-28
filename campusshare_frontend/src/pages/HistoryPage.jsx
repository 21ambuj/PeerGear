import React, { useState, useEffect } from 'react';
import { rentalsApi, authApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConditionTrackerModal from '../components/ConditionTrackerModal';
import QrHandoverModal from '../components/QrHandoverModal';
import PickupVerifyModal from '../components/PickupVerifyModal';
import ReturnVerifyModal from '../components/ReturnVerifyModal';
import CampusPaymentModal from '../components/CampusPaymentModal';
import ManageMoneyModal from '../components/ManageMoneyModal';
import { 
  History, 
  Wallet, 
  ShoppingBag, 
  Tag, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowDownRight,
  Sparkles, 
  Camera, 
  Search, 
  Filter, 
  Calendar,
  AlertCircle,
  QrCode,
  DollarSign,
  TrendingUp,
  Receipt,
  User,
  PlusCircle,
  Smartphone,
  Building2
} from 'lucide-react';

const HistoryPage = ({ onNavigateToRentals, onNavigateToExplore }) => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  // Active section tab: 'all', 'rented' (I borrowed), 'lent' (peers borrowed from me), 'wallet' (topups & refunds)
  const [activeSection, setActiveSection] = useState('rented');
  const [walletFilter, setWalletFilter] = useState('ALL'); // 'ALL', 'TOPUP', 'ESCROW_REFUND', 'RENTAL_DEBIT', 'RENTAL_EARNING'
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [rentals, setRentals] = useState([]);
  const [walletData, setWalletData] = useState({ transactions: [], summary: {} });

  // Modal interactions
  const [selectedRentalForTracking, setSelectedRentalForTracking] = useState(null);
  const [selectedRentalForQr, setSelectedRentalForQr] = useState(null);
  const [pickupModalRental, setPickupModalRental] = useState(null);
  const [returnModalRental, setReturnModalRental] = useState(null);
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [showManageMoneyModal, setShowManageMoneyModal] = useState(false);
  const [manageMoneyInitialView, setManageMoneyInitialView] = useState('CHOICE');

  const handleUpiTopupSuccess = async (txnReceipt) => {
    try {
      await authApi.topupWallet(txnReceipt.amount, {
        payment_method: txnReceipt.payment_method,
        transaction_ref: txnReceipt.transaction_ref,
        gateway_app: txnReceipt.gateway_app,
        utr_number: txnReceipt.utr_number,
        escrow_lock_id: txnReceipt.escrow_lock_id
      });
      await refreshUser();
      await fetchHistoryData();
      showToast(`₹${txnReceipt.amount} added to your campus wallet via ${txnReceipt.gateway_app}`, 'success', 'Wallet Recharged');
    } catch (err) {
      showToast('Failed to record wallet recharge.', 'error', 'Error');
    }
  };

  useEffect(() => {
    fetchHistoryData();
  }, []);

  const fetchHistoryData = async () => {
    try {
      setLoading(true);
      const [rentalsRes, walletRes] = await Promise.all([
        rentalsApi.myRentals({ role: 'all' }),
        authApi.getWalletHistory()
      ]);
      setRentals(rentalsRes.data.rentals || []);
      setWalletData({
        transactions: walletRes.data.transactions || [],
        summary: walletRes.data.summary || {}
      });
    } catch (err) {
      console.error("Failed to load history data:", err);
      showToast("Failed to load exchange history.", "error", "Network Error");
    } finally {
      setLoading(false);
    }
  };

  // Section 1: Items I Rented (Borrower history)
  const myRentedItems = rentals.filter(r => user && String(r.renter_id) === String(user._id));

  // Section 2: Items Peers Rented from Me (Lending & Earnings history)
  const peersRentedMyItems = rentals.filter(r => user && String(r.owner_id) === String(user._id));

  // Section 3: Wallet Transactions & Refund history
  const allWalletTx = walletData.transactions || [];
  const filteredWalletTx = allWalletTx.filter(tx => {
    if (walletFilter === 'ALL') return true;
    return tx.type === walletFilter;
  });

  // Search filtering
  const query = searchQuery.toLowerCase().trim();
  const searchFilter = (item, textFields) => {
    if (!query) return true;
    return textFields.some(txt => (txt || '').toLowerCase().includes(query));
  };

  const displayedRented = myRentedItems.filter(r => 
    searchFilter(r, [r.item?.title, r.item?.category, r.owner?.name, r.status, r.deposit_status])
  );

  const displayedLent = peersRentedMyItems.filter(r => 
    searchFilter(r, [r.item?.title, r.item?.category, r.renter?.name, r.status, r.deposit_status])
  );

  const displayedWallet = filteredWalletTx.filter(tx => 
    searchFilter(tx, [tx.description, tx.item_title, tx.type, tx.status])
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case 'BOOKED':
        return <span className="bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold px-2.5 py-0.5 rounded-full">Reserved (Pending Handover)</span>;
      case 'ACTIVE':
        return <span className="bg-blue-100 text-blue-900 border border-blue-200 text-xs font-bold px-2.5 py-0.5 rounded-full animate-pulse">Active Rental</span>;
      case 'COMPLETED':
        return <span className="bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1"><CheckCircle2 className="w-3 h-3 text-emerald-600" /><span>Completed & Inspected</span></span>;
      case 'DISPUTED':
        return <span className="bg-rose-100 text-rose-900 border border-rose-200 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1"><AlertCircle className="w-3 h-3 text-rose-600" /><span>In Dispute</span></span>;
      default:
        return <span className="bg-slate-100 text-slate-800 text-xs font-bold px-2.5 py-0.5 rounded-full">{status}</span>;
    }
  };

  const getDepositBadge = (depStatus, amount) => {
    switch (depStatus) {
      case 'HELD':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold px-2 py-0.5 rounded-md">₹{amount} Locked in Escrow</span>;
      case 'REFUNDED':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold px-2 py-0.5 rounded-md flex items-center space-x-1"><ShieldCheck className="w-3 h-3 text-emerald-600" /><span>₹{amount} 100% Refunded</span></span>;
      case 'LOCKED_IN_DISPUTE':
        return <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-semibold px-2 py-0.5 rounded-md">₹{amount} Held in Dispute</span>;
      default:
        return <span className="text-[11px] font-semibold text-slate-500">{depStatus}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
      
      {/* Page Header */}
      <div className="mb-6">
        <div className="inline-flex items-center space-x-1.5 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 px-2.5 py-0.5 rounded-full mb-1.5">
          <History className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>PeerGear Exchange & Escrow Ledger</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 dark:text-zinc-100 tracking-tight">Exchange & Financial History</h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed font-medium">
          Comprehensive records of resources you have borrowed, items peers rented from your inventory, and your live escrow wallet deposits and refunds.
        </p>
      </div>

      {/* Summary Financial Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        {/* Card 1: Total Spent on Rentals */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200/90 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:shadow-zinc-950/5 transition-all duration-300 card-interactive">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Total Spent on Rentals</span>
            <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-100 font-mono tracking-tight">
            ₹{Number(walletData.summary?.total_spent_rentals || 0).toFixed(0)}
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">
            Across {myRentedItems.length} borrowed resource{myRentedItems.length === 1 ? '' : 's'}
          </p>
        </div>

        {/* Card 2: Security Deposits 100% Refunded */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200/90 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:shadow-zinc-950/5 transition-all duration-300 card-interactive">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Deposits 100% Refunded</span>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
            ₹{Number(walletData.summary?.total_refunded || 0).toFixed(0)}
          </p>
          <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/90 font-bold mt-1">
            Returned safely to wallet
          </p>
        </div>

        {/* Card 3: Earnings from Lending */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200/90 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:shadow-zinc-950/5 transition-all duration-300 card-interactive">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Lending Earnings</span>
            <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-100 font-mono tracking-tight">
            ₹{Number(walletData.summary?.total_earned_lending || 0).toFixed(0)}
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">
            From {peersRentedMyItems.length} peer rental{peersRentedMyItems.length === 1 ? '' : 's'}
          </p>
        </div>

        {/* Card 4: Current Wallet Balance */}
        <div className="bg-[#090a0f] text-white rounded-3xl p-5 border border-zinc-800 shadow-xl shadow-black/25 card-interactive">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-400">Current Wallet Balance</span>
            <div className="p-2.5 bg-zinc-900 text-emerald-400 rounded-xl border border-zinc-800">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-400 font-mono tracking-tight">
            ₹{Number(user?.wallet_balance || 0).toFixed(0)}
          </p>
          <p className="text-[11px] text-zinc-400 mt-1 flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Ready for instant booking</span>
          </p>
        </div>

      </div>

      {/* Control Navigation Bar (Search + Section Selector) */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/90 dark:border-zinc-800 p-4 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Three Primary Sections Tabs */}
        <div className="flex flex-wrap bg-slate-100/90 dark:bg-zinc-800/80 p-1.5 rounded-2xl border border-slate-200/80 dark:border-zinc-700/80 gap-1.5">
          <button
            onClick={() => setActiveSection('rented')}
            className={`px-4 py-2 rounded-xl text-xs font-bold btn-tactile flex items-center space-x-1.5 cursor-pointer ${
              activeSection === 'rented'
                ? 'bg-white dark:bg-zinc-900 text-indigo-700 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>1. Items I Rented</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 font-extrabold">
              {myRentedItems.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSection('lent')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              activeSection === 'lent'
                ? 'bg-white dark:bg-zinc-900 text-purple-700 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>2. Peers Rented My Items</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 font-extrabold">
              {peersRentedMyItems.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSection('wallet')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              activeSection === 'wallet'
                ? 'bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>3. Wallet & Refund Ledger</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-extrabold">
              {allWalletTx.length}
            </span>
          </button>
        </div>

        {/* Live Search Field */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search items, peers, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-zinc-800/90 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-medium text-slate-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:bg-white dark:focus:bg-zinc-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

      </div>

      {/* SECTION 1: ITEMS I RENTED */}
      {activeSection === 'rented' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-zinc-100">Items You Rented (Borrower History)</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Track rental charges, refundable security deposits, and handover receipts</p>
            </div>
            <span className="text-xs text-slate-400 dark:text-zinc-400 font-bold bg-slate-100 dark:bg-zinc-800 px-3 py-1 rounded-xl">
              {displayedRented.length} record{displayedRented.length === 1 ? '' : 's'}
            </span>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map(n => <div key={n} className="h-36 bg-slate-100 dark:bg-zinc-800/60 rounded-3xl animate-pulse"></div>)}
            </div>
          ) : displayedRented.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-12 text-center shadow-xs">
              <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-zinc-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 dark:text-zinc-200 mb-1">No borrowed resources recorded</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto mb-5">
                Whenever you rent a calculator, cycle, camera, or lab coat on campus, its full payment and refund ledger will appear here.
              </p>
              {onNavigateToExplore && (
                <button
                  onClick={onNavigateToExplore}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-md cursor-pointer"
                >
                  Explore Campus Resources
                </button>
              )}
            </div>
          ) : (
            displayedRented.map(rental => (
              <div 
                key={rental._id}
                className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/90 dark:border-zinc-800 p-5 shadow-xs hover:shadow-md transition flex flex-col md:flex-row gap-5"
              >
                {/* Image */}
                <div className="w-full md:w-40 h-32 md:h-auto rounded-2xl overflow-hidden bg-slate-100 dark:bg-zinc-800 shrink-0">
                  <img
                    src={rental.item?.image || 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop&q=80'}
                    alt={rental.item?.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                          {rental.item?.category || 'Resource'}
                        </span>
                        <h3 className="font-extrabold text-slate-900 dark:text-zinc-100 text-base">{rental.item?.title}</h3>
                      </div>
                      <div>{getStatusBadge(rental.status)}</div>
                    </div>

                    {/* Breakdown Matrix */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2 text-xs text-slate-600 dark:text-zinc-400 bg-slate-50/80 dark:bg-zinc-800/60 p-3 rounded-2xl border border-slate-100 dark:border-zinc-750">
                      <div>
                        <span className="text-slate-400 dark:text-zinc-500 block text-[10px] uppercase font-bold">Rental Dates</span>
                        <span className="font-bold text-slate-800 dark:text-zinc-200">
                          {new Date(rental.start_date).toLocaleDateString([], { month: 'short', day: 'numeric' })} - {new Date(rental.end_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">({rental.rental_days} {rental.rental_days === 1 ? 'day' : 'days'})</span>
                      </div>

                      <div>
                        <span className="text-slate-400 dark:text-zinc-500 block text-[10px] uppercase font-bold">Rental Fee Paid</span>
                        <span className="font-black text-slate-900 dark:text-zinc-100">₹{rental.rental_fee}</span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">@ ₹{rental.rental_rate_per_day || (rental.rental_fee / (rental.rental_days || 1))}/day</span>
                      </div>

                      <div>
                        <span className="text-slate-400 dark:text-zinc-500 block text-[10px] uppercase font-bold">Security Deposit</span>
                        {getDepositBadge(rental.deposit_status, rental.security_deposit)}
                      </div>

                      <div>
                        <span className="text-slate-400 dark:text-zinc-500 block text-[10px] uppercase font-bold">Resource Owner</span>
                        <span className="font-bold text-slate-800 dark:text-zinc-200">{rental.owner?.name || 'Verified Peer'}</span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">{rental.owner?.hostel_block || 'Campus'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Dynamic Pass */}
                  <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 mt-3">
                    <div className="flex items-center space-x-2">
                      {rental.status === 'BOOKED' && (
                        <button
                          onClick={() => setSelectedRentalForQr(rental)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Show QR Handover Pass (OTP: {rental.handover_otp})</span>
                        </button>
                      )}

                      {rental.status === 'COMPLETED' && (
                        <span className="text-xs text-emerald-700 dark:text-emerald-400 font-extrabold flex items-center space-x-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Deposit of ₹{rental.security_deposit} 100% credited to your wallet</span>
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedRentalForTracking(rental)}
                      className="border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs px-3 py-1.5 rounded-xl transition flex items-center space-x-1 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
                      <span>Inspection Evidence Ledger</span>
                    </button>
                  </div>

                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* SECTION 2: PEERS RENTED MY ITEMS */}
      {activeSection === 'lent' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-zinc-100">Peers Who Rented Your Items (Lending & Earnings)</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">History of equipment you listed that peers booked, along with earnings and handover status</p>
            </div>
            <span className="text-xs text-slate-400 dark:text-zinc-400 font-bold bg-slate-100 dark:bg-zinc-800 px-3 py-1 rounded-xl">
              {displayedLent.length} contract{displayedLent.length === 1 ? '' : 's'}
            </span>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map(n => <div key={n} className="h-36 bg-slate-100 dark:bg-zinc-800/60 rounded-3xl animate-pulse"></div>)}
            </div>
          ) : displayedLent.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-12 text-center shadow-xs">
              <Tag className="w-12 h-12 text-slate-300 dark:text-zinc-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 dark:text-zinc-200 mb-1">No lending contracts yet</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto mb-5">
                When fellow students rent resources from your inventory, their rental payments, handover confirmations, and return inspections will be recorded here.
              </p>
            </div>
          ) : (
            displayedLent.map(rental => (
              <div 
                key={rental._id}
                className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/90 dark:border-zinc-800 p-5 shadow-xs hover:shadow-md transition flex flex-col md:flex-row gap-5"
              >
                {/* Image */}
                <div className="w-full md:w-40 h-32 md:h-auto rounded-2xl overflow-hidden bg-slate-100 dark:bg-zinc-800 shrink-0">
                  <img
                    src={rental.item?.image || 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop&q=80'}
                    alt={rental.item?.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                          {rental.item?.category || 'Lending'}
                        </span>
                        <h3 className="font-extrabold text-slate-900 dark:text-zinc-100 text-base">{rental.item?.title}</h3>
                      </div>
                      <div>{getStatusBadge(rental.status)}</div>
                    </div>

                    {/* Matrix */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2 text-xs text-slate-600 dark:text-zinc-400 bg-purple-50/40 dark:bg-purple-950/20 p-3 rounded-2xl border border-purple-100 dark:border-purple-900/40">
                      <div>
                        <span className="text-slate-400 dark:text-zinc-500 block text-[10px] uppercase font-bold">Renter Student</span>
                        <span className="font-bold text-slate-900 dark:text-zinc-100">{rental.renter?.name || 'Peer'}</span>
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400 block">{rental.renter?.hostel_block || 'Campus Hostel'}</span>
                      </div>

                      <div>
                        <span className="text-slate-400 dark:text-zinc-500 block text-[10px] uppercase font-bold">Your Earnings</span>
                        <span className="font-black text-emerald-700 dark:text-emerald-400 text-sm">₹{rental.rental_fee}</span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">for {rental.rental_days} day(s)</span>
                      </div>

                      <div>
                        <span className="text-slate-400 dark:text-zinc-500 block text-[10px] uppercase font-bold">Deposit Escrow</span>
                        {getDepositBadge(rental.deposit_status, rental.security_deposit)}
                      </div>

                      <div>
                        <span className="text-slate-400 dark:text-zinc-500 block text-[10px] uppercase font-bold">Rental Dates</span>
                        <span className="font-bold text-slate-800 dark:text-zinc-200">
                          {new Date(rental.start_date).toLocaleDateString([], { month: 'short', day: 'numeric' })} - {new Date(rental.end_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 mt-3">
                    <div className="flex items-center space-x-2">
                      {rental.status === 'BOOKED' && (
                        <button
                          onClick={() => setPickupModalRental(rental)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Scan QR / Verify Handover</span>
                        </button>
                      )}

                      {rental.status === 'ACTIVE' && (
                        <button
                          onClick={() => setReturnModalRental(rental)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Verify Return & Release Deposit</span>
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedRentalForTracking(rental)}
                      className="border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs px-3 py-1.5 rounded-xl transition flex items-center space-x-1 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
                      <span>Inspection Evidence Ledger</span>
                    </button>
                  </div>

                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* SECTION 3: WALLET TOP-UP & REFUND HISTORY */}
      {activeSection === 'wallet' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-zinc-100">Wallet Top-Ups & Escrow Refund Ledger</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Real-time audit trail of wallet recharges, security deposit refunds, and payouts</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setManageMoneyInitialView('ADD');
                  setShowManageMoneyModal(true);
                }}
                className="py-1.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer shrink-0"
              >
                <PlusCircle className="w-3.5 h-3.5 text-amber-300" />
                <span>+ Add Funds</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setManageMoneyInitialView('WITHDRAW');
                  setShowManageMoneyModal(true);
                }}
                className="py-1.5 px-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer shrink-0"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>↑ Withdraw Earnings</span>
              </button>

              {/* Filter Pills */}
              <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-2xl border border-slate-200/80 dark:border-zinc-700/80 text-xs">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'TOPUP', label: 'Top-Ups' },
                { id: 'WITHDRAWAL', label: 'Payouts' },
                { id: 'ESCROW_REFUND', label: 'Refunds' },
                { id: 'RENTAL_DEBIT', label: 'Debits' },
                { id: 'RENTAL_EARNING', label: 'Earnings' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setWalletFilter(f.id)}
                  className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer ${
                    walletFilter === f.id
                      ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-2xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(n => <div key={n} className="h-20 bg-slate-100 dark:bg-zinc-800/60 rounded-2xl animate-pulse"></div>)}
            </div>
          ) : displayedWallet.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-12 text-center shadow-xs">
              <Wallet className="w-12 h-12 text-slate-300 dark:text-zinc-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 dark:text-zinc-200 mb-1">No wallet transactions found</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
                All top-ups, refundable deposit holds, and completed escrow refunds will be logged here with instant verification.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/90 dark:border-zinc-800 overflow-hidden shadow-xs">
              <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                {displayedWallet.map((tx, idx) => {
                  const isPositive = Number(tx.amount) > 0;
                  const isTopup = tx.type === 'TOPUP';
                  const isRefund = tx.type === 'ESCROW_REFUND';
                  const isEarning = tx.type === 'RENTAL_EARNING';
                  const isDebit = tx.type === 'RENTAL_DEBIT';
                  const isWithdrawal = tx.type === 'WITHDRAWAL';

                  return (
                    <div 
                      key={tx._id || idx}
                      className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-zinc-800/50 transition"
                    >
                      <div className="flex items-center space-x-3.5">
                        <div className={`p-2.5 rounded-2xl shrink-0 ${
                          isTopup ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400' :
                          isRefund ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400' :
                          isEarning ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400' :
                          isWithdrawal ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400' :
                          'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                        }`}>
                          {isTopup && <ArrowDownLeft className="w-5 h-5" />}
                          {isRefund && <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
                          {isEarning && <TrendingUp className="w-5 h-5" />}
                          {isWithdrawal && <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
                          {isDebit && <ArrowUpRight className="w-5 h-5" />}
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                              isTopup ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60' :
                              isRefund ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60' :
                              isEarning ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60' :
                              isWithdrawal ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60' :
                              'bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700'
                            }`}>
                              {isTopup ? 'Wallet Top-Up' :
                               isRefund ? '100% Escrow Refund' :
                               isEarning ? 'Rental Earning' : 
                               isWithdrawal ? 'Bank IMPS Payout' : 'Rental Payment'}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                              {tx.created_at ? new Date(tx.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                            </span>
                          </div>

                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1">
                            {tx.description}
                          </h4>

                          {tx.item_title && (
                            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                              Resource: <strong className="text-slate-700 dark:text-zinc-300">{tx.item_title}</strong>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`text-base sm:text-lg font-black font-mono block ${
                          isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-zinc-100'
                        }`}>
                          {isPositive ? `+₹${Number(tx.amount).toFixed(2)}` : `-₹${Math.abs(Number(tx.amount)).toFixed(2)}`}
                        </span>
                        <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                          {tx.status || 'SUCCESS'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Interactive Modals */}
      {selectedRentalForTracking && (
        <ConditionTrackerModal
          rental={selectedRentalForTracking}
          onClose={() => setSelectedRentalForTracking(null)}
        />
      )}

      {selectedRentalForQr && (
        <QrHandoverModal
          rental={selectedRentalForQr}
          onClose={() => setSelectedRentalForQr(null)}
        />
      )}

      {pickupModalRental && (
        <PickupVerifyModal
          rental={pickupModalRental}
          onClose={() => setPickupModalRental(null)}
          onSuccess={() => {
            fetchHistoryData();
            refreshUser();
          }}
        />
      )}

      {returnModalRental && (
        <ReturnVerifyModal
          rental={returnModalRental}
          onClose={() => setReturnModalRental(null)}
          onSuccess={() => {
            fetchHistoryData();
            refreshUser();
          }}
        />
      )}

      {/* Campus B-Money Portal (Add Money & Withdraw Earnings) */}
      <ManageMoneyModal
        isOpen={showManageMoneyModal}
        onClose={() => setShowManageMoneyModal(false)}
        initialView={manageMoneyInitialView}
        onSuccess={() => {
          fetchHistoryData();
          refreshUser();
        }}
      />

      {/* Campus UPI Sandbox Top-Up Modal */}
      <CampusPaymentModal
        isOpen={showUpiModal}
        onClose={() => setShowUpiModal(false)}
        mode="TOPUP"
        amount={500}
        onPaymentSuccess={handleUpiTopupSuccess}
      />

    </div>
  );
};

export default HistoryPage;
