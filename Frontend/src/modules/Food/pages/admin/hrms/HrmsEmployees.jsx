import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '@core/api/axios';
import { toast } from 'sonner';
import { Users, Loader2, Search, Eye, Plus, ChevronLeft, ChevronRight, X, UserPlus } from 'lucide-react';

export default function HrmsEmployees() {
    const [employees, setEmployees] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showOnboard, setShowOnboard] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [onboardLoading, setOnboardLoading] = useState(false);

    const [onboardForm, setOnboardForm] = useState({
        fullName: '', email: '', password: '', phone: '', department: '', designation: '',
        employmentType: 'Full-Time', joiningDate: new Date().toISOString().split('T')[0],
        shift: 'General', ctc: '', hrmsRole: 'Employee', officeLocation: ''
    });

    const fetchEmployees = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: 20, status: 'Active' });
            if (search) params.append('search', search);
            const res = await axiosInstance.get(`/hrms/employees?${params}`);
            const data = res.data?.data || {};
            setEmployees(data.employees || []);
            setPagination(data.pagination || { page: 1, total: 0, totalPages: 0 });
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [search]);

    useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

    const handleOnboard = async () => {
        if (!onboardForm.fullName || !onboardForm.email || !onboardForm.password || !onboardForm.joiningDate) {
            return toast.error('Name, email, password, and joining date are required');
        }
        setOnboardLoading(true);
        try {
            await axiosInstance.post('/hrms/employees', { ...onboardForm, ctc: Number(onboardForm.ctc) || 0 });
            toast.success('Employee onboarded successfully');
            setShowOnboard(false);
            setOnboardForm({ fullName: '', email: '', password: '', phone: '', department: '', designation: '', employmentType: 'Full-Time', joiningDate: new Date().toISOString().split('T')[0], shift: 'General', ctc: '', hrmsRole: 'Employee', officeLocation: '' });
            fetchEmployees();
        } catch (e) { toast.error(e.response?.data?.message || 'Onboarding failed'); }
        finally { setOnboardLoading(false); }
    };

    const handleStatusChange = async (id, status) => {
        try {
            await axiosInstance.patch(`/hrms/employees/${id}/status`, { status });
            toast.success(`Employee ${status.toLowerCase()}`);
            fetchEmployees();
            setSelectedEmployee(null);
        } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    };

    const inputClass = "w-full h-10 px-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30";

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Employee Management</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage your active workforce</p>
                </div>
                <button onClick={() => setShowOnboard(!showOnboard)}
                    className="flex items-center gap-2 px-4 h-10 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl shadow-sm transition-all text-sm">
                    {showOnboard ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    {showOnboard ? 'Cancel' : 'Direct Onboard'}
                </button>
            </div>

            {/* Direct Onboard Form */}
            {showOnboard && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="font-semibold text-slate-900 mb-4">Direct Employee Onboarding</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div><label className="text-xs font-medium text-slate-600 mb-1 block">Full Name *</label><input className={inputClass} value={onboardForm.fullName} onChange={e => setOnboardForm(p => ({ ...p, fullName: e.target.value }))} /></div>
                        <div><label className="text-xs font-medium text-slate-600 mb-1 block">Email *</label><input type="email" className={inputClass} value={onboardForm.email} onChange={e => setOnboardForm(p => ({ ...p, email: e.target.value }))} /></div>
                        <div><label className="text-xs font-medium text-slate-600 mb-1 block">Password *</label><input type="password" className={inputClass} value={onboardForm.password} onChange={e => setOnboardForm(p => ({ ...p, password: e.target.value }))} /></div>
                        <div><label className="text-xs font-medium text-slate-600 mb-1 block">Phone</label><input className={inputClass} value={onboardForm.phone} onChange={e => setOnboardForm(p => ({ ...p, phone: e.target.value }))} /></div>
                        <div><label className="text-xs font-medium text-slate-600 mb-1 block">Department</label><input className={inputClass} value={onboardForm.department} onChange={e => setOnboardForm(p => ({ ...p, department: e.target.value }))} /></div>
                        <div><label className="text-xs font-medium text-slate-600 mb-1 block">Designation</label><input className={inputClass} value={onboardForm.designation} onChange={e => setOnboardForm(p => ({ ...p, designation: e.target.value }))} /></div>
                        <div><label className="text-xs font-medium text-slate-600 mb-1 block">CTC (Annual ₹)</label><input type="number" className={inputClass} value={onboardForm.ctc} onChange={e => setOnboardForm(p => ({ ...p, ctc: e.target.value }))} /></div>
                        <div><label className="text-xs font-medium text-slate-600 mb-1 block">Joining Date *</label><input type="date" className={inputClass} value={onboardForm.joiningDate} onChange={e => setOnboardForm(p => ({ ...p, joiningDate: e.target.value }))} /></div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 mb-1 block">HRMS Role</label>
                            <select className={inputClass} value={onboardForm.hrmsRole} onChange={e => setOnboardForm(p => ({ ...p, hrmsRole: e.target.value }))}>
                                <option>Employee</option><option>Manager</option><option>HR</option>
                            </select>
                        </div>
                    </div>
                    <button onClick={handleOnboard} disabled={onboardLoading}
                        className="mt-4 px-6 h-10 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all text-sm disabled:opacity-50">
                        {onboardLoading ? 'Processing...' : 'Onboard Employee'}
                    </button>
                </div>
            )}

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, ID, department..."
                    className="w-full h-11 pl-11 pr-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 bg-white" />
            </div>

            {/* Employee Detail */}
            {selectedEmployee && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-slate-900">{selectedEmployee.adminId?.name} <span className="text-sm text-slate-400">({selectedEmployee.employeeId})</span></h2>
                        <button onClick={() => setSelectedEmployee(null)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-400" /></button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                        {[
                            { l: 'Email', v: selectedEmployee.adminId?.email },
                            { l: 'Phone', v: selectedEmployee.adminId?.phone },
                            { l: 'Department', v: selectedEmployee.department },
                            { l: 'Designation', v: selectedEmployee.designation },
                            { l: 'HRMS Role', v: selectedEmployee.hrmsRole },
                            { l: 'Employment', v: selectedEmployee.employmentType },
                            { l: 'CTC', v: selectedEmployee.ctc ? `₹${selectedEmployee.ctc.toLocaleString()}` : '—' },
                            { l: 'Monthly Salary', v: selectedEmployee.monthlySalary ? `₹${selectedEmployee.monthlySalary.toLocaleString()}` : '—' },
                            { l: 'Joining Date', v: selectedEmployee.joiningDate ? new Date(selectedEmployee.joiningDate).toLocaleDateString('en-IN') : '—' },
                            { l: 'Status', v: selectedEmployee.status },
                            { l: 'Manager', v: selectedEmployee.managerId?.adminId?.name || '—' },
                            { l: 'Shift', v: selectedEmployee.shift },
                        ].map((f, i) => (
                            <div key={i}><p className="text-xs text-slate-500">{f.l}</p><p className="font-medium text-slate-900">{f.v || '—'}</p></div>
                        ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2 flex-wrap">
                        {selectedEmployee.status === 'Active' && (
                            <button onClick={() => handleStatusChange(selectedEmployee._id, 'Suspended')} className="px-4 h-9 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-all">Suspend</button>
                        )}
                        {selectedEmployee.status === 'Suspended' && (
                            <button onClick={() => handleStatusChange(selectedEmployee._id, 'Active')} className="px-4 h-9 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-all">Reactivate</button>
                        )}
                        {selectedEmployee.status !== 'Terminated' && (
                            <button onClick={() => handleStatusChange(selectedEmployee._id, 'Terminated')} className="px-4 h-9 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-all">Terminate</button>
                        )}
                    </div>
                </div>
            )}

            {/* Employee Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
                ) : employees.length === 0 ? (
                    <div className="text-center p-12">
                        <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">No employees found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-5 py-3 text-left font-semibold text-slate-600 text-xs uppercase">ID</th>
                                <th className="px-5 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Name</th>
                                <th className="px-5 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Department</th>
                                <th className="px-5 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Designation</th>
                                <th className="px-5 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Role</th>
                                <th className="px-5 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Status</th>
                                <th className="px-5 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Action</th>
                            </tr></thead>
                            <tbody>
                                {employees.map(emp => (
                                    <tr key={emp._id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                        <td className="px-5 py-3.5 font-mono text-xs text-slate-600">{emp.employeeId}</td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-xs font-bold">
                                                    {emp.adminId?.name?.[0]?.toUpperCase() || 'E'}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900">{emp.adminId?.name}</p>
                                                    <p className="text-xs text-slate-500">{emp.adminId?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-slate-600">{emp.department || '—'}</td>
                                        <td className="px-5 py-3.5 text-slate-600">{emp.designation || '—'}</td>
                                        <td className="px-5 py-3.5"><span className={`px-2 py-0.5 rounded text-xs font-medium ${emp.hrmsRole === 'Manager' ? 'bg-blue-50 text-blue-700' : emp.hrmsRole === 'HR' ? 'bg-violet-50 text-violet-700' : 'bg-slate-100 text-slate-600'}`}>{emp.hrmsRole}</span></td>
                                        <td className="px-5 py-3.5"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${emp.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{emp.status}</span></td>
                                        <td className="px-5 py-3.5">
                                            <button onClick={() => setSelectedEmployee(emp)} className="flex items-center gap-1.5 text-orange-600 hover:text-orange-700 font-medium text-xs">
                                                <Eye className="w-3.5 h-3.5" /> View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
                        <span className="text-sm text-slate-500">Page {pagination.page} of {pagination.totalPages}</span>
                        <div className="flex gap-2">
                            <button onClick={() => fetchEmployees(pagination.page - 1)} disabled={pagination.page <= 1} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                            <button onClick={() => fetchEmployees(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
