import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, MapPin, Star, Calendar, Tag } from 'lucide-react';

const ItemCard = ({ item, onSelect, onBook, animationDelayClass = '' }) => {
  const { user } = useAuth();
  const isAvailable = item.availability_status === 'AVAILABLE';

  // Check if current logged-in user is the owner
  const isMyItem = user && (
    String(item.owner_id) === String(user._id) || 
    String(item.owner?.id) === String(user._id)
  );

  return (
    <div className={`bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:shadow-slate-900/8 transition-all duration-300 overflow-hidden flex flex-col justify-between group card-interactive animate-fade-in-up ${animationDelayClass}`}>
      {/* Item Image with Category Badge & Status */}
      <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
        <img
          src={item.images && item.images.length > 0 ? item.images[0] : 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop&q=80'}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop&q=80';
          }}
        />
        
        {/* Subtle dark vignette overlay on bottom of image for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>

        <div className="absolute top-3 left-3 flex flex-wrap gap-1 z-10">
          <span className="glass-panel text-indigo-700 text-[11px] font-extrabold px-3 py-1 rounded-full shadow-xs border border-white/60 tracking-wide">
            {item.category}
          </span>
        </div>

        <div className="absolute top-3 right-3 flex flex-col items-end gap-1 z-10">
          {isMyItem ? (
            <span className="bg-purple-600/95 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm flex items-center space-x-1 border border-purple-400/40">
              <Tag className="w-2.5 h-2.5" />
              <span>Your Listing</span>
            </span>
          ) : (
            <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-sm backdrop-blur-md border ${
              isAvailable 
                ? 'bg-emerald-600/90 text-white border-emerald-400/40' 
                : 'bg-amber-600/90 text-white border-amber-400/40'
            }`}>
              {isAvailable ? '• Available' : '• In Use'}
            </span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Title & Rating */}
          <div className="flex justify-between items-start gap-2 mb-2">
            <h3 
              onClick={() => onSelect(item)}
              className="font-black text-slate-900 text-sm sm:text-base hover:text-indigo-600 transition-colors cursor-pointer line-clamp-1 tracking-tight"
              title={item.title}
            >
              {item.title}
            </h3>
            <div className="flex items-center space-x-1 shrink-0 bg-amber-50/90 border border-amber-200/60 px-2 py-0.5 rounded-lg text-amber-800 text-xs font-black shadow-2xs">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{item.ratings?.average || 5.0}</span>
            </div>
          </div>

          {/* Location & Host block */}
          <div className="flex items-center space-x-1.5 text-slate-500 text-xs mb-3">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate font-medium">{item.pickup_location || 'Campus Location'}</span>
          </div>

          {/* Dynamic Specifications */}
          {item.specifications && Object.keys(item.specifications).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {Object.entries(item.specifications).slice(0, 2).map(([key, val]) => (
                <span key={key} className="bg-slate-100/90 text-slate-600 text-[10px] px-2.5 py-0.5 rounded-md font-semibold border border-slate-200/60">
                  {key.replace('_', ' ')}: <span className="text-slate-800">{String(val)}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Pricing & Refundable Escrow Deposit */}
        <div className="pt-3.5 border-t border-slate-100">
          <div className="flex justify-between items-center mb-3">
            <div>
              <span className="text-xl font-black text-slate-900 tracking-tight">₹{item.rental_rate_per_day}</span>
              <span className="text-slate-400 text-xs font-semibold"> / day</span>
            </div>
            
            {/* Refundable Escrow Badge */}
            <div className="flex items-center space-x-1 bg-emerald-50 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-lg border border-emerald-200/80 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>₹{item.security_deposit} Escrow</span>
            </div>
          </div>

          {/* Tactile Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => onSelect(item)}
              className="flex-1 py-2 px-3 border border-slate-200/80 hover:bg-slate-100/80 text-slate-700 font-bold text-xs rounded-xl btn-tactile cursor-pointer"
            >
              Details
            </button>
            
            {isMyItem ? (
              <button
                onClick={() => onSelect(item)}
                className="flex-1 py-2 px-3 font-bold text-xs rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/80 btn-tactile flex items-center justify-center space-x-1.5 cursor-pointer"
                title="Manage or edit your listing"
              >
                <Tag className="w-3.5 h-3.5 text-purple-600" />
                <span>Manage</span>
              </button>
            ) : (
              <button
                disabled={!isAvailable}
                onClick={() => onBook(item)}
                className={`flex-1 py-2 px-3 font-black text-xs rounded-xl btn-tactile flex items-center justify-center space-x-1.5 cursor-pointer ${
                  isAvailable
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{isAvailable ? 'Rent Gear' : 'Rented'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemCard;
