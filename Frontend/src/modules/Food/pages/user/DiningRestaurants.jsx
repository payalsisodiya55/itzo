import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { MapPin, ChevronDown, Search, Mic, Wallet, SlidersHorizontal, Star, Compass, X, ArrowDownUp, Timer, IndianRupee, UtensilsCrossed, BadgePercent, ShieldCheck, Clock, Bookmark, Check, ArrowLeft } from "lucide-react"
import { Button } from "@food/components/ui/button"
import { Input } from "@food/components/ui/input"
import { Card, CardContent } from "@food/components/ui/card"
import AnimatedPage from "@food/components/user/AnimatedPage"
import { useSearchOverlay, useLocationSelector } from "@food/components/user/UserLayout"
import useAppBackNavigation from "@food/hooks/useAppBackNavigation"
import { useLocation as useLocationHook } from "@food/hooks/useLocation"
import { useProfile } from "@food/context/ProfileContext"
import { useCompanyName } from "@food/hooks/useCompanyName"
import { FaLocationDot } from "react-icons/fa6"

// Using placeholder for dining restaurant banner
const diningBanner = "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&h=400&fit=crop"

const popularRestaurants = [
  {
    id: 1,
    name: "IRIS",
    rating: 4.3,
    location: "Press Complex, Indore",
    distance: "2.9 km",
    cuisine: "Continental",
    price: "₹1500 for two",
    image: "",
    offer: "Flat 30% OFF + 3 more",
    deliveryTime: "30-35 mins",
    featuredDish: "Pasta",
    featuredPrice: 450,
  },
  {
    id: 2,
    name: "Skyline Rooftop",
    rating: 4.5,
    location: "MG Road, Indore",
    distance: "3.2 km",
    cuisine: "Multi-cuisine",
    price: "₹2000 for two",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop",
    offer: "Flat 25% OFF + 2 more",
    deliveryTime: "35-40 mins",
    featuredDish: "Grilled Chicken",
    featuredPrice: 550,
  },
  {
    id: 3,
    name: "The Grand Bistro",
    rating: 4.7,
    location: "Vijay Nagar, Indore",
    distance: "1.8 km",
    cuisine: "Continental",
    price: "₹1800 for two",
    image: "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=600&fit=crop",
    offer: "Flat 35% OFF + 4 more",
    deliveryTime: "25-30 mins",
    featuredDish: "Risotto",
    featuredPrice: 650,
  },
  {
    id: 4,
    name: "Coastal Kitchen",
    rating: 4.4,
    location: "Palasia, Indore",
    distance: "2.1 km",
    cuisine: "Seafood",
    price: "₹1600 for two",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop",
    offer: "Flat 20% OFF + 2 more",
    deliveryTime: "28-33 mins",
    featuredDish: "Fish Curry",
    featuredPrice: 480,
  },
  {
    id: 5,
    name: "Garden Terrace",
    rating: 4.6,
    location: "Scheme 54, Indore",
    distance: "4.5 km",
    cuisine: "North Indian",
    price: "₹1200 for two",
    image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop",
    offer: "Flat 30% OFF + 3 more",
    deliveryTime: "40-45 mins",
    featuredDish: "Butter Chicken",
    featuredPrice: 380,
  },
  {
    id: 6,
    name: "Midnight Lounge",
    rating: 4.2,
    location: "Bhawarkua, Indore",
    distance: "3.8 km",
    cuisine: "Continental",
    price: "₹2200 for two",
    image: "",
    offer: "Flat 25% OFF + 2 more",
    deliveryTime: "35-40 mins",
    featuredDish: "Steak",
    featuredPrice: 750,
  },
]

export default function DiningRestaurants() {
  const navigate = useNavigate()
  const goBack = useAppBackNavigation()
  const [heroSearch, setHeroSearch] = useState("")
  const [activeFilters, setActiveFilters] = useState(new Set())
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [activeFilterTab, setActiveFilterTab] = useState('sort')
  const [sortBy, setSortBy] = useState(null)
  const [selectedCuisine, setSelectedCuisine] = useState(null)
  const filterSectionRefs = useRef({})
  const rightContentRef = useRef(null)
  const { openSearch, closeSearch, setSearchValue } = useSearchOverlay()
  const { openLocationSelector } = useLocationSelector()
  const { location, loading } = useLocationHook()
  const { addFavorite, removeFavorite, isFavorite } = useProfile()
  const cityName = location?.city || "Select"
  const stateName = location?.state || "Location"

  const toggleFilter = (filterId) => {
    setActiveFilters(prev => {
      const newSet = new Set(prev)
      if (newSet.has(filterId)) {
        newSet.delete(filterId)
      } else {
        newSet.add(filterId)
      }
      return newSet
    })
  }

  const filteredRestaurants = useMemo(() => {
    let filtered = [...popularRestaurants]

    if (activeFilters.has('delivery-under-30')) {
      filtered = filtered.filter(r => {
        const timeMatch = r.deliveryTime.match(/(\d+)/)
        return timeMatch && parseInt(timeMatch[1]) <= 30
      })
    }
    if (activeFilters.has('delivery-under-45')) {
      filtered = filtered.filter(r => {
        const timeMatch = r.deliveryTime.match(/(\d+)/)
        return timeMatch && parseInt(timeMatch[1]) <= 45
      })
    }
    if (activeFilters.has('distance-under-1km')) {
      filtered = filtered.filter(r => {
        const distMatch = r.distance.match(/(\d+\.?\d*)/)
        return distMatch && parseFloat(distMatch[1]) <= 1.0
      })
    }
    if (activeFilters.has('distance-under-2km')) {
      filtered = filtered.filter(r => {
        const distMatch = r.distance.match(/(\d+\.?\d*)/)
        return distMatch && parseFloat(distMatch[1]) <= 2.0
      })
    }
    if (activeFilters.has('rating-35-plus')) {
      filtered = filtered.filter(r => r.rating >= 3.5)
    }
    if (activeFilters.has('rating-4-plus')) {
      filtered = filtered.filter(r => r.rating >= 4.0)
    }
    if (activeFilters.has('rating-45-plus')) {
      filtered = filtered.filter(r => r.rating >= 4.5)
    }

    // Apply cuisine filter
    if (selectedCuisine) {
      filtered = filtered.filter(r => r.cuisine.toLowerCase().includes(selectedCuisine.toLowerCase()))
    }

    // Apply sorting
    if (sortBy === 'rating-high') {
      filtered.sort((a, b) => b.rating - a.rating)
    } else if (sortBy === 'rating-low') {
      filtered.sort((a, b) => a.rating - b.rating)
    }

    return filtered
  }, [activeFilters, selectedCuisine, sortBy])

  const handleLocationClick = useCallback(() => {
    openLocationSelector()
  }, [openLocationSelector])

  const handleSearchFocus = useCallback(() => {
    if (heroSearch) {
      setSearchValue(heroSearch)
    }
    openSearch()
  }, [heroSearch, openSearch, setSearchValue])

  const handleOpenMap = () => {
    const lat = location?.latitude || 22.7196
    const lng = location?.longitude || 75.8577
    const googleMapsUrl = `https://www.google.com/maps/search/restaurants+near+me/@${lat},${lng},15z`
    window.open(googleMapsUrl, '_blank', 'fullscreen=yes')
  }

  return (
    <AnimatedPage className="bg-white" style={{ minHeight: '100vh', paddingBottom: '80px', overflow: 'visible' }}>
      {/* Banner Section with Back Button and Location */}
      <div className="relative w-full overflow-hidden min-h-[39vh] lg:min-h-[50vh] md:pt-16">
        {/* Background with dining banner */}
        <div className="absolute top-0 left-0 right-0 bottom-0 z-0">
          <img
            src={diningBanner}
            alt="Dining Banner"
            className="w-full h-full object-cover"
            style={{ objectPosition: 'bottom', minHeight: '100%' }}
          />
        </div>

        {/* Navbar with Back Button */}
        <nav className="relative z-20 w-full px-3 sm:px-6 lg:px-8 py-3 sm:py-4 md:pt-2 sm:pt-3 lg:pt-4 backdrop-blur-sm">
          <div className="flex items-center justify-start gap-3 sm:gap-4">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={goBack}
              className="h-9 w-9 sm:h-10 sm:w-10 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2.5} />
            </Button>

            {/* Location with Dotted Underline */}
            <Button
              variant="ghost"
              onClick={handleLocationClick}
              className="text-left text-white text-sm sm:text-base font-semibold backdrop-blur-sm rounded-full px-3 sm:px-4 py-2 hover:bg-white transition-colors"
            >
              <div className="flex items-start justify-start gap-2 min-w-0">
                <FaLocationDot className="h-4 w-4 sm:h-5 sm:w-5 text-white flex-shrink-0 mt-1" />
                <span className="text-sm sm:text-base font-semibold text-white truncate border-b-2 border-dotted border-white">
                  Home - {cityName}
                </span>
              </div>
            </Button>
          </div>
        </nav>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        <div className="max-w-7xl mx-auto">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-3xl mx-auto">
              <Input
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                onFocus={handleSearchFocus}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && heroSearch.trim()) {
                    navigate(`/user/search?q=${encodeURIComponent(heroSearch.trim())}`)
                    closeSearch()
                    setHeroSearch("")
                  }
                }}
                placeholder="Search for restaurants, cuisines, dishes..."
                className="w-full h-12 sm:h-14 md:h-16 pl-12 sm:pl-14 pr-12 sm:pr-14 rounded-xl border-2 border-gray-200 focus:border-[#cc2532] bg-white shadow-sm text-base sm:text-lg md:text-xl"
              />
              <Search className="absolute left-4 sm:left-5 md:left-6 top-1/2 -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-gray-400" />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 sm:right-3 md:right-4 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 rounded-full hover:bg-gray-100"
                onClick={() => {
                  // Voice search functionality
                }}
              >
                <Mic className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-gray-500" />
              </Button>
            </div>
          </div>

          {/* Popular Restaurants Around You Section */}
          <div className="mb-6 mt-8 sm:mt-12">
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <div className="flex-grow border-t border-gray-300"></div>
                <h3 className="px-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  POPULAR RESTAURANTS AROUND YOU
                </h3>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>
            </div>

            {/* Filters */}
            <section className="py-1 mb-4">
              <div
                className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide pb-1"
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                {/* Filter Button - Opens Modal */}
                <Button
                  variant="outline"
                  onClick={() => setIsFilterOpen(true)}
                  className="h-7 sm:h-8 px-2 sm:px-3 rounded-md flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 font-medium transition-all bg-white border border-gray-200 hover:bg-gray-50 text-gray-700"
                >
                  <SlidersHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm font-bold text-black">Filters</span>
                </Button>

                {/* Filter Buttons */}
                {[
                  { id: 'delivery-under-30', label: 'Under 30 mins' },
                  { id: 'delivery-under-45', label: 'Under 45 mins' },
                  { id: 'distance-under-1km', label: 'Under 1km', icon: MapPin },
                  { id: 'distance-under-2km', label: 'Under 2km', icon: MapPin },
                  { id: 'rating-35-plus', label: '3.5+ Rating' },
                  { id: 'rating-4-plus', label: '4.0+ Rating' },
                  { id: 'rating-45-plus', label: '4.5+ Rating' },
                ].map((filter) => {
                  const Icon = filter.icon
                  const isActive = activeFilters.has(filter.id)
                  return (
                    <Button
                      key={filter.id}
                      variant="outline"
                      onClick={() => toggleFilter(filter.id)}
                      className={`h-7 sm:h-8 px-2 sm:px-3 rounded-md flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 transition-all font-medium ${isActive
                        ? 'bg-[#cc2532] text-white border-[#cc2532] hover:bg-[#a81e29]'
                        : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-600'
                        }`}
                    >
                      {Icon && <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${isActive ? 'fill-white' : ''}`} />}
                      <span className="text-xs sm:text-sm font-bold text-black">{filter.label}</span>
                    </Button>
                  )
                })}
              </div>
            </section>

            {/* Restaurant Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
              {filteredRestaurants.map((restaurant, index) => {
                const restaurantSlug = restaurant.name.toLowerCase().replace(/\s+/g, "-")
                const favorite = isFavorite(restaurantSlug)

                const handleToggleFavorite = (e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (favorite) {
                    removeFavorite(restaurantSlug)
                  } else {
                    addFavorite({
                      slug: restaurantSlug,
                      name: restaurant.name,
                      cuisine: restaurant.cuisine,
                      rating: restaurant.rating,
                      deliveryTime: restaurant.deliveryTime,
                      distance: restaurant.distance,
                      image: restaurant.image
                    })
                  }
                }

                return (
                  <Link key={restaurant.id} to={`/user/restaurants/${restaurantSlug}`}>
                    <Card className="overflow-hidden gap-0 cursor-pointer border-0 group bg-white shadow-md hover:shadow-xl transition-all duration-300 py-0 rounded-2xl">
                      {/* Image Section */}
                      <div className="relative h-48 sm:h-56 md:h-60 w-full overflow-hidden rounded-t-2xl">
                        <img
                          src={restaurant.image}
                          alt={restaurant.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            e.currentTarget.style.display = "none"
                          }}
                        />

                        {/* Featured Dish Badge - Top Left */}
                        <div className="absolute top-3 left-3">
                          <div className="bg-gray-800/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium">
                            {restaurant.featuredDish} • ₹{restaurant.featuredPrice}
                          </div>
                        </div>

                        {/* Bookmark Icon - Top Right */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-3 right-3 h-9 w-9 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors"
                          onClick={handleToggleFavorite}
                        >
                          <Bookmark className={`h-5 w-5 ${favorite ? "fill-gray-800 text-gray-800" : "text-gray-600"}`} strokeWidth={2} />
                        </Button>

                        {/* Blue Section - Bottom 40% */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-[#cc2532] to-transparent" style={{ height: '40%' }}>
                          <div className="h-full flex flex-col justify-end">
                            <div className="pl-4 sm:pl-5 pb-4 sm:pb-5">
                              <p className="text-white text-xs sm:text-sm font-medium uppercase tracking-wide mb-1">
                                PRE-BOOK TABLE
                              </p>
                              <div className="h-px bg-white/30 mb-2 w-24"></div>
                              <p className="text-white text-base sm:text-lg font-bold">
                                {restaurant.offer}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Content Section */}
                      <CardContent className="p-3 sm:p-4 pt-3 sm:pt-4">
                        {/* Restaurant Name & Rating */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 line-clamp-1">
                              {restaurant.name}
                            </h3>
                          </div>
                          <div className="flex-shrink-0 bg-green-600 text-white px-2 py-1 rounded-lg flex items-center gap-1">
                            <span className="text-sm font-bold">{restaurant.rating}</span>
                            <Star className="h-3 w-3 fill-white text-white" />
                          </div>
                        </div>

                        {/* Delivery Time & Distance */}
                        <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                          <Clock className="h-4 w-4" strokeWidth={1.5} />
                          <span className="font-medium">{restaurant.deliveryTime}</span>
                          <span className="mx-1">|</span>
                          <span className="font-medium">{restaurant.distance}</span>
                        </div>

                        {/* Offer Badge */}
                        {restaurant.offer && (
                          <div className="flex items-center gap-2 text-sm">
                            <BadgePercent className="h-4 w-4 text-[#cc2532]" strokeWidth={2} />
                            <span className="text-gray-700 font-medium">{restaurant.offer}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Modal - Same as Dining page */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[100]" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsFilterOpen(false)}
          />

          {/* Modal Content */}
          <div className="absolute bottom-0 left-0 right-0 md:left-1/2 md:right-auto md:-translate-x-1/2 md:bottom-auto md:top-1/2 md:-translate-y-1/2 bg-white rounded-t-3xl md:rounded-3xl max-h-[85vh] md:max-h-[90vh] md:max-w-lg w-full md:w-auto flex flex-col animate-[slideUp_0.3s_ease-out]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-900">Filters and sorting</h2>
              <button
                onClick={() => {
                  setActiveFilters(new Set())
                  setSortBy(null)
                  setSelectedCuisine(null)
                }}
                className="text-[#cc2532] font-medium text-sm"
              >
                Clear all
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left Sidebar - Tabs */}
              <div className="w-24 sm:w-28 bg-gray-50 border-r flex flex-col">
                {[
                  { id: 'sort', label: 'Sort By', icon: ArrowDownUp },
                  { id: 'time', label: 'Time', icon: Timer },
                  { id: 'rating', label: 'Rating', icon: Star },
                  { id: 'distance', label: 'Distance', icon: MapPin },
                  { id: 'price', label: 'Dish Price', icon: IndianRupee },
                  { id: 'cuisine', label: 'Cuisine', icon: UtensilsCrossed },
                ].map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeFilterTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveFilterTab(tab.id)}
                      className={`flex flex-col items-center gap-1 py-4 px-2 text-center relative transition-colors ${isActive ? 'bg-white text-[#cc2532]' : 'text-gray-500 hover:bg-gray-100'
                        }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#cc2532] rounded-r" />
                      )}
                      <Icon className="h-5 w-5" strokeWidth={1.5} />
                      <span className="text-xs font-medium leading-tight">{tab.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Right Content Area - Scrollable */}
              <div ref={rightContentRef} className="flex-1 overflow-y-auto p-4">
                {/* Sort By Tab */}
                {activeFilterTab === 'sort' && (
                  <div className="space-y-4 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Sort by</h3>
                    <div className="flex flex-col gap-3">
                      {[
                        { id: null, label: 'Relevance' },
                        { id: 'rating-high', label: 'Rating: High to Low' },
                        { id: 'rating-low', label: 'Rating: Low to High' },
                      ].map((option) => (
                        <button
                          key={option.id || 'relevance'}
                          onClick={() => setSortBy(option.id)}
                          className={`px-4 py-3 rounded-xl border text-left transition-colors ${sortBy === option.id
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-green-500'
                            }`}
                        >
                          <span className={`text-sm font-medium ${sortBy === option.id ? 'text-green-600' : 'text-gray-700'}`}>
                            {option.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Time Tab */}
                {activeFilterTab === 'time' && (
                  <div className="space-y-4 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Estimated Time</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => toggleFilter('delivery-under-30')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors ${activeFilters.has('delivery-under-30')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-500'
                          }`}
                      >
                        <Timer className={`h-6 w-6 ${activeFilters.has('delivery-under-30') ? 'text-green-600' : 'text-gray-600'}`} strokeWidth={1.5} />
                        <span className={`text-sm font-medium ${activeFilters.has('delivery-under-30') ? 'text-green-600' : 'text-gray-700'}`}>Under 30 mins</span>
                      </button>
                      <button
                        onClick={() => toggleFilter('delivery-under-45')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors ${activeFilters.has('delivery-under-45')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-500'
                          }`}
                      >
                        <Timer className={`h-6 w-6 ${activeFilters.has('delivery-under-45') ? 'text-green-600' : 'text-gray-600'}`} strokeWidth={1.5} />
                        <span className={`text-sm font-medium ${activeFilters.has('delivery-under-45') ? 'text-green-600' : 'text-gray-700'}`}>Under 45 mins</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Rating Tab */}
                {activeFilterTab === 'rating' && (
                  <div className="space-y-4 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Restaurant Rating</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => toggleFilter('rating-35-plus')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors ${activeFilters.has('rating-35-plus')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-500'
                          }`}
                      >
                        <Star className={`h-6 w-6 ${activeFilters.has('rating-35-plus') ? 'text-green-600 fill-green-600' : 'text-gray-400'}`} />
                        <span className={`text-sm font-medium ${activeFilters.has('rating-35-plus') ? 'text-green-600' : 'text-gray-700'}`}>Rated 3.5+</span>
                      </button>
                      <button
                        onClick={() => toggleFilter('rating-4-plus')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors ${activeFilters.has('rating-4-plus')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-500'
                          }`}
                      >
                        <Star className={`h-6 w-6 ${activeFilters.has('rating-4-plus') ? 'text-green-600 fill-green-600' : 'text-gray-400'}`} />
                        <span className={`text-sm font-medium ${activeFilters.has('rating-4-plus') ? 'text-green-600' : 'text-gray-700'}`}>Rated 4.0+</span>
                      </button>
                      <button
                        onClick={() => toggleFilter('rating-45-plus')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors ${activeFilters.has('rating-45-plus')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-500'
                          }`}
                      >
                        <Star className={`h-6 w-6 ${activeFilters.has('rating-45-plus') ? 'text-green-600 fill-green-600' : 'text-gray-400'}`} />
                        <span className={`text-sm font-medium ${activeFilters.has('rating-45-plus') ? 'text-green-600' : 'text-gray-700'}`}>Rated 4.5+</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Distance Tab */}
                {activeFilterTab === 'distance' && (
                  <div className="space-y-4 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Distance</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => toggleFilter('distance-under-1km')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors ${activeFilters.has('distance-under-1km')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-500'
                          }`}
                      >
                        <MapPin className={`h-6 w-6 ${activeFilters.has('distance-under-1km') ? 'text-green-600' : 'text-gray-600'}`} strokeWidth={1.5} />
                        <span className={`text-sm font-medium ${activeFilters.has('distance-under-1km') ? 'text-green-600' : 'text-gray-700'}`}>Under 1 km</span>
                      </button>
                      <button
                        onClick={() => toggleFilter('distance-under-2km')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors ${activeFilters.has('distance-under-2km')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-500'
                          }`}
                      >
                        <MapPin className={`h-6 w-6 ${activeFilters.has('distance-under-2km') ? 'text-green-600' : 'text-gray-600'}`} strokeWidth={1.5} />
                        <span className={`text-sm font-medium ${activeFilters.has('distance-under-2km') ? 'text-green-600' : 'text-gray-700'}`}>Under 2 km</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Price Tab */}
                {activeFilterTab === 'price' && (
                  <div className="space-y-4 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Dish Price</h3>
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => toggleFilter('price-under-200')}
                        className={`px-4 py-3 rounded-xl border text-left transition-colors ${activeFilters.has('price-under-200')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-500'
                          }`}
                      >
                        <span className={`text-sm font-medium ${activeFilters.has('price-under-200') ? 'text-green-600' : 'text-gray-700'}`}>Under ₹200</span>
                      </button>
                      <button
                        onClick={() => toggleFilter('price-under-500')}
                        className={`px-4 py-3 rounded-xl border text-left transition-colors ${activeFilters.has('price-under-500')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-500'
                          }`}
                      >
                        <span className={`text-sm font-medium ${activeFilters.has('price-under-500') ? 'text-green-600' : 'text-gray-700'}`}>Under ₹500</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Cuisine Tab */}
                {activeFilterTab === 'cuisine' && (
                  <div className="space-y-4 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Cuisine</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {['Continental', 'Italian', 'Asian', 'Indian', 'Chinese', 'American', 'Seafood', 'Cafe'].map((cuisine) => (
                        <button
                          key={cuisine}
                          onClick={() => setSelectedCuisine(selectedCuisine === cuisine ? null : cuisine)}
                          className={`px-4 py-3 rounded-xl border text-center transition-colors ${selectedCuisine === cuisine
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-green-500'
                            }`}
                        >
                          <span className={`text-sm font-medium ${selectedCuisine === cuisine ? 'text-green-600' : 'text-gray-700'}`}>
                            {cuisine}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-4 px-4 py-4 border-t bg-white">
              <button
                onClick={() => setIsFilterOpen(false)}
                className="flex-1 py-3 text-center font-semibold text-gray-700"
              >
                Close
              </button>
              <button
                onClick={() => setIsFilterOpen(false)}
                className={`flex-1 py-3 font-semibold rounded-xl transition-colors ${activeFilters.size > 0 || sortBy || selectedCuisine
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-200 text-gray-500'
                  }`}
              >
                {activeFilters.size > 0 || sortBy || selectedCuisine
                  ? `Show ${filteredRestaurants.length} results`
                  : 'Show results'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AnimatedPage>
  )
}

