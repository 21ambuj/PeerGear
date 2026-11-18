import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import Navbar from './components/Navbar';
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNotifications={() => setShowNotificationsModal(true)}
        onOpenAuth={openAuth}
      />

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

      {/* Main Page Content */}
      <main className="flex-1 pb-20 lg:pb-0">
        {activeTab === 'explore' && (
          <ExplorePage 
            onNavigateToList={() => {
              if (!user) openAuth('login');
              else setActiveTab('list-item');
            }}
            onRequireAuth={() => openAuth('login')}
          />
        )}
        {activeTab === 'list-item' && (
          <ListItemPage onListed={() => setActiveTab('explore')} />
        )}
        {(activeTab === 'my-rentals' || activeTab === 'my-rentals-renter' || activeTab === 'my-rentals-owner') && (
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
        )}
        {activeTab === 'demand-board' && (
          user ? (
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
          )
        )}
        {activeTab === 'disputes' && <DisputesPage />}
        {activeTab === 'analytics' && <AnalyticsPage />}
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

      {/* Clean University Community Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-16 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-slate-900 tracking-tight">PeerGear</span>
            <span>• Peer-to-Peer Campus Resource Exchange & Escrow</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
            <span>Verified Student Community</span>
            <span>•</span>
            <button
              onClick={() => setActiveTab(user?.role === 'ADMIN' ? 'admin' : 'admin-login')}
              className="hover:text-indigo-600 font-bold text-slate-500 hover:underline transition cursor-pointer flex items-center space-x-1"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              <span>Campus Admin Portal</span>
            </button>
            <span>•</span>
            <span>Dynamic QR Handover</span>
            <span>•</span>
            <span>100% Refundable Escrow</span>
            <span>•</span>
            <span>© 2026 PeerGear</span>
          </div>
        </div>
      </footer>

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
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}
