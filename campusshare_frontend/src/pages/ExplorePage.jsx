import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { itemsApi, analyticsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { dataCache } from '../utils/dataCache';
import ItemCard from '../components/ItemCard';
import BookingModal from '../components/BookingModal';
import EditItemModal from '../components/EditItemModal';
import DeleteItemModal from '../components/DeleteItemModal';
import { 
  Search, 
  Sparkles, 
  SlidersHorizontal, 
  PlusCircle, 
  ShieldCheck, 
  PackageOpen,
  X,
  Edit2,
  Trash2,
  Tag,
  CheckCircle2,
  MapPin,
  Star,
  Lock,
  KeyRound,
  Camera,
  Wallet,
  ArrowRight,
  Zap,
  Smartphone,
  ArrowUpRight
} from 'lucide-react';

const CATEGORIES = [
  "All",
  "Electronics",
  "Books",
  "Lab & Academic",
  "Sports",
  "Cycles & Mobility",
  "Audio & Music",
  "Clothing & Costumes",
  "Project Kits"
];

const HERO_FEATURED_GEAR = [
  {
    id: 'hero-1',
    name: 'Casio fx-991CW ClassWiz',
    shortName: 'Casio 991CW',
    category: 'Electronics',
    rate: 30,
    deposit: 200,
    location: 'Ramanujan Hostel, Block B',
    status: 'Escrow Locked ✓',
    badgeStyle: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    tag: 'Math & Physics Practicals',
    image: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&auto=format&fit=crop&q=80',
    searchQuery: 'Casio'
  },
  {
    id: 'hero-2',
    name: 'Sony Alpha A6400 Mirrorless 4K',
    shortName: 'Sony A6400',
    category: 'Media & Optics',
    rate: 350,
    deposit: 2000,
    location: 'Aryabhatta Block C',
    status: 'QR Pass Verified ✓',
    badgeStyle: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    tag: '4K Campus Videography Kit',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80',
    searchQuery: 'Sony'
  },
  {
    id: 'hero-3',
    name: 'Hero Sprint 21-Speed Mountain Bike',
    shortName: 'Geared Cycle',
    category: 'Mobility & Cycles',
    rate: 45,
    deposit: 300,
    location: 'Main Campus Gate Hub',
    status: 'Ready for Pickup ✓',
    badgeStyle: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    tag: 'Daily Campus Commute',
    image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop&q=80',
    searchQuery: 'Cycle'
  }
];

const ExplorePage = ({ onNavigateToList, onRequireAuth, onOpenAuth }) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState(CATEGORIES);
  const [items, setItems] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [bookingItem, setBookingItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  // Hero Interactive Equipment Showcase State
  const [activeHeroIdx, setActiveHeroIdx] = useState(0);
  const [isHeroHovered, setIsHeroHovered] = useState(false);

  useEffect(() => {
    if (isHeroHovered) return;
    const interval = setInterval(() => {
      setActiveHeroIdx((prev) => (prev + 1) % HERO_FEATURED_GEAR.length);
    }, 4200);
    return () => clearInterval(interval);
  }, [isHeroHovered]);

  useEffect(() => {
    fetchItems();
    fetchRecommendations();
    fetchDynamicCategories();
  }, [selectedCategory, sortBy, user]);

  // Listen for real-time item creation/updates to refresh cache
  useEffect(() => {
    const handleItemCreated = () => {
      dataCache.invalidate('items_');
      fetchItems(true);
    };
    window.addEventListener('campusshare-item-created', handleItemCreated);
    return () => window.removeEventListener('campusshare-item-created', handleItemCreated);
  }, [selectedCategory, sortBy, searchQuery]);

  const fetchDynamicCategories = async () => {
    const cached = dataCache.get('categories_list');
    if (cached) {
      setCategories(cached);
      if (dataCache.isFresh('categories_list')) return;
    }
    try {
      const res = await itemsApi.getCategories();
      if (res.data?.categories) {
        const unique = ["All", ...res.data.categories.filter(c => c !== "All")];
        dataCache.set('categories_list', unique, 10 * 60 * 1000);
        setCategories(unique);
      }
    } catch (e) {
      // keep fallback
    }
  };

  const fetchItems = async (forceRefresh = false) => {
    const cacheKey = `items_${selectedCategory}_${sortBy}_${searchQuery.trim()}`;
    const cached = dataCache.get(cacheKey);

    if (cached && !forceRefresh) {
      setItems(cached);
      setLoading(false);
      // If cached data is fresh (< 2 mins), don't block UI with skeletons
      if (dataCache.isFresh(cacheKey)) return;
    } else if (!cached) {
      setLoading(true);
    }

    try {
      const params = {
        category: selectedCategory,
        sort: sortBy,
      };
      if (searchQuery.trim()) {
        params.q = searchQuery.trim();
      }
      const res = await itemsApi.list(params);
      const fetchedItems = res.data.items || [];
      dataCache.set(cacheKey, fetchedItems);
      setItems(fetchedItems);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    const recKey = `recs_${selectedCategory}_${user?._id || 'anon'}`;
    const cached = dataCache.get(recKey);
    if (cached) {
      setRecommendations(cached);
      if (dataCache.isFresh(recKey)) return;
    }
    try {
      const res = await analyticsApi.getRecommendations({
        category: selectedCategory === "All" ? "" : selectedCategory,
      });
      const allRecs = res.data.recommendations || [];
      // Do not recommend the student their own items
      const filteredRecs = user
        ? allRecs.filter(it => String(it.owner_info?.id || it.owner_id) !== String(user._id))
        : allRecs;
      dataCache.set(recKey, filteredRecs, 5 * 60 * 1000);
      setRecommendations(filteredRecs);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchItems();
  };

  return (
    <div className="pb-16">
      
      {/* ============================================================== */}
      {/* ASYMMETRIC COMMAND HERO (Linear / Stripe / Vercel Grade)      */}
      {/* ============================================================== */}
      <div className="bg-[#090a0f] text-white pt-8 pb-12 sm:pt-14 sm:pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden border-b border-zinc-800/80">
        
        {/* Subtle Architectural Dark Grid & Radial Ambient Lighting */}
        <div className="absolute inset-0 bg-dark-grid opacity-35 pointer-events-none"></div>
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/[0.04] rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-indigo-500/[0.03] rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10 w-full">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column: Headline, Command Search, Categories */}
            <div className="lg:col-span-7 flex flex-col items-start">
              
              {/* Protocol Badge */}
              <div className="inline-flex items-center space-x-2 bg-zinc-900/90 border border-zinc-800 px-3.5 py-1.5 rounded-full text-zinc-300 text-xs font-semibold mb-4 backdrop-blur-md shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-bold text-zinc-200">Campus Escrow Protocol</span>
                <span className="text-zinc-600">•</span>
                <span className="text-[11px] font-medium text-emerald-400">Zero Theft • Verified Students</span>
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-black tracking-[-0.035em] text-white mb-4 leading-[1.08]">
                Campus Gear, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200">On Demand.</span>
              </h1>

              {/* Subtitle */}
              <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed mb-6 max-w-xl font-normal">
                Scientific calculators, lab coats, geared cycles, cameras, and robotics hardware — securely rented from verified students in your university halls.
              </p>

              {/* Elevated Floating Command Search Box */}
              <form onSubmit={handleSearchSubmit} className="w-full max-w-xl flex items-center gap-2 p-1.5 bg-white rounded-2xl shadow-2xl shadow-black/40 border border-zinc-200 text-zinc-900 focus-within:ring-2 focus-within:ring-emerald-500/40">
                <div className="flex-1 flex items-center px-3 text-zinc-800 min-w-0">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400 shrink-0 mr-2.5" />
                  <input
                    type="text"
                    placeholder="Search Casio calculators, drafters, geared cycles, DSLR..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent text-zinc-900 placeholder-zinc-400 text-xs sm:text-sm focus:outline-hidden font-medium"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition cursor-pointer shadow-sm shrink-0 btn-tactile flex items-center space-x-1.5"
                >
                  <span>Search</span>
                </button>
              </form>

              {/* Quick Popular Queries */}
              <div className="flex flex-wrap items-center gap-1.5 mt-3 text-[11px] text-zinc-400">
                <span className="font-semibold text-zinc-500">Quick:</span>
                {[
                  { label: 'Casio fx-991CW', query: 'Casio' },
                  { label: 'Mini Drafter', query: 'Drafter' },
                  { label: 'Geared Cycle', query: 'Cycle' },
                  { label: 'Lab Coat', query: 'Lab Coat' },
                  { label: 'Arduino Kit', query: 'Arduino' }
                ].map(item => (
                  <button
                    type="button"
                    key={item.label}
                    onClick={() => {
                      setSearchQuery(item.query);
                      setSelectedCategory('All');
                    }}
                    className="px-2.5 py-0.5 rounded-md bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 text-[10px] font-medium border border-zinc-800 hover:border-zinc-700 transition cursor-pointer btn-tactile"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Category Pills */}
              <div className="flex overflow-x-auto items-center gap-1.5 mt-6 max-w-full pb-1 no-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-xs px-3.5 py-1.5 rounded-full font-bold transition-all shrink-0 cursor-pointer btn-tactile ${
                      selectedCategory === cat
                        ? "bg-emerald-500 text-zinc-950 shadow-sm shadow-emerald-500/20"
                        : "bg-zinc-900/90 text-zinc-400 border border-zinc-800 hover:text-white hover:border-zinc-700"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

            </div>

            {/* Right Column: Interactive Animated Equipment Showcase with Real Pictures */}
            <div className="lg:col-span-5 hidden lg:block">
              <div 
                onMouseEnter={() => setIsHeroHovered(true)}
                onMouseLeave={() => setIsHeroHovered(false)}
                className="glass-panel-dark rounded-3xl p-5 border border-zinc-800 relative shadow-2xl overflow-hidden group"
              >
                {/* Header with live pulse and 3 interactive gear switcher pills */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-3.5">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[11px] font-black text-zinc-200 uppercase tracking-wider">
                      Featured Campus Gear
                    </span>
                  </div>

                  {/* Interactive Switcher Tabs */}
                  <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
                    {HERO_FEATURED_GEAR.map((gear, idx) => (
                      <button
                        key={gear.id}
                        type="button"
                        onClick={() => setActiveHeroIdx(idx)}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                          activeHeroIdx === idx
                            ? 'bg-zinc-800 text-white shadow-xs'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {gear.shortName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main Hero Picture Container with Smooth Transition */}
                {(() => {
                  const currentGear = HERO_FEATURED_GEAR[activeHeroIdx];
                  return (
                    <div key={currentGear.id} className="animate-scale-in">
                      {/* Photo with Overlay Badges */}
                      <div className="relative aspect-16/10 rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 mb-3 group/img">
                        <img
                          src={currentGear.image}
                          alt={currentGear.name}
                          className="w-full h-full object-cover group-hover/img:scale-106 transition-transform duration-500 ease-out"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"></div>

                        {/* Top Overlay Badges */}
                        <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5">
                          <span className="bg-black/75 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-white/20">
                            {currentGear.category}
                          </span>
                        </div>

                        <div className="absolute top-2.5 right-2.5">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border backdrop-blur-md shadow-xs ${currentGear.badgeStyle}`}>
                            {currentGear.status}
                          </span>
                        </div>

                        {/* Bottom Picture Info */}
                        <div className="absolute bottom-2.5 left-3 right-3 text-left">
                          <h4 className="text-base font-extrabold text-white tracking-tight leading-tight drop-shadow-xs">
                            {currentGear.name}
                          </h4>
                          <p className="text-[11px] text-zinc-300 mt-0.5 flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>{currentGear.location}</span>
                          </p>
                        </div>
                      </div>

                      {/* Equipment Pricing, Deposit & Quick Action */}
                      <div className="p-3 bg-zinc-900/90 rounded-2xl border border-zinc-800 flex items-center justify-between">
                        <div>
                          <div className="flex items-baseline space-x-1">
                            <span className="text-xl font-black text-emerald-400 font-mono tracking-tight">₹{currentGear.rate}</span>
                            <span className="text-zinc-500 text-xs font-semibold">/ day</span>
                          </div>
                          <span className="text-[10px] text-zinc-400 font-medium">₹{currentGear.deposit} Escrow Deposit</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery(currentGear.searchQuery);
                            setSelectedCategory('All');
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 btn-tactile flex items-center space-x-1.5 cursor-pointer"
                        >
                          <span>Explore Gear</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* 3 Clickable Equipment Preview Thumbnails */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-zinc-800/80">
                  {HERO_FEATURED_GEAR.map((gear, idx) => {
                    const isSelected = activeHeroIdx === idx;
                    return (
                      <button
                        key={gear.id}
                        type="button"
                        onClick={() => setActiveHeroIdx(idx)}
                        className={`p-1.5 rounded-xl border text-left transition-all cursor-pointer flex items-center space-x-2 group/thumb btn-tactile ${
                          isSelected
                            ? 'bg-zinc-800/90 border-emerald-500/60 shadow-xs'
                            : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                        }`}
                      >
                        <img
                          src={gear.image}
                          alt={gear.shortName}
                          className="w-8 h-8 rounded-lg object-cover bg-zinc-800 shrink-0 border border-zinc-700/60"
                        />
                        <div className="min-w-0 flex-1">
                          <p className={`text-[10px] font-bold truncate ${isSelected ? 'text-emerald-400' : 'text-zinc-300'}`}>
                            {gear.shortName}
                          </p>
                          <p className="text-[9px] text-zinc-500 font-mono">₹{gear.rate}/d</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Bottom Trust Guarantee Footer */}
                <div className="mt-3 pt-2.5 border-t border-zinc-800/70 flex items-center justify-between text-[10px] text-zinc-400">
                  <div className="flex items-center space-x-1 text-emerald-400 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Dual-Party Condition Ledger</span>
                  </div>
                  <span className="text-zinc-500">100% P2P Handover</span>
                </div>

              </div>
            </div>

          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Catalog Explorer Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-zinc-200/80">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-950">
              {selectedCategory === "All" ? "Available Campus Inventory" : `${selectedCategory}`}
            </h2>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">
              Showing {items.length} verified item{items.length === 1 ? '' : 's'} available for peer rental
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <SlidersHorizontal className="w-4 h-4 text-zinc-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-zinc-200 text-xs font-bold text-zinc-700 rounded-full px-4 py-2 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 cursor-pointer shadow-xs btn-tactile"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating_desc">Highest Peer Rating</option>
            </select>
          </div>
        </div>

        {/* Item Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-80 bg-zinc-100 rounded-3xl animate-pulse"></div>
            ))}
          </div>
        ) : items.length === 0 ? (
          /* Empty State for Real User Uploads */
          <div className="text-center py-16 bg-white rounded-3xl border border-zinc-200 p-8 shadow-xs max-w-xl mx-auto my-8">
            <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-zinc-600">
              <PackageOpen className="w-7 h-7 stroke-[1.8]" />
            </div>
            <h3 className="text-lg font-black text-zinc-900 mb-1 tracking-tight">No campus items found</h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto mb-6 leading-relaxed">
              Be the first student to list a scientific calculator, textbook, lab coat, cycle, or project kit. Start sharing with your university halls!
            </p>
            <button
              onClick={onNavigateToList}
              className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-3 rounded-full shadow-md shadow-emerald-600/20 btn-tactile cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span>List Your First Item</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((item, index) => (
              <ItemCard
                key={item._id}
                item={item}
                animationDelayClass={`delay-${(index % 6) + 1}`}
                onSelect={setSelectedItem}
                onBook={setBookingItem}
              />
            ))}
          </div>
        )}

      </div>

      {/* ============================================================== */}
      {/* CAMPUS VERIFICATION ARCHITECTURE (Trust Engine Bento Grid)    */}
      {/* Positioned AFTER inventory and listing grid                    */}
      {/* ============================================================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 mb-16">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-zinc-200/80">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 block mb-1">
              Campus Verification Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950">
              Why Campus Students Trust PeerGear
            </h2>
          </div>
          <p className="text-xs text-zinc-500 max-w-md mt-2 sm:mt-0 font-medium leading-relaxed">
            Automated bank-grade escrow locks, in-person QR handovers, and zero platform theft across all university hostels.
          </p>
        </div>

        {/* 4 Bento Cards with Interactive Animated Pictures */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Card 1: 100% Refundable Escrow */}
          <div className="bento-card p-5 flex flex-col justify-between group">
            <div>
              {/* Animated Picture / Visual Mockup */}
              <div className="h-44 rounded-2xl bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 p-3.5 mb-4 relative overflow-hidden flex flex-col justify-between shadow-inner">
                <div className="absolute inset-0 bg-dark-grid opacity-30 pointer-events-none"></div>
                
                {/* Vault Top Bar */}
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">ICICI Escrow Vault</span>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700">LOCKED</span>
                </div>

                {/* Animated Pulsing Shield Centerpiece */}
                <div className="my-auto text-center relative z-10 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-1.5 shadow-lg shadow-emerald-500/10 animate-float">
                    <Lock className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <span className="font-mono text-xs font-black text-white tracking-tight">₹500.00 Security Deposit</span>
                  <span className="text-[9px] text-emerald-400/90 font-medium">Safe in campus custody</span>
                </div>

                {/* Simulated Auto-Refund Timeline */}
                <div className="relative z-10 bg-zinc-900/90 rounded-xl p-2 border border-zinc-800 text-[10px] flex items-center justify-between">
                  <span className="text-zinc-400">Return Verified</span>
                  <span className="font-bold text-emerald-400 flex items-center space-x-1">
                    <span>100% Auto-Refunded</span>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  </span>
                </div>
              </div>

              {/* Text & Content */}
              <h3 className="font-black text-zinc-950 text-base mb-1 tracking-tight">100% Refundable Escrow</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Deposit is securely locked in campus escrow and auto-refunded to your wallet the minute the gear is returned.
              </p>
            </div>

            <div className="mt-4 pt-3.5 border-t border-zinc-100 flex items-center justify-between text-xs font-bold text-emerald-700">
              <span>Automatic Settlement</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
          </div>

          {/* Card 2: Dynamic Handover Pass */}
          <div className="bento-card p-5 flex flex-col justify-between group">
            <div>
              {/* Animated Picture / Visual Mockup */}
              <div className="h-44 rounded-2xl bg-zinc-950 border border-zinc-800 p-3.5 mb-4 relative overflow-hidden flex items-center justify-between shadow-inner">
                <div className="absolute inset-0 bg-dark-grid opacity-25 pointer-events-none"></div>
                
                {/* QR Code with Animated Laser Scanner */}
                <div className="relative w-24 h-24 bg-white p-2 rounded-xl shrink-0 flex items-center justify-center shadow-md">
                  <QRCodeSVG value="peergear://verify-pass/8492" size={80} level="M" fgColor="#090a0f" bgColor="#ffffff" />
                  {/* Laser Scan Line Animation */}
                  <div className="absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_8px_#10b981] animate-laser-scan pointer-events-none"></div>
                </div>

                {/* Digital Pass Details */}
                <div className="flex-1 pl-3 text-left relative z-10 flex flex-col justify-between h-24">
                  <div>
                    <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider block">Encrypted Pass</span>
                    <span className="text-[11px] font-bold text-white block">Hostel Handover</span>
                  </div>

                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 text-center">
                    <span className="text-[9px] text-zinc-400 block font-semibold">Pickup OTP</span>
                    <span className="font-mono text-sm font-black text-emerald-400 tracking-widest block">8 4 9 2</span>
                  </div>

                  <span className="text-[9px] text-zinc-500 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Ready for Scan</span>
                  </span>
                </div>
              </div>

              {/* Text & Content */}
              <h3 className="font-black text-zinc-950 text-base mb-1 tracking-tight">Dynamic Handover Pass</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Encrypted QR pass and 4-digit OTP ensure equipment only changes hands between verified university students.
              </p>
            </div>

            <div className="mt-4 pt-3.5 border-t border-zinc-100 flex items-center justify-between text-xs font-bold text-indigo-700">
              <span>OTP Handover Protocol</span>
              <KeyRound className="w-4 h-4 text-indigo-600" />
            </div>
          </div>

          {/* Card 3: Condition Inspector */}
          <div className="bento-card p-5 flex flex-col justify-between group">
            <div>
              {/* Animated Picture / Visual Mockup */}
              <div className="h-44 rounded-2xl bg-zinc-950 border border-zinc-800 p-2.5 mb-4 relative overflow-hidden flex gap-2 shadow-inner">
                <div className="absolute inset-0 bg-dark-grid opacity-20 pointer-events-none"></div>
                
                {/* Photo 1: Pickup Snapshot with Scanner Overlay */}
                <div className="flex-1 rounded-xl overflow-hidden relative border border-zinc-800 bg-zinc-900 group-hover:scale-102 transition-transform">
                  <img
                    src="https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=300&auto=format&fit=crop&q=80"
                    alt="Pickup Condition Scan"
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute top-1.5 left-1.5 bg-black/80 backdrop-blur-xs text-[8px] font-black text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    Pickup 10:14 AM
                  </div>
                  {/* Viewfinder crosshair */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-8 h-8 border border-emerald-400/50 rounded flex items-center justify-center animate-pulse">
                      <div className="w-1 h-1 bg-emerald-400 rounded-full"></div>
                    </div>
                  </div>
                  <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-emerald-950/80 backdrop-blur-xs text-[8px] font-bold text-emerald-300 text-center py-0.5 rounded">
                    Mint Condition ✓
                  </div>
                </div>

                {/* Photo 2: Return Snapshot */}
                <div className="flex-1 rounded-xl overflow-hidden relative border border-zinc-800 bg-zinc-900 group-hover:scale-102 transition-transform">
                  <img
                    src="https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=300&auto=format&fit=crop&q=80"
                    alt="Return Condition Scan"
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute top-1.5 left-1.5 bg-black/80 backdrop-blur-xs text-[8px] font-black text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                    Return 04:30 PM
                  </div>
                  <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-emerald-950/80 backdrop-blur-xs text-[8px] font-bold text-emerald-300 text-center py-0.5 rounded">
                    100% Matched ✓
                  </div>
                </div>
              </div>

              {/* Text & Content */}
              <h3 className="font-black text-zinc-950 text-base mb-1 tracking-tight">Condition Inspector</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Time-stamped photos recorded before and after rental. Zero disputes, complete equipment transparency.
              </p>
            </div>

            <div className="mt-4 pt-3.5 border-t border-zinc-100 flex items-center justify-between text-xs font-bold text-amber-700">
              <span>Damage Proof Ledger</span>
              <Camera className="w-4 h-4 text-amber-600" />
            </div>
          </div>

          {/* Card 4: Instant B-Money Payouts */}
          <div className="bento-card p-5 flex flex-col justify-between group">
            <div>
              {/* Animated Picture / Visual Mockup */}
              <div className="h-44 rounded-2xl bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 p-3 mb-4 relative overflow-hidden flex flex-col justify-between shadow-inner">
                <div className="absolute inset-0 bg-dark-grid opacity-25 pointer-events-none"></div>

                {/* Push Notification Card */}
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-2.5 relative z-10 shadow-lg animate-float-card">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[9px] font-black">
                        ✓
                      </div>
                      <span className="text-[10px] font-bold text-zinc-200">Payout Credited</span>
                    </div>
                    <span className="text-[9px] text-zinc-500">Just now</span>
                  </div>
                  <p className="font-mono text-sm font-black text-emerald-400">+₹450.00 IMPS Payout</p>
                  <p className="text-[9px] text-zinc-400">Direct to UPI: student@oksbi</p>
                </div>

                {/* Gateway App Indicators */}
                <div className="relative z-10 flex items-center justify-between pt-1">
                  <div className="flex items-center space-x-1">
                    <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[8px] font-bold">GPay</span>
                    <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[8px] font-bold">PhonePe</span>
                    <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[8px] font-bold">Paytm</span>
                  </div>
                  <span className="text-[9px] text-emerald-400 font-bold flex items-center space-x-0.5">
                    <Zap className="w-2.5 h-2.5" />
                    <span>0.4s Instant</span>
                  </span>
                </div>
              </div>

              {/* Text & Content */}
              <h3 className="font-black text-zinc-950 text-base mb-1 tracking-tight">Instant B-Money Payouts</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Earn money from your idle lab gear and cycles. Withdraw directly to Google Pay, PhonePe, or Bank in seconds.
              </p>
            </div>

            <div className="mt-4 pt-3.5 border-t border-zinc-100 flex items-center justify-between text-xs font-bold text-purple-700">
              <span>Instant IMPS & UPI</span>
              <Wallet className="w-4 h-4 text-purple-600" />
            </div>
          </div>

        </div>
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in-up">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200/90 animate-scale-in">
            <div className="relative aspect-16/9 bg-slate-100">
              <img
                src={selectedItem.images?.[0] || 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop&q=80'}
                alt={selectedItem.title}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 bg-slate-900/70 hover:bg-slate-900 text-white p-1.5 rounded-full backdrop-blur-xs transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-4">
                <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                  {selectedItem.category}
                </span>
              </div>
            </div>

            <div className="p-6">
              <div className="flex justify-between items-baseline mb-2">
                <h2 className="text-xl font-bold text-slate-900">{selectedItem.title}</h2>
                <div className="text-right">
                  <span className="text-2xl font-black text-slate-900">₹{selectedItem.rental_rate_per_day}</span>
                  <span className="text-xs text-slate-500"> / day</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-xs text-slate-600 mb-4 pb-4 border-b border-slate-100">
                <span>📍 {selectedItem.pickup_location}</span>
                <span>•</span>
                <span>⭐ {selectedItem.ratings?.average || 5.0} ({selectedItem.ratings?.total_reviews || 0} reviews)</span>
              </div>

              <div className="mb-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Description</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{selectedItem.description}</p>
              </div>

              {/* Dynamic Specifications */}
              {selectedItem.specifications && Object.keys(selectedItem.specifications).length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Item Specifications</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(selectedItem.specifications).map(([k, v]) => (
                      <div key={k} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                        <span className="text-slate-400 capitalize block text-[10px]">{k.replace('_', ' ')}</span>
                        <span className="font-semibold text-slate-800">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Owner Info & Escrow Guarantee */}
              <div className="bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-indigo-50/80 border border-indigo-200/80 rounded-2xl p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-xs shrink-0">
                    {selectedItem.owner?.name?.charAt(0) || 'O'}
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5 flex-wrap">
                      <p className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">Item Owner</p>
                      {selectedItem.owner?.is_verified ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.2 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>CAMPUS ID VERIFIED</span>
                        </span>
                      ) : selectedItem.owner?.is_email_verified ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.2 rounded-full text-[9px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          <CheckCircle2 className="w-3 h-3 text-blue-600" />
                          <span>EMAIL VERIFIED</span>
                        </span>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                      <p className="font-extrabold text-slate-900 text-sm">{selectedItem.owner?.name || 'Campus Student'}</p>
                      {selectedItem.owner?.college_id && (
                        <span className="font-mono text-[10px] bg-white border border-slate-200 px-1.5 py-0.2 rounded text-slate-600 font-bold">
                          Reg: {selectedItem.owner.college_id}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      📍 {selectedItem.owner?.hostel_block || 'Campus Residence'} • <span className="text-amber-700 font-bold">★ {selectedItem.owner?.trust_score || 5.0} Trust</span>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-emerald-700 font-black uppercase tracking-wider block">Refundable Escrow</span>
                  <span className="text-lg font-black text-emerald-800">₹{selectedItem.security_deposit}</span>
                </div>
              </div>

              {/* Owner Action Buttons or Rent Button */}
              {user && (String(selectedItem.owner_id) === String(user._id) || String(selectedItem.owner?.id) === String(user._id)) ? (
                <div className="space-y-3">
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between text-xs text-purple-900">
                    <span className="flex items-center space-x-1.5 font-bold">
                      <Tag className="w-3.5 h-3.5 text-purple-600" />
                      <span>You are the registered owner of this listing</span>
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-200 text-purple-800">
                      {selectedItem.availability_status}
                    </span>
                  </div>

                  <div className="flex gap-2.5">
                    <button
                      onClick={() => {
                        setEditingItem(selectedItem);
                        setSelectedItem(null);
                      }}
                      className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-md shadow-purple-600/20 btn-tactile flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Listing & Rate</span>
                    </button>
                    <button
                      onClick={() => {
                        setDeletingItem(selectedItem);
                        setSelectedItem(null);
                      }}
                      className="py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl font-bold text-xs btn-tactile flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setBookingItem(selectedItem);
                    setSelectedItem(null);
                  }}
                  disabled={selectedItem.availability_status !== 'AVAILABLE'}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-black text-xs shadow-lg shadow-emerald-600/25 btn-tactile cursor-pointer disabled:opacity-50 tracking-wide"
                >
                  Rent This Resource
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {bookingItem && (
        <BookingModal
          item={bookingItem}
          onClose={() => setBookingItem(null)}
          onOpenAuth={onOpenAuth}
          onSuccess={() => {
            fetchItems();
            fetchRecommendations();
          }}
        />
      )}

      {/* Owner Edit Listing Modal */}
      {editingItem && (
        <EditItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onUpdated={() => {
            fetchItems();
            fetchRecommendations();
          }}
        />
      )}

      {/* Owner Delete Listing Modal */}
      {deletingItem && (
        <DeleteItemModal
          item={deletingItem}
          onClose={() => setDeletingItem(null)}
          onDeleted={() => {
            fetchItems();
            fetchRecommendations();
          }}
        />
      )}

    </div>
  );
};

export default ExplorePage;
