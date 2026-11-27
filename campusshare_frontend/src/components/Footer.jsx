import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  QrCode, 
  Zap, 
  ArrowUp, 
  Compass, 
  Bell, 
  ShoppingBag, 
  AlertTriangle, 
  BarChart3, 
  PlusCircle, 
  CheckCircle2, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  HeartHandshake,
  Layers,
  GraduationCap
} from 'lucide-react';

const Footer = ({ setActiveTab, onOpenAuth, user }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryClick = (categoryName) => {
    setActiveTab('explore');
    window.dispatchEvent(new CustomEvent('campusshare-set-category', { detail: categoryName }));
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-[#08090d] text-zinc-300 border-t border-zinc-800/80 overflow-hidden font-sans">
      
      {/* Subtle Ambient Glow and Dark Grid Background */}
      <div className="absolute inset-0 bg-dark-grid opacity-30 pointer-events-none"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Interactive Metric & Trust Strip */}
      <div className="relative border-b border-zinc-800/70 bg-zinc-950/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center md:text-left">
            
            <div className="flex items-center space-x-3 justify-center md:justify-start">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white tracking-tight">100% Locked Escrow</p>
                <p className="text-[11px] text-zinc-400">Zero-theft deposit guarantee</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 justify-center md:justify-start">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white tracking-tight">Encrypted QR Pass</p>
                <p className="text-[11px] text-zinc-400">Time-stamped physical handover</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 justify-center md:justify-start">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white tracking-tight">Instant B-Money Payouts</p>
                <p className="text-[11px] text-zinc-400">Realtime UPI & IMPS withdrawal</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 justify-center md:justify-start">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white tracking-tight">University ID Verified</p>
                <p className="text-[11px] text-zinc-400">Exclusive to campus students</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Main Multi-Column Footer Grid */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* Column 1: Brand & Campus Infrastructure Statement (Span 4) */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Brand Logo & Micro Tag */}
            <div 
              onClick={() => {
                setActiveTab('explore');
                scrollToTop();
              }}
              className="flex items-center space-x-2.5 cursor-pointer group select-none inline-flex"
            >
              <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-white shadow-lg group-hover:border-emerald-500/50 transition-colors">
                <svg className="w-4.5 h-4.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 3h5v5" />
                  <path d="M4 20L21 3" />
                  <path d="M21 16v5h-5" />
                  <path d="M15 15l6 6" />
                  <path d="M4 4l5 5" />
                </svg>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-black tracking-[-0.03em] text-white">PeerGear</span>
                  <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    CAMPUS
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 font-medium">University Resource Exchange</span>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed pr-2">
              PeerGear is the campus resource-sharing network. Built with automated escrow, encrypted QR handover passes, and dual-party condition audits for university students.
            </p>

            {/* Quick Action Button */}
            <div className="pt-2 flex items-center space-x-3">
              <button
                onClick={() => {
                  if (!user) onOpenAuth('login');
                  else setActiveTab('list-item');
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md shadow-emerald-950 cursor-pointer btn-tactile"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>List Idle Gear</span>
              </button>
              
              <button
                onClick={() => {
                  setActiveTab('explore');
                  scrollToTop();
                }}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer btn-tactile"
              >
                <span>Browse Catalog</span>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
              </button>
            </div>

          </div>

          {/* Column 2: Equipment Ecosystem Categories (Span 3) */}
          <div className="lg:col-span-3 space-y-3">
            <p className="text-xs font-black uppercase tracking-wider text-white flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Campus Equipment</span>
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => handleCategoryClick('Scientific Calculators')}
                  className="text-zinc-400 hover:text-white transition flex items-center space-x-1.5 group cursor-pointer"
                >
                  <span className="text-zinc-600 group-hover:text-emerald-400 transition-colors">›</span>
                  <span>Casio Scientific fx-991CW</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryClick('Cameras & Creator Gear')}
                  className="text-zinc-400 hover:text-white transition flex items-center space-x-1.5 group cursor-pointer"
                >
                  <span className="text-zinc-600 group-hover:text-emerald-400 transition-colors">›</span>
                  <span>DSLRs & Creator 4K Cameras</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryClick('Bicycles & Mobility')}
                  className="text-zinc-400 hover:text-white transition flex items-center space-x-1.5 group cursor-pointer"
                >
                  <span className="text-zinc-600 group-hover:text-emerald-400 transition-colors">›</span>
                  <span>Campus Geared Commuter Cycles</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryClick('Engineering Drafters & Scales')}
                  className="text-zinc-400 hover:text-white transition flex items-center space-x-1.5 group cursor-pointer"
                >
                  <span className="text-zinc-600 group-hover:text-emerald-400 transition-colors">›</span>
                  <span>Mini Drafters & Lab Geometry</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryClick('Electronics & Microcontrollers')}
                  className="text-zinc-400 hover:text-white transition flex items-center space-x-1.5 group cursor-pointer"
                >
                  <span className="text-zinc-600 group-hover:text-emerald-400 transition-colors">›</span>
                  <span>Raspberry Pi & Arduino Kits</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryClick('Audio & Headphones')}
                  className="text-zinc-400 hover:text-white transition flex items-center space-x-1.5 group cursor-pointer"
                >
                  <span className="text-zinc-600 group-hover:text-emerald-400 transition-colors">›</span>
                  <span>Studio Monitors & ANC Headsets</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Trust & Protection Engine (Span 3) */}
          <div className="lg:col-span-3 space-y-3">
            <p className="text-xs font-black uppercase tracking-wider text-white flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Trust Architecture</span>
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <button 
                  onClick={() => {
                    setActiveTab('explore');
                    const trustSection = document.getElementById('trust-architecture-section');
                    if (trustSection) trustSection.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-zinc-400 hover:text-white transition flex items-center space-x-1.5 group cursor-pointer text-left"
                >
                  <span className="text-zinc-600 group-hover:text-indigo-400 transition-colors">›</span>
                  <span>100% Auto-Refunded Escrow</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => {
                    setActiveTab('explore');
                    const trustSection = document.getElementById('trust-architecture-section');
                    if (trustSection) trustSection.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-zinc-400 hover:text-white transition flex items-center space-x-1.5 group cursor-pointer text-left"
                >
                  <span className="text-zinc-600 group-hover:text-indigo-400 transition-colors">›</span>
                  <span>Encrypted QR & 4-Digit Handover</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => {
                    setActiveTab('explore');
                    const trustSection = document.getElementById('trust-architecture-section');
                    if (trustSection) trustSection.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-zinc-400 hover:text-white transition flex items-center space-x-1.5 group cursor-pointer text-left"
                >
                  <span className="text-zinc-600 group-hover:text-indigo-400 transition-colors">›</span>
                  <span>Dual Photographic Condition Ledger</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setActiveTab('disputes')}
                  className="text-zinc-400 hover:text-white transition flex items-center space-x-1.5 group cursor-pointer"
                >
                  <span className="text-zinc-600 group-hover:text-indigo-400 transition-colors">›</span>
                  <span>Dispute Resolution & Campus Arbitration</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setActiveTab('analytics')}
                  className="text-zinc-400 hover:text-white transition flex items-center space-x-1.5 group cursor-pointer"
                >
                  <span className="text-zinc-600 group-hover:text-indigo-400 transition-colors">›</span>
                  <span>Campus Carbon & Financial Savings</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: University Hub & Administration (Span 2) */}
          <div className="lg:col-span-2 space-y-3">
            <p className="text-xs font-black uppercase tracking-wider text-white flex items-center space-x-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
              <span>Campus Portals</span>
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => setActiveTab(user?.role === 'ADMIN' ? 'admin' : 'admin-login')}
                  className="text-indigo-400 hover:text-indigo-300 font-bold transition flex items-center space-x-1.5 group cursor-pointer"
                >
                  <ShieldCheck className="w-3 h-3 text-indigo-400" />
                  <span>Admin Console</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    if (!user) onOpenAuth('login');
                    else setActiveTab('demand-board');
                  }}
                  className="text-zinc-400 hover:text-white transition flex items-center space-x-1.5 group cursor-pointer"
                >
                  <span className="text-zinc-600 group-hover:text-amber-400 transition-colors">›</span>
                  <span>Gear Requests Board</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    if (!user) onOpenAuth('login');
                    else setActiveTab('my-rentals');
                  }}
                  className="text-zinc-400 hover:text-white transition flex items-center space-x-1.5 group cursor-pointer"
                >
                  <span className="text-zinc-600 group-hover:text-amber-400 transition-colors">›</span>
                  <span>My Active Rentals</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    if (!user) onOpenAuth('register');
                    else setActiveTab('history');
                  }}
                  className="text-zinc-400 hover:text-white transition flex items-center space-x-1.5 group cursor-pointer"
                >
                  <span className="text-zinc-600 group-hover:text-amber-400 transition-colors">›</span>
                  <span>Student Ledger</span>
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Horizontal Divider with Accent Glow */}
        <div className="mt-12 pt-6 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="font-extrabold text-zinc-300 tracking-tight">PeerGear</span>
            <span>•</span>
            <span>Zero-Theft University Exchange & Escrow Network</span>
            <span>•</span>
            <span className="text-zinc-400">© 2026 Academic Edition</span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Back to Top Tactile Pill */}
            <button
              onClick={scrollToTop}
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-bold transition flex items-center space-x-1 cursor-pointer btn-tactile"
              title="Scroll back to top"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Top</span>
            </button>
          </div>

        </div>

      </div>

    </footer>
  );
};

export default Footer;
