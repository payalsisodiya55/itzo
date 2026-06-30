import React, { useState, useEffect } from 'react';
import axiosInstance from '@core/api/axios';
import { toast } from 'sonner';
import { Receipt, Loader2, Plus, X } from 'lucide-react';

export default function Expense() {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [form, setForm] = useState({
        visitDate: '', purpose: '', travelDistanceKm: '', travelCost: '', hotelCost: '', foodCost: '', otherExpenses: '', remarks: ''
    });

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get('/hrms/expenses/me');
            setExpenses(res.data?.data?.expenses || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchExpenses(); }, []);

    const handleSubmit = async () => {
        if (!form.visitDate || !form.purpose?.trim()) return toast.error('Visit date and purpose are required');
        setSubmitLoading(true);
        try {
            await axiosInstance.post('/hrms/expenses', {
                ...form,
                travelDistanceKm: Number(form.travelDistanceKm) || 0,
                travelCost: Number(form.travelCost) || 0,
                hotelCost: Number(form.hotelCost) || 0,
                foodCost: Number(form.foodCost) || 0,
                otherExpenses: Number(form.otherExpenses) || 0,
            });
            toast.success('Expense submitted');
            setShowForm(false);
            setForm({ visitDate: '', purpose: '', travelDistanceKm: '', travelCost: '', hotelCost: '', foodCost: '', otherExpenses: '', remarks: '' });
            fetchExpenses();
        } catch (e) { toast.error(e.response?.data?.message || 'Failed to submit'); }
        finally { setSubmitLoading(false); }
    };

    const total = (e) => (Number(e.travelCost) || 0) + (Number(e.hotelCost) || 0) + (Number(e.foodCost) || 0) + (Number(e.otherExpenses) || 0);
    const statusBadge = (s) => {
        const styles = { Pending: 'bg-amber-50 text-amber-700', Approved: 'bg-emerald-50 text-emerald-700', Rejected: 'bg-red-50 text-red-700', Reimbursed: 'bg-orange-50 text-orange-700' };
        return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${styles[s] || ''}`}>{s}</span>;
    };
    const inputClass = "w-full h-10 px-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30";

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Travel & Visit Expenses</h1>
                    <p className="text-sm text-slate-500 mt-1">Submit and track your expense claims</p>
                </div>
                <button onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-4 h-10 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl shadow-sm transition-all text-sm">
                    {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {showForm ? 'Cancel' : 'New Expense'}
                </button>
            </div>

            {showForm && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="font-semibold text-slate-900 mb-4">Submit Expense Claim</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs font-medium text-slate-600 mb-1 block">Visit Date *</label>
                            <input type="date" className={inputClass} value={form.visitDate} onChange={e => setForm(p => ({ ...p, visitDate: e.target.value }))} />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="text-xs font-medium text-slate-600 mb-1 block">Purpose *</label>
                            <input className={inputClass} value={form.purpose} onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))} placeholder="e.g., Client meeting at Bangalore" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 mb-1 block">Travel Distance (km)</label>
                            <input type="number" className={inputClass} value={form.travelDistanceKm} onChange={e => setForm(p => ({ ...p, travelDistanceKm: e.target.value }))} placeholder="0" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 mb-1 block">Travel Cost (₹)</label>
                            <input type="number" className={inputClass} value={form.travelCost} onChange={e => setForm(p => ({ ...p, travelCost: e.target.value }))} placeholder="0" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 mb-1 block">Hotel Cost (₹)</label>
                            <input type="number" className={inputClass} value={form.hotelCost} onChange={e => setForm(p => ({ ...p, hotelCost: e.target.value }))} placeholder="0" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 mb-1 block">Food Cost (₹)</label>
                            <input type="number" className={inputClass} value={form.foodCost} onChange={e => setForm(p => ({ ...p, foodCost: e.target.value }))} placeholder="0" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 mb-1 block">Other Expenses (₹)</label>
                            <input type="number" className={inputClass} value={form.otherExpenses} onChange={e => setForm(p => ({ ...p, otherExpenses: e.target.value }))} placeholder="0" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 mb-1 block">Remarks</label>
                            <input className={inputClass} value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} placeholder="Additional notes" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-700">Total: ₹{total(form).toLocaleString()}</span>
                        <button onClick={handleSubmit} disabled={submitLoading}
                            className="px-6 h-10 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition-all text-sm disabled:opacity-50">
                            {submitLoading ? 'Submitting...' : 'Submit Expense'}
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
                ) : expenses.length === 0 ? (
                    <div className="text-center p-12">
                        <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">No expense claims yet</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-5 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Date</th>
                                <th className="px-5 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Purpose</th>
                                <th className="px-5 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Travel</th>
                                <th className="px-5 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Hotel</th>
                                <th className="px-5 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Food</th>
                                <th className="px-5 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Total</th>
                                <th className="px-5 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Status</th>
                            </tr></thead>
                            <tbody>
                                {expenses.map(e => (
                                    <tr key={e._id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                        <td className="px-5 py-3.5 font-medium text-slate-900">{new Date(e.visitDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                                        <td className="px-5 py-3.5 text-slate-600 max-w-[200px] truncate">{e.purpose}</td>
                                        <td className="px-5 py-3.5 text-slate-600">₹{e.travelCost || 0}</td>
                                        <td className="px-5 py-3.5 text-slate-600">₹{e.hotelCost || 0}</td>
                                        <td className="px-5 py-3.5 text-slate-600">₹{e.foodCost || 0}</td>
                                        <td className="px-5 py-3.5 font-bold text-slate-900">₹{e.totalAmount?.toLocaleString() || 0}</td>
                                        <td className="px-5 py-3.5">
                                            {statusBadge(e.status)}
                                            {e.status === 'Rejected' && e.rejectionReason && (
                                                <p className="text-[10px] text-red-500 mt-1 max-w-[150px] truncate" title={e.rejectionReason}>Reason: {e.rejectionReason}</p>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
