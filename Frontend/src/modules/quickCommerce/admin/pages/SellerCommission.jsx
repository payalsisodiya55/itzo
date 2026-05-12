import { useState, useMemo, useEffect } from "react"
import { 
  Search, Plus, Edit, Trash2, ArrowUpDown, 
  DollarSign, Percent, Loader2, X, Building2, IndianRupee
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@food/components/ui/dialog"
import { adminApi } from "../services/adminApi"
import { toast } from "sonner"

export default function SellerCommission() {
  const [searchQuery, setSearchQuery] = useState("")
  const [commissions, setCommissions] = useState([])
  const [approvedSellers, setApprovedSellers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isAddEditOpen, setIsAddEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isSellerSelectOpen, setIsSellerSelectOpen] = useState(false)
  const [selectedCommission, setSelectedCommission] = useState(null)
  const [selectedSeller, setSelectedSeller] = useState(null)
  const [formData, setFormData] = useState({
    sellerId: "",
    defaultCommission: {
      type: "percentage",
      value: "10"
    },
    notes: ""
  })
  const [formErrors, setFormErrors] = useState({})
  const [visibleColumns, setVisibleColumns] = useState({
    si: true,
    seller: true,
    sellerId: true,
    defaultCommission: true,
    status: true,
    actions: true,
  })

  const filteredCommissions = useMemo(() => {
    if (!searchQuery.trim()) return commissions
    const query = searchQuery.toLowerCase().trim()
    return commissions.filter(commission =>
      commission.sellerName?.toLowerCase().includes(query) ||
      commission.sellerId?.toLowerCase().includes(query)
    )
  }, [commissions, searchQuery])

  const filteredSellers = useMemo(() => {
    if (!searchQuery.trim()) return approvedSellers
    const query = searchQuery.toLowerCase().trim()
    return approvedSellers.filter(seller =>
      seller.name?.toLowerCase().includes(query) ||
      seller.shopName?.toLowerCase().includes(query) ||
      String(seller._id).toLowerCase().includes(query)
    )
  }, [approvedSellers, searchQuery])

  useEffect(() => {
    fetchBootstrap()
  }, [])

  const fetchBootstrap = async () => {
    try {
      setLoading(true)
      const response = await adminApi.getSellerCommissionBootstrap()
      const data = response?.data?.data
      setCommissions(Array.isArray(data?.commissions) ? data.commissions : [])
      setApprovedSellers(Array.isArray(data?.sellers) ? data.sellers : [])
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch commissions')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (commission) => {
    try {
      await adminApi.toggleSellerCommissionStatus(commission._id)
      await fetchBootstrap()
      toast.success('Commission status updated successfully')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status')
    }
  }

  const handleAdd = () => {
    setSelectedCommission(null)
    setSelectedSeller(null)
    setFormData({
      sellerId: "",
      defaultCommission: {
        type: "percentage",
        value: "10"
      },
      notes: ""
    })
    setFormErrors({})
    setIsSellerSelectOpen(true)
  }

  const handleSelectSeller = (seller) => {
    setSelectedSeller(seller)
    setFormData(prev => ({
      ...prev,
      sellerId: seller._id
    }))
    setIsSellerSelectOpen(false)
    setIsAddEditOpen(true)
  }

  const handleEdit = async (commission) => {
    try {
      setLoading(true)
      const response = await adminApi.getSellerCommissionById(commission._id)
      const commissionData = response?.data?.data?.commission
      if (commissionData) {
        setSelectedCommission(commissionData)
        setSelectedSeller(commissionData.seller)
        setFormData({
          sellerId: commissionData.sellerId || commissionData.seller?._id || "",
          defaultCommission: {
            type: commissionData.defaultCommission?.type || "percentage",
            value: commissionData.defaultCommission?.value?.toString() || "10"
          },
          notes: commissionData.notes || ""
        })
        setFormErrors({})
        setIsAddEditOpen(true)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load commission')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (commission) => {
    setSelectedCommission(commission)
    setIsDeleteOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedCommission) return
    try {
      setDeleting(true)
      await adminApi.deleteSellerCommission(selectedCommission._id)
      await fetchBootstrap()
      toast.success('Commission deleted successfully')
      setIsDeleteOpen(false)
      setSelectedCommission(null)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete commission')
    } finally {
      setDeleting(false)
    }
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.sellerId) errors.sellerId = "Seller is required"
    if (!formData.defaultCommission.value || parseFloat(formData.defaultCommission.value) < 0) {
      errors.defaultCommission = "Default commission value is required"
    }
    if (formData.defaultCommission.type === "percentage" && 
        (parseFloat(formData.defaultCommission.value) < 0 || parseFloat(formData.defaultCommission.value) > 100)) {
      errors.defaultCommission = "Percentage must be between 0-100"
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return
    try {
      setSaving(true)
      const payload = {
        sellerId: formData.sellerId,
        defaultCommission: {
          type: formData.defaultCommission.type,
          value: parseFloat(formData.defaultCommission.value)
        },
        notes: formData.notes
      }

      if (selectedCommission) {
        await adminApi.updateSellerCommission(selectedCommission._id, payload)
        toast.success('Commission updated successfully')
      } else {
        await adminApi.createSellerCommission(payload)
        toast.success('Commission created successfully')
      }

      await fetchBootstrap()
      setIsAddEditOpen(false)
      setSelectedCommission(null)
      setSelectedSeller(null)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save commission')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 lg:p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">Seller Commission</h1>
              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-slate-100 text-slate-700">
                {filteredCommissions.length}
              </span>
            </div>
            <button 
              onClick={handleAdd}
              className="px-4 py-2.5 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-2 transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              Add Commission
            </button>
          </div>

          <div className="mb-4 flex items-center gap-3">
            <div className="relative flex-1 sm:flex-initial min-w-[300px]">
              <input
                type="text"
                placeholder="Search by seller name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 w-full text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider w-16">S.No</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">Seller Name</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">Seller ID</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">Default Commission</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-700 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {filteredCommissions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No commissions found</td>
                    </tr>
                  ) : (
                    filteredCommissions.map((commission) => (
                      <tr key={commission._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{commission.sl}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-emerald-700">{commission.sellerName}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{commission.sellerIdDisplay}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold text-slate-900">
                            {commission.defaultCommission?.type === 'percentage' ? `${commission.defaultCommission.value}%` : `\u20B9${commission.defaultCommission.value}`}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleStatus(commission)}
                            className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${commission.status ? "bg-emerald-500" : "bg-slate-300"}`}
                          >
                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${commission.status ? "translate-x-6" : "translate-x-1"}`} />
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => handleEdit(commission)} className="p-1.5 rounded text-blue-600 hover:bg-blue-50 transition-colors"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(commission)} className="p-1.5 rounded text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isSellerSelectOpen} onOpenChange={setIsSellerSelectOpen}>
        <DialogContent className="max-w-xl bg-white p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-lg font-semibold">Select Seller</DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-4">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search approved sellers..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full text-sm rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
            <div className="max-h-80 overflow-y-auto space-y-2">
              {filteredSellers.filter(s => !s.hasCommissionSetup).map((seller) => (
                <button key={seller._id} onClick={() => handleSelectSeller(seller)} className="w-full p-3 text-left rounded-lg border hover:bg-emerald-50 hover:border-emerald-200 transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-slate-900">{seller.shopName || seller.name}</p>
                      <p className="text-xs text-slate-500">{String(seller._id).slice(-8).toUpperCase()}</p>
                    </div>
                    <Building2 className="w-4 h-4 text-slate-400" />
                  </div>
                </button>
              ))}
              {filteredSellers.filter(s => !s.hasCommissionSetup).length === 0 && (
                <p className="text-center text-sm text-slate-500 py-4">No sellers available for new setup</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddEditOpen} onOpenChange={setIsAddEditOpen}>
        <DialogContent className="max-w-2xl bg-white p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-lg font-semibold">{selectedCommission ? "Edit Seller Commission" : "Add Seller Commission"}</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-6">
            {selectedSeller && (
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-emerald-900">{selectedSeller.shopName || selectedSeller.name}</p>
                  <p className="text-xs text-emerald-700">{selectedSeller._id}</p>
                </div>
                <Building2 className="w-5 h-5 text-emerald-500" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Commission Type</label>
                <select 
                  value={formData.defaultCommission.type} 
                  onChange={(e) => setFormData(prev => ({ ...prev, defaultCommission: { ...prev.defaultCommission, type: e.target.value } }))}
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-white"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="amount">Fixed Amount (\u20B9)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Value</label>
                <input 
                  type="number" 
                  value={formData.defaultCommission.value} 
                  onChange={(e) => setFormData(prev => ({ ...prev, defaultCommission: { ...prev.defaultCommission, value: e.target.value } }))}
                  className={`w-full px-3 py-2 text-sm border rounded-lg ${formErrors.defaultCommission ? "border-red-500" : "border-slate-300"}`}
                  placeholder="e.g., 10"
                />
                {formErrors.defaultCommission && <p className="text-xs text-red-500">{formErrors.defaultCommission}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (Optional)</label>
              <textarea 
                value={formData.notes} 
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 text-sm border rounded-lg resize-none" 
                rows="3" 
                placeholder="Commission details or remarks..."
              />
            </div>
          </div>
          <DialogFooter className="px-6 py-4 bg-slate-50 border-t">
            <button onClick={() => setIsAddEditOpen(false)} className="px-4 py-2 text-sm font-medium rounded-lg border bg-white">Cancel</button>
            <button 
              onClick={handleSave} 
              disabled={saving}
              className="px-6 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {selectedCommission ? "Update Commission" : "Create Commission"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader><DialogTitle>Delete Seller Commission</DialogTitle></DialogHeader>
          <div className="py-4"><p className="text-sm text-slate-700">Are you sure you want to delete commission for "{selectedCommission?.sellerName}"? This cannot be undone.</p></div>
          <DialogFooter>
            <button onClick={() => setIsDeleteOpen(false)} className="px-4 py-2 text-sm font-medium border rounded-lg bg-white">Cancel</button>
            <button onClick={confirmDelete} disabled={deleting} className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">Delete</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
