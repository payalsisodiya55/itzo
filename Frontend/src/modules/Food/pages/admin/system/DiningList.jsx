import { useState, useMemo, useEffect } from "react"
import { Search, Settings, Loader2, Star, Building2, X } from "lucide-react"
import { adminAPI } from "@food/api"
import { toast } from "sonner"
const debugLog = (...args) => {}
const debugWarn = (...args) => {}
const debugError = (...args) => {}

const normalizeImageUrl = (image) => {
    if (!image) return ""
    if (typeof image === "string") return image
    if (typeof image === "object") return image.url || image.secure_url || ""
    return ""
}

const getPrimaryRestaurantImage = (restaurant, fallback = "") => {
    // Prioritize profile image as it's the most specific identity image
    const profileImg = normalizeImageUrl(restaurant?.profileImage) || normalizeImageUrl(restaurant?.logo) || normalizeImageUrl(restaurant?.restaurantImage)
    if (profileImg) return profileImg

    const coverImages = Array.isArray(restaurant?.coverImages) ? restaurant.coverImages : []
    const firstCoverImage = coverImages.map(normalizeImageUrl).find(Boolean)
    if (firstCoverImage) return firstCoverImage

    const menuImages = Array.isArray(restaurant?.menuImages) ? restaurant.menuImages : []
    const firstMenuImage = menuImages.map(normalizeImageUrl).find(Boolean)
    if (firstMenuImage) return firstMenuImage

    return fallback
}


export default function DiningList() {
    const [searchQuery, setSearchQuery] = useState("")
    const [restaurants, setRestaurants] = useState([])
    const [categories, setCategories] = useState([])
    const [selectedCategory, setSelectedCategory] = useState("All")
    const [loading, setLoading] = useState(true)
    const [pageError, setPageError] = useState("")
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editingRestaurant, setEditingRestaurant] = useState(null)
    const [actionLoadingId, setActionLoadingId] = useState("")

    // Fetch restaurants from backend API
    useEffect(() => {
        const fetchRestaurants = async () => {
            try {
                setLoading(true)
                setPageError("")

                const response = await adminAPI.getDiningRestaurants()

                if (response.data && response.data.success && response.data.data) {
                    const restaurantsData = response.data.data.restaurants || []

                    const mappedRestaurants = restaurantsData.map((restaurant, index) => ({
                        id: restaurant._id || restaurant.id || index + 1,
                        _id: restaurant._id,
                        name: restaurant.name || restaurant.restaurantName || "N/A",
                        ownerName: restaurant.ownerName || "N/A",
                        ownerPhone: restaurant.ownerPhone || "N/A",
                        zone: restaurant.zone || "N/A",
                        status: restaurant.status === "approved" || restaurant.isActive === true,
                        rating: restaurant.rating || 0,
                        logo: getPrimaryRestaurantImage(restaurant, "https://via.placeholder.com/40"),
                        categories: Array.isArray(restaurant.categories) ? restaurant.categories : [],
                        categoryIds: Array.isArray(restaurant.categoryIds) ? restaurant.categoryIds : [],
                        primaryCategoryId: restaurant.primaryCategoryId || null,
                        diningSettings: restaurant.diningSettings || { isEnabled: false, maxGuests: 6, diningType: "" },
                        pendingDiningRequest: restaurant.pendingDiningRequest || null,
                        originalData: restaurant,
                    }))

                    setRestaurants(mappedRestaurants)
                } else {
                    setRestaurants([])
                }
            } catch (err) {
                debugError("Error fetching restaurants:", err)
                setPageError(err?.response?.data?.message || err?.message || "Failed to fetch restaurants")
                setRestaurants([])
            } finally {
                setLoading(false)
            }
        }

        fetchRestaurants()
    }, [])

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await adminAPI.getDiningCategories()
                if (response.data && response.data.success) {
                    const cats = (response.data.data.categories || []).map(cat => ({
                        ...cat,
                        slug: cat.name.toLowerCase().replace(/\s+/g, '-')
                    }))
                    setCategories(cats)
                }
            } catch (err) {
                debugError("Error fetching categories:", err)
            }
        }
        fetchCategories()
    }, [])

    const filteredRestaurants = useMemo(() => {
        let result = [...restaurants]

        // Search Filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim()
            result = result.filter(restaurant =>
                restaurant.name.toLowerCase().includes(query) ||
                restaurant.ownerName.toLowerCase().includes(query) ||
                restaurant.ownerPhone.includes(query)
            )
        }

        // Category Filter
        if (selectedCategory !== "All") {
            result = result.filter(restaurant =>
                restaurant.categories?.some(category => category.slug === selectedCategory) ||
                (selectedCategory === "Uncategorized" && !restaurant.diningSettings?.diningType)
            )
        }

        return result
    }, [restaurants, searchQuery, selectedCategory])

    const formatRestaurantId = (id) => {
        if (!id) return "REST000000"
        return `REST${String(id).slice(-6).toUpperCase()}`
    }

    const renderStars = (rating) => {
        const fullStars = Math.floor(rating || 0);
        return (
            <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <Star 
                        key={i} 
                        className={`w-3.5 h-3.5 ${i < fullStars ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} 
                    />
                ))}
                <span className="ml-1 text-slate-600">({rating || 0})</span>
            </div>
        )
    }

    const refreshRestaurants = async () => {
        try {
            const response = await adminAPI.getDiningRestaurants()
            const restaurantsData = response?.data?.data?.restaurants || []
            setRestaurants(restaurantsData.map((restaurant, index) => ({
                id: restaurant._id || restaurant.id || index + 1,
                _id: restaurant._id,
                name: restaurant.name || restaurant.restaurantName || "N/A",
                ownerName: restaurant.ownerName || "N/A",
                ownerPhone: restaurant.ownerPhone || "N/A",
                zone: restaurant.zone || "N/A",
                status: restaurant.status === "approved" || restaurant.isActive === true,
                rating: restaurant.rating || 0,
                logo: getPrimaryRestaurantImage(restaurant, "https://via.placeholder.com/40"),
                categories: Array.isArray(restaurant.categories) ? restaurant.categories : [],
                categoryIds: Array.isArray(restaurant.categoryIds) ? restaurant.categoryIds : [],
                primaryCategoryId: restaurant.primaryCategoryId || null,
                diningSettings: restaurant.diningSettings || { isEnabled: false, maxGuests: 6, diningType: "" },
                pendingDiningRequest: restaurant.pendingDiningRequest || null,
                originalData: restaurant,
            })))
        } catch (err) {
            debugError("Error refreshing dining restaurants:", err)
        }
    }

    const handlePendingRequestAction = async (restaurant, approvalAction) => {
        if (!restaurant?._id) return
        try {
            setActionLoadingId(`${restaurant._id}:${approvalAction}`)
            setPageError("")
            await adminAPI.updateRestaurantDiningSettings(restaurant._id, {
                approvalAction,
            })
            await refreshRestaurants()
            toast.success(`Dining request ${approvalAction === "approve" ? "approved" : "rejected"} successfully`)
        } catch (error) {
            debugError(`Failed to ${approvalAction} dining request`, error)
            const message = error?.response?.data?.message || `Failed to ${approvalAction} dining request`
            setPageError(message)
            toast.error(message)
        } finally {
            setActionLoadingId("")
        }
    }

    return (
        <div className="h-full overflow-y-auto bg-slate-50 p-4 lg:p-6">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-slate-900">Dining List</h1>
                        </div>
                    </div>
                    <p className="text-slate-500">Manage restaurants available for dining.</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    {pageError ? (
                        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                            {pageError}
                        </div>
                    ) : null}

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            <span className="ml-3 text-slate-600">Loading dining list...</span>
                        </div>
                    ) : restaurants.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                <Building2 className="w-10 h-10 text-slate-300" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 mb-2">No dining restaurants added yet</h2>
                            <p className="text-slate-500 max-w-sm mb-8">
                                Get started by adding your first restaurant to the dining management system.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                <h2 className="text-xl font-bold text-slate-900">Registered Dining Restaurants</h2>

                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="relative flex-1 sm:flex-initial min-w-[250px]">
                                        <input
                                            type="text"
                                            placeholder="Search dining restaurants..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10 pr-4 py-2.5 w-full text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    </div>
                                </div>
                            </div>

                            {/* Category Filter Chips */}
                            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-4 mb-2">
                                <button
                                    onClick={() => setSelectedCategory("All")}
                                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${selectedCategory === "All"
                                        ? "bg-blue-600 text-white shadow-md"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                        }`}
                                >
                                    All ({restaurants.length})
                                </button>
                                {categories.map((cat) => {
                                    const count = restaurants.filter(r => r.categories?.some(category => category.slug === cat.slug)).length;
                                    return (
                                        <button
                                            key={cat._id}
                                            onClick={() => setSelectedCategory(cat.slug)}
                                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${selectedCategory === cat.slug
                                                ? "bg-blue-600 text-white shadow-md"
                                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                                }`}
                                        >
                                            {cat.name} ({count})
                                        </button>
                                    )
                                })}
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">Restaurant</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">Owner</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">Zone</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">Approved</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">Requested</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">Rating</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-700 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-100">
                                        {filteredRestaurants.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="px-6 py-20 text-center">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                                            <Search className="w-8 h-8 text-slate-300" />
                                                        </div>
                                                        <p className="text-lg font-semibold text-slate-700 mb-1">No dining restaurants found</p>
                                                        <p className="text-sm text-slate-500">
                                                            Try adjusting your search query or filters.
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredRestaurants.map((restaurant, index) => (
                                                <tr key={restaurant.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
                                                                <img
                                                                    src={restaurant.logo}
                                                                    alt={restaurant.name}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => { e.target.src = "https://via.placeholder.com/40" }}
                                                                />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-medium text-slate-900">{restaurant.name}</span>
                                                                <span className="text-xs text-slate-500">#{formatRestaurantId(restaurant.originalData?.restaurantId || restaurant._id)}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium text-slate-900">{restaurant.ownerName}</span>
                                                            <span className="text-xs text-slate-500">{restaurant.ownerPhone}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-sm text-slate-700">{restaurant.zone}</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="space-y-1">
                                                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${restaurant.diningSettings?.isEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                                                {restaurant.diningSettings?.isEnabled ? 'Dining On' : 'Dining Off'}
                                                            </span>
                                                            <p className="text-xs text-slate-500">
                                                                Guests: {Number(restaurant.diningSettings?.maxGuests ?? 0)}
                                                            </p>
                                                            <p className="text-xs text-slate-500">
                                                                {(restaurant.categories || []).map((category) => category?.name).filter(Boolean).join(", ") || "No category"}
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {restaurant.pendingDiningRequest ? (
                                                            <div className="space-y-1">
                                                                <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                                                                    Pending approval
                                                                </span>
                                                                <p className="text-xs text-slate-600">
                                                                    {restaurant.pendingDiningRequest?.isEnabled ? "Dining On" : "Dining Off"} • Guests {Number(restaurant.pendingDiningRequest?.maxGuests ?? 0)}
                                                                </p>
                                                                <p className="text-xs text-slate-500 max-w-[220px] whitespace-normal">
                                                                    {(restaurant.pendingDiningRequest?.categories || []).map((category) => category?.name).filter(Boolean).join(", ") || "No category"}
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-slate-400">No pending request</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-sm text-yellow-500 font-medium">{renderStars(restaurant.rating)}</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${restaurant.status ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                                            {restaurant.status ? "Active" : "Inactive"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {restaurant.pendingDiningRequest ? (
                                                                <>
                                                                    <button
                                                                        onClick={() => handlePendingRequestAction(restaurant, "approve")}
                                                                        disabled={actionLoadingId === `${restaurant._id}:approve`}
                                                                        className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                                                                    >
                                                                        {actionLoadingId === `${restaurant._id}:approve` ? "Approving..." : "Approve"}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handlePendingRequestAction(restaurant, "reject")}
                                                                        disabled={actionLoadingId === `${restaurant._id}:reject`}
                                                                        className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 disabled:opacity-60"
                                                                    >
                                                                        {actionLoadingId === `${restaurant._id}:reject` ? "Rejecting..." : "Reject"}
                                                                    </button>
                                                                </>
                                                            ) : null}
                                                            <button
                                                                onClick={() => {
                                                                    setEditingRestaurant({ ...restaurant })
                                                                    setIsEditModalOpen(true)
                                                                }}
                                                                className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                                                            >
                                                                <Settings className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && editingRestaurant && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-slate-900">Edit Dining Settings</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Status */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Dining Status</p>
                                    <p className="text-xs text-slate-500">Enable or disable dining for this restaurant</p>
                                </div>
                                <button
                                    onClick={() => setEditingRestaurant(prev => ({
                                        ...prev,
                                        diningSettings: {
                                            ...prev.diningSettings,
                                            isEnabled: !prev.diningSettings.isEnabled,
                                            maxGuests: !prev.diningSettings.isEnabled
                                                ? Math.max(1, parseInt(prev.diningSettings?.maxGuests, 10) || 6)
                                                : 0
                                        },
                                        categoryIds: !prev.diningSettings.isEnabled ? (prev.categoryIds || []) : [],
                                        primaryCategoryId: !prev.diningSettings.isEnabled ? (prev.primaryCategoryId || prev.categoryIds?.[0] || null) : null,
                                        categories: !prev.diningSettings.isEnabled ? (prev.categories || []) : [],
                                    }))}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editingRestaurant.diningSettings?.isEnabled ? 'bg-blue-600' : 'bg-slate-200'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${editingRestaurant.diningSettings?.isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            {/* Max Guests */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-900">Maximum Guests</label>
                                <input
                                    type="number"
                                    min={editingRestaurant.diningSettings?.isEnabled ? "1" : "0"}
                                    max="1000"
                                    value={editingRestaurant.diningSettings?.maxGuests}
                                    onChange={(e) => setEditingRestaurant(prev => ({
                                        ...prev,
                                        diningSettings: {
                                            ...prev.diningSettings,
                                            maxGuests: prev.diningSettings?.isEnabled
                                                ? Math.max(1, parseInt(e.target.value, 10) || 1)
                                                : 0
                                        }
                                    }))}
                                    disabled={!editingRestaurant.diningSettings?.isEnabled}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            {/* Category */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-900">Dining Categories</label>
                                <div className="flex flex-wrap gap-2">
                                    {categories.map(cat => {
                                        const isSelected = (editingRestaurant.categoryIds || []).includes(cat._id)
                                        return (
                                            <button
                                                key={cat._id}
                                                type="button"
                                                onClick={() => setEditingRestaurant(prev => {
                                                    if (!prev.diningSettings?.isEnabled) return prev
                                                    const nextIds = isSelected
                                                        ? (prev.categoryIds || []).filter(id => id !== cat._id)
                                                        : [...(prev.categoryIds || []), cat._id]
                                                    const nextCategories = categories.filter(item => nextIds.includes(item._id))
                                                    return {
                                                        ...prev,
                                                        categoryIds: nextIds,
                                                        primaryCategoryId: nextIds[0] || null,
                                                        categories: nextCategories,
                                                        diningSettings: {
                                                            ...prev.diningSettings,
                                                            diningType: nextCategories[0]?.slug || "",
                                                        }
                                                    }
                                                })}
                                                disabled={!editingRestaurant.diningSettings?.isEnabled}
                                                className={`rounded-full border px-3 py-2 text-sm font-medium ${isSelected ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700"}`}
                                            >
                                                {cat.name}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-slate-50 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        setLoading(true)
                                        const isDiningEnabled = editingRestaurant.diningSettings?.isEnabled === true
                                        await adminAPI.updateRestaurantDiningSettings(editingRestaurant._id, {
                                            isEnabled: isDiningEnabled,
                                            maxGuests: isDiningEnabled ? (editingRestaurant.diningSettings?.maxGuests || 6) : 0,
                                            categoryIds: isDiningEnabled ? (editingRestaurant.categoryIds || []) : [],
                                            primaryCategoryId: isDiningEnabled ? (editingRestaurant.primaryCategoryId || editingRestaurant.categoryIds?.[0] || null) : null,
                                        })

                                        await refreshRestaurants()
                                        setIsEditModalOpen(false)
                                        // toast.success("Settings updated")
                                    } catch (err) {
                                        debugError("Update failed", err)
                                    } finally {
                                        setLoading(false)
                                    }
                                }}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
