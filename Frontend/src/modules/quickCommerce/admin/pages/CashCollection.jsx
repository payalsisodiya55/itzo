import React, { useState, useMemo, useEffect } from 'react';
import Pagination from '@shared/components/ui/Pagination';
import { adminApi } from '../services/adminApi';
import { toast } from 'sonner';
import Card from '@shared/components/ui/Card';
import Badge from '@shared/components/ui/Badge';
import Modal from '@shared/components/ui/Modal';
import {
    CircleDollarSign,
    Search,
    Truck,
    Clock,
    CheckCircle2,
    AlertTriangle,
    History,
    Download,
    Eye,
    Wallet,
    Bell,
    ArrowDownLeft,
    FileText,
    Percent,
    RotateCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const CashCollection = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('live_balances'); // live_balances or history
    const [selectedRider, setSelectedRider] = useState(null);
    const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
    const [settlementData, setSettlementData] = useState({ rider: null, amount: 0 });
    const [isProcessing, setIsProcessing] = useState(false);

    const [ridersCashData, setRidersCashData] = useState([]);
    const [historyData, setHistoryData] = useState([]);
    const [riderDetails, setRiderDetails] = useState([]);
    const [ridersPage, setRidersPage] = useState(1);
    const [historyPage, setHistoryPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [ridersTotal, setRidersTotal] = useState(0);
    const [historyTotal, setHistoryTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [detailsLoading, setDetailsLoading] = useState(false);

    const fetchData = async (cashPage = 1, histPage = 1) => {
        try {
            setLoading(true);
            const [cashRes, historyRes] = await Promise.all([
                adminApi.getDeliveryCashBalances({ page: cashPage, limit: pageSize }),
                adminApi.getCashSettlementHistory({ page: histPage, limit: pageSize })
            ]);

            if (cashRes.data.success) {
                const payload = cashRes.data.result || {};
                const riders = Array.isArray(payload.items) ? payload.items : (payload.riders || []);
                setRidersCashData(riders);
                setRidersTotal(typeof payload.total === 'number' ? payload.total : riders.length);
                setRidersPage(typeof payload.page === 'number' ? payload.page : cashPage);
            }
            if (historyRes.data.success) {
                const payload = historyRes.data.result || {};
                const history = Array.isArray(payload.items) ? payload.items : (historyRes.data.results || historyRes.data.result || []);
                setHistoryData(Array.isArray(history) ? history : []);
                setHistoryTotal(typeof payload.total === 'number' ? payload.total : history.length);
                setHistoryPage(typeof payload.page === 'number' ? payload.page : histPage);
            }
        } catch (error) {
            console.error("Failed to fetch cash collection data:", error);
            toast.error("Failed to sync with backend");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setRidersPage(1);
        setHistoryPage(1);
        fetchData(1, 1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageSize]);

    const fetchRidersPage = (p) => {
        setRidersPage(p);
        fetchData(p, historyPage);
    };
    const fetchHistoryPage = (p) => {
        setHistoryPage(p);
        fetchData(ridersPage, p);
    };

    // Fetch deep dive details when a rider is selected
    useEffect(() => {
        const fetchRiderDetails = async () => {
            if (!selectedRider) return;
            try {
                setDetailsLoading(true);
                const res = await adminApi.getRiderCashDetails(selectedRider.id);
                if (res.data.success) {
                    const data = res.data.results ?? res.data.result;
                    setRiderDetails(Array.isArray(data) ? data : []);
                } else {
                    setRiderDetails([]);
                }
            } catch (error) {
                console.error("Failed to fetch rider details:", error);
            } finally {
                setDetailsLoading(false);
            }
        };
        fetchRiderDetails();
    }, [selectedRider]);

    const stats = {
        totalInHand: (ridersCashData || []).reduce((acc, r) => acc + (r.currentCash || 0), 0),
        overLimitCount: (ridersCashData || []).filter(r => (r.currentCash || 0) >= (r.limit || 5000)).length,
        todaySettled: (historyData || []).filter(h => {
            const today = new Date().toLocaleDateString();
            return new Date(h.date).toLocaleDateString() === today;
        }).reduce((acc, h) => acc + (h.amount || 0), 0),
        avgBalance: (ridersCashData || []).length ? (ridersCashData || []).reduce((acc, r) => acc + (r.currentCash || 0), 0) / ridersCashData.length : 0
    };

    const filteredRiders = (ridersCashData || []).filter(r =>
        (r.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.id || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredHistory = (historyData || []).filter(h =>
        (h.rider || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (h.id || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSettlement = (rider) => {
        setSettlementData({ rider, amount: rider.currentCash });
        setIsSettleModalOpen(true);
    };

    const confirmSettlement = async () => {
        try {
            setIsProcessing(true);
            const response = await adminApi.settleRiderCash({
                riderId: settlementData.rider.id,
                amount: Number(settlementData.amount),
                method: 'Cash submission'
            });

            if (response.data.success) {
                toast.success(`Settlement of ₹${settlementData.amount} for ${settlementData.rider.name} processed successfully.`);
                fetchData(ridersPage, historyPage);
                setIsSettleModalOpen(false);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Settlement failed");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="ds-section-spacing animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-1">
                <div>
                    <h1 className="ds-h1 flex items-center gap-3">
                        Cash Collection Hub
                        <div className="p-1.5 bg-emerald-100 rounded-lg">
                            <CircleDollarSign className="h-5 w-5 text-emerald-600" />
                        </div>
                    </h1>
                    <p className="ds-description mt-1">Manage physical cash collected by delivery partners and track settlements.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-5 py-3 bg-white ring-1 ring-slate-200 text-slate-700 rounded-2xl text-xs font-bold hover:bg-slate-50 transition-all shadow-sm">
                        <Download className="h-4 w-4" />
                        EXPORT LEDGER
                    </button>
                    <button className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg active:scale-95 shadow-emerald-200">
                        <CheckCircle2 className="h-4 w-4" />
                        BULK SETTLE ALL
                    </button>
                </div>
            </div>

            {/* Insight Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Cash in Hand', value: `₹${stats.totalInHand.toLocaleString()}`, icon: Wallet, color: 'blue', bg: 'bg-blue-50', iconColor: 'text-blue-600' },
                    { label: 'Critical Over-Limit', value: stats.overLimitCount, icon: AlertTriangle, color: 'rose', bg: 'bg-rose-50', iconColor: 'text-rose-600', sub: 'Action required' },
                    { label: 'Collected Today', value: `₹${stats.todaySettled.toLocaleString()}`, icon: ArrowDownLeft, color: 'emerald', bg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
                    { label: 'Avg. Rider Load', value: `₹${stats.avgBalance.toFixed(0)}`, icon: Percent, color: 'amber', bg: 'bg-amber-50', iconColor: 'text-amber-600' },
                ].map((stat, i) => (
                    <Card key={i} className="p-6 border-none shadow-sm ring-1 ring-slate-100 bg-white group hover:ring-emerald-200 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className={cn("p-3 rounded-2xl", stat.bg)}>
                                <stat.icon className={cn("h-6 w-6", stat.iconColor)} />
                            </div>
                            {stat.sub && <Badge variant="danger" className="text-[8px] px-1.5 py-0">{stat.sub}</Badge>}
                        </div>
                        <p className="ds-label mb-1 uppercase tracking-tight font-black">{stat.label}</p>
                        <h3 className="ds-stat-medium ds-stat-large">{stat.value}</h3>
                    </Card>
                ))}
            </div>

            {/* Navigation & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-8">
                <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit">
                    <button
                        onClick={() => setActiveTab('live_balances')}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all",
                            activeTab === 'live_balances' ? "bg-white text-slate-900 shadow-xl" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <Truck className="h-4 w-4" />
                        LIVE RIDER BALANCES
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all",
                            activeTab === 'history' ? "bg-white text-slate-900 shadow-xl" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <History className="h-4 w-4" />
                        SETTLEMENT LOGS
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Find Rider or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-11 pr-4 py-2.5 bg-white ring-1 ring-slate-200 rounded-2xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/10 w-64 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <Card className="border-none shadow-2xl ring-1 ring-slate-100 overflow-hidden bg-white rounded-xl mt-6">
                <div className="overflow-x-auto">
                    {activeTab === 'live_balances' ? (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="ds-table-header-cell pl-8 py-5">Delivery Partner</th>
                                    <th className="ds-table-header-cell">Cash Statistics</th>
                                    <th className="ds-table-header-cell text-center">Safety Status</th>
                                    <th className="ds-table-header-cell">Last Settle Date</th>
                                    <th className="ds-table-header-cell text-right pr-8">Management</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredRiders.map((rider) => (
                                    <tr key={rider.id} className="group hover:bg-slate-50/40 transition-all">
                                        <td className="px-6 py-6 pl-8">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <img src={rider.avatar} alt="" className="h-12 w-12 rounded-2xl ring-2 ring-white shadow-md bg-slate-100" />
                                                    <div className={cn(
                                                        "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white",
                                                        rider.status === 'safe' ? "bg-emerald-500" : rider.status === 'warning' ? "bg-amber-500" : "bg-rose-500"
                                                    )} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900">{rider.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">
                                                        {rider.id} • {rider.totalOrders || 0} Delivered • {rider.pendingOrders || 0} Pending
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="space-y-2 max-w-[180px]">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-lg font-black text-slate-900">₹{rider.currentCash.toLocaleString()}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Limit: ₹{rider.limit}</span>
                                                </div>
                                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min((rider.currentCash / rider.limit) * 100, 100)}%` }}
                                                        className={cn(
                                                            "h-full rounded-full",
                                                            rider.status === 'safe' ? "bg-emerald-500" : rider.status === 'warning' ? "bg-amber-500" : "bg-rose-500"
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <Badge
                                                variant={rider.status === 'safe' ? 'success' : rider.status === 'warning' ? 'warning' : 'danger'}
                                                className="text-[9px] font-black px-3 py-1 uppercase tracking-widest"
                                            >
                                                {rider.status.replace('_', ' ')}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-6 font-semibold text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                                <span className="text-xs">
                                                    {rider.lastSettlement !== 'Never'
                                                        ? new Date(rider.lastSettlement).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                                                        : 'No History'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-right pr-8">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleSettlement(rider)}
                                                    className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95 uppercase tracking-widest"
                                                >
                                                    Settle
                                                </button>
                                                <button className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-200 transition-all active:scale-95">
                                                    <Bell className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => setSelectedRider(rider)}
                                                    className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all active:scale-95"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="ds-table-header-cell pl-8 py-5">Settlement ID</th>
                                    <th className="ds-table-header-cell">Partner Name</th>
                                    <th className="ds-table-header-cell text-center">Amount Settled</th>
                                    <th className="ds-table-header-cell">Method</th>
                                    <th className="ds-table-header-cell text-right pr-8">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredHistory.map((log) => (
                                    <tr key={log.id} className="group hover:bg-slate-50/40 transition-all">
                                        <td className="px-6 py-5 pl-8 text-[10px] font-black text-slate-400 uppercase tracking-tighter">{log.id}</td>
                                        <td className="px-6 py-5 text-sm font-bold text-slate-900">{log.rider}</td>
                                        <td className="px-6 py-5 text-center text-sm font-black text-emerald-600">₹{log.amount.toLocaleString()}</td>
                                        <td className="px-6 py-5">
                                            <Badge variant="secondary" className="text-[9px] font-black px-2 py-0.5 uppercase">
                                                {log.method}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-5 text-right pr-8 text-xs font-bold text-slate-500">
                                            {new Date(log.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                <div className="px-6 py-3 border-t border-slate-100">
                    <Pagination
                        page={activeTab === 'live_balances' ? ridersPage : historyPage}
                        totalPages={Math.ceil((activeTab === 'live_balances' ? ridersTotal : historyTotal) / pageSize) || 1}
                        total={activeTab === 'live_balances' ? ridersTotal : historyTotal}
                        pageSize={pageSize}
                        onPageChange={activeTab === 'live_balances' ? fetchRidersPage : fetchHistoryPage}
                        onPageSizeChange={(newSize) => {
                            setPageSize(newSize);
                            setRidersPage(1);
                            setHistoryPage(1);
                        }}
                        loading={loading}
                    />
                </div>
            </Card>

            {/* Rider Deep Dive Modal */}
            <Modal
                isOpen={!!selectedRider}
                onClose={() => setSelectedRider(null)}
                title="Rider Collection Intelligence"
                size="md"
            >
                {selectedRider && (
                    <div className="ds-section-spacing">
                        <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-xl border border-slate-100 mt-4">
                            <img src={selectedRider.avatar} alt="" className="h-20 w-20 rounded-xl shadow-xl ring-4 ring-white" />
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{selectedRider.name}</h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <Badge variant={selectedRider.status === 'safe' ? 'success' : 'warning'}>
                                        {selectedRider.status.toUpperCase()}
                                    </Badge>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedRider.id}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Card className="p-6 border-none bg-slate-900 text-white rounded-xl relative overflow-hidden">
                                <p className="text-[10px] opacity-60 font-black uppercase tracking-widest mb-2">Primary Wallet</p>
                                <h4 className="text-3xl font-black italic">₹{selectedRider.currentCash.toLocaleString()}</h4>
                                <div className="mt-4 flex items-center gap-2">
                                    <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-400" style={{ width: `${Math.min((selectedRider.currentCash / selectedRider.limit) * 100, 100)}%` }} />
                                    </div>
                                    <span className="text-[10px] font-bold opacity-60">{Math.min(Math.round((selectedRider.currentCash / selectedRider.limit) * 100), 100)}%</span>
                                </div>
                                <CircleDollarSign className="absolute -bottom-4 -right-4 h-20 w-20 opacity-10" />
                            </Card>
                            <Card className="p-6 border-none bg-slate-50 ring-1 ring-slate-100 rounded-xl">
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Pending COD Orders</p>
                                <h4 className="text-3xl font-black text-slate-900">{selectedRider.pendingOrders}</h4>
                                <p className="text-[10px] font-bold text-slate-400 mt-4 uppercase">Requires immediate sync</p>
                            </Card>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <FileText className="h-4 w-4 text-emerald-600" />
                                Collection Ledger
                            </h4>
                            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                {detailsLoading ? (
                                    <div className="py-8 text-center">
                                        <RotateCw className="h-6 w-6 animate-spin mx-auto text-emerald-500 mb-2" />
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fetching Ledger...</p>
                                    </div>
                                ) : (Array.isArray(riderDetails) ? riderDetails : []).length > 0 ? (
                                    (Array.isArray(riderDetails) ? riderDetails : []).map((item, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-white ring-1 ring-slate-100 rounded-2xl hover:ring-emerald-200 transition-all group">
                                            <div className="flex items-center gap-3">
                                                <div className="h-2 w-2 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform" />
                                                <div>
                                                    <p className="text-xs font-black text-slate-900">{item.reference || item.id}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase">
                                                        {new Date(item.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-sm font-black text-slate-700">₹{item.amount.toLocaleString()}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        <CircleDollarSign className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Recent Collections</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-2 flex gap-3">
                            <button
                                onClick={() => { setSelectedRider(null); handleSettlement(selectedRider); }}
                                className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-emerald-100 transition-all active:scale-[0.98]"
                            >
                                Trigger Settlement
                            </button>
                            <button className="p-4 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-all active:scale-95">
                                <Bell className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Settlement Processor Modal */}
            <Modal
                isOpen={isSettleModalOpen}
                onClose={() => !isProcessing && setIsSettleModalOpen(false)}
                title="Financial Settlement Processor"
                size="sm"
            >
                {settlementData.rider && (
                    <div className="ds-section-spacing py-4">
                        <div className="text-center space-y-4">
                            <div className="h-20 w-20 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mx-auto shadow-inner border border-emerald-100">
                                <CircleDollarSign className="h-10 w-10" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Record Cash Receive</h3>
                                <p className="text-sm font-medium text-slate-500 mt-1 max-w-[240px] mx-auto">
                                    Finalizing cash submission for <span className="font-black text-slate-900">{settlementData.rider.name}</span>.
                                </p>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-xl ring-1 ring-slate-100 mt-6">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-2">Total Amount to Settle</p>
                            <div className="flex items-center justify-center gap-2">
                                <span className="text-xl font-black italic text-slate-900">₹</span>
                                <input
                                    type="number"
                                    value={settlementData.amount}
                                    onChange={(e) => setSettlementData({ ...settlementData, amount: e.target.value })}
                                    className="bg-transparent text-2xl font-black italic text-slate-900 w-40 outline-none text-center"
                                />
                            </div>
                        </div>

                        <div className="space-y-3 mt-8">
                            <button
                                onClick={confirmSettlement}
                                disabled={isProcessing}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
                            >
                                {isProcessing && <RotateCw className="h-4 w-4 animate-spin" />}
                                {isProcessing ? 'SYNCHRONIZING...' : 'CONFIRM & DEPOSIT'}
                            </button>
                            <button
                                onClick={() => setIsSettleModalOpen(false)}
                                disabled={isProcessing}
                                className="w-full py-4 bg-white ring-1 ring-slate-200 text-slate-400 font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all active:scale-[0.98]"
                            >
                                ABORT SESSION
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default CashCollection;
