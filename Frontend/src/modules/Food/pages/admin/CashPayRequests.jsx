import { useState, useEffect } from "react"
import { Search, Receipt, Loader2, Package, Eye, X, ZoomIn } from "lucide-react"
import { adminAPI } from "@food/api"
import { toast } from "sonner"
const debugLog = (...args) => {}
const debugWarn = (...args) => {}
const debugError = (...args) => {}

const formatCurrency = (amount) => {
  if (amount == null) return "₹0.00"
  return `₹${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const formatDate = (d) => {
  if (!d) return "—"
  try {
    return new Date(d).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    })
  } catch {
    return String(d)
  }
}

export default function CashPayRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [methodFilter, setMethodFilter] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isFullscreenImage, setIsFullscreenImage] = useState(false)
  
  const limit = 20

  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, methodFilter, debouncedSearchQuery]);

  const fetchData = async (options = {}) => {
    try {
      setLoading(true)
      const res = await adminAPI.getCashPayRequests({
        search: debouncedSearchQuery.trim() || undefined,
        status: statusFilter || undefined,
        method: methodFilter || undefined,
        page: options.page || page,
        limit
      })
      if (res?.data?.success) {
        const data = res.data.data
        setRequests(data?.requests || [])
        setTotal(data?.pagination?.total || 0)
        setPages(data?.pagination?.pages || 1)
      } else {
        toast.error(res?.data?.message || "Failed to fetch requests")
        setRequests([])
      }
    } catch (err) {
      debugError("Error fetching cash pay requests:", err)
      toast.error(err?.response?.data?.message || "Failed to fetch requests")
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [page, statusFilter, methodFilter, debouncedSearchQuery])

  const handleAction = async (id, status) => {
      try {
        const adminNote = status === 'Rejected' ? window.prompt("Reason for rejection?") || "" : "";
        if (status === 'Rejected' && adminNote === null) return; // cancelled
        
        const res = await adminAPI.updateDeliveryCashDepositStatus(id, status, adminNote);
        if (res?.data?.success) {
          toast.success(`Request ${status} successfully`);
          setSelectedRequest(null);
          setIsDrawerOpen(false);
          fetchData();
        } else {
          toast.error(res?.data?.message || "Failed to update status");
        }
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to update status");
      }
  }


  return (
    <div className="p-4 lg:p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-3">
            <Receipt className="w-5 h-5 text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-900">Cash Pay Requests</h1>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Review manual cash pay requests submitted by delivery partners. Approve them to restore their cash limit.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900">Requests</h2>
              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-slate-100 text-slate-700">
                {total}
              </span>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm rounded-lg border border-slate-300 py-2 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <option value="">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
              <select 
                value={methodFilter} 
                onChange={(e) => setMethodFilter(e.target.value)}
                className="text-sm rounded-lg border border-slate-300 py-2 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <option value="">All Methods</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
              </select>
            </div>
            
            <div className="relative flex-1 sm:flex-initial min-w-[200px] max-w-xs">
              <input
                type="text"
                placeholder="Search by ID or name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 w-full text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-4" />
              <p className="text-slate-600">Loading…</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">Delivery Boy</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">Method</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-700 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Package className="w-16 h-16 text-slate-400 mb-4" />
                          <p className="text-lg font-semibold text-slate-700">No requests found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    requests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => { setSelectedRequest(req); setIsDrawerOpen(true); }}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                          {formatDate(req.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-700">
                          <div className="flex flex-col">
                            <span>{req.deliveryName || "—"}</span>
                            <span className="text-xs text-slate-400 font-mono">{req.deliveryIdString || "—"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-700">
                          {formatCurrency(req.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-slate-100 text-slate-700 uppercase">
                            {req.paymentMethod}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              req.status === "Completed"
                                ? "bg-emerald-100 text-emerald-700"
                                : req.status === "Rejected"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {req.status === "Completed" ? "Approved" : req.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                           <button className="p-2 text-slate-400 hover:text-emerald-600 bg-slate-50 rounded-lg">
                              <Eye className="w-4 h-4" />
                           </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
          {pages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-600">
                Page {page} of {pages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={page >= pages}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Drawer */}
      {isDrawerOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">Request Details</h3>
              <button onClick={() => setIsDrawerOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
               <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Status</label>
                  <span
                      className={`px-3 py-1 inline-flex rounded-full text-xs font-bold ${
                        selectedRequest.status === "Completed"
                          ? "bg-emerald-100 text-emerald-700"
                          : selectedRequest.status === "Rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {selectedRequest.status === "Completed" ? "Approved" : selectedRequest.status}
                  </span>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Amount</label>
                    <div className="text-lg font-bold text-slate-900">{formatCurrency(selectedRequest.amount)}</div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Method</label>
                    <div className="text-sm font-medium text-slate-900 uppercase">{selectedRequest.paymentMethod}</div>
                  </div>
               </div>
               
               <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Delivery Partner</label>
                  <div className="font-medium text-slate-900">{selectedRequest.deliveryName}</div>
                  <div className="text-sm text-slate-500 font-mono mt-1">{selectedRequest.deliveryIdString}</div>
               </div>
               
               <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Submitted At</label>
                  <div className="text-sm text-slate-700">{formatDate(selectedRequest.createdAt)}</div>
               </div>
               
               {selectedRequest.adminNote && (
                  <div className="bg-red-50 text-red-800 p-4 rounded-xl text-sm border border-red-100">
                    <span className="font-bold block mb-1">Rejection Note:</span>
                    {selectedRequest.adminNote}
                  </div>
               )}
               
               {selectedRequest.proofImageUrl && (
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Payment Proof</label>
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 group bg-slate-100">
                       <img 
                          src={selectedRequest.proofImageUrl} 
                          alt="Proof" 
                          className="w-full h-auto max-h-64 object-contain cursor-pointer"
                          onClick={() => setIsFullscreenImage(true)}
                       />
                       <button 
                          onClick={() => setIsFullscreenImage(true)}
                          className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors flex items-center justify-center"
                       >
                         <ZoomIn className="text-white opacity-0 group-hover:opacity-100 w-8 h-8 drop-shadow-md" />
                       </button>
                    </div>
                  </div>
               )}
            </div>
            
            {selectedRequest.status === 'Pending' && (
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
                <button 
                  onClick={() => handleAction(selectedRequest.id, 'Completed')} 
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  Approve Request
                </button>
                <button 
                  onClick={() => handleAction(selectedRequest.id, 'Rejected')} 
                  className="flex-1 py-3 px-4 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-semibold rounded-xl transition-colors"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Fullscreen Image Preview */}
      {isFullscreenImage && selectedRequest?.proofImageUrl && (
         <div className="fixed inset-0 z-[60] bg-slate-900/90 backdrop-blur flex items-center justify-center p-4">
            <button 
              onClick={() => setIsFullscreenImage(false)} 
              className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
               src={selectedRequest.proofImageUrl} 
               alt="Proof Zoomed" 
               className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
         </div>
      )}
    </div>
  )
}
