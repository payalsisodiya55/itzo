import { useState, useMemo, useEffect } from "react"
import { Search, Edit, Trash2, IndianRupee, Settings, Check, Columns, MapPin, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@food/components/ui/dialog"
import { adminAPI } from "@food/api"
import { API_BASE_URL } from "@food/api/config"
import { toast } from "sonner"
const debugLog = (...args) => {}
const debugWarn = (...args) => {}
const debugError = (...args) => {}


export default function DeliveryBoyCommission() {
  const [searchQuery, setSearchQuery] = useState("")
  const [commissions, setCommissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isAddEditOpen, setIsAddEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [selectedCommission, setSelectedCommission] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    minDistance: "",
    maxDistance: "",
    maxDistanceUnlimited: false,
    commissionPerKm: "",
    basePayout: "",
  })
  const [formErrors, setFormErrors] = useState({})
  const [visibleColumns, setVisibleColumns] = useState({
    si: true,
    name: true,
    distanceSlab: true,
    commissionPerKm: true,
    basePayout: true,
    status: true,
    actions: true,
  })

  const filteredCommissions = useMemo(() => {
    if (!searchQuery.trim()) {
      return commissions
    }
    
    const query = searchQuery.toLowerCase().trim()
    return commissions.filter(commission =>
      commission.name.toLowerCase().includes(query) ||
      `0-${commission.minDistance} km`.toLowerCase().includes(query) ||
      (commission.maxDistance !== null && `${commission.minDistance}-${commission.maxDistance} km`.toLowerCase().includes(query))
    )
  }, [commissions, searchQuery])

  const getDistanceSlabLabel = (commission) => {
    const min = Number(commission.minDistance) || 0
    const max = commission.maxDistance === null || commission.maxDistance === undefined ? null : Number(commission.maxDistance)
    if (max === null) return `${min}+ km`
    return `${min}-${max} km`
  }

  // Calculate total commission for a given distance
  const calculateTotalCommission = (commission, distance) => {
    // Check if distance falls within this commission tier
    if (distance < commission.minDistance) return 0
    if (commission.maxDistance !== null && distance > commission.maxDistance) return 0
    
    // For 0-x slab we usually want per-km on full distance; for other slabs apply per-km after minDistance
    const min = Number(commission.minDistance) || 0
    const extraDistance = Math.max(0, distance - min)
    const kmForRate = min === 0 ? distance : extraDistance
    return commission.basePayout + (kmForRate * commission.commissionPerKm)
  }

  // Calculate example commission for display (using mid-point of range)
  const getExampleCommission = (commission) => {
    if (commission.maxDistance === null) {
      const exampleDistance = commission.minDistance + 5 // Example: 10km for 10+ km tier
      return calculateTotalCommission(commission, exampleDistance)
    }
    const midDistance = (commission.minDistance + commission.maxDistance) / 2
    return calculateTotalCommission(commission, midDistance)
  }

  // Fetch commission rules on component mount
  useEffect(() => {
    fetchCommissionRules()
  }, [])

  const fetchCommissionRules = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getCommissionRules()
      
      // Handle different response structures
      let commissionsData = null
      if (response?.data?.success && response?.data?.data?.commissions) {
        commissionsData = response.data.data.commissions
      } else if (response?.data?.data?.commissions) {
        commissionsData = response.data.data.commissions
      } else if (response?.data?.commissions) {
        commissionsData = response.data.commissions
      }
      
      if (commissionsData && Array.isArray(commissionsData)) {
        // Add serial numbers based on array index
        const commissionsWithSl = commissionsData.map((commission, index) => ({
          ...commission,
          sl: index + 1
        }))
        setCommissions(commissionsWithSl)
      } else {
        setCommissions([])
      }
    } catch (error) {
      debugError('Error fetching commission rules:', error)
      debugError('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL
      })
      
      // Handle network errors
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        const errorMessage = `Cannot connect to backend server. Please ensure the backend is running on ${API_BASE_URL.replace('/api', '')}`
        toast.error(errorMessage)
        debugError('?? Backend connection issue. Check:')
        debugError('   1. Is backend server running? (npm start in backend folder)')
        debugError(`   2. Is backend running on ${API_BASE_URL.replace('/api', '')}?`)
        debugError('   3. Check browser console for CORS errors')
        setCommissions([])
        return
      }
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch commission rules'
      toast.error(errorMessage)
      setCommissions([])
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (commission) => {
    try {
      const newStatus = !commission.status
      await adminAPI.toggleCommissionRuleStatus(commission._id, newStatus)
      setCommissions(commissions.map(c =>
        c._id === commission._id ? { ...c, status: newStatus } : c
      ))
      toast.success('Commission rule status updated successfully')
    } catch (error) {
      debugError('Error toggling status:', error)
      toast.error(error.response?.data?.message || 'Failed to update status')
    }
  }

  const handleAdd = () => {
    setSelectedCommission(null)
    setFormData({ name: "", minDistance: "0", maxDistance: "", maxDistanceUnlimited: false, commissionPerKm: "", basePayout: "" })
    setFormErrors({})
    setIsAddEditOpen(true)
  }

  const handleEdit = (commission) => {
    setSelectedCommission(commission)
    const isUnlimited = commission.maxDistance === null || commission.maxDistance === undefined
    setFormData({
      name: commission.name,
      minDistance: commission.minDistance?.toString?.() || "",
      maxDistance: isUnlimited ? "" : String(commission.maxDistance),
      maxDistanceUnlimited: isUnlimited,
      commissionPerKm: commission.commissionPerKm.toString(),
      basePayout: commission.basePayout.toString(),
    })
    setFormErrors({})
    setIsAddEditOpen(true)
  }

  const handleDelete = (commission) => {
    setSelectedCommission(commission)
    setIsDeleteOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedCommission) return
    
    try {
      setDeleting(true)
      await adminAPI.deleteCommissionRule(selectedCommission._id)
      setCommissions(commissions.filter(commission => commission._id !== selectedCommission._id))
      setIsDeleteOpen(false)
      setSelectedCommission(null)
      toast.success('Commission rule deleted successfully')
    } catch (error) {
      debugError('Error deleting commission rule:', error)
      toast.error(error.response?.data?.message || 'Failed to delete commission rule')
    } finally {
      setDeleting(false)
    }
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.minDistance.trim() || parseFloat(formData.minDistance) < 0) {
      errors.minDistance = "Minimum distance must be 0 or greater"
    }
    if (!formData.maxDistanceUnlimited && formData.maxDistance !== "" && parseFloat(formData.maxDistance) < parseFloat(formData.minDistance || "0")) {
      errors.maxDistance = "Max distance must be greater than or equal to min distance"
    }
    if (!formData.commissionPerKm.trim() || parseFloat(formData.commissionPerKm) < 0) {
      errors.commissionPerKm = "Commission per km must be 0 or greater"
    }
    if (!formData.basePayout.trim() || parseFloat(formData.basePayout) < 0) {
      errors.basePayout = "Base payout must be 0 or greater"
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return
    
    try {
      setSaving(true)
      const minDistance = parseFloat(formData.minDistance)
      const maxDistance = formData.maxDistanceUnlimited || formData.maxDistance === "" ? null : parseFloat(formData.maxDistance)
      const commissionData = {
        name: formData.name.trim() || `Base (0-${minDistance} km)`,
        minDistance,
        maxDistance,
        commissionPerKm: parseFloat(formData.commissionPerKm),
        basePayout: parseFloat(formData.basePayout),
        status: selectedCommission ? selectedCommission.status : true,
      }
      
      if (selectedCommission) {
        // Update existing commission
        const response = await adminAPI.updateCommissionRule(selectedCommission._id, commissionData)
        let commission = null
        if (response?.data?.success && response?.data?.data?.commission) {
          commission = response.data.data.commission
        } else if (response?.data?.data?.commission) {
          commission = response.data.data.commission
        } else if (response?.data?.commission) {
          commission = response.data.commission
        }
        
        if (commission) {
          const updatedCommission = {
            ...commission,
            sl: selectedCommission.sl
          }
          setCommissions(commissions.map(c =>
            c._id === selectedCommission._id ? updatedCommission : c
          ))
          toast.success('Commission rule updated successfully')
        }
      } else {
        const response = await adminAPI.createCommissionRule(commissionData)
        let commission = null
        if (response?.data?.success && response?.data?.data?.commission) {
          commission = response.data.data.commission
        } else if (response?.data?.data?.commission) {
          commission = response.data.data.commission
        } else if (response?.data?.commission) {
          commission = response.data.commission
        }
        
        if (commission) {
          const newCommission = {
            ...commission,
            sl: commissions.length + 1
          }
          setCommissions([...commissions, newCommission])
          toast.success('Commission rule created successfully')
        }
      }
      
      setIsAddEditOpen(false)
      setFormData({ name: "", minDistance: "0", maxDistance: "", commissionPerKm: "", basePayout: "" })
      setSelectedCommission(null)
    } catch (error) {
      debugError('Error saving commission rule:', error)
      debugError('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL
      })
      
      // Log full response data for debugging
      if (error.response?.data) {
        debugError('Full error response:', JSON.stringify(error.response.data, null, 2))
      }
      
      // Handle network errors
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        const errorMessage = `Cannot connect to backend server. Please ensure the backend is running on ${API_BASE_URL.replace('/api', '')}`
        toast.error(errorMessage)
        debugError('?? Backend connection issue. Check:')
        debugError('   1. Is backend server running? (npm start in backend folder)')
        debugError(`   2. Is backend running on ${API_BASE_URL.replace('/api', '')}?`)
        debugError('   3. Check browser console for CORS errors')
        return
      }
      
      // Handle other errors - extract message from different possible response structures
      let errorMessage = 'Failed to save commission rule'
      if (error.response?.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data
        } else if (error.response.data.errors) {
          // Handle validation errors
          const errors = error.response.data.errors
          if (Array.isArray(errors)) {
            errorMessage = errors.join(', ')
          } else if (typeof errors === 'object') {
            errorMessage = Object.values(errors).join(', ')
          }
        }
      } else {
        errorMessage = error.message || errorMessage
      }
      
      toast.error(errorMessage)
      
      // Set form errors if validation errors from backend
      if (error.response?.data?.errors) {
        setFormErrors(error.response.data.errors)
      } else if (error.response?.data?.message) {
        // If backend returns a single error message, try to parse it
        const message = error.response.data.message
        if (message.includes('overlap')) {
          setFormErrors({ overlap: message })
        } else if (message.includes('name')) {
          setFormErrors({ name: message })
        } else if (message.includes('distance')) {
          setFormErrors({ minDistance: message, maxDistance: message })
        }
      }
    } finally {
      setSaving(false)
    }
  }

  const toggleColumn = (columnKey) => {
    setVisibleColumns(prev => ({ ...prev, [columnKey]: !prev[columnKey] }))
  }

  const resetColumns = () => {
    setVisibleColumns({
      si: true,
      name: true,
      distanceSlab: true,
      commissionPerKm: true,
      basePayout: true,
      totalCommission: true,
      status: true,
      actions: true,
    })
  }

  const columnsConfig = {
    si: "Serial Number",
    name: "Name",
    distanceSlab: "Distance Slab (km)",
    commissionPerKm: "Commission/Km",
    basePayout: "Base Payout",
    status: "Status",
    actions: "Actions",
  }

  const configuredMinDistance = Number(
    formData.minDistance !== "" ? formData.minDistance : selectedCommission?.minDistance
  )
  const formulaMinDistance = Number.isFinite(configuredMinDistance) ? configuredMinDistance : 0

  return (
    <div className="p-4 lg:p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <IndianRupee className="w-5 h-5 text-slate-600" />
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">Delivery Boy Commission</h1>
                <span className="px-3 py-1 rounded-full text-sm font-semibold bg-slate-100 text-slate-700">
                  {filteredCommissions.length}
                </span>
              </div>
            </div>

          <div className="flex items-center gap-2">
              <button
                onClick={handleAdd}
                className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Rule
              </button>
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-all"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Info Card */}
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-slate-700">
                <p className="font-semibold text-blue-900 mb-1">Fixed + Extra Distance Commission</p>
                <p className="text-slate-600">
                  Commission is calculated as: <strong>Base payout for 0-{formulaMinDistance} km + Extra per km after {formulaMinDistance} km</strong>.
                  Example: if base is ₹25 and extra is ₹5/km, then 6 km earns ₹25 + (2 x ₹5) = ₹35.
                </p>
                <p className="text-slate-600 mt-1">
                  Only the slab with <strong>min distance = 0</strong> can have a base payout. All other slabs should keep base payout set to 0 and use only amount per km.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-4 flex items-center gap-3">
            <div className="relative flex-1 sm:flex-initial min-w-[250px]">
              <input
                type="text"
                placeholder="Ex: Search by name or distance."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 w-full text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {visibleColumns.si && (
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">SI</th>
                  )}
                  {visibleColumns.name && (
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">Name</th>
                  )}
                  {visibleColumns.distanceSlab && (
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">Distance Slab (km)</th>
                  )}
                  {visibleColumns.commissionPerKm && (
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">Amount Per/Km (₹)</th>
                  )}
                  {visibleColumns.basePayout && (
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">Base Payout (₹)</th>
                  )}
                  {visibleColumns.status && (
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">Status</th>
                  )}
                  {visibleColumns.actions && (
                    <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-700 uppercase tracking-wider">Action</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={Object.values(visibleColumns).filter(v => v).length} className="px-6 py-8 text-center">
                      <div className="flex items-center justify-center gap-2 text-slate-500">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Loading commission rules...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredCommissions.length === 0 ? (
                  <tr>
                    <td colSpan={Object.values(visibleColumns).filter(v => v).length} className="px-6 py-8 text-center text-slate-500">
                      No commission rules found
                    </td>
                  </tr>
                ) : (
                  filteredCommissions.map((commission) => (
                    <tr key={commission.sl} className="hover:bg-slate-50 transition-colors">
                      {visibleColumns.si && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-slate-700">{commission.sl}</span>
                        </td>
                      )}
                      {visibleColumns.name && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-slate-900">{commission.name}</span>
                        </td>
                      )}
                      {visibleColumns.distanceSlab && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-900">{getDistanceSlabLabel(commission)}</span>
                            <span className="text-xs text-slate-500">Base payout slab</span>
                          </div>
                        </td>
                      )}
                      {visibleColumns.commissionPerKm && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-green-700">{"\u20B9"}{commission.commissionPerKm}</span>
                        </td>
                      )}
                      {visibleColumns.basePayout && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-blue-700">{"\u20B9"}{commission.basePayout}</span>
                        </td>
                      )}
                      {visibleColumns.status && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleStatus(commission)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              commission.status ? "bg-blue-600" : "bg-slate-300"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                commission.status ? "translate-x-6" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </td>
                      )}
                      {visibleColumns.actions && (
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEdit(commission)}
                              className="p-1.5 rounded text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(commission)}
                              className="p-1.5 rounded text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddEditOpen} onOpenChange={setIsAddEditOpen}>
        <DialogContent className="max-w-md bg-white p-0 opacity-0 data-[state=open]:opacity-100 data-[state=closed]:opacity-0 transition-opacity duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:scale-100 data-[state=closed]:scale-100">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle>{selectedCommission ? "Edit Commission Rule" : "Add Commission Rule"}</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Rule Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-4 py-2.5 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                  formErrors.name ? "border-red-500" : "border-slate-300"
                }`}
                placeholder={`e.g., Base (0-${formulaMinDistance} km)`}
              />
              {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Minimum Distance Slab (km) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.minDistance}
                onChange={(e) => setFormData({ ...formData, minDistance: e.target.value })}
                className={`w-full px-4 py-2.5 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                  formErrors.minDistance ? "border-red-500" : "border-slate-300"
                }`}
                placeholder="e.g., 4"
              />
              {formErrors.minDistance && <p className="text-xs text-red-500 mt-1">{formErrors.minDistance}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Maximum Distance Slab (km) <span className="text-slate-400">(optional)</span>
              </label>
              <div className="flex items-center justify-between gap-3 mb-2">
                <label className="flex items-center gap-2 text-sm text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.maxDistanceUnlimited)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxDistanceUnlimited: e.target.checked,
                        maxDistance: e.target.checked ? "" : formData.maxDistance,
                      })
                    }
                  />
                  Unlimited
                </label>
                <span className="text-xs text-slate-500">
                  If unlimited, this rule applies for {formData.minDistance || 0}+ km
                </span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.maxDistance}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxDistanceUnlimited: false,
                    maxDistance: e.target.value,
                  })
                }
                disabled={Boolean(formData.maxDistanceUnlimited)}
                className={`w-full px-4 py-2.5 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                  formErrors.maxDistance ? "border-red-500" : "border-slate-300"
                }`}
                placeholder="e.g., 3 (or enable Unlimited)"
              />
              {formErrors.maxDistance && <p className="text-xs text-red-500 mt-1">{formErrors.maxDistance}</p>}
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              Distance slab:{" "}
              <strong>
                {formData.maxDistanceUnlimited || !formData.maxDistance
                  ? `${formData.minDistance || 0}+ km`
                  : `${formData.minDistance || 0}-${formData.maxDistance} km`}
              </strong>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Extra Per Kilometer after {formulaMinDistance} km (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.commissionPerKm}
                onChange={(e) => setFormData({ ...formData, commissionPerKm: e.target.value })}
                className={`w-full px-4 py-2.5 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                  formErrors.commissionPerKm ? "border-red-500" : "border-slate-300"
                }`}
                placeholder="e.g., 5"
              />
              {formErrors.commissionPerKm && <p className="text-xs text-red-500 mt-1">{formErrors.commissionPerKm}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Fixed Payout for 0-{formulaMinDistance} km (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.basePayout}
                onChange={(e) => setFormData({ ...formData, basePayout: e.target.value })}
                className={`w-full px-4 py-2.5 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                  formErrors.basePayout ? "border-red-500" : "border-slate-300"
                }`}
                placeholder="e.g., 25"
              />
              {formErrors.basePayout && <p className="text-xs text-red-500 mt-1">{formErrors.basePayout}</p>}
              <p className="text-xs text-slate-500 mt-1">
                Formula: Base payout + (max(0, distance - {formulaMinDistance}) * extra per km)
              </p>
            </div>
          </div>
          <DialogFooter className="px-6 pb-6">
            <button
              onClick={() => setIsAddEditOpen(false)}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {selectedCommission ? "Update" : "Add"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md bg-white p-0 opacity-0 data-[state=open]:opacity-100 data-[state=closed]:opacity-0 transition-opacity duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:scale-100 data-[state=closed]:scale-100">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle>Delete Commission Rule</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6">
            <p className="text-sm text-slate-700">
              Are you sure you want to delete "{selectedCommission?.name}"? This action cannot be undone.
            </p>
          </div>
          <DialogFooter className="px-6 pb-6">
            <button
              onClick={() => setIsDeleteOpen(false)}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={deleting}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-md bg-white p-0 opacity-0 data-[state=open]:opacity-100 data-[state=closed]:opacity-0 transition-opacity duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:scale-100 data-[state=closed]:scale-100">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Table Settings
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Columns className="w-4 h-4" />
                Visible Columns
              </h3>
              <div className="space-y-2">
                {Object.entries(columnsConfig).map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={visibleColumns[key]}
                      onChange={() => toggleColumn(key)}
                      className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                    />
                    <span className="text-sm text-slate-700">{label}</span>
                    {visibleColumns[key] && (
                      <Check className="w-4 h-4 text-emerald-600 ml-auto" />
                    )}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={resetColumns}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-all"
              >
                Reset
              </button>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-md"
              >
                Apply
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


