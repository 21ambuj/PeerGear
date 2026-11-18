import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../api/client';
import { 
  BarChart3, 
  TrendingUp, 
  ShieldCheck, 
  Users, 
  ShoppingBag, 
  Sparkles,
  RefreshCw,
  Leaf,
  CheckCircle2
} from 'lucide-react';

const AnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await analyticsApi.getDashboard();
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const summary = data?.summary || {};
  const categories = data?.category_breakdown || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Campus Sustainability & Resource Impact</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">PeerGear Campus Community Metrics</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Live metrics on student resource re-use, cost savings, and 100% refundable security deposit escrow health across our campus network.
          </p>
        </div>

        <button
          onClick={fetchDashboard}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-600" />
          <p className="text-xs">Loading live community data...</p>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">Verified Students</span>
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">{summary.total_students || 0}</p>
              <span className="text-[10px] text-emerald-600 font-semibold">Active Campus Accounts</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">Live Resources</span>
                <ShoppingBag className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">{summary.available_listings || 0}</p>
              <span className="text-[10px] text-slate-400">{summary.total_listings || 0} total shared</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">Active Rentals</span>
                <TrendingUp className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-black text-amber-600">{summary.active_rentals || 0}</p>
              <span className="text-[10px] text-emerald-600 font-semibold">{summary.completed_rentals || 0} completed</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">Protected Escrow</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-emerald-600">₹{summary.escrow_held_deposit || 0}</p>
              <span className="text-[10px] text-emerald-700 font-semibold">100% Refundable Deposits</span>
            </div>
          </div>

          {/* Category Performance */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Category Sharing Activity & Volume</h3>
                <p className="text-xs text-slate-500">Live breakdown of student sharing by resource category</p>
              </div>
            </div>

            {categories.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No completed rental contracts yet. As students start renting, category activity will appear here!</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="pb-3">Category</th>
                      <th className="pb-3">Total Rentals</th>
                      <th className="pb-3">Student Savings / Fee</th>
                      <th className="pb-3">Avg Rental Period</th>
                      <th className="pb-3">Protected Deposit Volume</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {categories.map((c, i) => (
                      <tr key={i} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 font-bold text-slate-900">{c.category}</td>
                        <td className="py-3 text-slate-600">{c.total_rentals} contract{c.total_rentals > 1 ? 's' : ''}</td>
                        <td className="py-3 font-semibold text-emerald-700">₹{c.total_revenue}</td>
                        <td className="py-3 text-slate-600">{c.avg_rental_days} days</td>
                        <td className="py-3 font-semibold text-slate-800">₹{c.total_deposits_managed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Environmental & College Impact Card */}
          <div className="bg-gradient-to-r from-emerald-900 to-teal-950 rounded-3xl p-6 text-white shadow-md flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-emerald-800/60 rounded-2xl">
                <Leaf className="w-7 h-7 text-emerald-300" />
              </div>
              <div>
                <h4 className="font-bold text-base">Promoting a Sustainable, Zero-Wastage Campus</h4>
                <p className="text-xs text-emerald-200 mt-0.5">
                  Every shared textbook, lab coat, calculator, and bicycle saves student money and reduces carbon footprint.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default AnalyticsPage;
