import React, { useState, useEffect } from 'react';
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
  Lock
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

// Cohesive 3-color palette styling (Slate foundation, Emerald brand accent, Warm Amber highlight)
const getCategoryChipStyle = (cat, isSelected) => {
  if (isSelected) {
    return "bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-sm shadow-emerald-500/10";
  }
  return "bg-slate-900/90 text-slate-300 border-slate-700/80 hover:bg-slate-800 hover:text-white hover:border-slate-600";
};

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
      
      {/* Refined, Human-Crafted Architectural Campus Hero Banner */}
      <div className="bg-slate-950 text-white py-10 sm:py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex flex-col justify-center border-b border-slate-800/80">
        
        {/* Subtle Architectural Grid Texture (Structured, non-AI aesthetic) */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#33415518_1px,transparent_1px),linear-gradient(to_bottom,#33415518_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none"></div>

        {/* Soft, Restrained Ambient Vignettes (Subtle warm amber & cool teal) */}
        <div className="absolute top-0 left-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10 w-full">
          
          {/* Authentic Live Campus Network Beacon */}
          <div className="inline-flex items-center space-x-2 bg-slate-900/90 border border-slate-700/80 px-3.5 py-1.5 rounded-full text-slate-300 text-xs font-semibold mb-4 backdrop-blur-md shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-bold text-slate-200">Campus Peer Network</span>
            <span className="text-slate-600">•</span>
            <span className="text-[11px] font-medium text-emerald-400">100% Escrow Protected</span>
          </div>

          {/* Clean, High-Impact Headline without Generic AI Rainbow Gradient */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white mb-3 sm:mb-4 leading-tight px-1">
            Rent What You Need, <span className="text-amber-300 font-serif italic font-normal">Share What You Have</span>
          </h1>

          <p className="max-w-2xl mx-auto text-slate-300 text-xs sm:text-sm leading-relaxed mb-6 font-normal px-2">
            Scientific calculators, lab coats, cycles, DSLR cameras, and robotics kits — securely exchanged with verified university peers.
          </p>

          {/* Solid Elevated High-Contrast Search Box */}
          <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto flex items-center gap-2 p-2 bg-white rounded-2xl shadow-xl shadow-slate-950/20 border border-slate-200 text-slate-900 focus-within:ring-2 focus-within:ring-emerald-500/40">
            <div className="flex-1 flex items-center px-3 text-slate-800 min-w-0">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 shrink-0 mr-2.5" />
              <input
                type="text"
                placeholder="Search calculators, lab coats, geared cycles, drafters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-hidden font-medium"
              />
            </div>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl transition cursor-pointer shadow-sm shrink-0"
            >
              Search
            </button>
          </form>

          {/* Quick Clickable Popular Queries */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2.5 text-[11px] text-slate-400">
            <span className="font-medium text-slate-500">Popular:</span>
            {[
              { label: 'Casio fx-991EX', query: 'Casio' },
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
                className="px-2 py-0.5 rounded-md bg-slate-900/90 hover:bg-slate-800 text-slate-300 text-[10px] font-medium border border-slate-700/60 transition cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Disciplined 3-Color Trust Badges (Slate, Emerald, Amber) */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px] font-semibold mt-6 mb-2">
            <span className="flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 px-3 py-1 rounded-full shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>100% Refundable Escrow</span>
            </span>
            <span className="flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 px-3 py-1 rounded-full shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Verified College Students</span>
            </span>
            <span className="flex items-center space-x-1.5 bg-amber-500/10 border border-amber-500/25 text-amber-300 px-3 py-1 rounded-full shadow-2xs">
              <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Dynamic QR Handover Pass</span>
            </span>
          </div>

          {/* Categories Bar with Tailored Multi-Color Subtle Styling */}
          <div className="flex overflow-x-auto sm:flex-wrap items-center justify-start sm:justify-center gap-1.5 sm:gap-2 mt-5 max-w-4xl mx-auto px-1 py-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-[11px] sm:text-xs px-3 sm:px-3.5 py-1.5 rounded-xl font-semibold border transition shrink-0 cursor-pointer ${getCategoryChipStyle(cat, selectedCategory === cat)}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Catalog Explorer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pt-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {selectedCategory === "All" ? "Explore Campus Resources" : `${selectedCategory}`}
            </h2>
            <p className="text-xs text-slate-500">
              {items.length} item{items.length === 1 ? '' : 's'} available for rent
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-slate-300 text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating_desc">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Item Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-72 bg-slate-100 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : items.length === 0 ? (
          /* Empty State for Real User Uploads */
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs max-w-xl mx-auto my-6">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
              <PackageOpen className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No items listed yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
              Be the first student to list a calculator, textbook, lab coat, cycle, or project kit. Start sharing with your campus community!
            </p>
            <button
              onClick={onNavigateToList}
              className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-6 py-3 rounded-xl shadow-md shadow-emerald-500/25 transition-all hover:scale-105 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span>List Your First Item</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((item) => (
              <ItemCard
                key={item._id}
                item={item}
                onSelect={setSelectedItem}
                onBook={setBookingItem}
              />
            ))}
          </div>
        )}

      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
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
                      className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Listing & Rate</span>
                    </button>
                    <button
                      onClick={() => {
                        setDeletingItem(selectedItem);
                        setSelectedItem(null);
                      }}
                      className="py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl font-bold text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
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
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition cursor-pointer disabled:opacity-50"
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
