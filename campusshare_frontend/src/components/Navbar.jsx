import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { itemsApi } from '../api/client';
import LogoutConfirmModal from './LogoutConfirmModal';
import { 
  ShoppingBag, 
  PlusCircle, 
  ClipboardList, 
  Bell, 
  Wallet, 
  ShieldCheck, 
  ChevronDown, 
  BarChart3, 
  AlertTriangle, 
  LogOut,
  Sparkles,
  Compass,
  ArrowUpRight,
  UserCheck,
  Tag,
  Package,
  X,
  History
} from 'lucide-react';
import CampusPaymentModal from './CampusPaymentModal';

const Navbar = ({ activeTab, setActiveTab, onOpenNotifications, onOpenAuth }) => {
  const { user, logout, topupWallet, unreadNotifications } = useAuth();
  const { showToast } = useToast();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [topupAmount, setTopupAmount] = useState('500');
  const [userListings, setUserListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(false);

  const profileContainerRef = useRef(null);

  // Close profile menu and wallet on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (profileContainerRef.current && !profileContainerRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowProfileMenu(false);
        setShowWalletModal(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const fetchUserListings = async () => {
    if (!user) return;
    try {
      setLoadingListings(true);
      const res = await itemsApi.getMyItems();
      setUserListings(res.data.items || []);
    } catch (err) {
      console.error("Failed to fetch user listings for profile dropdown:", err);
    } finally {
      setLoadingListings(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserListings();
    } else {
      setUserListings([]);
    }
  }, [user, activeTab]);

  useEffect(() => {
    const handleItemCreated = () => {
      if (user) fetchUserListings();
    };
    window.addEventListener('campusshare-item-created', handleItemCreated);
    return () => window.removeEventListener('campusshare-item-created', handleItemCreated);
  }, [user]);

  const handleToggleProfileMenu = () => {
    const nextState = !showProfileMenu;
    setShowProfileMenu(nextState);
    if (nextState && user) {
      fetchUserListings();
    }
  };

  const handleUpiTopupSuccess = async (txnReceipt) => {
    try {
      await topupWallet(txnReceipt.amount, {
        payment_method: txnReceipt.payment_method,
        transaction_ref: txnReceipt.transaction_ref,
        gateway_app: txnReceipt.gateway_app,
        utr_number: txnReceipt.utr_number,
        escrow_lock_id: txnReceipt.escrow_lock_id
      });
      showToast(
        `₹${txnReceipt.amount.toFixed(2)} added to your campus wallet via ${txnReceipt.gateway_app} (Ref: ${txnReceipt.transaction_ref})`,
        'success',
        'Wallet Recharged'
      );
    } catch (err) {
      showToast('Failed to record wallet recharge.', 'error', 'Transaction Error');
    }
  };

  const handleConfirmLogout = () => {
    logout();
    showToast('You have been signed out safely. See you soon!', 'info', 'Signed Out');
  };

  const navItems = [
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'demand-board', label: 'Requests', icon: Bell, requiresAuth: true },
    ...(user ? [{ id: 'my-rentals', label: 'Rentals', icon: ShoppingBag }] : []),
    { id: 'disputes', label: 'Disputes', icon: AlertTriangle },
    { id: 'analytics', label: 'Impact', icon: BarChart3 },
    ...(user?.role === 'ADMIN' ? [{ id: 'admin', label: 'Admin', icon: ShieldCheck, isAdmin: true }] : []),
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/70 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2 sm:gap-6 lg:gap-8">
            
            {/* Logo & Modern Interactive Brand */}
            <div 
              onClick={() => setActiveTab('explore')}
              className="flex items-center space-x-2 sm:space-x-3 cursor-pointer group select-none shrink-0 mr-2 sm:mr-6 lg:mr-8 xl:mr-10"
            >
              <div className="relative">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 group-hover:rotate-3 transition-all duration-300">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 3h5v5" />
                    <path d="M4 20L21 3" />
                    <path d="M21 16v5h-5" />
                    <path d="M15 15l6 6" />
                    <path d="M4 4l5 5" />
                  </svg>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-500 rounded-full border-2 border-white shadow-xs"></div>
              </div>

              <div>
                <span className="text-lg sm:text-xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-700 bg-clip-text text-transparent block leading-none">
                  PeerGear
                </span>
              </div>
            </div>

            {/* Modern Animated Navigation Tabs */}
            <nav className="hidden lg:flex items-center space-x-1 bg-slate-100/70 p-1.5 rounded-2xl border border-slate-200/60 backdrop-blur-md shrink-0">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id || (item.id === 'my-rentals' && (activeTab === 'my-rentals-renter' || activeTab === 'my-rentals-owner'));

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.requiresAuth && !user) {
                        onOpenAuth('login');
                      } else {
                        setActiveTab(item.id);
                      }
                    }}
                    className={`relative px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center space-x-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-white text-indigo-700 shadow-sm shadow-indigo-500/10 -translate-y-0.2'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 hover:-translate-y-0.2'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 transition-colors duration-200 ${
                      isActive ? 'text-indigo-600 stroke-[2.5]' : 'text-slate-400'
                    }`} />
                    <span>{item.label}</span>

                    {/* Active glowing micro-indicator */}
                    {isActive && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-3.5 h-0.5 bg-indigo-600 rounded-full"></span>
                    )}
                  </button>
                );
              })}

              {/* Dedicated "List an Item" Action Button (GREEN) */}
              <button
                onClick={() => {
                  if (!user) onOpenAuth('login');
                  else setActiveTab('list-item');
                }}
                className={`ml-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all duration-200 flex items-center space-x-1.5 cursor-pointer shadow-sm ${
                  activeTab === 'list-item'
                    ? 'bg-emerald-600 text-white shadow-emerald-600/30 -translate-y-0.5'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 hover:shadow-md hover:shadow-emerald-500/25 hover:-translate-y-0.5 active:translate-y-0'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5 stroke-[2.8]" />
                <span>List Item</span>
              </button>
            </nav>

            {/* Right Action Bar (Fintech-Grade Wallet & User Avatar) */}
            <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0 ml-auto lg:ml-0">
              
              {user ? (
                <>
                  {/* Notification Bell with Badge */}
                  <button
                    onClick={onOpenNotifications}
                    className="relative p-1.5 sm:p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 rounded-xl transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
                    title="Campus Activity Alerts"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadNotifications > 0 && (
                      <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse shadow-xs">
                        {unreadNotifications}
                      </span>
                    )}
                  </button>

                  {/* Modern Animated Escrow Wallet Pill */}
                  <div 
                    onClick={() => setShowWalletModal(true)}
                    className="flex items-center space-x-1.5 sm:space-x-2 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-emerald-500/10 border border-emerald-500/30 text-emerald-950 px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-2xl text-xs font-bold cursor-pointer hover:border-emerald-500/60 hover:shadow-md hover:shadow-emerald-500/10 hover:-translate-y-0.5 transition-all duration-200 select-none group"
                    title="Click to manage deposit escrow balance"
                  >
                    {/* Glowing Live Escrow Status Pulse */}
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>

                    <Wallet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-mono font-black text-xs text-slate-900 tracking-tight">
                      ₹{Number(user.wallet_balance || 0).toFixed(0)}
                    </span>
                    
                    <span className="hidden sm:inline-block text-[10px] font-extrabold bg-emerald-600 text-white px-1.5 py-0.5 rounded-md shadow-xs group-hover:scale-105 group-hover:bg-emerald-700 transition-transform">
                      + Add
                    </span>
                  </div>

                  {/* Modern Animated User Avatar with Dropdown */}
                  <div className="relative" ref={profileContainerRef}>
                    <button
                      onClick={handleToggleProfileMenu}
                      className="flex items-center space-x-1.5 sm:space-x-2 bg-slate-100/80 hover:bg-slate-200/70 p-1 sm:pr-2.5 rounded-xl sm:rounded-2xl text-xs font-bold text-slate-800 transition-all duration-200 cursor-pointer border border-slate-200/80 hover:-translate-y-0.2 group"
                      title="Profile and Account Settings"
                    >
                      {/* Gradient Avatar */}
                      <div className="relative">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 text-white font-black text-xs flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                      </div>

                      <div className="text-left hidden md:block leading-tight">
                        <p className="font-extrabold text-slate-900 text-xs truncate max-w-24">
                          {user.name.split(' ')[0]}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium truncate max-w-24">
                          {user.hostel_block ? user.hostel_block.split(',')[0] : 'Campus'}
                        </p>
                      </div>

                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                        showProfileMenu ? 'rotate-180 text-indigo-600' : 'group-hover:text-slate-600'
                      }`} />
                    </button>

                    {/* Click-away backdrop to close dropdown cleanly */}
                    {showProfileMenu && (
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowProfileMenu(false)}
                      />
                    )}

                    {/* Animated Glass Dropdown Menu */}
                    {showProfileMenu && (
                      <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] sm:w-80 max-w-sm bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/80 py-2.5 z-50 animate-in zoom-in-95 fade-in duration-150 max-h-[82vh] overflow-y-auto no-scrollbar">
                        
                        {/* Student Identity Card */}
                        <div className="px-4 py-3 border-b border-slate-100">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200"></span>
                              <p className="text-xs font-black text-slate-900 truncate">{user.name}</p>
                            </div>
                            {user.id_card_status === 'VERIFIED' ? (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                ⭐ Verified
                              </span>
                            ) : user.id_card_status === 'PENDING_VERIFICATION' ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                ⏳ Under Review
                              </span>
                            ) : user.id_card_status === 'REJECTED' ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                                ✗ ID Rejected
                              </span>
                            ) : user.is_email_verified ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Email Verified ✓
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                Unverified
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px]">
                            <span className="text-slate-400">Roll / ID:</span>
                            <span className="font-mono font-bold text-slate-700">{user.college_id}</span>
                          </div>

                          {/* Rejection reason & Upload ID Card prompt */}
                          {user.id_card_status === 'REJECTED' && (
                            <div className="mt-2.5 p-2 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5">
                              <p className="text-[10px] text-rose-800 font-semibold leading-tight">
                                ⚠️ {user.id_card_rejection_reason || 'Document could not be verified by admin.'}
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowProfileMenu(false);
                                  onOpenAuth && onOpenAuth('register', 'ID_CARD');
                                }}
                                className="w-full py-1.5 px-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold flex items-center justify-center space-x-1 transition cursor-pointer shadow-2xs"
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>Re-upload College ID</span>
                              </button>
                            </div>
                          )}

                          {user.id_card_status !== 'VERIFIED' && user.id_card_status !== 'PENDING_VERIFICATION' && user.id_card_status !== 'REJECTED' && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowProfileMenu(false);
                                onOpenAuth && onOpenAuth('register', 'ID_CARD');
                              }}
                              className="w-full mt-2.5 py-1.5 px-2 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-700 border border-indigo-200/80 rounded-xl text-[10px] font-bold flex items-center justify-center space-x-1 transition cursor-pointer"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Upload College ID (Get Verified)</span>
                            </button>
                          )}
                        </div>

                        {/* SECTION: My Listed Items (Shows your listings right in the dropdown) */}
                        <div className="px-3 py-2.5 bg-slate-50/80 border-b border-slate-100">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-1.5 text-purple-700">
                              <Tag className="w-3.5 h-3.5" />
                              <span className="text-[11px] font-black uppercase tracking-wider">My Listed Items</span>
                            </div>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                              {userListings.length} {userListings.length === 1 ? 'item' : 'items'}
                            </span>
                          </div>

                          {loadingListings ? (
                            <div className="py-3 text-center text-[11px] text-slate-400 animate-pulse">
                              Loading listings...
                            </div>
                          ) : userListings.length > 0 ? (
                            <div className="max-h-44 overflow-y-auto space-y-1.5 no-scrollbar pr-0.5">
                              {userListings.map((item) => (
                                <div
                                  key={item._id}
                                  onClick={() => {
                                    setActiveTab('my-rentals-owner');
                                    setShowProfileMenu(false);
                                  }}
                                  className="flex items-center space-x-2.5 p-2 rounded-xl bg-white hover:bg-purple-50/80 border border-slate-200/80 hover:border-purple-200 transition cursor-pointer group shadow-2xs"
                                >
                                  <img
                                    src={item.images?.[0] || 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop&q=80'}
                                    alt={item.title}
                                    className="w-9 h-9 rounded-lg object-cover bg-slate-100 shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <p className="text-xs font-bold text-slate-900 truncate group-hover:text-purple-700">{item.title}</p>
                                      <span className="text-[9px] text-purple-600 font-bold group-hover:underline">Manage →</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-0.5">
                                      <span className="font-bold text-slate-800">₹{item.rental_rate_per_day}/day</span>
                                      <span className={`px-1.5 py-0.2 rounded font-black text-[9px] ${
                                        item.availability_status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                      }`}>
                                        {item.availability_status}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-3 text-center bg-white rounded-2xl border border-slate-200/60 shadow-2xs">
                              <p className="text-[11px] text-slate-400 font-medium">You haven't listed any campus items yet.</p>
                              <button
                                onClick={() => {
                                  setActiveTab('list-item');
                                  setShowProfileMenu(false);
                                }}
                                className="mt-1 text-[11px] text-emerald-600 font-bold hover:underline block mx-auto cursor-pointer"
                              >
                                + List Your First Resource
                              </button>
                            </div>
                          )}
                        </div>

                        {/* SECTION: Remaining Navigation Options (Retained and styled) */}
                        <div className="p-1.5 space-y-0.5">
                          {user?.role === 'ADMIN' && (
                            <button
                              onClick={() => {
                                setActiveTab('admin');
                                setShowProfileMenu(false);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 rounded-xl flex items-center justify-between transition cursor-pointer mb-1 border border-indigo-200"
                            >
                              <div className="flex items-center space-x-2">
                                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                                <span>Campus Admin Console</span>
                              </div>
                              <ArrowUpRight className="w-3 h-3 text-indigo-400" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setActiveTab('list-item');
                              setShowProfileMenu(false);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl flex items-center justify-between transition cursor-pointer"
                          >
                            <div className="flex items-center space-x-2">
                              <PlusCircle className="w-4 h-4 text-emerald-600" />
                              <span className="font-bold text-emerald-700">+ List New Resource</span>
                            </div>
                            <ArrowUpRight className="w-3 h-3 text-slate-300" />
                          </button>

                          <button
                            onClick={() => {
                              setActiveTab('history');
                              setShowProfileMenu(false);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl flex items-center justify-between transition cursor-pointer"
                          >
                            <div className="flex items-center space-x-2">
                              <History className="w-4 h-4 text-indigo-500" />
                              <span>History</span>
                            </div>
                            <ArrowUpRight className="w-3 h-3 text-slate-300" />
                          </button>

                          <button
                            onClick={() => {
                              setActiveTab('my-rentals-renter');
                              setShowProfileMenu(false);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl flex items-center justify-between transition cursor-pointer"
                          >
                            <div className="flex items-center space-x-2">
                              <ShoppingBag className="w-4 h-4 text-indigo-500" />
                              <span>Items I'm Renting</span>
                            </div>
                            <ArrowUpRight className="w-3 h-3 text-slate-300" />
                          </button>

                          <button
                            onClick={() => {
                              setActiveTab('my-rentals-owner');
                              setShowProfileMenu(false);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-700 rounded-xl flex items-center justify-between transition cursor-pointer"
                          >
                            <div className="flex items-center space-x-2">
                              <Tag className="w-4 h-4 text-purple-500" />
                              <span>All Listings & Escrow Ledger</span>
                            </div>
                            <ArrowUpRight className="w-3 h-3 text-slate-300" />
                          </button>

                          <button
                            onClick={() => {
                              setActiveTab('demand-board');
                              setShowProfileMenu(false);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl flex items-center justify-between transition cursor-pointer"
                          >
                            <div className="flex items-center space-x-2">
                              <Bell className="w-4 h-4 text-slate-400" />
                              <span>Requests Board</span>
                            </div>
                            <ArrowUpRight className="w-3 h-3 text-slate-300" />
                          </button>
                        </div>

                        <div className="border-t border-slate-100 mx-2 my-1"></div>

                        <div className="p-1.5">
                          <button
                            onClick={() => {
                              setShowProfileMenu(false);
                              setShowLogoutConfirm(true);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center space-x-2 transition cursor-pointer"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Sleek Sign In / Register Buttons */
                <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
                  <button
                    onClick={() => setActiveTab('admin-login')}
                    className="p-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-xs font-bold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/60 rounded-xl transition-all duration-200 cursor-pointer flex items-center space-x-1 border border-slate-200"
                    title="Campus Administrator Portal"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="hidden sm:inline">Admin</span>
                  </button>
                  <button
                    onClick={() => onOpenAuth('login')}
                    className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs font-bold text-slate-700 hover:text-indigo-600 hover:bg-slate-100/70 rounded-xl transition-all duration-200 cursor-pointer whitespace-nowrap"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => onOpenAuth('register')}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-black bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl shadow-md shadow-indigo-500/25 hover:shadow-lg hover:-translate-y-0.2 transition-all duration-200 cursor-pointer whitespace-nowrap"
                  >
                    Get Started
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      </header>

      {/* Campus Escrow UPI Gateway Modal */}
      <CampusPaymentModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        mode="TOPUP"
        amount={Number(topupAmount) || 500}
        onPaymentSuccess={handleUpiTopupSuccess}
      />

      {/* Logout Confirmation Animated Modal */}
      <LogoutConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleConfirmLogout}
      />
    </>
  );
};

export default Navbar;
