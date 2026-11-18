import React, { useState } from 'react';
import { itemsApi } from '../api/client';
import { useToast } from '../context/ToastContext';
import { Trash2, AlertTriangle, X } from 'lucide-react';

const DeleteItemModal = ({ item, onClose, onDeleted }) => {
  const { showToast } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setError('');
    try {
      setDeleting(true);
      await itemsApi.delete(item._id);
      showToast(`'${item.title}' was deleted successfully.`, 'success', 'Listing Removed');
      window.dispatchEvent(new Event('campusshare-item-created'));
      if (onDeleted) onDeleted();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to delete listing. Please try again.';
      setError(msg);
      showToast(msg, 'error', 'Delete Failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Warning Icon */}
        <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
          <Trash2 className="w-7 h-7" />
        </div>

        <h3 className="text-lg font-black text-slate-900 text-center mb-1">
          Delete Listing?
        </h3>
        
        <p className="text-xs text-slate-500 text-center mb-4 leading-relaxed">
          Are you sure you want to permanently delete <strong className="text-slate-800 font-bold">"{item.title}"</strong>? It will be removed from the campus catalog immediately and peers will no longer be able to rent it.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            Keep Listing
          </button>
          
          <button
            type="button"
            disabled={deleting}
            onClick={handleDelete}
            className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{deleting ? 'Deleting...' : 'Yes, Delete'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default DeleteItemModal;
