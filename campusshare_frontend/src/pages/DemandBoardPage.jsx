import React, { useState, useEffect } from 'react';
import { requestsApi, itemsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import BookingModal from '../components/BookingModal';
import { 
  Bell, 
  Plus, 
  Sparkles, 
  Calendar, 
  ShieldCheck, 
  User, 
  Trash2, 
  CheckCircle2, 
  Tag, 
  ArrowRight,
  PackageCheck,
  AlertCircle
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

const DemandBoardPage = ({ onFulfillRequest }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [bookingItem, setBookingItem] = useState(null);

  // Form
  const [category, setCategory] = useState('Electronics');
  const [keyword, setKeyword] = useState('');
  const [maxBudget, setMaxBudget] = useState('30');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await requestsApi.list();
      setRequests(res.data.requests || []);
    } catch (e) {
      console.error(e);
      showToast("Failed to fetch campus requests.", "error", "Network Error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!keyword.trim()) {
      setFormError("Please enter the item name or keyword you are looking for.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await requestsApi.create({
        category,
        keyword: keyword.trim(),
        max_budget_per_day: parseFloat(maxBudget) || 30,
        notes: notes.trim(),
      });

      showToast(`Request for '${keyword.trim()}' posted! You'll be alerted when listed.`, "success", "Request Created");
      setShowModal(false);
      setKeyword('');
      setNotes('');
      fetchRequests();
    } catch (e) {
      const msg = e.response?.data?.error || "Failed to post request. Please try again.";
      setFormError(msg);
      showToast(msg, "error", "Submission Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRequest = async (id, title) => {
    try {
      await requestsApi.delete(id);
      showToast(`Request for '${title}' removed.`, "success", "Request Deleted");
      fetchRequests();
    } catch (e) {
      const msg = e.response?.data?.error || "Failed to delete request.";
      showToast(msg, "error", "Delete Failed");
    }
  };

  // Extract all matching available items across active requests
  const allMatchedItems = [];
  const seenItemIds = new Set();
  requests.forEach(req => {
    if (req.matching_items && req.matching_items.length > 0) {
      req.matching_items.forEach(item => {
        if (!seenItemIds.has(item._id)) {
          seenItemIds.add(item._id);
          allMatchedItems.push({ ...item, matchedFor: req.keyword });
        }
      });
    }
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-amber-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Demand-Driven Campus Sharing • Instant Matching</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">Campus Requests Board ("Notify Me")</h1>
          <p className="text-xs sm:text-sm text-indigo-100 mt-1 max-w-xl leading-relaxed">
            Can't find a calculator, lab coat, cycle, or project kit? Post a request here. Our engine matches your criteria with campus owners in real-time!
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-black text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-lg transition flex items-center space-x-2 cursor-pointer shrink-0 hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Post Needed Item</span>
        </button>
      </div>

      {/* SECTION: Recommended / Available Items Matching Active Requests */}
      {allMatchedItems.length > 0 && (
        <div className="mb-10 bg-gradient-to-br from-indigo-50/70 via-purple-50/60 to-emerald-50/60 border border-indigo-100 rounded-3xl p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                <PackageCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-sm sm:text-base">
                  Available Campus Items Matching Active Requests
                </h3>
                <p className="text-[11px] text-slate-500">
                  Resources currently live on campus that fulfill pending student requests
                </p>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              {allMatchedItems.length} Live Matches
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allMatchedItems.map((item) => (
              <div 
                key={item._id} 
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-md transition flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {item.category}
                    </span>
                    <span className="text-[10px] text-purple-700 font-extrabold bg-purple-50 border border-purple-200 px-2 py-0.2 rounded-full truncate max-w-[130px]">
                      Matches "{item.matchedFor}"
                    </span>
                  </div>

                  <div className="flex items-start space-x-3 mb-3">
                    <img
                      src={item.images?.[0] || 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop&q=80'}
                      alt={item.title}
                      className="w-16 h-16 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-100"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 text-xs truncate" title={item.title}>
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        <strong className="text-slate-900 font-black">₹{item.rental_rate_per_day}</strong>/day • <span className="text-emerald-700 font-semibold">₹{item.security_deposit} dep</span>
                      </p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        📍 {item.pickup_location || 'Campus'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Instant Rent / Fulfill Action */}
                <button
                  onClick={() => setBookingItem(item)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer mt-1"
                >
                  <span>Rent This Matched Item</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Requests List */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900">Active Student Requests</h2>
          <p className="text-xs text-slate-500">Items requested by students awaiting owner listings</p>
        </div>
        <span className="text-xs text-slate-500 font-bold bg-slate-100 px-2.5 py-1 rounded-xl">
          {requests.length} open request{requests.length === 1 ? '' : 's'}
        </span>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-40 bg-slate-100 rounded-3xl animate-pulse"></div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
          <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <h3 className="text-base font-bold text-slate-700 mb-1">No pending item requests</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
            Can't find a calculator, lab coat, or camera on campus? Post your request and get alerted the second someone lists it.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition cursor-pointer"
          >
            Post the First Request
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {requests.map((req) => {
            const hasMatches = req.matching_items && req.matching_items.length > 0;
            const isMyRequest = user && String(user._id) === String(req.student_id);

            return (
              <div
                key={req._id}
                className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        {req.category}
                      </span>
                      <h3 className="font-black text-slate-900 text-base mt-1 leading-snug">{req.keyword}</h3>
                    </div>

                    {isMyRequest && (
                      <button
                        onClick={() => handleDeleteRequest(req._id, req.keyword)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-xl hover:bg-rose-50 transition cursor-pointer"
                        title="Delete your request"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                    {req.notes || "Urgent requirement for practicals, exams, or campus event."}
                  </p>

                  {/* Matching Item Inline Alert */}
                  {hasMatches && (
                    <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                      <div className="flex items-center space-x-1.5 text-emerald-800 text-xs font-bold mb-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{req.matching_items.length} Matched Item{req.matching_items.length > 1 ? 's' : ''} Live Now!</span>
                      </div>
                      <div className="space-y-1.5">
                        {req.matching_items.slice(0, 2).map((mItem) => (
                          <div 
                            key={mItem._id}
                            className="flex items-center justify-between p-2 bg-white rounded-xl border border-emerald-200/60 shadow-2xs text-xs"
                          >
                            <span className="font-bold text-slate-900 truncate max-w-[170px]">{mItem.title}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-[11px] font-black text-slate-800">₹{mItem.rental_rate_per_day}/d</span>
                              <button
                                onClick={() => setBookingItem(mItem)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition cursor-pointer shadow-2xs"
                              >
                                Rent
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Max Daily Budget</span>
                    <span className="font-black text-emerald-700">₹{req.max_budget_per_day} / day</span>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Requested By</span>
                    <span className="font-bold text-slate-800">{req.student?.name || 'Verified Student'}</span>
                    <span className="text-slate-400 text-[10px] block">{req.student?.hostel_block || 'Campus'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal to Post Request */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-black text-slate-900 text-lg">Request an Item</h3>
                <p className="text-xs text-slate-500">Get notified the second someone lists this item on campus.</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Item Name / Keyword</label>
                <input
                  type="text"
                  placeholder="e.g. Casio fx-991EX Calculator or Size L Lab Coat"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Max Daily Budget (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes / When Needed</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Needed for physics lab exam this Friday"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Posting...' : 'Post Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Booking Modal for Instant Matched Item Rental */}
      {bookingItem && (
        <BookingModal
          item={bookingItem}
          onClose={() => setBookingItem(null)}
          onSuccess={() => {
            fetchRequests();
          }}
        />
      )}

    </div>
  );
};

export default DemandBoardPage;
