import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@core/context/AuthContext';
import axiosInstance from '@core/api/axios';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Clock, CalendarDays, Wallet, FileCheck, LogIn, LogOut, Loader2, TrendingUp, Timer } from 'lucide-react';

export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [attendance, setAttendance] = useState(null);
    const [leaveBalance, setLeaveBalance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [elapsed, setElapsed] = useState('0:00');

    const fetchData = useCallback(async () => {
        try {
            const [attRes, leaveRes] = await Promise.all([
                axiosInstance.get('/hrms/attendance/me').catch(() => ({ data: { data: [] } })),
                axiosInstance.get('/hrms/leaves/balance').catch(() => ({ data: { data: null } }))
            ]);
            const records = attRes.data?.data || [];
            if (records.length > 0) {
                const latest = records[0];
                const today = new Date().toDateString();
                if (new Date(latest.date).toDateString() === today) setAttendance(latest);
            }
            setLeaveBalance(leaveRes.data?.data || null);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        if (!attendance?.checkInTime || attendance?.checkOutTime) return;
        const update = () => {
            const diff = Date.now() - new Date(attendance.checkInTime).getTime();
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            setElapsed(`${h}:${String(m).padStart(2, '0')}`);
        };
        update();
        const interval = setInterval(update, 60000);
        return () => clearInterval(interval);
    }, [attendance]);

    const handleCheckIn = async () => {
        setActionLoading(true);
        try {
            const res = await axiosInstance.post('/hrms/attendance/check-in');
            setAttendance(res.data.data);
            toast.success('Checked in successfully!');
        } catch (e) { toast.error(e.response?.data?.message || 'Check-in failed'); }
        finally { setActionLoading(false); }
    };

    const handleCheckOut = async () => {
        setActionLoading(true);
        try {
            const res = await axiosInstance.post('/hrms/attendance/check-out');
            setAttendance(res.data.data);
            toast.success('Checked out successfully!');
        } catch (e) { toast.error(e.response?.data?.message || 'Check-out failed'); }
        finally { setActionLoading(false); }
    };

    const firstName = user?.name?.split(' ')[0] || 'Employee';

    if (loading) {
        return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;
    }

    const isCheckedIn = attendance?.checkInTime && !attendance?.checkOutTime;
    const isDone = attendance?.checkOutTime;

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-6 sm:p-8 text-white shadow-xl shadow-orange-500/15">
                <h1 className="text-2xl sm:text-3xl font-bold">Welcome back, {firstName}!</h1>
                <p className="text-orange-100 mt-1 text-sm sm:text-base">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {/* Check-in Card */}
                <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${isDone ? 'border-slate-200' : isCheckedIn ? 'border-orange-300' : 'border-orange-200'}`}>
                    <div className={`h-1 ${isDone ? 'bg-slate-300' : 'bg-gradient-to-r from-orange-500 to-amber-500'}`} />
                    <div className="p-6 text-center">
                        <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center border-4 ${
                            isDone ? 'border-slate-100 bg-slate-50' : 'border-orange-100 bg-orange-50'
                        }`}>
                            {isDone ? (
                                <span className="text-base font-bold text-slate-500">
                                    {Math.floor(attendance.workingHours)}h {Math.round((attendance.workingHours % 1) * 60)}m
                                </span>
                            ) : isCheckedIn ? (
                                <span className="text-lg font-bold text-orange-600">{elapsed}</span>
                            ) : (
                                <Timer className="w-8 h-8 text-orange-500" />
                            )}
                        </div>
                        <h3 className="font-bold text-slate-900 text-lg mb-1">
                            {isDone ? 'Shift Complete' : isCheckedIn ? 'Working' : 'Not Checked In'}
                        </h3>
                        <p className="text-sm text-slate-500 mb-5">
                            {isDone
                                ? `Checked out at ${new Date(attendance.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                : isCheckedIn
                                    ? `Since ${new Date(attendance.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                    : 'Start your workday'}
                        </p>
                        {!attendance?.checkInTime && (
                            <button onClick={handleCheckIn} disabled={actionLoading}
                                className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                                {actionLoading ? 'Processing...' : 'Check In'}
                            </button>
                        )}
                        {isCheckedIn && (
                            <button onClick={handleCheckOut} disabled={actionLoading}
                                className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                                {actionLoading ? 'Processing...' : 'Check Out'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Leave Balance */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-orange-500 to-amber-500" />
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                                <CalendarDays className="w-5 h-5 text-orange-600" />
                            </div>
                            <h3 className="font-bold text-slate-900">Leave Balance</h3>
                        </div>
                        {leaveBalance ? (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-500">Monthly Allowed</span>
                                    <span className="font-bold text-slate-900">{leaveBalance.monthly?.allowed || 4}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-500">Used This Month</span>
                                    <span className="font-bold text-orange-500">{leaveBalance.monthly?.used || 0}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                    <span className="text-sm font-medium text-slate-700">Remaining</span>
                                    <span className="font-bold text-lg text-orange-600">{leaveBalance.monthly?.remaining || 4}</span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400">No leave data available</p>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden md:col-span-2 xl:col-span-1">
                    <div className="h-1 bg-gradient-to-r from-orange-500 to-amber-500" />
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-orange-600" />
                            </div>
                            <h3 className="font-bold text-slate-900">Quick Actions</h3>
                        </div>
                        <div className="space-y-2.5">
                            {[
                                { label: 'Apply for Leave', path: '/hrms/leave', icon: CalendarDays, color: 'text-orange-600 bg-orange-50' },
                                { label: 'Submit Expense', path: '/hrms/expenses', icon: Wallet, color: 'text-orange-600 bg-orange-50' },
                                { label: 'View Attendance', path: '/hrms/attendance', icon: Clock, color: 'text-orange-600 bg-orange-50' },
                                { label: 'View Payslip', path: '/hrms/salary', icon: FileCheck, color: 'text-orange-600 bg-orange-50' },
                            ].map((item) => (
                                <button key={item.path} onClick={() => navigate(item.path)}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-all text-left group">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.color}`}>
                                        <item.icon className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
