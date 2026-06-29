import React, { useState, useEffect } from 'react';
import axiosInstance from '@core/api/axios';
import { toast } from 'sonner';
import { Wallet, Loader2, Play, CheckCircle, DollarSign, Receipt } from 'lucide-react';

export default function HrmsPayroll() {
    const [tab, setTab] = useState('payroll');
    const [payrollRecords, setPayrollRecords] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [genLoading, setGenLoading] = useState(false);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            try {
                if (tab === 'payroll') {
                    const res = await axiosInstance.get(`/hrms/salaries?month=${month}&year=${year}`);
                    const data = res.data?.data || {};
                    setPayrollRecords(data.records || []);
                    setSummary(data.summary || null);
                } else {
                    const res = await axiosInstance.get('/hrms/expenses?status=Pending');
                    setExpenses(res.data?.data?.expenses || []);
                }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetch();
    }, [tab, month, year]);

    const handleGenerate = async () => {
        setGenLoading(true);
        try {
            await axiosInstance.post('/hrms/salaries/generate', { month, year });
            toast.success('Payroll generated');
            const res = await axiosInstance.get(`/hrms/salaries?month=${month}&year=${year}`);
            const data = res.data?.data || {};
            setPayrollRecords(data.records || []);
            setSummary(data.summary || null);
        } catch (e) { toast.error(e.response?.data?.message || 'Generation failed'); }
        finally { setGenLoading(false); }
    };

    const handleApprovePayroll = async () => {
        try {
            await axiosInstance.post('/hrms/salaries/approve', { month, year });
            toast.success('Payroll approved');
            const res = await axiosInstance.get(`/hrms/salaries?month=${month}&year=${year}`);
            setPayrollRecords(res.data?.data?.records || []);
        } catch (e) { toast.error(e.response?.data?.message || 'Approval failed'); }
    };

    const handleMarkPaid = async () => {
        try {
            await axiosInstance.post('/hrms/salaries/mark-paid', { month, year });
            toast.success('Payroll marked as paid');
            const res = await axiosInstance.get(`/hrms/salaries?month=${month}&year=${year}`);
            setPayrollRecords(res.data?.data?.records || []);
        } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    };

    const handleExpenseAction = async (id, action, approvedAmount) => {
        try {
            let rejectionReason = '';
            if (action === 'Rejected') {
                rejectionReason = window.prompt("Please provide a reason for rejection:");
                if (rejectionReason === null) return; // User cancelled
            }
            await axiosInstance.post(`/hrms/expenses/${id}/action`, { action, approvedAmount, rejectionReason });
            toast.success(`Expense ${action.toLowerCase()}`);
            setExpenses(prev => prev.filter(e => e._id !== id));
        } catch (e) { toast.error(e.response?.data?.message || 'Action failed'); }
    };

    const hasDrafts = payrollRecords.some(r => r.status === 'Draft');
    const hasApproved = payrollRecords.some(r => r.status === 'Approved');

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">Payroll & Expenses</h1>

            <div className="flex gap-2">
                <button onClick={() => setTab('payroll')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === 'payroll' ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'}`}>Payroll</button>
                <button onClick={() => setTab('expenses')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === 'expenses' ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'}`}>Pending Expenses</button>
            </div>

            {tab === 'payroll' && (
                <>
                    <div className="flex flex-wrap gap-3 items-center">
                        <select value={month} onChange={e => setMonth(Number(e.target.value))} className="h-10 px-3 border border-slate-200 rounded-xl text-sm bg-white">
                            {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m,i) => <option key={i} value={i+1}>{m}</option>)}
                        </select>
                        <select value={year} onChange={e => setYear(Number(e.target.value))} className="h-10 px-3 border border-slate-200 rounded-xl text-sm bg-white">
                            {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <button onClick={handleGenerate} disabled={genLoading}
                            className="flex items-center gap-2 px-4 h-10 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl text-sm disabled:opacity-50">
                            <Play className="w-4 h-4" />{genLoading ? 'Generating...' : 'Generate Payroll'}
                        </button>
                        {hasDrafts && (
                            <button onClick={handleApprovePayroll} className="flex items-center gap-2 px-4 h-10 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl text-sm">
                                <CheckCircle className="w-4 h-4" /> Approve All
                            </button>
                        )}
                        {hasApproved && (
                            <button onClick={handleMarkPaid} className="flex items-center gap-2 px-4 h-10 bg-violet-500 hover:bg-violet-600 text-white font-medium rounded-xl text-sm">
                                <DollarSign className="w-4 h-4" /> Mark Paid
                            </button>
                        )}
                    </div>

                    {summary && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                                <p className="text-xs text-slate-500">Employees</p><p className="text-2xl font-bold text-slate-900">{summary.count}</p>
                            </div>
                            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                                <p className="text-xs text-slate-500">Total Salary</p><p className="text-2xl font-bold text-emerald-600">₹{summary.totalNetSalary?.toLocaleString()}</p>
                            </div>
                            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                                <p className="text-xs text-slate-500">Reimbursements</p><p className="text-2xl font-bold text-blue-600">₹{summary.totalReimbursements?.toLocaleString()}</p>
                            </div>
                            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                                <p className="text-xs text-slate-500">LOP Deductions</p><p className="text-2xl font-bold text-red-600">₹{summary.totalLopDeduction?.toLocaleString()}</p>
                            </div>
                        </div>
                    )}
                </>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
                ) : tab === 'payroll' ? (
                    payrollRecords.length === 0 ? (
                        <div className="text-center p-12"><Wallet className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">No payroll for this period. Click "Generate Payroll" to create.</p></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead><tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Employee</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Present</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase">LOP</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Deductions</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Reimb.</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Net Salary</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                                </tr></thead>
                                <tbody>
                                    {payrollRecords.map(r => (
                                        <tr key={r._id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                            <td className="px-5 py-3.5 font-medium text-slate-900">{r.employeeId?.adminId?.name || '—'}</td>
                                            <td className="px-5 py-3.5">{r.presentDays}/{r.totalWorkingDays}</td>
                                            <td className="px-5 py-3.5 text-red-600">{r.lopDays || 0}</td>
                                            <td className="px-5 py-3.5 text-red-600">₹{((r.shortHourDeduction || 0) + (r.lopDeduction || 0)).toLocaleString()}</td>
                                            <td className="px-5 py-3.5 text-blue-600">₹{r.reimbursements?.toLocaleString() || 0}</td>
                                            <td className="px-5 py-3.5 font-bold text-emerald-600">₹{r.netSalary?.toLocaleString() || 0}</td>
                                            <td className="px-5 py-3.5"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${r.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : r.status === 'Approved' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{r.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                ) : (
                    expenses.length === 0 ? (
                        <div className="text-center p-12"><Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">No pending expenses</p></div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {expenses.map(e => (
                                <div key={e._id} className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div>
                                        <p className="font-medium text-slate-900">{e.employeeId?.adminId?.name || 'Employee'}</p>
                                        <p className="text-sm text-slate-500">{e.purpose} · {new Date(e.visitDate).toLocaleDateString('en-IN')}</p>
                                        <p className="text-xs text-slate-400">Travel: ₹{e.travelCost} | Hotel: ₹{e.hotelCost} | Food: ₹{e.foodCost} | Other: ₹{e.otherExpenses} | <strong>Total: ₹{e.totalAmount}</strong></p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleExpenseAction(e._id, 'Approved', e.totalAmount)} className="px-4 h-9 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium">Approve</button>
                                        <button onClick={() => handleExpenseAction(e._id, 'Rejected')} className="px-4 h-9 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium">Reject</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
