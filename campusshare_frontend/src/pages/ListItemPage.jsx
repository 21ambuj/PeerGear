import React, { useState, useEffect } from 'react';
import { itemsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  PlusCircle, 
  ShieldCheck, 
  ShieldAlert,
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  Image as ImageIcon,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Sparkles,
  Tag,
  FolderPlus,
  Lock,
  Clock,
  RefreshCw
} from 'lucide-react';

const DEFAULT_CATEGORIES = [
  "Electronics",
  "Lab & Academic",
  "Sports",
  "Cycles & Mobility",
  "Audio & Music",
  "Books",
  "Clothing & Costumes",
  "Project Kits"
];

const ListItemPage = ({ onListed, onOpenAuth }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [customCategories, setCustomCategories] = useState([]);
  const [category, setCategory] = useState("Electronics");

  // Custom Category Creation / Editing State
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [submittingCat, setSubmittingCat] = useState(false);
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingCatName, setEditingCatName] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rentalRate, setRentalRate] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [pickupLocation, setPickupLocation] = useState(user?.hostel_block || "Campus Main Gate");
  const [imagePreview, setImagePreview] = useState("");
  const [tags, setTags] = useState("");
  
  // Dynamic Specs based on category
  const [specKey1, setSpecKey1] = useState("Brand");
  const [specVal1, setSpecVal1] = useState("");
  const [specKey2, setSpecKey2] = useState("Condition");
  const [specVal2, setSpecVal2] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await itemsApi.getCategories();
      if (res.data?.categories) {
        setCategories(res.data.categories);
      }
      if (res.data?.custom_categories) {
        setCustomCategories(res.data.custom_categories);
      }
    } catch (e) {
      console.warn("Failed to fetch dynamic categories, using defaults:", e);
    }
  };

  // Add Custom Category
  const handleAddCategory = async (e) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;

    try {
      setSubmittingCat(true);
      const res = await itemsApi.createCategory({ name: trimmed });
      showToast(`Custom category '${trimmed}' created!`, 'success', 'Category Added');
      setNewCatName("");
      setIsAddingCategory(false);
      await fetchCategories();
      setCategory(trimmed);
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to create category.";
      showToast(msg, 'error', 'Error');
    } finally {
      setSubmittingCat(false);
    }
  };

  // Start Editing Custom Category
  const handleStartEditCategory = (e, cat) => {
    e.stopPropagation();
    setEditingCatId(cat._id);
    setEditingCatName(cat.name);
  };

  // Save Modified Category
  const handleSaveEditCategory = async (e, catId) => {
    e.preventDefault();
    e.stopPropagation();
    const trimmed = editingCatName.trim();
    if (!trimmed) return;

    try {
      setSubmittingCat(true);
      await itemsApi.updateCategory(catId, { name: trimmed });
      showToast(`Category renamed to '${trimmed}'.`, 'success', 'Category Updated');
      setEditingCatId(null);
      await fetchCategories();
      setCategory(trimmed);
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to rename category.";
      showToast(msg, 'error', 'Error');
    } finally {
      setSubmittingCat(false);
    }
  };

  // Delete Custom Category
  const handleDeleteCategory = async (e, cat) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to remove the custom category '${cat.name}'?`)) {
      return;
    }

    try {
      await itemsApi.deleteCategory(cat._id);
      showToast(`Custom category '${cat.name}' deleted.`, 'info', 'Category Removed');
      if (category === cat.name) {
        setCategory(DEFAULT_CATEGORIES[0]);
      }
      await fetchCategories();
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to delete category.";
      showToast(msg, 'error', 'Error');
    }
  };

  // Compress and resize image client-side to ensure fast mobile uploads (< 300KB)
  const compressImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.82) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(event.target.result);
        img.src = event.target.result;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  // Handle local file photo upload (optimized for phone camera & gallery)
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setErrorMsg("");
      try {
        const compressed = await compressImage(file);
        if (compressed) {
          setImagePreview(compressed);
        }
      } catch (err) {
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (!title.trim() || !rentalRate || !securityDeposit) {
      setErrorMsg("Please fill in the title, rental rate, and refundable security deposit.");
      return;
    }

    // Default placeholder photo if user didn't attach one
    const photoToSubmit = imagePreview || "https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop&q=80";

    const dynamicSpecs = {};
    if (specKey1 && specVal1) dynamicSpecs[specKey1.trim()] = specVal1.trim();
    if (specKey2 && specVal2) dynamicSpecs[specKey2.trim()] = specVal2.trim();

    // If user opened "+ Custom Category", typed a name, and directly hit "List Resource Now"
    let effectiveCategory = category;
    if (isAddingCategory && newCatName.trim()) {
      const trimmedNewCat = newCatName.trim();
      try {
        await itemsApi.createCategory({ name: trimmedNewCat });
        effectiveCategory = trimmedNewCat;
      } catch (catErr) {
        // If category already exists, gracefully use it
        effectiveCategory = trimmedNewCat;
      }
    }

    try {
      setSubmitting(true);
      await itemsApi.create({
        title: title.trim(),
        category: effectiveCategory,
        description: description.trim() || "Item in working condition, available for campus rental.",
        rental_rate_per_day: parseFloat(rentalRate),
        security_deposit: parseFloat(securityDeposit),
        pickup_location: pickupLocation.trim(),
        images: [photoToSubmit],
        tags: tags.trim(),
        specifications: dynamicSpecs,
      });

      setSuccessMsg("Resource listed successfully! Other students can now find and rent this item on PeerGear.");
      showToast("Your item has been published on PeerGear!", "success", "Listing Published");
      window.dispatchEvent(new Event('campusshare-item-created'));
      setTimeout(() => {
        if (onListed) onListed();
      }, 1200);
    } catch (err) {
      const errText = err.response?.data?.error || err.message || "Failed to list item. Please try again.";
      setErrorMsg(errText);
      showToast(errText, "error", "Listing Failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Case 1: Unauthenticated
  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 px-4">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center animate-in fade-in duration-200">
          <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Sign In to List Items</h2>
          <p className="text-xs text-slate-500 leading-relaxed mb-6">
            PeerGear is a closed-campus platform. Please sign in with your college account to publish listings for other students.
          </p>
          <button
            type="button"
            onClick={() => onOpenAuth && onOpenAuth('login')}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
          >
            Sign In or Register
          </button>
        </div>
      </div>
    );
  }

  // Case 2: Account Suspended / Blocked
  if (user?.is_blocked) {
    return (
      <div className="max-w-md mx-auto my-16 px-4">
        <div className="bg-white rounded-3xl border border-red-200 shadow-xl p-8 text-center animate-in fade-in duration-200">
          <div className="w-16 h-16 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center mx-auto mb-4 text-red-600 shadow-inner">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="inline-block px-3 py-1 bg-red-100 text-red-800 text-[10px] font-extrabold uppercase rounded-full mb-3 tracking-wider">
            Account Suspended
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Listing Permissions Disabled</h2>
          <p className="text-xs text-slate-600 leading-relaxed mb-4">
            Your campus account has been suspended by administration.
            {user.blocked_reason && (
              <span className="block mt-2 font-semibold italic text-red-700">"Reason: {user.blocked_reason}"</span>
            )}
          </p>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 text-left space-y-1">
            <p className="font-semibold text-slate-700">Why am I seeing this?</p>
            <p>Campus administrators restrict accounts that violate community safety or return policies. Please visit the admin desk to appeal your status.</p>
          </div>
        </div>
      </div>
    );
  }

  // Case 3: Student ID Card Not Verified (Admins are exempt)
  if (user?.role !== 'ADMIN' && user?.id_card_status !== 'VERIFIED') {
    const isPending = user?.id_card_status === 'PENDING_VERIFICATION';
    const isRejected = user?.id_card_status === 'REJECTED';

    return (
      <div className="max-w-lg mx-auto my-12 px-4">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in duration-200">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white p-6 sm:p-7 text-center">
            <div className="w-14 h-14 bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
              <ShieldAlert className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl font-bold">College ID Verification Required</h2>
            <p className="text-xs text-amber-100 mt-1">
              To keep our campus community safe and prevent equipment theft, only verified students can list items.
            </p>
          </div>

          {/* Status Box & Actions */}
          <div className="p-6 sm:p-8 space-y-5">
            {isPending ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-2">
                <div className="flex items-center space-x-2 font-bold text-amber-800">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Document Under Review</span>
                </div>
                <p className="text-xs leading-relaxed text-amber-800/90">
                  Your submitted College ID card is currently awaiting administrative approval. Campus coordinators verify student enrollment to maintain campus safety.
                </p>
                <p className="text-[11px] font-semibold text-amber-700">
                  ⏳ Review usually takes a few hours. Once approved, listing will automatically be unlocked!
                </p>
              </div>
            ) : isRejected ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 space-y-3">
                <div className="flex items-center space-x-2 font-bold text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Submission Rejected by Administration</span>
                </div>
                <p className="text-xs leading-relaxed text-rose-800/90">
                  Your College ID card could not be verified:
                  <span className="block mt-1 font-semibold italic text-rose-950">
                    "{user.id_card_rejection_reason || 'Unreadable document or invalid student registration number'}"
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => onOpenAuth && onOpenAuth('register', 'ID_CARD')}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-upload Valid College ID Proof</span>
                </button>
              </div>
            ) : (
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs text-indigo-900 space-y-3">
                <div className="flex items-center space-x-2 font-bold text-indigo-800">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Step 2: Upload Your Student ID</span>
                </div>
                <p className="text-xs leading-relaxed text-indigo-800/90">
                  You haven't uploaded your Student ID card yet. It only takes 30 seconds to snap a photo and verify your student registration.
                </p>
                <button
                  type="button"
                  onClick={() => onOpenAuth && onOpenAuth('register', 'ID_CARD')}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload College ID Card Now</span>
                </button>
              </div>
            )}

            <div className="border-t border-slate-100 pt-4 text-center">
              <p className="text-[11px] text-slate-400">
                Logged in as <strong className="text-slate-600">{user?.name}</strong> ({user?.college_id})
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        
        {/* Banner */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-800 text-white p-6 sm:p-8">
          <div className="flex items-center space-x-2 text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">
            <PlusCircle className="w-4 h-4 text-amber-300" />
            <span>List a Resource</span>
          </div>
          <h1 className="text-2xl font-bold">List Your Item for Campus Sharing</h1>
          <p className="text-xs sm:text-sm text-indigo-100 mt-1">
            Rent out your equipment safely. Security deposit is held in escrow before item handover.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          
          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Photo Upload Section */}
          <div>
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Item Photo
            </label>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="w-full sm:w-44 h-36 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center relative overflow-hidden bg-slate-50 group hover:border-indigo-500 transition">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-3 text-slate-400">
                    <Camera className="w-8 h-8 mx-auto mb-1 stroke-slate-400" />
                    <span className="text-[11px] font-semibold block">Click to upload photo</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>

              <div className="flex-1 text-xs text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700">Upload a clear photo of your item</p>
                <p className="text-[11px]">Takes photos from camera or gallery (JPG, PNG). Helps other students verify condition.</p>
                <div className="pt-1">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Or paste direct photo URL:</span>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={imagePreview.startsWith('http') ? imagePreview : ''}
                    onChange={(e) => setImagePreview(e.target.value)}
                    className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Category Picker with Custom Category Management */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-600" />
                <span>Category</span>
              </label>

              {/* Add Custom Category Trigger */}
              <button
                type="button"
                onClick={() => setIsAddingCategory(!isAddingCategory)}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 px-2.5 py-1 rounded-xl transition flex items-center space-x-1 cursor-pointer shadow-2xs"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>+ Custom Category</span>
              </button>
            </div>

            {/* Inline Add Custom Category Box */}
            {isAddingCategory && (
              <div className="mb-3 p-3 bg-gradient-to-r from-indigo-50/90 to-purple-50/90 border border-indigo-200 rounded-2xl animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Create Custom Category</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCategory(false);
                      setNewCatName("");
                    }}
                    className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Photography Gear, Board Games, Camping..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCategory(e);
                      }
                    }}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    disabled={submittingCat || !newCatName.trim()}
                    onClick={handleAddCategory}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs disabled:opacity-50 flex items-center space-x-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{submittingCat ? "Adding..." : "Add"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Category Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {categories.map((cat) => {
                const isSelected = category === cat;
                const customDoc = customCategories.find(c => c.name === cat);
                const isCustom = Boolean(customDoc);
                const isEditingThis = isCustom && editingCatId === customDoc._id;

                if (isEditingThis) {
                  return (
                    <div 
                      key={cat}
                      className="p-1 bg-white border-2 border-indigo-500 rounded-xl shadow-xs col-span-2 flex items-center gap-1.5"
                    >
                      <input
                        type="text"
                        value={editingCatName}
                        onChange={(e) => setEditingCatName(e.target.value)}
                        className="flex-1 px-2 py-1 text-xs font-bold text-slate-800 border border-slate-200 rounded-lg focus:outline-hidden"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={(e) => handleSaveEditCategory(e, customDoc._id)}
                        className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer"
                        title="Save Changes"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCatId(null);
                        }}
                        className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer"
                        title="Cancel"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`relative p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate pr-1">{cat}</span>

                    {/* Custom Category Actions (Edit & Delete) */}
                    {isCustom && (
                      <div className="flex items-center space-x-1 shrink-0 ml-1">
                        <button
                          type="button"
                          onClick={(e) => handleStartEditCategory(e, customDoc)}
                          className={`p-1 rounded transition hover:scale-110 cursor-pointer ${
                            isSelected 
                              ? 'text-indigo-200 hover:text-white hover:bg-indigo-700/60' 
                              : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                          }`}
                          title={`Rename custom category '${cat}'`}
                        >
                          <Edit2 className="w-2.5 h-2.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteCategory(e, customDoc)}
                          className={`p-1 rounded transition hover:scale-110 cursor-pointer ${
                            isSelected 
                              ? 'text-indigo-200 hover:text-rose-200 hover:bg-rose-600/80' 
                              : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                          }`}
                          title={`Delete custom category '${cat}'`}
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {customCategories.length > 0 && (
              <p className="text-[10px] text-slate-400 mt-1.5 flex items-center space-x-1">
                <span>Tip: Custom categories can be renamed or deleted using the pencil and trash icons.</span>
              </p>
            )}
          </div>

          {/* Title & Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Item Title</label>
            <input
              type="text"
              placeholder="e.g. Casio fx-991EX Scientific Calculator, Size M Lab Coat, Hero Geared Bicycle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description & Specifications</label>
            <textarea
              rows="3"
              placeholder="Describe the condition, what is included (charger, case, lock, etc.), and any instructions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Rates and Escrow Security Deposit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rental Rate (₹ / day) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="5"
                placeholder="e.g. 25"
                value={rentalRate}
                onChange={(e) => setRentalRate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Security Deposit (₹)</span> <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="50"
                placeholder="e.g. 100"
                value={securityDeposit}
                onChange={(e) => setSecurityDeposit(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-emerald-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          {/* Pickup Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Campus Handover Location</label>
            <input
              type="text"
              placeholder="e.g. Hostel Block B, Library Gate, Food Court"
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Specifications (CSE494 Schema Flexibility) */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-slate-700 block mb-2 uppercase tracking-wider">
              Item Details & Attributes
            </span>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input
                type="text"
                placeholder="Key (e.g. Brand)"
                value={specKey1}
                onChange={(e) => setSpecKey1(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
              />
              <input
                type="text"
                placeholder="Value (e.g. Casio)"
                value={specVal1}
                onChange={(e) => setSpecVal1(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Key (e.g. Condition)"
                value={specKey2}
                onChange={(e) => setSpecKey2(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
              />
              <input
                type="text"
                placeholder="Value (e.g. Excellent, Like New)"
                value={specVal2}
                onChange={(e) => setSpecVal2(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-emerald-600/25 cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span>{submitting ? "Publishing Item..." : "Publish Item for Campus Sharing"}</span>
          </button>
        </form>

      </div>
    </div>
  );
};

export default ListItemPage;
