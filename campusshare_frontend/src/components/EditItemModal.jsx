import React, { useState, useEffect } from 'react';
import { itemsApi } from '../api/client';
import { useToast } from '../context/ToastContext';
import { 
  X, 
  Tag, 
  Save, 
  IndianRupee, 
  MapPin, 
  FileText, 
  AlertCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

const CATEGORIES = [
  "Electronics",
  "Books",
  "Lab & Academic",
  "Sports",
  "Cycles & Mobility",
  "Audio & Music",
  "Clothing & Costumes",
  "Project Kits"
];

const EditItemModal = ({ item, onClose, onUpdated }) => {
  const { showToast } = useToast();

  const [categories, setCategories] = useState(CATEGORIES);
  const [title, setTitle] = useState(item.title || '');
  const [category, setCategory] = useState(item.category || CATEGORIES[0]);
  const [description, setDescription] = useState(item.description || '');
  const [rentalRate, setRentalRate] = useState(String(item.rental_rate_per_day || ''));
  const [securityDeposit, setSecurityDeposit] = useState(String(item.security_deposit || ''));
  const [pickupLocation, setPickupLocation] = useState(item.pickup_location || '');
  const [availabilityStatus, setAvailabilityStatus] = useState(item.availability_status || 'AVAILABLE');
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await itemsApi.getCategories();
        if (res.data?.categories) {
          setCategories(res.data.categories);
        }
      } catch (e) {}
    };
    fetchCats();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title cannot be empty.');
      return;
    }

    const rate = parseFloat(rentalRate);
    const deposit = parseFloat(securityDeposit);

    if (isNaN(rate) || rate < 0) {
      setError('Please provide a valid rental rate (0 or greater).');
      return;
    }

    if (isNaN(deposit) || deposit < 0) {
      setError('Please provide a valid refundable security deposit (0 or greater).');
      return;
    }

    try {
      setSubmitting(true);
      await itemsApi.update(item._id, {
        title: title.trim(),
        category,
        description: description.trim(),
        rental_rate_per_day: rate,
        security_deposit: deposit,
        pickup_location: pickupLocation.trim(),
        availability_status: availabilityStatus,
      });

      showToast(`'${title}' updated successfully!`, 'success', 'Listing Updated');
      window.dispatchEvent(new Event('campusshare-item-created'));
      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update listing. Please try again.';
      setError(msg);
      showToast(msg, 'error', 'Update Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 rounded-t-3xl">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Edit Your Listing</h3>
              <p className="text-[11px] text-slate-500">Update availability, price, or description</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Availability Status Quick Switch */}
          <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900">Rental Availability</p>
              <p className="text-[11px] text-slate-500">
                {availabilityStatus === 'AVAILABLE'
                  ? 'Item is currently visible and bookable by students.'
                  : 'Item is paused and hidden from rentals.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAvailabilityStatus(prev => prev === 'AVAILABLE' ? 'MAINTENANCE' : 'AVAILABLE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                availabilityStatus === 'AVAILABLE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-amber-100 text-amber-900 border border-amber-200'
              }`}
            >
              <span>{availabilityStatus === 'AVAILABLE' ? 'Live & Available' : 'Paused / Maintenance'}</span>
            </button>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Item Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Rates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Rental Rate (₹/day)</label>
              <input
                type="number"
                min="0"
                step="5"
                value={rentalRate}
                onChange={(e) => setRentalRate(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Refundable Deposit (₹)</label>
              <input
                type="number"
                min="0"
                step="10"
                value={securityDeposit}
                onChange={(e) => setSecurityDeposit(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-bold"
                required
              />
            </div>
          </div>

          {/* Pickup Location */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Pickup Location</label>
            <input
              type="text"
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              placeholder="e.g. Block C, Room 204 or Central Library"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description / Notes</label>
            <textarea
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{submitting ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default EditItemModal;
