import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineArrowPath,
  HiOutlineBuildingOffice2,
  HiOutlineCalendarDays,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineDocumentText,
  HiOutlineEnvelope,
  HiOutlineEye,
  HiOutlineMagnifyingGlass,
  HiOutlineMapPin,
  HiOutlinePhone,
  HiOutlineShieldCheck,
  HiOutlineXCircle,
  HiOutlineXMark,
} from 'react-icons/hi2';
import { toast } from 'sonner';
import Card from '@shared/components/ui/Card';
import Badge from '@shared/components/ui/Badge';
import { adminApi } from '../services/adminApi';
import { cn } from '@/lib/utils';

const buildDocs = (seller) => {
  const docs = [];
  if (seller?.documents?.shopLicenseNumber || seller?.documents?.shopLicenseImage) docs.push('Shop License');
  if (seller?.documents?.gstNumber) docs.push('GST');
  if (seller?.documents?.panNumber) docs.push('PAN');
  if (seller?.documents?.fssaiNumber) docs.push('FSSAI');
  if (seller?.bankInfo?.upiId || seller?.bankInfo?.upiQrImage) docs.push('UPI');
  return docs;
};

const formatDate = (value) => {
  if (!value) return 'Just now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';
  return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
};

const PendingSellers = () => {
  const [pendingSellers, setPendingSellers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [viewingSeller, setViewingSeller] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadPendingSellers = async (search = '') => {
    setIsLoading(true);
    try {
      const response = await adminApi.getSellerRequests({ status: 'pending', limit: 100, search });
      const items = response?.data?.result?.items || [];
      setPendingSellers(items);
    } catch (error) {
      toast.error('Failed to load seller requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPendingSellers();
  }, []);

  const stats = useMemo(() => ({
    total: pendingSellers.length,
    today: pendingSellers.filter((s) => {
      const created = new Date(s.applicationDate);
      const now = new Date();
      return !Number.isNaN(created.getTime()) && created.toDateString() === now.toDateString();
    }).length,
    complete: pendingSellers.filter((s) => buildDocs(s).length >= 3).length,
  }), [pendingSellers]);

  const filteredSellers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return pendingSellers;
    return pendingSellers.filter((seller) =>
      [seller.shopName, seller.ownerName, seller.email, seller.phone]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [pendingSellers, searchTerm]);

  const handleApprove = async (sellerId) => {
    setIsProcessing(true);
    try {
      await adminApi.approveSeller(sellerId);
      toast.success('Seller approved successfully');
      setPendingSellers((prev) => prev.filter((seller) => seller._id !== sellerId));
      setIsReviewModalOpen(false);
      setViewingSeller(null);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to approve seller');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (sellerId) => {
    setIsProcessing(true);
    try {
      await adminApi.rejectSeller(sellerId, { reason: 'Please update onboarding details and resubmit.' });
      toast.success('Seller request rejected');
      setPendingSellers((prev) => prev.filter((seller) => seller._id !== sellerId));
      setIsReviewModalOpen(false);
      setViewingSeller(null);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to reject seller');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="ds-section-spacing animate-in fade-in slide-in-from-bottom-2 duration-700 pb-16">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="ds-h1 flex items-center gap-2">
            Seller Requests
            <Badge variant="warning" className="admin-tiny px-1.5 py-0 font-bold animate-pulse">Review queue</Badge>
          </h1>
          <p className="ds-description mt-0.5">New seller onboarding submissions appear here before they can enter the seller dashboard.</p>
        </div>
        <button
          type="button"
          onClick={() => loadPendingSellers(searchTerm)}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.22em] text-white"
        >
          <HiOutlineArrowPath className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          Refresh Queue
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: 'Pending requests', val: stats.total, icon: HiOutlineDocumentText, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Received today', val: stats.today, icon: HiOutlineCalendarDays, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Doc-ready', val: stats.complete, icon: HiOutlineShieldCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm ring-1 ring-slate-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="ds-label">{stat.label}</p>
                <h4 className="ds-stat-medium mt-1">{stat.val}</h4>
              </div>
              <div className={cn('h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner', stat.bg, stat.color)}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-xl ring-1 ring-slate-100 overflow-hidden rounded-xl">
        <div className="p-6 border-b border-slate-50 flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white">
          <div className="relative flex-1 w-full max-w-md">
            <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by shop, owner, email, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2 ring-1 ring-amber-100">
            <HiOutlineClock className="h-4 w-4 text-amber-600" />
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Approval unlocks seller dashboard</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="ds-table-header-cell px-6">Seller</th>
                <th className="ds-table-header-cell px-6">Documents</th>
                <th className="ds-table-header-cell px-6">Applied on</th>
                <th className="ds-table-header-cell px-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {!isLoading && filteredSellers.length > 0 ? filteredSellers.map((seller) => {
                const docs = buildDocs(seller);
                return (
                  <tr key={seller._id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl overflow-hidden bg-slate-100 ring-2 ring-slate-100 flex items-center justify-center text-slate-400">
                          <HiOutlineBuildingOffice2 className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{seller.shopName}</p>
                          <p className="text-[10px] font-bold text-slate-400">{seller.ownerName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {docs.length ? docs.map((doc) => (
                          <span key={doc} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-bold rounded-full ring-1 ring-blue-100 uppercase">{doc}</span>
                        )) : <span className="text-xs font-medium text-slate-400">No docs yet</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700">{formatDate(seller.applicationDate)}</span>
                        <span className="text-[9px] font-medium text-slate-400">{seller.category || 'General'} partner</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => { setViewingSeller(seller); setIsReviewModalOpen(true); }}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-[10px] font-bold text-white shadow-lg"
                      >
                        <HiOutlineEye className="h-3.5 w-3.5" />
                        View Application
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="4" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        {isLoading ? <HiOutlineArrowPath className="h-8 w-8 text-slate-300 animate-spin" /> : <HiOutlineCheckCircle className="h-8 w-8 text-slate-200" />}
                      </div>
                      <p className="text-slate-500 font-bold text-sm">{isLoading ? 'Loading seller requests...' : 'No pending seller requests right now.'}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <AnimatePresence>
        {isReviewModalOpen && viewingSeller && (
          <div className="fixed inset-0 z-[100] overflow-y-auto">
            <div className="min-h-full flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setIsReviewModalOpen(false)} />
              <motion.div initial={{ opacity: 0, scale: 0.94, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 24 }} className="relative z-10 w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
                <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.4fr]">
                  <div className="bg-slate-50 p-6 border-r border-slate-100">
                    <div className="flex items-start justify-between">
                      <div className="h-20 w-20 rounded-3xl bg-white shadow-xl flex items-center justify-center text-3xl font-black text-slate-900">
                        {(viewingSeller.shopName || 'S')[0]}
                      </div>
                      <button type="button" onClick={() => setIsReviewModalOpen(false)} className="rounded-full p-2 hover:bg-slate-200">
                        <HiOutlineXMark className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="mt-8 space-y-6">
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 leading-tight">{viewingSeller.shopName}</h3>
                        <p className="mt-2 text-[11px] font-black uppercase tracking-[0.28em] text-primary">{viewingSeller.category || 'General'} seller request</p>
                      </div>
                      <div className="space-y-4 text-xs">
                        <div className="flex items-center gap-3"><HiOutlineEnvelope className="h-4 w-4 text-slate-400" /><span className="font-semibold text-slate-600">{viewingSeller.email || 'No email'}</span></div>
                        <div className="flex items-center gap-3"><HiOutlinePhone className="h-4 w-4 text-slate-400" /><span className="font-semibold text-slate-600">{viewingSeller.phone || 'No phone'}</span></div>
                        <div className="flex items-center gap-3"><HiOutlineMapPin className="h-4 w-4 text-slate-400" /><span className="font-semibold text-slate-600">{viewingSeller.location || 'No address provided'}</span></div>
                        <div className="flex items-center gap-3"><HiOutlineCalendarDays className="h-4 w-4 text-slate-400" /><span className="font-semibold text-slate-600">Applied {formatDate(viewingSeller.applicationDate)}</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 lg:p-8">
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-lg font-black text-slate-900">Application overview</h4>
                        <p className="mt-2 text-sm font-medium text-slate-500">Review the submitted business, banking, and compliance details before approval.</p>
                      </div>

                      <div className="space-y-6">
                        {/* Store Identity */}
                        <div>
                          <h5 className="text-xs font-black uppercase tracking-[0.22em] text-primary mb-3">Store Identity</h5>
                          <div className="grid gap-3 md:grid-cols-2">
                            {[
                              ['Owner name', viewingSeller.ownerName],
                              ['Business type', viewingSeller.shopInfo?.businessType],
                              ['Alternate phone', viewingSeller.shopInfo?.alternatePhone],
                              ['Support email', viewingSeller.shopInfo?.supportEmail],
                              ['Opening hours', viewingSeller.shopInfo?.openingHours || viewingSeller.openingHours || 'Not set'],
                              ['Service zone', viewingSeller.shopInfo?.zoneName],
                              ['Service radius', viewingSeller.serviceRadius ? `${viewingSeller.serviceRadius} km` : 'N/A'],
                              ['Address', viewingSeller.location],
                            ].map(([label, value]) => (
                              <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</p>
                                <p className="mt-1.5 text-sm font-bold text-slate-800 break-words">{value || 'Not provided'}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Banking & UPI */}
                        <div>
                          <h5 className="text-xs font-black uppercase tracking-[0.22em] text-primary mb-3">Banking & UPI</h5>
                          <div className="grid gap-3 md:grid-cols-2">
                            {[
                              ['Bank name', viewingSeller.bankInfo?.bankName],
                              ['Account holder', viewingSeller.bankInfo?.accountHolderName],
                              ['Account number', viewingSeller.bankInfo?.accountNumber],
                              ['IFSC code', viewingSeller.bankInfo?.ifscCode],
                              ['Account type', viewingSeller.bankInfo?.accountType],
                              ['UPI ID', viewingSeller.bankInfo?.upiId],
                            ].map(([label, value]) => (
                              <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</p>
                                <p className="mt-1.5 text-sm font-bold text-slate-800 break-words">{value || 'Not provided'}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Compliance */}
                        <div>
                          <h5 className="text-xs font-black uppercase tracking-[0.22em] text-primary mb-3">Compliance & Licenses</h5>
                          <div className="grid gap-3 md:grid-cols-2">
                            {[
                              ['PAN number', viewingSeller.documents?.panNumber],
                              ['GST registered', viewingSeller.documents?.gstRegistered ? 'Yes' : 'No'],
                              ['GST number', viewingSeller.documents?.gstNumber],
                              ['GST legal name', viewingSeller.documents?.gstLegalName],
                              ['FSSAI number', viewingSeller.documents?.fssaiNumber],
                              ['FSSAI expiry', viewingSeller.documents?.fssaiExpiry ? new Date(viewingSeller.documents.fssaiExpiry).toLocaleDateString('en-IN') : null],
                              ['Shop license no.', viewingSeller.documents?.shopLicenseNumber],
                              ['License expiry', viewingSeller.documents?.shopLicenseExpiry ? new Date(viewingSeller.documents.shopLicenseExpiry).toLocaleDateString('en-IN') : null],
                            ].map(([label, value]) => (
                              <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</p>
                                <p className="mt-1.5 text-sm font-bold text-slate-800 break-words">{value || 'Not provided'}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {(viewingSeller.bankInfo?.upiQrImage || viewingSeller.documents?.shopLicenseImage) && (
                        <div className="space-y-4 pt-2">
                          <h4 className="text-base font-black text-slate-900 uppercase tracking-wider">Verification documents</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {viewingSeller.bankInfo?.upiQrImage && (
                              <div className="space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">UPI QR Code</p>
                                <div className="group relative aspect-square w-full overflow-hidden rounded-3xl border-2 border-slate-100 bg-slate-50 transition-all hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5">
                                  <img 
                                    src={viewingSeller.bankInfo.upiQrImage} 
                                    alt="UPI QR" 
                                    className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                                  />
                                  <a 
                                    href={viewingSeller.bankInfo.upiQrImage} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="absolute inset-0 flex items-center justify-center bg-slate-900/0 backdrop-blur-0 opacity-0 transition-all duration-300 group-hover:bg-slate-900/40 group-hover:backdrop-blur-sm group-hover:opacity-100"
                                  >
                                    <div className="rounded-2xl bg-white/20 p-4 text-white backdrop-blur-md">
                                      <HiOutlineEye className="h-8 w-8" />
                                    </div>
                                  </a>
                                </div>
                              </div>
                            )}
                            {viewingSeller.documents?.shopLicenseImage && (
                              <div className="space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Shop License</p>
                                <div className="group relative aspect-square w-full overflow-hidden rounded-3xl border-2 border-slate-100 bg-slate-50 transition-all hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5">
                                  <img 
                                    src={viewingSeller.documents.shopLicenseImage} 
                                    alt="Shop License" 
                                    className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                                  />
                                  <a 
                                    href={viewingSeller.documents.shopLicenseImage} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="absolute inset-0 flex items-center justify-center bg-slate-900/0 backdrop-blur-0 opacity-0 transition-all duration-300 group-hover:bg-slate-900/40 group-hover:backdrop-blur-sm group-hover:opacity-100"
                                  >
                                    <div className="rounded-2xl bg-white/20 p-4 text-white backdrop-blur-md">
                                      <HiOutlineEye className="h-8 w-8" />
                                    </div>
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {!viewingSeller.bankInfo?.upiQrImage && !viewingSeller.documents?.shopLicenseImage && (
                        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 text-sm font-bold text-amber-800 flex items-center gap-3">
                          <HiOutlineXCircle className="h-5 w-5" />
                          No verification documents were uploaded with this application.
                        </div>
                      )}

                      <div className="flex flex-col gap-3 pt-4 md:flex-row">
                        <button type="button" disabled={isProcessing} onClick={() => handleReject(viewingSeller._id)} className="flex-1 rounded-2xl bg-slate-100 py-4 text-[11px] font-black uppercase tracking-[0.22em] text-slate-700 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-60">
                          <span className="inline-flex items-center gap-2"><HiOutlineXCircle className="h-4 w-4" />Reject request</span>
                        </button>
                        <button type="button" disabled={isProcessing} onClick={() => handleApprove(viewingSeller._id)} className="flex-[1.35] rounded-2xl bg-slate-900 py-4 text-[11px] font-black uppercase tracking-[0.22em] text-white transition hover:bg-black disabled:opacity-60">
                          <span className="inline-flex items-center gap-2 justify-center">{isProcessing ? <HiOutlineArrowPath className="h-4 w-4 animate-spin" /> : <HiOutlineCheckCircle className="h-4 w-4" />}Approve seller</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PendingSellers;

