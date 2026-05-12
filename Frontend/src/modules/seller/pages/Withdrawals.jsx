import React, { useState, useMemo } from 'react';
import Card from '@shared/components/ui/Card';
import Badge from '@shared/components/ui/Badge';
import Button from '@shared/components/ui/Button';
import Modal from '@shared/components/ui/Modal';
import {
    Wallet,
    ArrowUpRight,
    Clock,
    CheckCircle2,
    XCircle,
    History,
    Download,
    Building2,
    Info,
    ArrowRight,
    Search,
    AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { BlurFade } from "@/components/ui/blur-fade";
import { sellerApi } from "../services/sellerApi";
import { toast } from "sonner";
import { useSellerEarnings } from "../context/SellerEarningsContext";
import Pagination from "@shared/components/ui/Pagination";

const Withdrawals = () => {
    const { earningsData: data, earningsLoading: loading, refreshEarnings } = useSellerEarnings();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [amount, setAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const ledger = Array.isArray(data?.ledger) ? data.ledger : [];
    const withdrawalHistory = ledger.filter((t) => (t.type || '').toString() === 'Withdrawal');

    const filteredHistory = useMemo(() => {
        const term = searchTerm.toLowerCase();
        const result = withdrawalHistory.filter((item) => {
            const id = (item.id ?? item.ref ?? '').toString().toLowerCase();
            const status = (item.status ?? '').toString().toLowerCase();
            const method = (item.method ?? item.customer ?? '').toString().toLowerCase();
            const amount = Math.abs(Number(item.amount ?? 0)).toString();
            return (
                !term ||
                id.includes(term) ||
                status.includes(term) ||
                method.includes(term) ||
                amount.includes(term)
            );
        });
        // Reset page if out of range
        const totalPages = Math.max(1, Math.ceil(result.length / pageSize));
        if (page > totalPages) {
            setPage(1);
        }
        return result;
    }, [withdrawalHistory, searchTerm, page, pageSize]);

    const paginatedHistory = useMemo(() => {
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        return filteredHistory.slice(start, end);
    }, [filteredHistory, page, pageSize]);

    const handleDownloadReceipt = (item) => {
        const id = item.id || item.ref || item.reference || 'withdrawal';
        const lines = [];
        lines.push('Withdrawal Receipt');
        lines.push(`ID,${id}`);
        lines.push(`Status,${item.status ?? ''}`);
        lines.push(`Date,${item.date ?? ''}`);
        lines.push(`Time,${item.time ?? ''}`);
        lines.push(`Amount,₹${Math.abs(item.amount ?? 0).toLocaleString()}`);
        lines.push(`Method,${item.customer ?? 'Bank Transfer'}`);
        if (item.reason) {
            lines.push(`Reason,${item.reason}`);
        }
        const csvContent = lines.join('\n');
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `withdrawal-receipt-${id}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Receipt downloaded');
    };

    const handleSubmitRequest = async (e) => {
        e.preventDefault();
        const settled = Number(data?.balances?.settledBalance ?? 0);
        const available = Math.max(0, settled);

        if (!amount || parseFloat(amount) <= 0 || parseFloat(amount) > available) {
            toast.error(`Please enter a valid amount within your available balance (₹${available}).`);
            return;
        }

        try {
            setIsSubmitting(true);
            const response = await sellerApi.requestWithdrawal({ amount: parseFloat(amount) });
            if (response.data.success) {
                toast.success('Withdrawal request submitted successfully!');
                setIsModalOpen(false);
                setAmount('');
                refreshEarnings();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to submit request");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-screen font-black text-slate-600">LOADING WITHDRAWALS...</div>;
    }

    const balances = {
        available: Math.max(0, Number(data.balances?.settledBalance ?? 0)),
        pending: Math.abs(Number(data.balances?.pendingPayouts ?? 0)),
        lastWithdrawal: Math.abs(withdrawalHistory.find((item) => item.status === 'Settled')?.amount ?? 0),
    };

    return (
        <div className="space-y-8 pb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <BlurFade delay={0.1}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                            Money Requests
                            <div className="p-1.5 bg-indigo-100 rounded-lg">
                                <Wallet className="h-5 w-5 text-indigo-600" />
                            </div>
                        </h1>
                        <p className="text-slate-600 text-base mt-1 font-medium">Request payouts and track your withdrawal history.</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95 flex items-center gap-2 group"
                    >
                        <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        New Request
                    </button>
                </div>
            </BlurFade>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {[
                    { label: 'Available Balance', value: `₹${balances.available.toLocaleString()}`, icon: Wallet, color: 'emerald', sub: 'Ready to withdraw' },
                    { label: 'Pending Requests', value: `₹${balances.pending.toLocaleString()}`, icon: Clock, color: 'amber', sub: 'Awaiting approval' },
                    { label: 'Last Withdrawal', value: `₹${balances.lastWithdrawal.toLocaleString()}`, icon: CheckCircle2, color: 'blue', sub: 'Sent to bank' },
                ].map((stat, i) => (
                    <BlurFade key={i} delay={0.2 + i * 0.1}>
                        <Card className="p-6 border-none shadow-sm ring-1 ring-slate-100 hover:ring-indigo-200 transition-all bg-white group relative overflow-hidden">
                            <div className="relative z-10">
                                <div className={cn(
                                    "h-10 w-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
                                    stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                                        stat.color === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                                )}>
                                    <stat.icon className="h-5 w-5" />
                                </div>
                                <p className="text-xs font-black text-slate-600 uppercase tracking-widest mb-1">{stat.label}</p>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
                                <p className="text-xs font-bold text-slate-600 mt-2 flex items-center gap-1.5 uppercase">
                                    <span className="w-1 h-3 rounded-full bg-slate-100" />
                                    {stat.sub}
                                </p>
                            </div>
                            <div className="absolute -bottom-4 -right-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                                <stat.icon className="h-24 w-24" />
                            </div>
                        </Card>
                    </BlurFade>
                ))}
            </div>

            {/* History Table */}
            <BlurFade delay={0.5}>
                <Card className="border-none shadow-xl ring-1 ring-slate-100 overflow-hidden bg-white rounded-3xl">
                    <div className="p-4 sm:p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4">
                        <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                            <History className="h-5 w-5 text-indigo-500" />
                            Withdrawal History
                        </h2>
                        <div className="relative w-full md:w-64 group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search ID or Status..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[640px]">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-4 text-xs font-black text-slate-600 uppercase tracking-widest">Request Details</th>
                                    <th className="px-8 py-4 text-xs font-black text-slate-600 uppercase tracking-widest">Amount</th>
                                    <th className="px-8 py-4 text-xs font-black text-slate-600 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-8 py-4 text-xs font-black text-slate-600 uppercase tracking-widest text-right">Method</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredHistory.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-12 text-center text-slate-600 text-sm font-medium">
                                            {withdrawalHistory.length === 0 ? "No withdrawal requests yet." : "No matches for your search."}
                                        </td>
                                    </tr>
                                ) : paginatedHistory.map((item, idx) => (
                                    <tr key={item.id || item.ref || item.reference || `wd-${idx}`} className="group hover:bg-slate-50/50 transition-all">
                                        <td className="px-8 py-5">
                                            <p className="text-sm font-black text-slate-900">{item.id}</p>
                                            <p className="text-xs font-bold text-slate-600 mt-0.5 uppercase tracking-tighter">{item.date} • {item.time}</p>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="text-sm font-black text-slate-900">₹{Math.abs(item.amount).toLocaleString()}</p>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <Badge
                                                variant={item.status === 'Settled' ? 'success' : (item.status === 'Pending' || item.status === 'Processing') ? 'warning' : 'danger'}
                                                className="text-[8px] font-black px-2.5 py-0.5 uppercase tracking-widest rounded-lg"
                                            >
                                                {item.status === 'Settled' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : (item.status === 'Pending' || item.status === 'Processing') ? <Clock className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                                                {item.status}
                                            </Badge>
                                            {item.reason && <p className="text-[9px] text-rose-500 font-bold mt-1 uppercase italic">{item.reason}</p>}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <p className="text-xs font-bold text-slate-600">{item.customer}</p>
                                            <button
                                                type="button"
                                                onClick={() => handleDownloadReceipt(item)}
                                                className="text-[10px] font-black text-indigo-500 hover:text-indigo-600 mt-1 uppercase tracking-widest flex items-center gap-1 justify-end ml-auto"
                                            >
                                                Receipt <Download className="h-3 w-3" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredHistory.length > 0 && (
                        <div className="p-4 sm:p-5 border-t border-slate-50 bg-slate-50/40">
                            <Pagination
                                page={page}
                                totalPages={Math.max(1, Math.ceil(filteredHistory.length / pageSize))}
                                total={filteredHistory.length}
                                pageSize={pageSize}
                                onPageChange={(newPage) => setPage(newPage)}
                                onPageSizeChange={(newSize) => {
                                    setPageSize(newSize);
                                    setPage(1);
                                }}
                                loading={loading}
                            />
                        </div>
                    )}
                </Card>
            </BlurFade>

            {/* Request Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => !isSubmitting && setIsModalOpen(false)}
                title="Request Withdrawal"
            >
                <form onSubmit={handleSubmitRequest} className="space-y-6 py-4">
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-black text-slate-600 uppercase tracking-widest mb-1">Available to Withdraw</p>
                            <h4 className="text-2xl font-black text-emerald-600">₹{balances.available.toLocaleString()}</h4>
                        </div>
                        <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            <Info className="h-6 w-6 text-slate-300" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-black text-slate-600 uppercase tracking-widest mb-2 block ml-1">Enter Amount</label>
                            <div className="relative group">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300 group-focus-within:text-indigo-500 transition-colors">₹</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full pl-12 pr-6 py-4 bg-white ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 rounded-2xl text-xl font-black outline-none transition-all placeholder:text-slate-200"
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 space-y-3">
                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Transfer Destination</p>
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                    <Building2 className="h-5 w-5 text-indigo-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-black text-slate-900 uppercase">HDFC Bank Limited</p>
                                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">Acct Ending in **** 4589</p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-slate-300" />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-95"
                        >
                            {isSubmitting ? <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'SUBMIT REQUEST'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="w-full py-2 text-xs font-black text-slate-600 uppercase tracking-widest hover:text-slate-600 transition-colors"
                        >
                            Nevermind, keep funds
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Withdrawals;
