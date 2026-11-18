import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Compass, 
  Bell, 
  Plus, 
  ShoppingBag, 
  ShieldCheck, 
  User, 
  History 
} from 'lucide-react';

const MobileBottomNav = ({ activeTab, setActiveTab, onOpenAuth }) => {
  const { user } = useAuth();

  const isRentalsActive = activeTab === 'my-rentals' || activeTab === 'my-rentals-renter' || activeTab === 'my-rentals-owner' || activeTab === 'history';

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200/80 shadow-2xl px-2 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] transition-transform duration-200"
    >
      <div className="max-w-md mx-auto flex items-center justify-around">
        
        {/* Tab 1: Explore */}
        <button
          onClick={() => setActiveTab('explore')}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'explore'
              ? 'text-indigo-600 font-black'
              : 'text-slate-500 hover:text-slate-800 font-semibold'
          }`}
        >
          <div className="relative">
            <Compass className={`w-5 h-5 ${activeTab === 'explore' ? 'stroke-[2.6]' : 'stroke-[1.8]'}`} />
            {activeTab === 'explore' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Explore</span>
        </button>

        {/* Tab 2: Requests Board */}
        <button
          onClick={() => {
            if (!user) onOpenAuth('login');
            else setActiveTab('demand-board');
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'demand-board'
              ? 'text-indigo-600 font-black'
              : 'text-slate-500 hover:text-slate-800 font-semibold'
          }`}
        >
          <div className="relative">
            <Bell className={`w-5 h-5 ${activeTab === 'demand-board' ? 'stroke-[2.6]' : 'stroke-[1.8]'}`} />
            {activeTab === 'demand-board' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Requests</span>
        </button>

        {/* Center Tab: List New Equipment (+ Floating Action Pill) */}
        <div className="flex-1 flex flex-col items-center justify-center -mt-4">
          <button
            onClick={() => {
              if (!user) onOpenAuth('login');
              else setActiveTab('list-item');
            }}
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer ${
              activeTab === 'list-item'
                ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-emerald-600/40 scale-105'
                : 'bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 text-white shadow-emerald-500/30 hover:scale-105'
            }`}
            title="List equipment for campus peer exchange"
          >
            <Plus className="w-6 h-6 stroke-[2.8]" />
          </button>
          <span className="text-[10px] font-bold text-slate-700 mt-0.5">List</span>
        </div>

        {/* Tab 4: My Rentals / History */}
        <button
          onClick={() => {
            if (!user) onOpenAuth('login');
            else setActiveTab('my-rentals');
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
            isRentalsActive
              ? 'text-indigo-600 font-black'
              : 'text-slate-500 hover:text-slate-800 font-semibold'
          }`}
        >
          <div className="relative">
            <ShoppingBag className={`w-5 h-5 ${isRentalsActive ? 'stroke-[2.6]' : 'stroke-[1.8]'}`} />
            {isRentalsActive && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Rentals</span>
        </button>

        {/* Tab 5: Admin or Student Profile */}
        {user?.role === 'ADMIN' ? (
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'admin'
                ? 'text-emerald-700 font-black'
                : 'text-slate-500 hover:text-slate-800 font-semibold'
            }`}
          >
            <div className="relative">
              <ShieldCheck className={`w-5 h-5 text-emerald-600 ${activeTab === 'admin' ? 'stroke-[2.6]' : 'stroke-[1.8]'}`} />
              {activeTab === 'admin' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-bold text-emerald-700">Admin</span>
          </button>
        ) : user ? (
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'text-indigo-600 font-black'
                : 'text-slate-500 hover:text-slate-800 font-semibold'
            }`}
          >
            <div className="relative">
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              {activeTab === 'history' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Profile</span>
          </button>
        ) : (
          <button
            onClick={() => onOpenAuth('login')}
            className="flex-1 flex flex-col items-center justify-center py-1 rounded-xl text-slate-500 hover:text-indigo-600 transition-all cursor-pointer"
          >
            <User className="w-5 h-5 stroke-[1.8]" />
            <span className="text-[10px] mt-0.5 tracking-tight font-semibold">Sign In</span>
          </button>
        )}

      </div>
    </nav>
  );
};

export default MobileBottomNav;
