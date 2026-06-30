import React, { useState, useEffect, useRef, useMemo } from 'react';
import axiosInstance from '@core/api/axios';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Clock, Wallet, CalendarDays, Loader2, TrendingUp, AlertCircle, Search, ArrowRight, Package, User, Building2, Utensils, Grid, PlusCircle } from 'lucide-react';
import { adminAPI } from '@food/api';

/* ───────── live date hook ───────── */
function useLiveDate() {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        // Calculate ms until next midnight so the date ticks over exactly at 00:00
        const msUntilMidnight = () => {
            const tomorrow = new Date();
            tomorrow.setHours(24, 0, 0, 0);
            return tomorrow - new Date();
        };

        let timeout;
        const schedule = () => {
            setNow(new Date());
            timeout = setTimeout(schedule, msUntilMidnight());
        };
        timeout = setTimeout(schedule, msUntilMidnight());

        return () => clearTimeout(timeout);
    }, []);

    const formatted = now.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).toUpperCase();

    return formatted;
}

export default function HrmsDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [pendingRequests, setPendingRequests] = useState(0);
    const [loading, setLoading] = useState(true);

    /* ── search state ── */
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef(null);

    const dateStr = useLiveDate();

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

    /* ── debounced search ── */
    useEffect(() => {
        if (searchQuery.trim().length < 2) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        const timer = setTimeout(async () => {
            try {
                const [empRes, jrRes] = await Promise.all([
                    axiosInstance.get(`/hrms/employees?status=all&limit=10&search=${encodeURIComponent(searchQuery)}`),
                    axiosInstance.get(`/hrms/joining-requests?status=all&limit=10&search=${encodeURIComponent(searchQuery)}`)
                ]);

                const emps = empRes.data?.data?.employees || [];
                const requests = jrRes.data?.data?.requests || [];

                const results = [];

                emps.forEach(emp => {
                    results.push({
                        id: emp._id,
                        type: 'Employee',
                        title: emp.adminId?.name || 'Unnamed Employee',
                        description: `ID: ${emp.employeeId || '-'} | ${emp.designation || ''} (${emp.department || ''}) [${emp.status}]`,
                        path: `/ecs/hrms/employees?search=${encodeURIComponent(emp.adminId?.name || '')}`
                    });
                });

                requests.forEach(req => {
                    results.push({
                        id: req._id,
                        type: 'Joining Request',
                        title: req.fullName || 'Unnamed Applicant',
                        description: `ID: ${req.requestId || '-'} | Dept: ${req.preferredDepartment || ''} | Status: ${req.status}`,
                        path: `/ecs/hrms/joining-requests?status=all&search=${encodeURIComponent(req.fullName || '')}`
                    });
                });

                setSearchResults(results);
            } catch (err) {
                console.error('Error searching HRMS:', err);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 350);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    /* ── close results on outside click ── */
    useEffect(() => {
        const handleClick = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleResultClick = (result) => {
        setShowResults(false);
        setSearchQuery('');
        navigate(result.path);
    };

    const groupedResults = useMemo(() => {
        const groups = {};
        searchResults.forEach((r) => {
            if (!groups[r.type]) groups[r.type] = [];
            groups[r.type].push(r);
        });
        return groups;
    }, [searchResults]);

    const resultIcon = (type) => {
        switch (type) {
            case 'Employee': return <Users className="w-4 h-4 text-orange-600" />;
            case 'Joining Request': return <UserPlus className="w-4 h-4 text-orange-600" />;
            default: return <Search className="w-4 h-4 text-slate-400" />;
        }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;

    const cards = [
        { label: 'Active Employees', value: stats?.totalActive || 0, icon: Users, color: 'text-orange-600 bg-orange-50', path: '/ecs/hrms/employees' },
        { label: 'Pending Requests', value: pendingRequests, icon: UserPlus, color: 'text-orange-600 bg-orange-50', path: '/ecs/hrms/joining-requests', highlight: pendingRequests > 0 },
        { label: 'Suspended', value: stats?.totalSuspended || 0, icon: AlertCircle, color: 'text-orange-600 bg-orange-50', path: '/ecs/hrms/employees' },
        { label: 'Total Employees', value: stats?.totalEmployees || 0, icon: TrendingUp, color: 'text-orange-600 bg-orange-50', path: '/ecs/hrms/employees' },
    ];

    return (
        <div className="space-y-6">
            {/* ── Title ── */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">HRMS Dashboard</h1>
                <p className="text-sm text-slate-500 mt-1">Overview of your workforce</p>
            </div>

            {/* ── Dashboard Sub-Header ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-3 flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                {/* Search */}
                <div className="relative flex-1 w-full sm:max-w-md" ref={searchRef}>
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
                        <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
                        <input
                            type="text"
                            placeholder="Search employees or approvals…"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setShowResults(true);
                            }}
                            onFocus={() => setShowResults(true)}
                            className="bg-transparent w-full text-sm text-slate-700 placeholder:text-slate-400 placeholder:uppercase placeholder:tracking-wider placeholder:text-xs focus:outline-none"
                        />
                        {isSearching && <Loader2 className="w-4 h-4 animate-spin text-orange-500 ml-2 shrink-0" />}
                    </div>

                    {/* Search Results Dropdown */}
                    {showResults && searchQuery.trim().length >= 2 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
                            {isSearching ? (
                                <div className="flex items-center justify-center py-8 gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                                    <span className="text-sm text-slate-500">Searching…</span>
                                </div>
                            ) : searchResults.length === 0 ? (
                                <div className="text-center py-8">
                                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm text-slate-500">No results for "{searchQuery}"</p>
                                </div>
                            ) : (
                                <div className="py-2">
                                    <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                        {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                                    </p>
                                    {Object.entries(groupedResults).map(([type, results]) => (
                                        <div key={type}>
                                            <p className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-orange-500">{type}s</p>
                                            {results.map((result, idx) => (
                                                <button
                                                    key={`${type}-${idx}`}
                                                    onClick={() => handleResultClick(result)}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 transition-colors text-left group"
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors shrink-0">
                                                        {resultIcon(result.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-slate-800 truncate">{result.title}</p>
                                                        <p className="text-xs text-slate-400 truncate">{result.description}</p>
                                                    </div>
                                                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-orange-500 shrink-0 transition-colors" />
                                                </button>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right side: Status + Date */}
                <div className="flex items-center gap-3 shrink-0">
                    {/* System Active Badge */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">System Active</span>
                    </div>

                    {/* Date Badge */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full">
                        <CalendarDays className="w-3.5 h-3.5 text-orange-500" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">{dateStr}</span>
                    </div>
                </div>
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
