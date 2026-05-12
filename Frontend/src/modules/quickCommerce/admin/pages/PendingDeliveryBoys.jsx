import React, { useState, useMemo } from 'react';
import Card from '@shared/components/ui/Card';
import Badge from '@shared/components/ui/Badge';
import {
    Search,
    Filter,
    CheckCircle,
    XCircle,
    FileSearch,
    Phone,
    Mail,
    Truck,
    MapPin,
    Calendar,
    IdCard,
    RotateCw,
    Check,
    X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { adminApi } from '../services/adminApi';

const PendingDeliveryBoys = () => {
    const [pendingRiders, setPendingRiders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [viewingRider, setViewingRider] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Fetch Pending Riders
    const fetchPendingRiders = async () => {
        setIsLoading(true);
        try {
            // verified=false fetches riders waiting for review
            const response = await adminApi.getDeliveryPartners({ verified: 'false' });
            const payload = response.data.result || {};
            const list = Array.isArray(payload.items) ? payload.items : (response.data.results || []);

            // Map backend data to frontend format
            const mappedRiders = list.map(r => ({
                id: r._id,
                name: r.name,
                phone: r.phone,
                email: r.email,
                appliedDate: new Date(r.createdAt).toLocaleDateString(),
                location: r.currentArea || 'Unknown',
                vehicle: r.vehicleType,
                documents: Object.keys(r.documents || {}).filter(key => r.documents[key]),
                status: r.isVerified ? 'approved' : 'pending_review',
                experience: 'Not Specified', // Mock for now
                preferredArea: r.currentArea || 'Not Specified'
            }));

            setPendingRiders(mappedRiders);
        } catch (error) {
            console.error('Fetch Pending Riders Error:', error);
            toast.error('Failed to load applications');
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        fetchPendingRiders();
    }, []);

    const filteredRiders = useMemo(() => {
        return pendingRiders.filter(r => {
            const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.phone.includes(searchTerm);
            const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
            return matchesSearch && matchesStatus;
        });
    }, [pendingRiders, searchTerm, filterStatus]);

    const handleApprove = async (id) => {
        setIsProcessing(true);
        try {
            await adminApi.approveDeliveryPartner(id);
            toast.success('Rider Approved & Activated!');
            setPendingRiders(pendingRiders.filter(r => r.id !== id));
            setViewingRider(null);
        } catch (error) {
            console.error('Approval Error:', error);
            toast.error('Failed to approve rider');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async (id) => {
        if (window.confirm('Are you sure you want to reject this application?')) {
            setIsProcessing(true);
            try {
                await adminApi.rejectDeliveryPartner(id);
                toast.success('Application Rejected');
                setPendingRiders(pendingRiders.filter(r => r.id !== id));
                setViewingRider(null);
            } catch (error) {
                console.error('Rejection Error:', error);
                toast.error('Failed to reject rider');
            } finally {
                setIsProcessing(false);
            }
        }
    };

    return (
        <div className="ds-section-spacing animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="ds-h1 flex items-center gap-3">
                        Rider Applications
                        <Badge variant="primary" className="text-[10px] px-2 py-0.5 uppercase">Pending Review</Badge>
                    </h1>
                    <p className="ds-description mt-1">Review documents for new delivery partners.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="p-3 bg-white ring-1 ring-slate-200 rounded-2xl text-slate-400 hover:text-primary transition-all shadow-sm active:rotate-180 duration-500">
                        <RotateCw className="h-5 w-5" />
                    </button>
                    <div className="h-10 w-[1px] bg-slate-200 mx-2" />
                    <div className="flex flex-col items-end">
                        <p className="ds-label">Total Pending</p>
                        <h4 className="ds-h2">{pendingRiders.length}</h4>
                    </div>
                </div>
            </div>

            {/* Utility Bar */}
            <Card className="p-4 border-none shadow-sm ring-1 ring-slate-100 bg-white/50 backdrop-blur-xl">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by name or mobile..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-100/50 border-none rounded-2xl text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-100/50 p-1 rounded-2xl flex items-center">
                            {['all', 'pending', 'missing_info'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={cn(
                                        "px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                                        filterStatus === status
                                            ? "bg-white text-slate-900 shadow-sm"
                                            : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    {status === 'pending' ? 'PENDING' : status.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                        <button className="p-3.5 bg-white ring-1 ring-slate-200 rounded-2xl text-slate-600 hover:text-primary transition-all">
                            <Filter className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </Card>

            {/* Applications Table View */}
            <Card className="border-none shadow-2xl ring-1 ring-slate-100 overflow-hidden bg-white rounded-xl relative min-h-[400px]">
                {isLoading && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-3">
                            <div className="h-10 w-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Applications...</p>
                        </div>
                    </div>
                )}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="ds-table-header-cell px-4">Applicant Details</th>
                                <th className="ds-table-header-cell px-4">Operational Intel</th>
                                <th className="ds-table-header-cell px-4">Submission Status</th>
                                <th className="ds-table-header-cell px-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {!isLoading && filteredRiders.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="py-20 text-center">
                                        <FileSearch className="h-10 w-10 text-slate-300 mx-auto mb-4" />
                                        <p className="text-sm font-bold text-slate-500">No pending applications found.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredRiders.map((rider) => (
                                    <tr key={rider.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                                    <IdCard className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900">{rider.name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Phone className="h-3 w-3 text-slate-400" />
                                                        <span className="text-[10px] font-bold text-slate-500">{rider.phone}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Truck className="h-3.5 w-3.5" />
                                                    <span className="text-[10px] font-bold">{rider.vehicle}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <MapPin className="h-3.5 w-3.5" />
                                                    <span className="text-[10px] font-bold">{rider.location}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-2">
                                                <Badge variant={rider.status === 'pending_review' ? 'primary' : 'warning'} className="w-fit text-[8px] font-black uppercase">
                                                    {rider.status.replace('_', ' ')}
                                                </Badge>
                                                <div className="flex gap-1">
                                                    {rider.documents.slice(0, 2).map((doc, i) => (
                                                        <div key={i} className="h-5 px-2 bg-slate-100 rounded-md text-[8px] font-bold text-slate-500 flex items-center">
                                                            {doc}
                                                        </div>
                                                    ))}
                                                    {rider.documents.length > 2 && (
                                                        <div className="h-5 px-2 bg-slate-100 rounded-md text-[8px] font-bold text-slate-400 flex items-center">
                                                            +{rider.documents.length - 2} More
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button
                                                onClick={() => setViewingRider(rider)}
                                                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
                                            >
                                                VIEW APPLICATION
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Application Review Modal */}
            <AnimatePresence>
                {viewingRider && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
                            onClick={() => setViewingRider(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="w-full max-w-5xl relative z-10 bg-white rounded-[48px] shadow-3xl overflow-hidden flex flex-col lg:flex-row"
                        >
                            {/* Left: Applicant Profile Info */}
                            <div className="lg:w-80 bg-slate-50 p-5 border-r border-slate-100">
                                <div className="text-center mb-10">
                                    <div className="h-24 w-24 rounded-xl bg-white shadow-xl flex items-center justify-center text-slate-300 mx-auto mb-6">
                                        <IdCard className="h-12 w-12" />
                                    </div>
                                    <h3 className="ds-h2">{viewingRider.name}</h3>
                                    <p className="ds-label text-primary mt-1">Applicant Node</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preferred Area</p>
                                        <div className="flex items-center gap-2 text-slate-700">
                                            <MapPin className="h-4 w-4 text-slate-400" />
                                            <span className="text-xs font-bold">{viewingRider.preferredArea}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Experience</p>
                                        <div className="flex items-center gap-2 text-slate-700">
                                            <Calendar className="h-4 w-4 text-slate-400" />
                                            <span className="text-xs font-bold">{viewingRider.experience}</span>
                                        </div>
                                    </div>
                                    <div className="pt-6 border-t border-slate-200">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">System Confidence</p>
                                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 w-[85%]" />
                                        </div>
                                        <p className="text-[9px] font-bold text-emerald-600 mt-2">85% Verification Score</p>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Document & Action Section */}
                            <div className="flex-1 p-5 lg:p-14 bg-white">
                                <div className="flex justify-between items-start mb-10">
                                    <div>
                                        <h2 className="ds-h1">Vetting Protocol</h2>
                                        <p className="ds-description mt-1">Check submitted legal documents for platform entry.</p>
                                    </div>
                                    <button onClick={() => setViewingRider(null)} className="p-3 hover:bg-slate-50 rounded-2xl transition-all">
                                        <X className="h-6 w-6 text-slate-400" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contact Records</h4>
                                        <div className="p-6 bg-slate-50 rounded-xl space-y-4">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary">
                                                    <Phone className="h-5 w-5" />
                                                </div>
                                                <span className="text-sm font-bold text-slate-900">{viewingRider.phone}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary">
                                                    <Mail className="h-5 w-5" />
                                                </div>
                                                <span className="text-sm font-bold text-slate-900">{viewingRider.email}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Vehicle Identification</h4>
                                        <div className="p-6 bg-slate-50 rounded-xl border-2 border-emerald-500/10">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-emerald-600">
                                                    <Truck className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900">{viewingRider.vehicle}</p>
                                                    <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">Eco-Friendly Ready</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-14">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Submitted Documents ({viewingRider.documents.length})</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {viewingRider.documents.map((doc, idx) => (
                                            <div key={idx} className="group relative aspect-[4/3] bg-slate-100 rounded-[24px] overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                                                <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                                                    <FileSearch className="h-8 w-8 text-slate-400 group-hover:text-primary transition-colors" />
                                                    <p className="text-[9px] font-black text-slate-500 uppercase mt-2 text-center">{doc}</p>
                                                </div>
                                                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/5 transition-colors" />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4">
                                    <button
                                        disabled={isProcessing}
                                        onClick={() => handleApprove(viewingRider.id)}
                                        className="flex-1 py-5 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                Processing Vetting...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="h-4 w-4" />
                                                APPROVE & ACTIVATE RIDER
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleReject(viewingRider.id)}
                                        className="py-5 px-5 bg-rose-50 text-rose-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-100 transition-all active:scale-95"
                                    >
                                        REJECT APPLICATION
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PendingDeliveryBoys;
