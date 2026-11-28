import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ExplorePage from './pages/ExplorePage';
import ListItemPage from './pages/ListItemPage';
import MyRentalsPage from './pages/MyRentalsPage';
import DemandBoardPage from './pages/DemandBoardPage';
import DisputesPage from './pages/DisputesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import HistoryPage from './pages/HistoryPage';
import NotificationsModal from './components/NotificationsModal';
import AuthModal from './components/AuthModal';
import MobileBottomNav from './components/MobileBottomNav';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import SnakeCursor from './components/SnakeCursor';
import { Bell, ShieldCheck } from 'lucide-react';

const AppContent = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('explore');
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  
  // Auth Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [authModalStep, setAuthModalStep] = useState('FORM');

  const openAuth = (mode = 'login', step = 'FORM') => {
    setAuthModalMode(mode);
    setAuthModalStep(step);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07080b] flex flex-col font-sans text-slate-800 dark:text-zinc-100 transition-colors duration-200">
      
      {/* Organic Trailing Snake Cursor with Click Ripple */}
      <SnakeCursor />

      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNotifications={() => setShowNotificationsModal(true)}
        onOpenAuth={openAuth}
      />

      {/* Account Suspended Persistent Banner */}
      {user && user.is_blocked && (
        <div className="bg-red-600 text-white px-4 py-3 text-xs shadow-md animate-in slide-in-from-top-2 duration-200">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse shrink-0"></span>
              <span className="font-extrabold uppercase tracking-wide">Account Suspended:</span>
              <span>
                Your campus account has been suspended by administration.
                {user.blocked_reason && (
                  <strong className="ml-1 text-red-100 font-semibold italic">"{user.blocked_reason}"</strong>
                )}
                {' '}Listing, renting, and booking permissions are disabled. Please contact campus administration to resolve.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Student ID Rejection Action Banner */}
      {user && user.id_card_status === 'REJECTED' && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5 text-xs text-rose-900 shadow-2xs animate-in slide-in-from-top-2 duration-200">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0"></span>
              <span className="font-bold text-rose-800">Action Required:</span>
              <span>
                Your submitted Student ID Card was not approved by campus moderation.
                {user.id_card_rejection_reason && (
                  <strong className="ml-1 text-rose-950 font-semibold italic">"{user.id_card_rejection_reason}"</strong>
                )}
              </span>
            </div>
            <button
              onClick={() => openAuth('register', 'ID_CARD')}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs shrink-0 cursor-pointer flex items-center space-x-1"
            >
              <span>Re-upload Clear ID Proof</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Page Content - Persistent Tab Mounting for 0ms Instant Navigation */}
      <main className="flex-1 pb-20 lg:pb-0">
        <div className={activeTab === 'explore' ? 'block' : 'hidden'}>
          <ExplorePage 
            onNavigateToList={() => {
              if (!user) openAuth('login');
              else setActiveTab('list-item');
            }}
            onRequireAuth={() => openAuth('login')}
            onOpenAuth={openAuth}
          />
        </div>

        <div className={activeTab === 'list-item' ? 'block' : 'hidden'}>
          {activeTab === 'list-item' && (
            <ListItemPage 
              onListed={() => setActiveTab('explore')} 
              onOpenAuth={openAuth}
            />
          )}
        </div>

        <div className={(activeTab === 'my-rentals' || activeTab === 'my-rentals-renter' || activeTab === 'my-rentals-owner') ? 'block' : 'hidden'}>
          <MyRentalsPage
            initialSubTab={
              activeTab === 'my-rentals-renter' ? 'renter' :
              activeTab === 'my-rentals-owner' ? 'owner' : 'all'
            }
            onNavigateToExplore={() => setActiveTab('explore')}
            onNavigateToList={() => {
              if (!user) openAuth('login');
              else setActiveTab('list-item');
            }}
          />
        </div>

        <div className={activeTab === 'demand-board' ? 'block' : 'hidden'}>
          {user ? (
            <DemandBoardPage onFulfillRequest={() => setActiveTab('list-item')} />
          ) : (
            <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl border border-slate-200 shadow-xl text-center">
              <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600 shadow-inner">
                <Bell className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Student Verification Required</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                The Campus Requests Board is reserved for verified students to post item requests and receive automatic availability alerts.
              </p>
              <button
                onClick={() => openAuth('login')}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                Sign In or Register
              </button>
            </div>
          )}
        </div>

        <div className={activeTab === 'disputes' ? 'block' : 'hidden'}>
          {activeTab === 'disputes' && <DisputesPage />}
        </div>

        <div className={activeTab === 'analytics' ? 'block' : 'hidden'}>
          {activeTab === 'analytics' && <AnalyticsPage />}
        </div>
        {(activeTab === 'admin' || activeTab === 'admin-login') && (
          user?.role === 'ADMIN' ? (
            <AdminDashboardPage />
          ) : (
            <AdminLoginPage 
              onLoginSuccess={() => setActiveTab('admin')}
              onBackToStudent={() => setActiveTab('explore')}
            />
          )
        )}
        {activeTab === 'history' && (
          user ? (
            <HistoryPage
              onNavigateToRentals={() => setActiveTab('my-rentals')}
              onNavigateToExplore={() => setActiveTab('explore')}
            />
          ) : (
            <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl border border-slate-200 shadow-xl text-center">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Sign In Required</h3>
              <p className="text-xs text-slate-500 mb-6">
                Please log in to view your personalized exchange, lending, and wallet history.
              </p>
              <button
                onClick={() => openAuth('login')}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                Sign In to View History
              </button>
            </div>
          )
        )}
      </main>

      {/* Ultra-Modern Campus Tech Footer */}
      <Footer
        setActiveTab={setActiveTab}
        onOpenAuth={openAuth}
        user={user}
      />

      {/* Modals */}
      {showNotificationsModal && (
        <NotificationsModal onClose={() => setShowNotificationsModal(false)} />
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        initialStep={authModalStep}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* iOS & Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={openAuth}
      />

    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
