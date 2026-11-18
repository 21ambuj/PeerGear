import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, MapPin, Star, UserCheck, Calendar, Tag } from 'lucide-react';

const ItemCard = ({ item, onSelect, onBook }) => {
  const { user } = useAuth();
  const isAvailable = item.availability_status === 'AVAILABLE';

  // Check if current logged-in user is the owner
  const isMyItem = user && (
    String(item.owner_id) === String(user._id) || 
    String(item.owner?.id) === String(user._id)
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group">
      {/* Item Image with Category Badge & Status */}
      <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
        <img
          src={item.images && item.images.length > 0 ? item.images[0] : 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop&q=80'}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop&q=80';
          }}
        />
        
        <div className="absolute top-3 left-3 flex flex-wrap gap-1">
          <span className="bg-white/95 backdrop-blur-xs text-indigo-700 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-xs">
            {item.category}
          </span>
        </div>

        <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
          {isMyItem ? (
            <span className="bg-purple-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md flex items-center space-x-1">
              <Tag className="w-2.5 h-2.5" />
              <span>Your Listing</span>
            </span>
          ) : (
            <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-xs ${
              isAvailable 
                ? 'bg-emerald-500 text-white' 
                : 'bg-amber-500 text-white'
            }`}>
              {item.availability_status}
            </span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Title & Rating */}
          <div className="flex justify-between items-start gap-2 mb-1.5">
            <h3 
              onClick={() => onSelect(item)}
              className="font-bold text-slate-900 text-sm hover:text-indigo-600 transition cursor-pointer line-clamp-1"
              title={item.title}
            >
              {item.title}
            </h3>
            <div className="flex items-center space-x-1 shrink-0 bg-amber-50 px-1.5 py-0.5 rounded text-amber-700 text-xs font-semibold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{item.ratings?.average || 5.0}</span>
            </div>
          </div>

          {/* Location & Specs */}
          <div className="flex items-center space-x-1 text-slate-500 text-xs mb-3">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{item.pickup_location || 'Campus Location'}</span>
          </div>

          {/* Dynamic Specifications */}
          {item.specifications && Object.keys(item.specifications).length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {Object.entries(item.specifications).slice(0, 2).map(([key, val]) => (
                <span key={key} className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded font-medium">
                  {key.replace('_', ' ')}: {String(val)}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Pricing & Deposit Information */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex justify-between items-baseline mb-2">
            <div>
              <span className="text-lg font-black text-slate-900">₹{item.rental_rate_per_day}</span>
              <span className="text-slate-500 text-xs font-medium"> / day</span>
            </div>
            
            {/* Refundable Deposit Badge */}
            <div className="flex items-center space-x-1 bg-emerald-50 text-emerald-800 text-[11px] font-semibold px-2 py-0.5 rounded-md border border-emerald-200">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>₹{item.security_deposit} Refundable</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => onSelect(item)}
              className="flex-1 py-1.5 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Details
            </button>
            
            {isMyItem ? (
              <button
                onClick={() => onSelect(item)}
                className="flex-1 py-1.5 px-3 font-bold text-xs rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition flex items-center justify-center space-x-1 cursor-pointer"
                title="Manage or edit your listing"
              >
                <Tag className="w-3 h-3 text-purple-500" />
                <span>Manage</span>
              </button>
            ) : (
              <button
                disabled={!isAvailable}
                onClick={() => onBook(item)}
                className={`flex-1 py-1.5 px-3 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer ${
                  isAvailable
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{isAvailable ? 'Rent Now' : 'Rented'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemCard;
