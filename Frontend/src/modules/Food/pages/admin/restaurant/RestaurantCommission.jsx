import { useState, useMemo, useEffect } from "react"
import { 
  Search, Plus, Edit, Trash2, ArrowUpDown, 
  DollarSign, Percent, Loader2, X, Building2, IndianRupee
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@food/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@food/components/ui/dropdown-menu"
import { adminAPI } from "@food/api"
import { API_BASE_URL } from "@food/api/config"
import { toast } from "sonner"
const debugLog = (...args) => {}
const debugWarn = (...args) => {}
const debugError = (...args) => {}


export default function RestaurantCommission() {
  const [searchQuery, setSearchQuery] = useState("")
  const [commissions, setCommissions] = useState([])
  const [approvedRestaurants, setApprovedRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isAddEditOpen, setIsAddEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isRestaurantSelectOpen, setIsRestaurantSelectOpen] = useState(false)
  const [selectedCommission, setSelectedCommission] = useState(null)
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [formData, setFormData] = useState({
    restaurantId: "",
    defaultCommission: {
      type: "percentage",
      value: "10"
    },
    notes: ""
  })
  const [formErrors, setFormErrors] = useState({})
  const [visibleColumns, setVisibleColumns] = useState({
    si: true,
    restaurant: true,
    restaurantId: true,
    defaultCommission: true,
    status: true,
    actions: true,
  })

  const filteredCommissions = useMemo(() => {
    if (!searchQuery.trim()) {
      return commissions
    }
    
    const query = searchQuery.toLowerCase().trim()
    return commissions.filter(commission =>
      commission.restaurantName?.toLowerCase().includes(query) ||
      commission.restaurantId?.toLowerCase().includes(query) ||
      commission.restaurant?.name?.toLowerCase().includes(query)
    )
  }, [commissions, searchQuery])

  const filteredRestaurants = useMemo(() => {
    if (!searchQuery.trim()) {
      return approvedRestaurants
    }
    
    const query = searchQuery.toLowerCase().trim()
    return approvedRestaurants.filter(restaurant =>
      restaurant.name?.toLowerCase().includes(query) ||
      restaurant.restaurantId?.toLowerCase().includes(query) ||
      restaurant.ownerName?.toLowerCase().includes(query)
    )
  }, [approvedRestaurants, searchQuery])

  // Fetch data on component mount
  useEffect(() => {
    // Single fast call to avoid multiple API requests on load
    fetchBootstrap()
  }, [])

  const fetchBootstrap = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getRestaurantCommissionBootstrap()
      const data = response?.data?.data
      setCommissions(Array.isArray(data?.commissions) ? data.commissions : [])
      setApprovedRestaurants(Array.isArray(data?.restaurants) ? data.restaurants : [])
    } catch (error) {
      debugError('Error fetching bootstrap:', error)
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        toast.error(`Cannot connect to backend server. Please ensure the backend is running on ${API_BASE_URL.replace('/api', '')}`)
      } else {
        toast.error(error.response?.data?.message || 'Failed to fetch commissions')
      }
      setCommissions([])
      setApprovedRestaurants([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCommissions = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getRestaurantCommissions({})
      
      let commissionsData = null
      if (response?.data?.success && response?.data?.data?.commissions) {
        commissionsData = response.data.data.commissions
      } else if (response?.data?.data?.commissions) {
        commissionsData = response.data.data.commissions
      } else if (response?.data?.commissions) {
        commissionsData = response.data.commissions
      }
      
      if (commissionsData && Array.isArray(commissionsData)) {
        setCommissions(commissionsData)
      } else {
        setCommissions([])
      }
    } catch (error) {
      debugError('Error fetching commissions:', error)
      
      // Handle network errors
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        toast.error(`Cannot connect to backend server. Please ensure the backend is running on ${API_BASE_URL.replace('/api', '')}`)
        debugError('?? Backend connection issue. Check:')
        debugError('   1. Is backend server running? (npm start in backend folder)')
        debugError(`   2. Is backend running on ${API_BASE_URL.replace('/api', '')}?`)
        debugError('   3. Check browser console for CORS errors')
      } else {
        toast.error(error.response?.data?.message || 'Failed to fetch commissions')
      }
      setCommissions([])
    } finally {
      setLoading(false)
    }
  }

  const fetchApprovedRestaurants = async () => {
    try {
      const response = await adminAPI.getApprovedRestaurants({ limit: 1000 })
      
      let restaurantsData = null
      if (response?.data?.success && response?.data?.data?.restaurants) {
        restaurantsData = response.data.data.restaurants
      } else if (response?.data?.data?.restaurants) {
        restaurantsData = response.data.data.restaurants
      } else if (response?.data?.restaurants) {
        restaurantsData = response.data.restaurants
      }
      
      if (restaurantsData && Array.isArray(restaurantsData)) {
        setApprovedRestaurants(restaurantsData)
      } else {
        setApprovedRestaurants([])
      }
    } catch (error) {
      debugError('Error fetching approved restaurants:', error)
      
      // Handle network errors silently (already handled in fetchCommissions)
      if (error.code !== 'ERR_NETWORK' && error.message !== 'Network Error') {
        toast.error(error.response?.data?.message || 'Failed to fetch approved restaurants')
      }
    }
  }

  const handleToggleStatus = async (commission) => {
    try {
      await adminAPI.toggleRestaurantCommissionStatus(commission._id)
      await fetchCommissions()
      toast.success('Commission status updated successfully')
    } catch (error) {
      debugError('Error toggling status:', error)
      toast.error(error.response?.data?.message || 'Failed to update status')
    }
  }

  const handleAdd = () => {
    setSelectedCommission(null)
    setSelectedRestaurant(null)
    setFormData({
      restaurantId: "",
      defaultCommission: {
        type: "percentage",
        value: "10"
      },
      notes: ""
    })
    setFormErrors({})
    setIsRestaurantSelectOpen(true)
  }

  const handleSelectRestaurant = (restaurant) => {
    setSelectedRestaurant(restaurant)
    setFormData(prev => ({
      ...prev,
      restaurantId: restaurant._id
    }))
    setIsRestaurantSelectOpen(false)
    setIsAddEditOpen(true)
  }

  const handleEdit = async (commission) => {
    try {
      setLoading(true)
      const response = await adminAPI.getRestaurantCommissionById(commission._id)
      
      let commissionData = null
      if (response?.data?.success && response?.data?.data?.commission) {
        commissionData = response.data.data.commission
      } else if (response?.data?.data?.commission) {
        commissionData = response.data.data.commission
      } else if (response?.data?.commission) {
        commissionData = response.data.commission
      }

      if (commissionData) {
        setSelectedCommission(commissionData)
        setSelectedRestaurant(commissionData.restaurant)
        
        // Handle restaurant ID - it can be an object with _id or just an ID string
        let restaurantId = ""
        if (commissionData.restaurant) {
          if (typeof commissionData.restaurant === 'object' && commissionData.restaurant._id) {
            restaurantId = commissionData.restaurant._id
          } else if (typeof commissionData.restaurant === 'string') {
            restaurantId = commissionData.restaurant
          } else {
            restaurantId = commissionData.restaurantId || commissionData.restaurant?._id || ""
          }
        } else {
          // Fallback to restaurantId field if restaurant object is not populated
          restaurantId = commissionData.restaurantId || commissionData.restaurant || ""
        }
        
        setFormData({
          restaurantId: restaurantId,
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
      debugError('Error fetching commission:', error)
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
      await adminAPI.deleteRestaurantCommission(selectedCommission._id)
      await fetchCommissions()
      toast.success('Commission deleted successfully')
      setIsDeleteOpen(false)
      setSelectedCommission(null)
    } catch (error) {
      debugError('Error deleting commission:', error)
      toast.error(error.response?.data?.message || 'Failed to delete commission')
    } finally {
      setDeleting(false)
    }
  }

  const validateForm = () => {
    const errors = {}
    
    if (!formData.restaurantId) {
      errors.restaurantId = "Restaurant is required"
    }

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
    if (!validateForm()) {
      toast.error("Please fix the errors in the form")
      return
    }

    try {
      setSaving(true)
      
      const payload = {
        restaurantId: formData.restaurantId,
        defaultCommission: {
          type: formData.defaultCommission.type,
          value: parseFloat(formData.defaultCommission.value)
        },
        notes: formData.notes
      }

      if (selectedCommission) {
        await adminAPI.updateRestaurantCommission(selectedCommission._id, payload)
        toast.success('Commission updated successfully')
      } else {
        await adminAPI.createRestaurantCommission(payload)
        toast.success('Commission created successfully')
      }

      await fetchCommissions()
      setIsAddEditOpen(false)
      setSelectedCommission(null)
      setSelectedRestaurant(null)
    } catch (error) {
      debugError('Error saving commission:', error)
      toast.error(error.response?.data?.message || 'Failed to save commission')
    } finally {
      setSaving(false)
    }
  }

  const columnsConfig = {
    si: "Serial Number",
    restaurant: "Restaurant Name",
    restaurantId: "Restaurant ID",
    defaultCommission: "Default Commission",
    status: "Status",
    actions: "Actions",
  }

  return (
    <div className="p-4 lg:p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">Restaurant Commission</h1>
              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-slate-100 text-slate-700">
                {filteredCommissions.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={handleAdd}
                className="px-4 py-2.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
                Add Commission
              </button>
            </div>
          </div>

          <div className="mb-4 flex items-center gap-3">
            <div className="relative flex-1 sm:flex-initial min-w-[250px]">
              <input
                  type="text"
                  placeholder="Search by restaurant name or ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-full text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {visibleColumns.si && (
                      <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <span>S.No</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400 cursor-pointer hover:text-slate-600" />
                        </div>
                      </th>
                    )}
                    {visibleColumns.restaurant && (
                      <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                        Restaurant Name
                      </th>
                    )}
                    {visibleColumns.restaurantId && (
                      <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                        Restaurant ID
                      </th>
                    )}
                    {visibleColumns.defaultCommission && (
                      <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                        Default Commission
                      </th>
                    )}
                    {visibleColumns.status && (
                      <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                        Status
                      </th>
                    )}
                    {visibleColumns.actions && (
                      <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-700 uppercase tracking-wider">Action</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {filteredCommissions.length === 0 ? (
                    <tr>
                      <td colSpan={Object.values(visibleColumns).filter(v => v).length} className="px-6 py-8 text-center text-slate-500">
                        No commissions found
                      </td>
                    </tr>
                  ) : (
                    filteredCommissions.map((commission) => (
                      <tr key={commission._id} className="hover:bg-slate-50 transition-colors">
                        {visibleColumns.si && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-slate-700">{commission.sl || '-'}</span>
                          </td>
                        )}
                        {visibleColumns.restaurant && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-blue-600">
                              {commission.restaurantName || commission.restaurant?.name || '-'}
                            </span>
                          </td>
                        )}
                        {visibleColumns.restaurantId && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-slate-700">{commission.restaurantId || '-'}</span>
                          </td>
                        )}
                        {visibleColumns.defaultCommission && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-slate-900">
                              {commission.defaultCommission?.type === 'percentage' ? (
                                <>{commission.defaultCommission.value}%</>
                              ) : (
                                <>${commission.defaultCommission.value}</>
                              )}
                            </span>
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
          )}
        </div>
      </div>

      {/* Restaurant Selection Dialog */}
      <Dialog open={isRestaurantSelectOpen} onOpenChange={setIsRestaurantSelectOpen}>
        <DialogContent className="max-w-xl bg-white p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200">
            <DialogTitle className="text-lg font-semibold text-slate-900">Select Restaurant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-6 py-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search restaurants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
            <div className="max-h-80 overflow-y-auto space-y-2">
              {filteredRestaurants
                .filter(r => !r.hasCommissionSetup)
                .map((restaurant) => (
                  <button
                    key={restaurant._id}
                    onClick={() => handleSelectRestaurant(restaurant)}
                    className="w-full p-3 text-left rounded-lg border border-slate-200 hover:bg-blue-50 hover:border-blue-300 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm text-slate-900">{restaurant.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{restaurant.restaurantId}</p>
                      </div>
                      <Building2 className="w-4 h-4 text-slate-400" />
                    </div>
                  </button>
                ))}
              {filteredRestaurants.filter(r => !r.hasCommissionSetup).length === 0 && (
                <p className="text-center text-sm text-slate-500 py-4">No restaurants available</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddEditOpen} onOpenChange={setIsAddEditOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-white p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200">
            <DialogTitle className="text-lg font-semibold text-slate-900">
              {selectedCommission ? "Edit Restaurant Commission" : "Add Restaurant Commission"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-6 py-4">
            {/* Restaurant Info */}
            {selectedRestaurant && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="font-semibold text-sm text-slate-900">{selectedRestaurant.name}</p>
                <p className="text-xs text-slate-600 mt-0.5">{selectedRestaurant.restaurantId}</p>
              </div>
            )}

            {/* Default Commission */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Default Commission <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <select
                    value={formData.defaultCommission.type}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      defaultCommission: { ...prev.defaultCommission, type: e.target.value }
                    }))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="amount">Fixed Amount (\u20B9)</option>
                  </select>
                </div>
                <div>
                  <input
                    type="number"
                    step={formData.defaultCommission.type === "percentage" ? "0.1" : "0.01"}
                    value={formData.defaultCommission.value}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      defaultCommission: { ...prev.defaultCommission, value: e.target.value }
                    }))}
                    className={`w-full px-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.defaultCommission ? "border-red-500" : "border-slate-300"
                    }`}
                    placeholder={formData.defaultCommission.type === "percentage" ? "e.g., 10" : "e.g., 5.00"}
                  />
                  {formErrors.defaultCommission && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.defaultCommission}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Notes <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows="2"
                placeholder="Add any notes or remarks..."
              />
            </div>
          </div>
          <DialogFooter className="px-6 py-4 border-t border-slate-200 bg-slate-50">
            <button
              onClick={() => setIsAddEditOpen(false)}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {selectedCommission ? "Update" : "Create"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Delete Restaurant Commission</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-700">
              Are you sure you want to delete commission for "{selectedCommission?.restaurantName || selectedCommission?.restaurant?.name}"? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
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

    </div>
  )
}


