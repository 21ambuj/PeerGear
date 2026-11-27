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
  History,
  RefreshCw,
  Menu,
  Search,
  Lock,
  CheckCircle2,
  Sun,
  Moon
} from 'lucide-react';
import CampusPaymentModal from './CampusPaymentModal';
import ManageMoneyModal from './ManageMoneyModal';
import { useTheme } from '../context/ThemeContext';

const Navbar = ({ activeTab, setActiveTab, onOpenNotifications, onOpenAuth }) => {
  const { user, logout, topupWallet, unreadNotifications } = useAuth();
  const { showToast } = useToast();
  const { theme, isDark, toggleTheme } = useTheme();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showManageMoneyModal, setShowManageMoneyModal] = useState(false);
  const [moneyModalInitialView, setMoneyModalInitialView] = useState('CHOICE');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [topupAmount, setTopupAmount] = useState('500');
  const [userListings, setUserListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const profileContainerRef = useRef(null);

  // Close profile menu, mobile drawer, and wallet on outside click or Escape key
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
        setMobileMenuOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setActiveTab('explore');
        setMobileMenuOpen(false);
        window.dispatchEvent(new CustomEvent('campusshare-focus-search'));
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
  }, [setActiveTab]);

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
      <header className="sticky top-0 z-40 bg-white/85 dark:bg-[#07080b]/85 backdrop-blur-2xl border-b border-zinc-200/60 dark:border-white/[0.07] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] dark:shadow-[0_12px_36px_-8px_rgba(0,0,0,0.7)] transition-all duration-300">
        {/* Sleek Ambient Top Laser Beam */}
        <div className="h-[1.5px] w-full bg-gradient-to-r from-transparent via-emerald-500/80 to-transparent"></div>

        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-[68px] gap-2 sm:gap-4 lg:gap-8">
            
            {/* Precision Brand Mark & Live University Status */}
            <div 
              onClick={() => setActiveTab('explore')}
              className="flex items-center space-x-3 cursor-pointer group select-none shrink-0"
            >
              <div className="relative">
                {/* Ambient glow halo on hover */}
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500/25 to-teal-500/25 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-black dark:from-zinc-800 dark:via-zinc-900 dark:to-zinc-950 text-white flex items-center justify-center shadow-md shadow-zinc-950/20 group-hover:scale-[1.04] transition-all duration-300 ring-1 ring-zinc-800 dark:ring-white/[0.12]">
                  <svg className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 3h5v5" />
                    <path d="M4 20L21 3" />
                    <path d="M21 16v5h-5" />
                    <path d="M15 15l6 6" />
                    <path d="M4 4l5 5" />
                  </svg>
                </div>
                {/* Live Campus Node Ping Dot */}
                <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-white dark:border-zinc-950"></span>
                </span>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center space-x-1.5">
                  <span className="text-lg sm:text-[19px] font-black tracking-[-0.03em] text-zinc-950 dark:text-white leading-none group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    PeerGear
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 dark:bg-emerald-400/10 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                    Campus
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium tracking-tight mt-0.5">Verified Peer Exchange</span>
              </div>
            </div>

            {/* Quick Command Search Pill (Desktop - Linear / Raycast Style) */}
            <button
              onClick={() => {
                setActiveTab('explore');
                window.dispatchEvent(new CustomEvent('campusshare-focus-search'));
              }}
              className="hidden xl:flex items-center space-x-2.5 px-3.5 py-1.5 rounded-full bg-zinc-100/80 dark:bg-zinc-900/80 hover:bg-zinc-200/60 dark:hover:bg-zinc-850 border border-zinc-200/80 dark:border-white/[0.08] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 text-xs transition-all duration-200 cursor-pointer group shadow-2xs hover:border-emerald-500/40"
              title="Quick Search Gear (⌘K or Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
              <span className="font-medium text-xs">Search gear...</span>
              <kbd className="text-[10px] font-mono bg-white dark:bg-zinc-850 px-1.5 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-400 font-bold shadow-2xs group-hover:border-emerald-500/40 transition-colors">
                ⌘K
              </kbd>
            </button>

            {/* Modern Floating Dock Navigation Tabs */}
            <nav className="hidden lg:flex items-center space-x-1 p-1 rounded-full bg-zinc-100/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-white/[0.08] backdrop-blur-xl shadow-inner shrink-0">
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
                    className={`relative px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 flex items-center space-x-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-white/60 dark:hover:bg-zinc-800/60'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 transition-colors duration-200 ${
                      isActive ? 'text-emerald-600 dark:text-emerald-400 stroke-[2.5]' : 'text-zinc-400 dark:text-zinc-500'
                    }`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              {/* Dedicated "+ List Gear" Primary Action Button (Fluid Glowing CTA) */}
              <button
                onClick={() => {
                  if (!user) onOpenAuth('login');
                  else setActiveTab('list-item');
                }}
                className={`ml-1 px-4 py-1.5 rounded-full text-xs font-black transition-all duration-200 flex items-center space-x-1.5 cursor-pointer shadow-md active:scale-95 group ${
                  activeTab === 'list-item'
                    ? 'bg-emerald-600 text-white shadow-emerald-600/30 ring-2 ring-emerald-500/40'
                    : 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5 stroke-[2.8] group-hover:rotate-90 transition-transform duration-300" />
                <span>+ List Gear</span>
              </button>
            </nav>

            {/* Right Action Bar (Fintech Wallet, Theme Switcher & User Avatar) */}
            <div className="flex items-center space-x-2 shrink-0 ml-auto lg:ml-0">
              
              {/* Animated Theme Switcher Button (Sun / Moon) */}
              <button
                onClick={toggleTheme}
                className="relative p-2 rounded-full bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200/80 dark:hover:bg-zinc-800 text-zinc-600 dark:text-amber-400 border border-zinc-200/80 dark:border-white/[0.08] transition-all duration-200 cursor-pointer shadow-2xs hover:scale-105 active:scale-95 group"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                aria-label="Toggle color theme"
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-90 transition-transform duration-500" />
                ) : (
                  <Moon className="w-4 h-4 text-zinc-700 group-hover:-rotate-12 transition-transform duration-300" />
                )}
              </button>

              {user ? (
                <>
                  {/* Notification Bell with Radiant Ping Badge */}
                  <button
                    onClick={onOpenNotifications}
                    className="relative p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all duration-200 cursor-pointer border border-zinc-200/80 dark:border-white/[0.08] group"
                    title="Campus Activity Alerts"
                  >
                    <Bell className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                    {unreadNotifications > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500 text-white text-[8px] font-black items-center justify-center shadow-xs">
                          {unreadNotifications}
                        </span>
                      </span>
                    )}
                  </button>

                  {/* High-End Fintech B-Money Pill (Revolut / Apple Pay grade) */}
                  <div 
                    onClick={() => {
                      setMoneyModalInitialView('CHOICE');
                      setShowManageMoneyModal(true);
                    }}
                    className="flex items-center space-x-2 bg-gradient-to-r from-zinc-950 via-zinc-900 to-black dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950 hover:from-zinc-900 hover:to-zinc-850 dark:hover:from-zinc-850 dark:hover:to-zinc-900 border border-zinc-800/90 dark:border-white/[0.12] text-white px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md hover:border-emerald-500/50 active:scale-95 group select-none"
                    title="Open B-Money Portal (Add Funds & Withdraw Earnings)"
                  >
                    {/* Concentric Animated Pulse Beacon */}
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>

                    <span className="text-[10px] font-black text-emerald-400 tracking-wider uppercase">B-Money</span>
                    <span className="w-px h-3 bg-zinc-800 dark:bg-zinc-700"></span>
                    <span className="font-mono font-black text-xs text-zinc-100 group-hover:text-emerald-300 transition-colors">
                      ₹{Number(user.wallet_balance || 0).toFixed(0)}
                    </span>
                    <span className="text-[10px] text-zinc-400 group-hover:text-white transition-colors">
                      +
                    </span>
                  </div>

                  {/* Modern User Avatar with Holographic ID Card Dropdown */}
                  <div className="relative" ref={profileContainerRef}>
                    <button
                      onClick={handleToggleProfileMenu}
                      className="flex items-center space-x-2 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200/80 dark:hover:bg-zinc-800 p-1 sm:pr-2.5 rounded-full text-xs font-bold text-zinc-800 dark:text-zinc-200 transition-all duration-200 cursor-pointer border border-zinc-200/80 dark:border-white/[0.08] group hover:scale-[1.02] active:scale-95"
                      title="Profile and Account Settings"
                    >
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full bg-zinc-900 dark:bg-zinc-800 text-white font-black text-xs flex items-center justify-center shadow-xs ring-1 ring-white/10">
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border-2 border-white dark:border-zinc-900 rounded-full"></span>
                      </div>

                      <div className="text-left hidden md:block leading-tight">
                        <p className="font-extrabold text-zinc-900 dark:text-zinc-100 text-xs truncate max-w-20">
                          {user.name.split(' ')[0]}
                        </p>
                      </div>

                      <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                        showProfileMenu ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : 'group-hover:text-zinc-600 dark:group-hover:text-zinc-200'
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
                      <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] sm:w-80 max-w-sm glass-panel dark:glass-panel-dark dark:bg-zinc-950/95 rounded-3xl shadow-2xl shadow-slate-900/15 dark:shadow-black/70 border border-slate-200/80 dark:border-zinc-800 py-2.5 z-50 animate-scale-in max-h-[82vh] overflow-y-auto no-scrollbar">
                        
                        {/* Student Digital Identity Card (Obsidian Fintech Card) */}
                        <div className="mx-2 mb-2 p-3.5 bg-gradient-to-br from-zinc-950 via-zinc-900 to-slate-950 text-white rounded-2xl border border-zinc-800 shadow-md relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none"></div>

                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-black text-xs text-emerald-400 shrink-0">
                                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-white truncate max-w-[130px]">{user.name}</p>
                                <p className="text-[10px] text-zinc-400 font-mono">{user.college_id || 'ID Pending'}</p>
                              </div>
                            </div>

                            {user.id_card_status === 'VERIFIED' ? (
                              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1 shrink-0">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                <span>Verified</span>
                              </span>
                            ) : user.id_card_status === 'PENDING_VERIFICATION' ? (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                                ⏳ Review
                              </span>
                            ) : user.id_card_status === 'REJECTED' ? (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                                ✗ Rejected
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 shrink-0">
                                Unverified
                              </span>
                            )}
                          </div>

                          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px]">
                            <span className="text-zinc-400 truncate max-w-[150px]">{user.email}</span>
                            <span className="text-emerald-400 font-mono font-bold">₹{Number(user.wallet_balance || 0).toFixed(0)} B-Money</span>
                          </div>
                        </div>

                        {/* Status actions / Upload ID Card prompt */}
                        {(user.id_card_status === 'REJECTED' || (user.id_card_status !== 'VERIFIED' && user.id_card_status !== 'PENDING_VERIFICATION')) && (
                          <div className="px-2 pb-2">
                            {user.id_card_status === 'REJECTED' && (
                              <div className="p-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl space-y-1.5">
                                <p className="text-[10px] text-rose-800 dark:text-rose-300 font-semibold leading-tight">
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
                                className="w-full mt-1.5 py-1.5 px-2 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 hover:from-indigo-100 hover:to-purple-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 rounded-xl text-[10px] font-bold flex items-center justify-center space-x-1 transition cursor-pointer"
                              >
                                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                <span>Upload College ID (Get Verified)</span>
                              </button>
                            )}
                          </div>
                        )}

                        {/* SECTION: My Listed Items (Shows your listings right in the dropdown) */}
                        <div className="px-3 py-2.5 bg-slate-50/80 dark:bg-zinc-900/60 border-b border-slate-100 dark:border-zinc-800">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-1.5 text-purple-700 dark:text-purple-400">
                              <Tag className="w-3.5 h-3.5" />
                              <span className="text-[11px] font-black uppercase tracking-wider">My Listed Items</span>
                            </div>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300">
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
                                  className="flex items-center space-x-2.5 p-2 rounded-xl bg-white dark:bg-zinc-900 hover:bg-purple-50/80 dark:hover:bg-zinc-800 border border-slate-200/80 dark:border-zinc-800 hover:border-purple-200 transition cursor-pointer group shadow-2xs"
                                >
                                  <img
                                    src={item.images?.[0] || 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop&q=80'}
                                    alt={item.title}
                                    className="w-9 h-9 rounded-lg object-cover bg-slate-100 dark:bg-zinc-800 shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <p className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate group-hover:text-purple-700 dark:group-hover:text-purple-400">{item.title}</p>
                                      <span className="text-[9px] text-purple-600 dark:text-purple-400 font-bold group-hover:underline">Manage →</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">
                                      <span className="font-bold text-slate-800 dark:text-zinc-200">₹{item.rental_rate_per_day}/day</span>
                                      <span className={`px-1.5 py-0.2 rounded font-black text-[9px] ${
                                        item.availability_status === 'AVAILABLE' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                                      }`}>
                                        {item.availability_status}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-3 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/60 dark:border-zinc-800 shadow-2xs">
                              <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">You haven't listed any campus items yet.</p>
                              <button
                                onClick={() => {
                                  setActiveTab('list-item');
                                  setShowProfileMenu(false);
                                }}
                                className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline block mx-auto cursor-pointer"
                              >
                                + List Your First Resource
                              </button>
                            </div>
                          )}
                        </div>

                        {/* SECTION: Remaining Navigation Options */}
                        <div className="p-1.5 space-y-0.5">
                          {user?.role === 'ADMIN' && (
                            <button
                              onClick={() => {
                                setActiveTab('admin');
                                setShowProfileMenu(false);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-xl flex items-center justify-between transition cursor-pointer mb-1 border border-indigo-200 dark:border-indigo-800/60"
                            >
                              <div className="flex items-center space-x-2">
                                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
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
                            className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-xl flex items-center justify-between transition cursor-pointer"
                          >
                            <div className="flex items-center space-x-2">
                              <PlusCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              <span className="font-bold text-emerald-700 dark:text-emerald-400">+ List New Resource</span>
                            </div>
                            <ArrowUpRight className="w-3 h-3 text-slate-300 dark:text-zinc-600" />
                          </button>

                          <button
                            onClick={() => {
                              setActiveTab('history');
                              setShowProfileMenu(false);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-700 dark:hover:text-indigo-400 rounded-xl flex items-center justify-between transition cursor-pointer"
                          >
                            <div className="flex items-center space-x-2">
                              <History className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                              <span>History</span>
                            </div>
                            <ArrowUpRight className="w-3 h-3 text-slate-300 dark:text-zinc-600" />
                          </button>

                          <button
                            onClick={() => {
                              setActiveTab('my-rentals-renter');
                              setShowProfileMenu(false);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-700 dark:hover:text-indigo-400 rounded-xl flex items-center justify-between transition cursor-pointer"
                          >
                            <div className="flex items-center space-x-2">
                              <ShoppingBag className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                              <span>Items I'm Renting</span>
                            </div>
                            <ArrowUpRight className="w-3 h-3 text-slate-300 dark:text-zinc-600" />
                          </button>

                          <button
                            onClick={() => {
                              setActiveTab('my-rentals-owner');
                              setShowProfileMenu(false);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-400 rounded-xl flex items-center justify-between transition cursor-pointer"
                          >
                            <div className="flex items-center space-x-2">
                              <Tag className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                              <span>All Listings & Escrow Ledger</span>
                            </div>
                            <ArrowUpRight className="w-3 h-3 text-slate-300 dark:text-zinc-600" />
                          </button>

                          <button
                            onClick={() => {
                              setActiveTab('demand-board');
                              setShowProfileMenu(false);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-700 dark:hover:text-indigo-400 rounded-xl flex items-center justify-between transition cursor-pointer"
                          >
                            <div className="flex items-center space-x-2">
                              <Bell className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
                              <span>Requests Board</span>
                            </div>
                            <ArrowUpRight className="w-3 h-3 text-slate-300 dark:text-zinc-600" />
                          </button>
                        </div>

                        <div className="border-t border-slate-100 dark:border-zinc-800 mx-2 my-1"></div>

                        <div className="p-1.5">
                          <button
                            onClick={() => {
                              setShowProfileMenu(false);
                              setShowLogoutConfirm(true);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl flex items-center space-x-2 transition cursor-pointer"
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
                /* Sleek Tech Sign In / Register Buttons */
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => setActiveTab('admin-login')}
                    className="p-1.5 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all duration-200 cursor-pointer flex items-center space-x-1 border border-zinc-200 dark:border-white/[0.08] hover:scale-105 active:scale-95"
                    title="Campus Administrator Portal"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400 shrink-0" />
                    <span className="hidden sm:inline">Admin</span>
                  </button>
                  <button
                    onClick={() => onOpenAuth('login')}
                    className="px-3.5 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all duration-200 cursor-pointer whitespace-nowrap hover:scale-105 active:scale-95"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => onOpenAuth('register')}
                    className="px-4 py-1.5 text-xs font-black bg-gradient-to-r from-zinc-950 via-zinc-900 to-black hover:from-zinc-900 hover:to-zinc-800 dark:from-emerald-600 dark:to-teal-600 dark:hover:from-emerald-500 dark:hover:to-teal-500 text-white rounded-full shadow-md hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-200 cursor-pointer whitespace-nowrap hover:scale-105 active:scale-95 ring-1 ring-white/10"
                  >
                    Join Campus
                  </button>
                </div>
              )}

              {/* Mobile Menu Toggle Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all duration-200 cursor-pointer border border-zinc-200/80 dark:border-white/[0.08] ml-1"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
                ) : (
                  <Menu className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
                )}
              </button>

            </div>
          </div>
        </div>

        {/* Animated Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-zinc-200/80 dark:border-white/[0.08] bg-white/95 dark:bg-[#07080b]/95 backdrop-blur-2xl px-4 py-4 space-y-3 animate-fade-in-down shadow-2xl max-h-[82vh] overflow-y-auto">
            
            {/* Quick Search Trigger */}
            <div 
              onClick={() => {
                setActiveTab('explore');
                setMobileMenuOpen(false);
                window.dispatchEvent(new CustomEvent('campusshare-focus-search'));
              }}
              className="flex items-center space-x-2.5 px-3.5 py-2.5 rounded-2xl bg-zinc-100/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs cursor-pointer hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition"
            >
              <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate">Search Casio, drafters, cycles, DSLR...</span>
            </div>

            {/* Mobile Theme Switcher Row */}
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800">
              <div className="flex items-center space-x-2">
                {isDark ? (
                  <Moon className="w-4 h-4 text-amber-400" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-500" />
                )}
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  {isDark ? 'Dark Mode Active' : 'Light Mode Active'}
                </span>
              </div>
              <button
                onClick={toggleTheme}
                className="px-3.5 py-1 rounded-full text-xs font-bold bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs border border-zinc-200 dark:border-zinc-700 cursor-pointer"
              >
                Switch to {isDark ? 'Light' : 'Dark'}
              </button>
            </div>

            {/* Navigation Links Grid */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id || (item.id === 'my-rentals' && (activeTab === 'my-rentals-renter' || activeTab === 'my-rentals-owner'));

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (item.requiresAuth && !user) {
                        onOpenAuth('login');
                      } else {
                        setActiveTab(item.id);
                      }
                    }}
                    className={`flex items-center space-x-2 p-2.5 rounded-2xl text-xs font-bold transition text-left cursor-pointer ${
                      isActive
                        ? 'bg-zinc-950 dark:bg-zinc-800 text-white shadow-xs'
                        : 'bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-zinc-500 dark:text-zinc-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* List Gear Mobile CTA */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (!user) onOpenAuth('login');
                else setActiveTab('list-item');
              }}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl text-xs font-black transition flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950/20 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ List New Gear for Rent</span>
            </button>

            {/* Admin Console Quick Link */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-[11px] text-zinc-400">Campus Student Network</span>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setActiveTab(user?.role === 'ADMIN' ? 'admin' : 'admin-login');
                }}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center space-x-1 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Console</span>
              </button>
            </div>

          </div>
        )}
      </header>

      {/* Unified Campus B-Money Portal (Add Money & Instant Bank Withdrawal) */}
      <ManageMoneyModal
        isOpen={showManageMoneyModal}
        onClose={() => setShowManageMoneyModal(false)}
        initialView={moneyModalInitialView}
      />

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
