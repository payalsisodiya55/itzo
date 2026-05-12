import React, { useEffect, useMemo, useState } from "react";
import Card from "@shared/components/ui/Card";
import Badge from "@shared/components/ui/Badge";
import Button from "@shared/components/ui/Button";
import { sellerApi } from "../services/sellerApi";
import { useToast } from "@shared/components/ui/Toast";
import {
    HiOutlineArrowPath,
    HiOutlineInboxStack,
    HiOutlineEye,
    HiOutlineCalendarDays,
} from "react-icons/hi2";
import { BlurFade } from "@/components/ui/blur-fade";
import { MagicCard } from "@/components/ui/magic-card";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const Returns = () => {
    const { showToast } = useToast();
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("All");
    const [selectedReturn, setSelectedReturn] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const tabs = [
        "All",
        "Requested",
        "Approved",
        "Rejected",
        "Pickup Assigned",
        "In Transit",
        "Completed",
    ];

    const mapReturnStatusLabel = (status) => {
        switch (status) {
            case "return_requested":
                return "Requested";
            case "return_approved":
                return "Approved";
            case "return_rejected":
                return "Rejected";
            case "return_pickup_assigned":
                return "Pickup Assigned";
            case "return_in_transit":
                return "In Transit";
            case "returned":
            case "refund_completed":
                return "Completed";
            default:
                return status || "Unknown";
        }
    };

    const getStatusVariant = (status) => {
        switch (status) {
            case "return_requested":
                return "warning";
            case "return_approved":
                return "info";
            case "return_rejected":
                return "error";
            case "return_pickup_assigned":
            case "return_in_transit":
                return "secondary";
            case "refund_completed":
            case "returned":
                return "success";
            default:
                return "secondary";
        }
    };

    const fetchReturns = async () => {
        try {
            setLoading(true);
            const res = await sellerApi.getReturns();
            const payload = res.data.result || {};
            const items = Array.isArray(payload.items)
                ? payload.items
                : res.data.results || [];
            setReturns(items || []);
        } catch (error) {
            console.error("Failed to fetch returns", error);
            showToast("Failed to fetch return requests", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReturns();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filteredReturns = useMemo(() => {
        if (activeTab === "All") return returns;
        return returns.filter((r) => {
            const label = mapReturnStatusLabel(r.returnStatus);
            return label === activeTab;
        });
    }, [returns, activeTab]);

    const openDetails = (ret) => {
        setSelectedReturn(ret);
        setIsDetailsOpen(true);
    };

    const handleApprove = async (orderId) => {
        try {
            await sellerApi.approveReturn(orderId, {});
            showToast("Return approved", "success");
            await fetchReturns();
        } catch (error) {
            console.error("Failed to approve return", error);
            showToast(
                error.response?.data?.message || "Failed to approve return",
                "error"
            );
        }
    };

    const handleReject = async (orderId) => {
        const reason = window.prompt(
            "Please enter reason for rejecting the return request:"
        );
        if (!reason) return;
        try {
            await sellerApi.rejectReturn(orderId, { reason });
            showToast("Return rejected", "success");
            await fetchReturns();
        } catch (error) {
            console.error("Failed to reject return", error);
            showToast(
                error.response?.data?.message || "Failed to reject return",
                "error"
            );
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-16">
            <BlurFade delay={0.1}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
                    <div className="min-w-0">
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex flex-wrap items-center gap-2">
                            Return Requests
                            <Badge
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0 font-bold tracking-widest uppercase"
                            >
                                New
                            </Badge>
                        </h1>
                        <p className="text-slate-600 text-sm sm:text-base mt-0.5 font-medium">
                            Review and manage customer return requests.
                        </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                        <Button
                            onClick={fetchReturns}
                            variant="outline"
                            className="flex items-center space-x-1.5 sm:space-x-2 px-3 py-2 sm:px-5 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold text-slate-600 bg-white hover:bg-slate-50 border-slate-200"
                        >
                            <HiOutlineArrowPath className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">REFRESH</span>
                        </Button>
                    </div>
                </div>
            </BlurFade>

            {loading ? (
                <div className="min-h-[320px] flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    <p className="text-slate-600 font-bold mt-4 uppercase tracking-widest text-xs">
                        Loading Return Requests...
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {["Requested", "Approved", "Rejected", "Completed"].map(
                            (label, i) => {
                                const count = returns.filter(
                                    (r) => mapReturnStatusLabel(r.returnStatus) === label
                                ).length;
                                return (
                                    <BlurFade key={label} delay={0.1 + i * 0.05}>
                                        <MagicCard
                                            className="border-none shadow-sm ring-1 ring-slate-100 p-0 overflow-hidden group bg-white"
                                            gradientColor="#eef2ff"
                                        >
                                            <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 relative z-10">
                                                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg flex items-center justify-center bg-slate-900 text-white shadow-sm shrink-0">
                                                    <HiOutlineInboxStack className="h-5 w-5 sm:h-6 sm:w-6" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-widest truncate">
                                                        {label}
                                                    </p>
                                                    <h4 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                                                        {count}
                                                    </h4>
                                                </div>
                                            </div>
                                        </MagicCard>
                                    </BlurFade>
                                );
                            }
                        )}
                    </div>

                    <BlurFade delay={0.2}>
                        <Card className="border-none shadow-xl ring-1 ring-slate-100 rounded-lg bg-white overflow-hidden">
                            <div className="border-b border-slate-100 bg-slate-50/30 overflow-x-auto scrollbar-hide">
                                <div className="flex px-3 sm:px-6 items-center min-w-max">
                                    {tabs.map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={cn(
                                                "relative py-3 sm:py-4 px-2.5 sm:px-4 text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-300",
                                                activeTab === tab
                                                    ? "text-primary scale-105"
                                                    : "text-slate-600 hover:text-slate-700"
                                            )}
                                        >
                                            {tab}
                                            {activeTab === tab && (
                                                <motion.div
                                                    layoutId="returns-tab-underline"
                                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full mx-2 sm:mx-4"
                                                />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-3 sm:p-4">
                                {filteredReturns.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 px-4">
                                        <div className="h-14 w-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-3">
                                            <HiOutlineInboxStack className="h-7 w-7" />
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-900">
                                            No return requests found
                                        </h3>
                                        <p className="text-xs text-slate-600 font-medium text-center mt-1">
                                            You will see customer return requests here.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {filteredReturns.map((ret) => (
                                            <div
                                                key={ret._id}
                                                className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:bg-slate-50/40 transition-colors flex items-start justify-between gap-3"
                                            >
                                                <div
                                                    className="min-w-0 flex-1 cursor-pointer"
                                                    onClick={() => openDetails(ret)}
                                                >
                                                    <p className="text-xs font-black text-slate-900 truncate">
                                                        #{ret.orderId}
                                                    </p>
                                                    <p className="text-xs font-semibold text-slate-600 mt-0.5 flex items-center gap-1">
                                                        <HiOutlineCalendarDays className="h-3 w-3 shrink-0" />
                                                        {ret.returnRequestedAt
                                                            ? new Date(
                                                                  ret.returnRequestedAt
                                                              ).toLocaleString("en-IN", {
                                                                  day: "2-digit",
                                                                  month: "short",
                                                                  hour: "2-digit",
                                                                  minute: "2-digit",
                                                              })
                                                            : "N/A"}
                                                    </p>
                                                    <p className="text-xs font-bold text-slate-800 mt-1">
                                                        {ret.customer?.name || "Customer"}
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                                        {ret.returnReason ||
                                                            "No reason provided"}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col items-end gap-2 shrink-0">
                                                    <Badge
                                                        variant={getStatusVariant(
                                                            ret.returnStatus
                                                        )}
                                                        className="text-[10px] font-black uppercase px-2 py-0"
                                                    >
                                                        {mapReturnStatusLabel(ret.returnStatus)}
                                                    </Badge>
                                                    <p className="text-xs font-black text-slate-900">
                                                        ₹
                                                        {ret.returnRefundAmount ||
                                                            ret.pricing?.subtotal ||
                                                            0}
                                                    </p>
                                                    <button
                                                        onClick={() => openDetails(ret)}
                                                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
                                                    >
                                                        <HiOutlineEye className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Card>
                    </BlurFade>
                </>
            )}

            <AnimatePresence>
                {isDetailsOpen && selectedReturn && (
                    <div className="fixed inset-0 z-[100] flex items-stretch sm:items-center justify-center p-3 sm:p-6 lg:p-12">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-md"
                            onClick={() => setIsDetailsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="w-full max-w-lg sm:max-w-2xl relative z-10 bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-100">
                                <div>
                                    <h3 className="text-base font-black text-slate-900">
                                        Return for Order #{selectedReturn.orderId}
                                    </h3>
                                    <div className="flex items-center space-x-2 mt-0.5">
                                        <Badge
                                            variant={getStatusVariant(
                                                selectedReturn.returnStatus
                                            )}
                                            className="text-[10px] font-black uppercase tracking-widest px-1.5 py-0"
                                        >
                                            {mapReturnStatusLabel(
                                                selectedReturn.returnStatus
                                            )}
                                        </Badge>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsDetailsOpen(false)}
                                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="px-4 py-4 sm:px-6 sm:py-5 overflow-y-auto scrollbar-hide flex-1 space-y-4">
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                                        Customer
                                    </p>
                                    <p className="text-sm font-bold text-slate-900">
                                        {selectedReturn.customer?.name || "Customer"}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {selectedReturn.customer?.phone || ""}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                                        Return Reason
                                    </p>
                                    <p className="text-sm text-slate-800 bg-slate-50 rounded-2xl p-3 border border-slate-100">
                                        {selectedReturn.returnReason ||
                                            "No reason provided by customer."}
                                    </p>
                                    {selectedReturn.returnRejectedReason && (
                                        <p className="text-xs text-rose-600 font-semibold">
                                            Rejection reason:{" "}
                                            {selectedReturn.returnRejectedReason}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                                        Items
                                    </p>
                                    <div className="space-y-2">
                                        {(selectedReturn.returnItems || []).map(
                                            (item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100"
                                                >
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-900">
                                                            {item.name}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            Qty: {item.quantity}
                                                        </p>
                                                    </div>
                                                    <p className="text-xs font-black text-slate-900">
                                                        ₹{item.price * item.quantity}
                                                    </p>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                                        Payment Breakdown
                                    </p>
                                    <p className="text-xs text-slate-700">
                                        Product refund:{" "}
                                        <span className="font-black">
                                            ₹
                                            {selectedReturn.returnRefundAmount ||
                                                selectedReturn.pricing?.subtotal ||
                                                0}
                                        </span>
                                    </p>
                                    <p className="text-xs text-slate-700">
                                        Return delivery commission:{" "}
                                        <span className="font-black">
                                            ₹
                                            {selectedReturn.returnDeliveryCommission ||
                                                0}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-3 sm:gap-0 sm:items-center justify-end">
                                <div className="flex gap-2 items-center">
                                    <button
                                        onClick={() => setIsDetailsOpen(false)}
                                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all"
                                    >
                                        Close
                                    </button>
                                    {selectedReturn.returnStatus ===
                                        "return_requested" && (
                                        <>
                                            <Button
                                                variant="outline"
                                                className="text-xs font-bold"
                                                onClick={() =>
                                                    handleReject(
                                                        selectedReturn.orderId
                                                    )
                                                }
                                            >
                                                Reject
                                            </Button>
                                            <Button
                                                className="text-xs font-bold"
                                                onClick={() =>
                                                    handleApprove(
                                                        selectedReturn.orderId
                                                    )
                                                }
                                            >
                                                Approve
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Returns;

