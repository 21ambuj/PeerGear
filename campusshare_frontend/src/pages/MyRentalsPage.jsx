import React, { useState, useEffect } from 'react';
import { rentalsApi, itemsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import ConditionTrackerModal from '../components/ConditionTrackerModal';
import PickupVerifyModal from '../components/PickupVerifyModal';
import ReturnVerifyModal from '../components/ReturnVerifyModal';
import { 
  ClipboardList, 
  ShieldCheck, 
  Camera, 
  KeyRound, 
  CheckCircle2, 
  AlertTriangle, 
  Star, 
  Package, 
  ShoppingBag, 
  ArrowRight,
  PlusCircle,
  Tag,
  Edit2,
  Trash2,
  QrCode,
  MapPin,
  User,
  Phone
} from 'lucide-react';
import EditItemModal from '../components/EditItemModal';
import DeleteItemModal from '../components/DeleteItemModal';
import QrHandoverModal from '../components/QrHandoverModal';

const MyRentalsPage = ({ initialSubTab = 'all', onNavigateToExplore, onNavigateToList }) => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState(initialSubTab); // 'all', 'renter', 'owner'
  const [rentals, setRentals] = useState([]);
  const [myListedItems, setMyListedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [selectedRentalForQr, setSelectedRentalForQr] = useState(null);
  const [selectedRentalForTracking, setSelectedRentalForTracking] = useState(null);
  const [pickupModalRental, setPickupModalRental] = useState(null);
  const [returnModalRental, setReturnModalRental] = useState(null);
  const [reviewModalRental, setReviewModalRental] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('Great item and seamless handover!');

  useEffect(() => {
    setActiveTab(initialSubTab);
  }, [initialSubTab]);

  useEffect(() => {
    fetchRentalsAndListings();
  }, [activeTab]);

  // Real-time update listener when QR handover or return is verified
  useEffect(() => {
    const handleRentalUpdated = () => {
      fetchRentalsAndListings();
      if (refreshUser) refreshUser();
    };
    window.addEventListener('campusshare-rental-updated', handleRentalUpdated);
    return () => window.removeEventListener('campusshare-rental-updated', handleRentalUpdated);
  }, []);

  const fetchRentalsAndListings = async () => {
    try {
      setLoading(true);
      const res = await rentalsApi.myRentals({ role: activeTab });
      setRentals(res.data.rentals || []);

      // Also fetch user's published inventory
      const itemsRes = await itemsApi.getMyItems();
      setMyListedItems(itemsRes.data.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewModalRental) return;
    try {
      await rentalsApi.submitReview(reviewModalRental._id, {
        rating: reviewRating,
        comment: reviewComment,
      });
      setReviewModalRental(null);
      fetchRentalsAndListings();
    } catch (e) {
      alert("Failed to submit review.");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'BOOKED':
        return <span className="bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold px-2.5 py-0.5 rounded-full">Reserved (Pending Handover)</span>;
      case 'ACTIVE':
        return <span className="bg-blue-100 text-blue-900 border border-blue-200 text-xs font-bold px-2.5 py-0.5 rounded-full animate-pulse">Active Rental</span>;
      case 'COMPLETED':
        return <span className="bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1"><CheckCircle2 className="w-3 h-3 text-emerald-600" /><span>Completed</span></span>;
      case 'DISPUTED':
        return <span className="bg-rose-100 text-rose-900 border border-rose-200 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1"><AlertTriangle className="w-3 h-3 text-rose-600" /><span>In Dispute</span></span>;
      default:
        return <span className="bg-slate-100 text-slate-800 text-xs font-bold px-2.5 py-0.5 rounded-full">{status}</span>;
    }
  };

  const getDepositBadge = (depStatus, amount) => {
    switch (depStatus) {
      case 'HELD':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold px-2 py-0.5 rounded-md">₹{amount} Locked in Escrow</span>;
      case 'REFUNDED':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold px-2 py-0.5 rounded-md flex items-center space-x-1"><ShieldCheck className="w-3 h-3 text-emerald-600" /><span>₹{amount} 100% Refunded</span></span>;
      case 'LOCKED_IN_DISPUTE':
        return <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-semibold px-2 py-0.5 rounded-md">₹{amount} Held in Dispute</span>;
      default:
        return <span className="text-[11px] font-semibold text-slate-500">{depStatus}</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <ClipboardList className="w-4 h-4" />
            <span>Campus Exchange Ledger</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">My Rentals & Published Listings</h1>
          <p className="text-xs text-slate-500">
            Manage items you are currently borrowing, track security deposit refunds, and oversee resources you have listed.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/80 self-start sm:self-auto shadow-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Activity
          </button>
          <button
            onClick={() => setActiveTab('renter')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
              activeTab === 'renter' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-indigo-500" />
            <span>Items I'm Renting</span>
          </button>
          <button
            onClick={() => setActiveTab('owner')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
              activeTab === 'owner' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-purple-500" />
            <span>My Listed Items ({myListedItems.length})</span>
          </button>
        </div>
      </div>

      {/* SECTION: When on "My Listed Items" (Owner) mode, show the Published Inventory grid */}
      {(activeTab === 'owner' || activeTab === 'all') && myListedItems.length > 0 && (
        <div className="mb-8 bg-purple-50/50 border border-purple-100 rounded-3xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 rounded-xl text-purple-700">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Your Published Campus Listings</h3>
                <p className="text-[11px] text-slate-500">Resources you made available for other students to rent ({myListedItems.length} active)</p>
              </div>
            </div>
            {onNavigateToList && (
              <button
                onClick={onNavigateToList}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1 shadow-xs transition cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ List Another Item</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myListedItems.map((item) => (
              <div key={item._id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-purple-200 hover:shadow-md transition flex flex-col justify-between group">
                <div className="flex items-start space-x-3 mb-3">
                  <img
                    src={item.images?.[0] || 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop&q=80'}
                    alt={item.title}
                    className="w-16 h-16 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-100"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {item.category}
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        item.availability_status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.availability_status}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs truncate" title={item.title}>
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      <span className="font-extrabold text-slate-900">₹{item.rental_rate_per_day}</span>/day • <span className="font-medium text-emerald-700">₹{item.security_deposit} dep</span>
                    </p>
                  </div>
                </div>

                {/* Owner Actions: Edit & Delete */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-end space-x-1.5">
                  <button
                    onClick={() => setEditingItem(item)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-800 text-xs font-bold rounded-xl transition flex items-center space-x-1 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => setDeletingItem(item)}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl transition flex items-center space-x-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty listings state when in Owner mode */}
      {activeTab === 'owner' && myListedItems.length === 0 && !loading && (
        <div className="mb-8 bg-purple-50/50 border border-purple-200/60 rounded-3xl p-6 text-center">
          <Package className="w-10 h-10 text-purple-400 mx-auto mb-2" />
          <h3 className="font-extrabold text-slate-900 text-sm mb-1">You haven't listed any items for campus sharing yet</h3>
          <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
            List your lab coats, calculators, cycles, or project equipment and earn money while helping peers.
          </p>
          {onNavigateToList && (
            <button
              onClick={onNavigateToList}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl inline-flex items-center space-x-1.5 shadow-sm transition cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ List an Item Now</span>
            </button>
          )}
        </div>
      )}

      {/* Rentals List */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-extrabold text-slate-900 text-base">
          {activeTab === 'renter' 
            ? "Items You Are Currently Renting" 
            : activeTab === 'owner' 
            ? "Rental Handover & Return Contracts for Your Items" 
            : "All Rental Transactions"}
        </h3>
        <span className="text-xs text-slate-400 font-semibold">{rentals.length} transaction{rentals.length === 1 ? '' : 's'}</span>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-40 bg-slate-100 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : rentals.length === 0 ? (
        <div className="text-center py-14 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <h3 className="text-base font-bold text-slate-700 mb-1">
            {activeTab === 'renter' 
              ? "You haven't rented any items yet" 
              : activeTab === 'owner'
              ? (myListedItems.length > 0 
                  ? "Your listed items are live and available on campus!" 
                  : "No rental bookings yet")
              : "No rental contracts found"}
          </h3>
          <p className="text-xs text-slate-500 mb-5 max-w-sm mx-auto leading-relaxed">
            {activeTab === 'renter'
              ? "Find calculators, lab coats, cycles, and project equipment available for rent in your college."
              : activeTab === 'owner'
              ? (myListedItems.length > 0 
                  ? "Your items are listed in the section above. When another student books one of your resources, their contract and pickup handover OTP will appear here." 
                  : "List items you own to start earning money safely with 100% refundable student deposits.")
              : "Your rental and lending transactions will appear here."}
          </p>
          {activeTab === 'renter' && onNavigateToExplore && (
            <button
              onClick={onNavigateToExplore}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition cursor-pointer"
            >
              Explore Items to Rent
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {rentals.map((rental) => {
            const isRenter = user && String(rental.renter_id) === String(user._id);
            const isOwner = user && String(rental.owner_id) === String(user._id);
            const peer = isRenter ? rental.owner : rental.renter;
            const pickupLoc = rental.item?.pickup_location || rental.pickup_location || peer?.hostel_block || 'Campus Main Hub';

            return (
              <div
                key={rental._id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition p-5 flex flex-col md:flex-row gap-5"
              >
                {/* Thumbnail */}
                <div className="w-full md:w-36 h-32 md:h-auto rounded-xl overflow-hidden bg-slate-100 shrink-0">
                  <img
                    src={rental.item?.image || 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop&q=80'}
                    alt={rental.item?.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                          isRenter ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          {isRenter ? 'You Rented This' : 'Lent from Your Inventory'}
                        </span>
                        <h3 className="font-bold text-slate-900 text-base">{rental.item?.title || 'Resource'}</h3>
                      </div>
                      <div>{getStatusBadge(rental.status)}</div>
                    </div>

                    {/* Rental Financial & Period Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-2 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Rental Period</span>
                        <span className="font-bold text-slate-800">
                          {new Date(rental.start_date).toLocaleDateString([], { month: 'short', day: 'numeric' })} - {new Date(rental.end_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Rental Fee</span>
                        <span className="font-bold text-slate-900">₹{rental.rental_fee} ({rental.rental_days}d)</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Refundable Deposit</span>
                        {getDepositBadge(rental.deposit_status, rental.security_deposit)}
                      </div>
                    </div>

                    {/* Pickup Location & Logistics Banner */}
                    <div className="my-2 bg-gradient-to-r from-amber-50/80 via-orange-50/50 to-amber-50/80 border border-amber-200/90 rounded-xl px-3 py-2 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block">Pickup & Handover Point</span>
                          <span className="font-bold text-slate-900">{pickupLoc}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-amber-700 bg-white/80 border border-amber-200 px-2 py-0.5 rounded-md">
                        In-Person Handover
                      </span>
                    </div>

                    {/* Peer Profile & Trust Badges */}
                    <div className="p-3 bg-slate-50/90 border border-slate-200/90 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs mb-2">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black flex items-center justify-center text-sm shadow-xs shrink-0">
                          {peer?.name?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5 flex-wrap">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                              {isRenter ? 'Equipment Owner' : 'Verified Renter'}
                            </span>
                            {peer?.is_verified ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                <span>CAMPUS ID VERIFIED</span>
                              </span>
                            ) : peer?.is_email_verified ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                <CheckCircle2 className="w-3 h-3 text-blue-600" />
                                <span>EMAIL VERIFIED</span>
                              </span>
                            ) : null}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                            <span className="font-extrabold text-slate-900 text-xs">{peer?.name || 'Campus Student'}</span>
                            {peer?.college_id && (
                              <span className="font-mono text-[10px] bg-white border border-slate-200 px-1.5 py-0.2 rounded text-slate-600 font-bold">
                                Reg: {peer.college_id}
                              </span>
                            )}
                            <span className="text-slate-500 text-[11px]">
                              📍 {peer?.hostel_block || 'Campus Hostel'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Trust Rating</span>
                          <span className="font-black text-amber-600 flex items-center justify-end space-x-0.5 text-xs">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                            <span>{peer?.trust_score || 5.0} / 5.0</span>
                          </span>
                        </div>

                        {peer?.phone && peer.phone !== '+91 0000000000' && (
                          <a
                            href={`tel:${peer.phone}`}
                            className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-indigo-700 font-bold text-[11px] transition shadow-2xs flex items-center space-x-1 cursor-pointer"
                            title="Direct Call / Contact"
                          >
                            <Phone className="w-3 h-3 text-indigo-600" />
                            <span>Contact</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Handover OTP / QR */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    {/* Handover OTP Notice & QR Pass Button if Reserved */}
                    {rental.status === 'BOOKED' && isRenter && (
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center space-x-2 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl text-xs">
                          <KeyRound className="w-4 h-4 text-indigo-600" />
                          <span>Pickup Handover OTP: <strong className="font-mono text-sm text-indigo-700 tracking-wider font-black">{rental.handover_otp}</strong></span>
                        </div>

                        <button
                          onClick={() => setSelectedRentalForQr(rental)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Show QR Handover Pass</span>
                        </button>
                      </div>
                    )}

                    {rental.status === 'BOOKED' && isOwner && (
                      <button
                        onClick={() => setPickupModalRental(rental)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Scan QR or Enter OTP to Hand Over</span>
                      </button>
                    )}

                    {rental.status === 'ACTIVE' && isOwner && (
                      <button
                        onClick={() => setReturnModalRental(rental)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Verify Return & Refund Deposit</span>
                      </button>
                    )}

                    {rental.status === 'COMPLETED' && isRenter && !rental.rating_given && (
                      <button
                        onClick={() => setReviewModalRental(rental)}
                        className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>Leave Review</span>
                      </button>
                    )}

                    {/* Always visible: Condition Tracking Ledger */}
                    <button
                      onClick={() => setSelectedRentalForTracking(rental)}
                      className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs px-3 py-1.5 rounded-xl transition flex items-center space-x-1 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-slate-500" />
                      <span>Condition Photos & Evidence</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {selectedRentalForTracking && (
        <ConditionTrackerModal
          rental={selectedRentalForTracking}
          onClose={() => setSelectedRentalForTracking(null)}
        />
      )}

      {pickupModalRental && (
        <PickupVerifyModal
          rental={pickupModalRental}
          onClose={() => setPickupModalRental(null)}
          onSuccess={() => {
            fetchRentalsAndListings();
            refreshUser();
          }}
        />
      )}

      {returnModalRental && (
        <ReturnVerifyModal
          rental={returnModalRental}
          onClose={() => setReturnModalRental(null)}
          onSuccess={() => {
            fetchRentalsAndListings();
            refreshUser();
          }}
        />
      )}

      {/* Review Modal */}
      {reviewModalRental && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-1">Rate Your Rental Experience</h3>
            <p className="text-xs text-slate-500 mb-4">{reviewModalRental.item?.title}</p>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rating (1 to 5 Stars)</label>
                <div className="flex gap-2 justify-center py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="p-1 cursor-pointer transition hover:scale-110"
                    >
                      <Star className={`w-6 h-6 ${star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Review Comments</label>
                <textarea
                  rows="2"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setReviewModalRental(null)}
                  className="flex-1 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modals for Editing and Deleting Listed Items */}
      {editingItem && (
        <EditItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onUpdated={fetchRentalsAndListings}
        />
      )}

      {deletingItem && (
        <DeleteItemModal
          item={deletingItem}
          onClose={() => setDeletingItem(null)}
          onDeleted={fetchRentalsAndListings}
        />
      )}

      {/* Dynamic QR Handover Pass Modal */}
      {selectedRentalForQr && (
        <QrHandoverModal
          rental={selectedRentalForQr}
          onClose={() => setSelectedRentalForQr(null)}
        />
      )}

    </div>
  );
};

export default MyRentalsPage;
