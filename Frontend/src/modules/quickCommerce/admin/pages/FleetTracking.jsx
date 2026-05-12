import React, { useState, useEffect } from "react";
import Card from "@shared/components/ui/Card";
import Badge from "@shared/components/ui/Badge";
import Button from "@shared/components/ui/Button";
import {
  HiOutlineMagnifyingGlass,
  HiOutlineArrowRight,
  HiOutlineXMark,
  HiOutlinePhone,
  HiOutlineIdentification,
  HiOutlineStar,
  HiOutlineCalendarDays,
  HiOutlineTruck,
} from "react-icons/hi2";
import { motion, AnimatePresence } from "framer-motion";
import Pagination from "@shared/components/ui/Pagination";
import { adminApi } from "../services/adminApi";
import { toast } from "sonner";

const formatTimeDistance = (date) => {
  if (!date) return "N/A";
  const diff = Math.floor((new Date() - new Date(date)) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
};

const FleetTrackingTable = () => {
  const [fleet, setFleet] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBoy, setSelectedBoy] = useState(null);

  const fetchFleet = async (requestedPage = 1) => {
    setIsLoading(true);
    try {
      const response = await adminApi.getActiveFleet({
        page: requestedPage,
        limit: pageSize,
      });
      const payload = response.data.result || {};
      const data = Array.isArray(payload.items)
        ? payload.items
        : response.data.results || [];
      setFleet(data);
      setTotal(typeof payload.total === "number" ? payload.total : data.length);
      setPage(typeof payload.page === "number" ? payload.page : requestedPage);
    } catch (error) {
      console.error("Fetch Fleet Error:", error);
      toast.error("Failed to fetch live fleet data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFleet(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize]);

  useEffect(() => {
    const interval = setInterval(() => fetchFleet(page), 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const filteredFleet = fleet.filter(
    (item) =>
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.deliveryBoy.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fleet Tracking</h1>
          <p className="text-sm text-slate-500">
            Monitor all active delivery assignments in real-time.
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search Order or Partner..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Delivery Boy
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
                  Route
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">
                  Last Update
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFleet.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-slate-900 leading-none">
                      {item.id}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedBoy(item.deliveryBoy)}
                      className="text-left hover:text-primary transition-colors focus:outline-none">
                      <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors underline decoration-dotted underline-offset-4 decoration-slate-300 group-hover:decoration-primary">
                        {item.deliveryBoy.name}
                      </p>
                      <p className="text-xs text-primary font-medium">
                        {item.deliveryBoy.phone}
                      </p>
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-3 text-slate-600">
                      <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100">
                        {item.seller.name}
                      </span>
                      <HiOutlineArrowRight className="text-slate-300" />
                      <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2 py-1 rounded border border-emerald-100">
                        {item.customer.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {item.customer.name}
                      </p>
                      <p className="text-xs text-slate-500 font-medium">
                        {item.customer.phone}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant={
                        item.status === "On the Way"
                          ? "info"
                          : item.status === "At Pickup"
                            ? "warning"
                            : "primary"
                      }
                      className="text-[10px] font-bold uppercase tracking-wider">
                      {item.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                      {formatTimeDistance(item.lastUpdate)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-slate-100">
          <Pagination
            page={page}
            totalPages={Math.ceil(total / pageSize) || 1}
            total={total}
            pageSize={pageSize}
            onPageChange={(p) => fetchFleet(p)}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
            loading={isLoading}
          />
        </div>

        {filteredFleet.length === 0 && (
          <div className="py-12 text-center text-slate-400">
            <p className="text-sm font-medium tracking-wide">
              No active missions matching your search.
            </p>
          </div>
        )}
      </Card>

      {/* Delivery Boy Detail Modal */}
      <AnimatePresence>
        {selectedBoy && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBoy(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden">
              <div className="relative h-32 bg-slate-900">
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={() => setSelectedBoy(null)}
                    className="h-8 w-8 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all">
                    <HiOutlineXMark className="h-5 w-5" />
                  </button>
                </div>
                <div className="absolute -bottom-12 left-8">
                  <div className="h-24 w-24 rounded-xl border-4 border-white overflow-hidden shadow-lg">
                    <img
                      src={selectedBoy.image}
                      alt={selectedBoy.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-16 pb-8 px-4 space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">
                    {selectedBoy.name}
                  </h2>
                  <div className="flex items-center gap-2 text-primary font-bold text-sm mt-1">
                    <HiOutlineIdentification className="h-4 w-4" />
                    ID: {selectedBoy.id}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Rating
                    </p>
                    <div className="flex items-center gap-1.5 text-amber-500 font-bold">
                      <HiOutlineStar className="h-4 w-4 fill-amber-500" />
                      {selectedBoy.rating}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Joined
                    </p>
                    <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                      <HiOutlineCalendarDays className="h-4 w-4 text-slate-400" />
                      {selectedBoy.joined}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                      <HiOutlinePhone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                        Mobile Number
                      </p>
                      <p className="font-bold text-slate-900">
                        {selectedBoy.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                      <HiOutlineTruck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                        Vehicle Details
                      </p>
                      <p className="font-bold text-slate-900">
                        {selectedBoy.vehicle}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button className="w-full py-6 rounded-2xl font-bold tracking-wide">
                    VIEW FULL PROFILE
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FleetTrackingTable;
