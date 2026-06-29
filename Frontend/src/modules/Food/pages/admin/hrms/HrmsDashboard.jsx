import React, { useState, useEffect } from 'react';
import axiosInstance from '@core/api/axios';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Clock, Wallet, CalendarDays, Loader2, TrendingUp, AlertCircle } from 'lucide-react';

export default function HrmsDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [pendingRequests, setPendingRequests] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const [statsRes, jrRes] = await Promise.all([
                    axiosInstance.get('/hrms/employees/stats').catch(() => ({ data: { data: null } })),
                    axiosInstance.get('/hrms/joining-requests?status=Pending&limit=1').catch(() => ({ data: { data: { counts: {} } } }))
                ]);
                setStats(statsRes.data?.data || null);
                setPendingRequests(jrRes.data?.data?.counts?.pending || 0);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetch();
    }, []);

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;

    const cards = [
        { label: 'Active Employees', value: stats?.totalActive || 0, icon: Users, color: 'text-emerald-600 bg-emerald-50', path: 'employees' },
        { label: 'Pending Requests', value: pendingRequests, icon: UserPlus, color: 'text-orange-600 bg-orange-50', path: 'joining-requests', highlight: pendingRequests > 0 },
        { label: 'Suspended', value: stats?.totalSuspended || 0, icon: AlertCircle, color: 'text-amber-600 bg-amber-50', path: 'employees' },
        { label: 'Total Employees', value: stats?.totalEmployees || 0, icon: TrendingUp, color: 'text-blue-600 bg-blue-50', path: 'employees' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">HRMS Dashboard</h1>
                <p className="text-sm text-slate-500 mt-1">Overview of your workforce</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {cards.map((card, i) => (
                    <button key={i} onClick={() => navigate(card.path)}
                        className={`bg-white rounded-2xl border shadow-sm p-5 text-left hover:shadow-md transition-all group ${card.highlight ? 'border-orange-300 ring-2 ring-orange-100' : 'border-slate-200'}`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color.split(' ')[1]}`}>
                                <card.icon className={`w-5 h-5 ${card.color.split(' ')[0]}`} />
                            </div>
                            {card.highlight && <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />}
                        </div>
                        <p className="text-3xl font-bold text-slate-900">{card.value}</p>
                        <p className="text-sm text-slate-500 mt-0.5">{card.label}</p>
                    </button>
                ))}
            </div>

            {/* Department Breakdown */}
            {stats?.departments?.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="font-semibold text-slate-900 mb-4">Department Breakdown</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {stats.departments.map((dept, i) => (
                            <div key={i} className="bg-slate-50 rounded-xl p-4 text-center">
                                <p className="text-2xl font-bold text-slate-900">{dept.count}</p>
                                <p className="text-sm text-slate-500 mt-0.5">{dept._id || 'Unassigned'}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
