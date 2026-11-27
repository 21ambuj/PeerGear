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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in-up"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-zinc-800 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Warning Icon */}
        <div className="w-14 h-14 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
          <Trash2 className="w-7 h-7" />
        </div>

        <h3 className="text-lg font-black text-slate-900 dark:text-zinc-100 text-center mb-1">
          Delete Listing?
        </h3>
        
        <p className="text-xs text-slate-500 dark:text-zinc-400 text-center mb-4 leading-relaxed">
          Are you sure you want to permanently delete <strong className="text-slate-800 dark:text-zinc-200 font-bold">"{item.title}"</strong>? It will be removed from the campus catalog immediately and peers will no longer be able to rent it.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 text-xs font-bold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-xl transition cursor-pointer"
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
