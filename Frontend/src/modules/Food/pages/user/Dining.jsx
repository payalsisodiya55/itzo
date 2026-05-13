import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { MapPin, Search, Mic, SlidersHorizontal, Star, X, ArrowDownUp, Timer, IndianRupee, Clock, Bookmark, UtensilsCrossed } from "lucide-react"
import { Button } from "@food/components/ui/button"
import { Input } from "@food/components/ui/input"
import { Card, CardContent } from "@food/components/ui/card"
import AnimatedPage from "@food/components/user/AnimatedPage"
import { useSearchOverlay, useLocationSelector } from "@food/components/user/UserLayout"
import { useLocation as useLocationHook } from "@food/hooks/useLocation"
import { useProfile } from "@food/context/ProfileContext"
import { diningAPI } from "@food/api"
import PageNavbar from "@food/components/user/PageNavbar"
import OptimizedImage from "@food/components/OptimizedImage"
const debugLog = (...args) => {}
const debugWarn = (...args) => {}
const debugError = (...args) => {}

const slugifyValue = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

const getCoordinates = (restaurant) => {
  const latitude = restaurant?.location?.latitude
  const longitude = restaurant?.location?.longitude
  if (typeof latitude === "number" && typeof longitude === "number") {
    return { latitude, longitude }
  }

  const coords = restaurant?.location?.coordinates
  if (Array.isArray(coords) && coords.length === 2) {
    return { latitude: coords[1], longitude: coords[0] }
  }

  return null
}

const getDistanceKm = (userLocation, restaurant) => {
  const userLat = Number(userLocation?.latitude)
  const userLng = Number(userLocation?.longitude)
  const restaurantCoords = getCoordinates(restaurant)

  if (!Number.isFinite(userLat) || !Number.isFinite(userLng) || !restaurantCoords) {
    return Number.POSITIVE_INFINITY
  }

  const toRadians = (value) => (value * Math.PI) / 180
  const earthRadiusKm = 6371
  const dLat = toRadians(restaurantCoords.latitude - userLat)
  const dLng = toRadians(restaurantCoords.longitude - userLng)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(userLat)) *
      Math.cos(toRadians(restaurantCoords.latitude)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const shimmerClassName =
  "before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent before:animate-[shimmer_2.2s_infinite]"

const loadingCategoryCards = Array.from({ length: 6 }, (_, index) => `category-skeleton-${index}`)
const loadingRestaurantCards = Array.from({ length: 6 }, (_, index) => `restaurant-skeleton-${index}`)

function DiningCategorySkeleton({ index }) {
  return (
    <motion.div
      className={`relative h-[138px] overflow-hidden rounded-[18px] border border-[#e9e1d8] bg-[linear-gradient(180deg,#fff9f9_0%,#fff5f5_100%)] shadow-[0_1px_2px_rgba(35,24,12,0.05)] sm:h-[154px] md:h-[166px] ${shimmerClassName}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
    >
      <div className="absolute inset-x-0 top-0 z-10 px-3 pt-3 sm:px-4 sm:pt-4">
        <div className="h-3 w-16 rounded-full bg-[#f0dcca]" />
        <div className="mt-3 h-4 w-24 rounded-full bg-[#ead2bc]" />
        <div className="mt-2 h-4 w-20 rounded-full bg-[#f3e3d4]" />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[64%] rounded-b-[18px] bg-[radial-gradient(circle_at_25%_20%,rgba(204,37,50,0.2),transparent_30%),linear-gradient(180deg,#fff5f5_0%,#fff5f5_100%)]">
        <div className="absolute bottom-3 left-3 h-14 w-14 rounded-full bg-white/45 blur-md" />
      </div>
    </motion.div>
  )
}

function DiningRestaurantSkeleton({ index }) {
  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
    >
      <div className="h-full overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-[#efe2d3]">
        <div className={`relative h-48 overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(204,37,50,0.24),transparent_28%),linear-gradient(135deg,#fff5f5_0%,#fff5f5_100%)] sm:h-56 md:h-60 lg:h-64 xl:h-72 ${shimmerClassName}`}>
          <div className="absolute left-4 top-4 h-8 w-28 rounded-lg bg-black/10" />
          <div className="absolute right-4 top-4 h-9 w-9 rounded-lg bg-white/60" />
          <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-r from-[#FE5502] to-transparent/20">
            <div className="flex h-full flex-col justify-end pl-4 pb-4 sm:pl-5 sm:pb-5">
              <div className="h-2.5 w-24 rounded-full bg-white/35" />
              <div className="mt-2 h-px w-24 bg-white/25" />
              <div className="mt-3 h-4 w-40 rounded-full bg-white/55" />
            </div>
          </div>
        </div>
        <div className="space-y-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="h-5 w-40 rounded-full bg-[#ead8c8]" />
              <div className="mt-2 h-4 w-24 rounded-full bg-[#f2e7dd]" />
            </div>
            <div className="h-8 w-12 rounded-lg bg-[#d7efe0]" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-[#efe2d7]" />
            <div className="h-4 w-24 rounded-full bg-[#efe2d7]" />
            <div className="h-4 w-4 rounded-full bg-[#f5ece4]" />
            <div className="h-4 w-20 rounded-full bg-[#f5ece4]" />
          </div>
          <div className="h-4 w-48 rounded-full bg-[#f0e1d3]" />
        </div>
      </div>
    </motion.div>
  )
}

export default function Dining() {
  const navigate = useNavigate()
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
  const { location } = useLocationHook()
  const { addFavorite, removeFavorite, isFavorite } = useProfile()

  const [categories, setCategories] = useState([])
  const [restaurantList, setRestaurantList] = useState([])
  const [loading, setLoading] = useState(true)
  const [diningHeroBanners, setDiningHeroBanners] = useState([])
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)
  const autoSlideIntervalRef = useRef(null)
  const touchStartXRef = useRef(0)
  const touchStartYRef = useRef(0)
  const touchEndXRef = useRef(0)
  const touchEndYRef = useRef(0)
  const isBannerSwipingRef = useRef(false)

  useEffect(() => {
    const fetchDiningData = async () => {
      try {
        setLoading(true)
        const [bannerResponse, cats, rests] = await Promise.all([
          diningAPI.getHeroBanners().catch(() => ({ data: { success: false, data: { banners: [] } } })),
          diningAPI.getCategories(),
          diningAPI.getRestaurants(location?.city ? { city: location.city } : {}),
        ])

        const heroBanners = Array.isArray(bannerResponse?.data?.data?.banners)
          ? bannerResponse.data.data.banners
              .map((banner, index) => {
                const imageUrl = String(banner?.imageUrl || "").trim()
                if (!imageUrl) return null

                return {
                  id: String(banner?._id || banner?.id || `dining-banner-${index}`),
                  imageUrl,
                  tagline: String(banner?.title || banner?.tagline || "").trim(),
                  promoCode: String(banner?.ctaText || banner?.promoCode || "").trim(),
                }
              })
              .filter(Boolean)
          : []

        setDiningHeroBanners(heroBanners)
        setCategories(cats?.data?.success ? (cats.data.data || []) : [])
        setRestaurantList(rests?.data?.success ? (rests.data.data || []) : [])
      } catch (error) {
        debugError("Failed to fetch dining data", error)
        setDiningHeroBanners([])
        setCategories([])
        setRestaurantList([])
      } finally {
        setLoading(false)
      }
    }
    fetchDiningData()
  }, [location?.city])

  const safeCategories = useMemo(() => {
    return (Array.isArray(categories) ? categories : [])
      .filter((category) => {
        const categoryName = String(category?.name || "").trim()
        return categoryName.length > 0
      })
      .map((category, index) => ({
        ...category,
        name: String(category?.name || "").trim(),
        slug: String(category?.slug || category?.name || "")
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
        imageUrl: String(category?.imageUrl || "").trim()
      }))
  }, [categories])

  const normalizedRestaurantList = useMemo(() => {
    return (Array.isArray(restaurantList) ? restaurantList : [])
      .filter((restaurant) => {
        const hasName = String(restaurant?.restaurantName || restaurant?.name || "").trim().length > 0
        const isDiningEnabled = restaurant?.diningSettings?.isEnabled !== false
        const isAcceptingOrders = restaurant?.isAcceptingOrders !== false
        return hasName && isDiningEnabled && isAcceptingOrders
      })
      .map((restaurant, index) => {
        const distanceKm = getDistanceKm(location, restaurant)
        const restaurantName = String(restaurant?.restaurantName || restaurant?.name || "").trim()
        return {
          ...restaurant,
          id: restaurant?._id || restaurant?.id || `restaurant-${index}`,
          name: restaurantName,
          slug: String(restaurant?.restaurantNameNormalized || "").trim() || slugifyValue(restaurantName),
          cuisine: Array.isArray(restaurant?.cuisines) && restaurant.cuisines.length > 0
            ? restaurant.cuisines.join(", ")
            : "Multi-cuisine",
          image: String(
            restaurant?.coverImages?.[0]?.url ||
            restaurant?.coverImages?.[0] ||
            restaurant?.coverImage ||
            restaurant?.menuImages?.[0]?.url ||
            restaurant?.menuImages?.[0] ||
            restaurant?.profileImage?.url ||
            restaurant?.profileImage ||
            ""
          ).trim(),
          offer: String(restaurant?.offer || "Pre-book table").trim(),
          featuredDish: String(restaurant?.featuredDish || "Chef's special").trim(),
          featuredPrice: Number(restaurant?.featuredPrice || 0),
          rating: Number(restaurant?.rating || restaurant?.avgRating || 0),
          deliveryTime: String(
            restaurant?.estimatedDeliveryTime ||
            restaurant?.deliveryTime ||
            (restaurant?.estimatedDeliveryTimeMinutes ? `${restaurant.estimatedDeliveryTimeMinutes} mins` : "30-40 mins")
          ).trim(),
          distanceValue: distanceKm,
          distance: Number.isFinite(distanceKm) ? `${distanceKm.toFixed(1)} km` : "Distance unavailable",
          diningType: restaurant?.diningSettings?.diningType || restaurant?.categories?.[0]?.slug || "dining",
        }
      })
  }, [restaurantList, location])

  const categoryRestaurantKeys = useMemo(() => {
    const keySet = new Set()

    normalizedRestaurantList.forEach((restaurant) => {
      const rawCategories = []

      if (Array.isArray(restaurant?.categories)) {
        rawCategories.push(...restaurant.categories)
      }

      if (restaurant?.diningSettings?.diningType) {
        rawCategories.push(restaurant.diningSettings.diningType)
      }

      rawCategories.forEach((category) => {
        if (typeof category === "string") {
          const normalized = slugifyValue(category)
          if (normalized) keySet.add(normalized)
          return
        }

        if (category && typeof category === "object") {
          const slug = slugifyValue(category?.slug || category?.name || category?.title || "")
          if (slug) keySet.add(slug)
        }
      })
    })

    return keySet
  }, [normalizedRestaurantList])

  const filteredCategories = useMemo(() => {
    return safeCategories.filter((category) => categoryRestaurantKeys.has(category.slug))
  }, [safeCategories, categoryRestaurantKeys])

  const nearbyPopularRestaurants = useMemo(() => {
    const within10Km = normalizedRestaurantList
      .filter((restaurant) => Number.isFinite(restaurant.distanceValue) && restaurant.distanceValue <= 10)
      .sort((a, b) => a.distanceValue - b.distanceValue)

    return within10Km.length > 0 ? within10Km : normalizedRestaurantList
  }, [normalizedRestaurantList])

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
    let filtered = [...nearbyPopularRestaurants]

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
  }, [nearbyPopularRestaurants, activeFilters, selectedCuisine, sortBy])

  useEffect(() => {
    setCurrentBannerIndex((prev) => {
      if (diningHeroBanners.length === 0) return 0
      return Math.min(prev, diningHeroBanners.length - 1)
    })
  }, [diningHeroBanners.length])

  useEffect(() => {
    if (typeof window === "undefined") return

    diningHeroBanners.forEach((banner) => {
      if (!banner?.imageUrl) return
      const img = new window.Image()
      img.src = banner.imageUrl
    })
  }, [diningHeroBanners])

  const startBannerAutoSlide = useCallback(() => {
    if (autoSlideIntervalRef.current) {
      clearInterval(autoSlideIntervalRef.current)
    }

    if (diningHeroBanners.length <= 1) return

    autoSlideIntervalRef.current = setInterval(() => {
      if (!isBannerSwipingRef.current) {
        setCurrentBannerIndex((prev) => (prev + 1) % diningHeroBanners.length)
      }
    }, 3500)
  }, [diningHeroBanners.length])

  const resetBannerAutoSlide = useCallback(() => {
    startBannerAutoSlide()
  }, [startBannerAutoSlide])

  useEffect(() => {
    startBannerAutoSlide()

    return () => {
      if (autoSlideIntervalRef.current) {
        clearInterval(autoSlideIntervalRef.current)
      }
    }
  }, [startBannerAutoSlide])

  const handleBannerTouchStart = useCallback((event) => {
    if (diningHeroBanners.length <= 1) return
    touchStartXRef.current = event.touches[0].clientX
    touchStartYRef.current = event.touches[0].clientY
    touchEndXRef.current = event.touches[0].clientX
    touchEndYRef.current = event.touches[0].clientY
    isBannerSwipingRef.current = true
  }, [diningHeroBanners.length])

  const handleBannerTouchMove = useCallback((event) => {
    if (!isBannerSwipingRef.current) return
    touchEndXRef.current = event.touches[0].clientX
    touchEndYRef.current = event.touches[0].clientY
  }, [])

  const handleBannerTouchEnd = useCallback(() => {
    if (!isBannerSwipingRef.current || diningHeroBanners.length <= 1) {
      isBannerSwipingRef.current = false
      return
    }

    const deltaX = touchEndXRef.current - touchStartXRef.current
    const deltaY = Math.abs(touchEndYRef.current - touchStartYRef.current)
    const minSwipeDistance = 40

    if (Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaX) > deltaY) {
      setCurrentBannerIndex((prev) => {
        if (deltaX > 0) {
          return (prev - 1 + diningHeroBanners.length) % diningHeroBanners.length
        }
        return (prev + 1) % diningHeroBanners.length
      })
      resetBannerAutoSlide()
    }

    isBannerSwipingRef.current = false
  }, [diningHeroBanners.length, resetBannerAutoSlide])


  const handleSearchFocus = useCallback(() => {
    if (heroSearch) {
      setSearchValue(heroSearch)
    }
    openSearch()
  }, [heroSearch, openSearch, setSearchValue])

  return (
    <AnimatedPage className="bg-white dark:bg-[#0a0a0a]" style={{ minHeight: '100vh', paddingBottom: '80px', overflow: 'visible' }}>
      <style>{`
        @keyframes shimmer {
          100% {
            transform: translateX(200%);
          }
        }
      `}</style>
      {/* Sticky Header Wrapper */}
      <div className="sticky top-0 z-40 w-full bg-white dark:bg-[#0a0a0a] shadow-sm md:hidden">
        {/* Navbar Section */}
        <div className="relative z-20 pt-2 sm:pt-3 lg:pt-4">
          <PageNavbar
            textColor="dark"
            zIndex={20}
            onNavClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Search Bar Section */}
        <section
          className="relative z-20 w-full py-3 sm:py-4 md:py-5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative z-20 w-full px-3 sm:px-6 lg:px-8">
            {/* Search Bar Container */}
            <div className="z-20">
              {/* Enhanced Search Bar */}
              <div className="w-full relative">
                <div className="relative bg-white dark:bg-[#1a1a1a] rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-1 sm:p-1.5 transition-all duration-300 hover:shadow-xl">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Search className="h-4 w-4 sm:h-4 sm:w-4 text-[#FE5502] flex-shrink-0 ml-2 sm:ml-3" strokeWidth={2.5} />
                    <div className="flex-1 relative">
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
                        className="pl-0 pr-2 h-8 sm:h-9 w-full bg-transparent border-0 text-sm sm:text-base font-semibold text-gray-700 dark:text-white focus-visible:ring-0 focus-visible:ring-offset-0 rounded-full placeholder:font-semibold placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        placeholder='Search "burger"'
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSearchFocus}
                      className="flex-shrink-0 mr-2 sm:mr-3 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                      <Mic className="h-4 w-4 sm:h-4 sm:w-4 text-gray-500 dark:text-gray-400" strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Banner Section */}
      <div className="relative w-full px-3 sm:px-4 md:px-6 lg:px-8 pb-4 sm:pb-6">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative w-full h-[30vh] sm:h-[35vh] lg:h-[40vh] rounded-2xl overflow-hidden shadow-lg"
        >
          {diningHeroBanners.length > 0 ? (
            <div
              className="relative h-full w-full"
              onTouchStart={handleBannerTouchStart}
              onTouchMove={handleBannerTouchMove}
              onTouchEnd={handleBannerTouchEnd}
            >
              <div
                className="flex h-full w-full transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentBannerIndex * 100}%)` }}
              >
                {diningHeroBanners.map((banner, index) => (
                  <div key={banner.id} className="relative h-full w-full shrink-0">
                    <OptimizedImage
                      src={banner.imageUrl}
                      alt={`Dining Banner ${index + 1}`}
                      className="w-full h-full"
                      objectFit="cover"
                      priority={index === 0}
                      sizes="100vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 md:p-6 lg:p-8">
                      <div className="max-w-[75%] rounded-2xl bg-black/20 px-3 py-3 text-white backdrop-blur-sm sm:px-4 md:px-5">
                        {banner.promoCode && (
                          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/85 sm:text-xs">
                            {banner.promoCode}
                          </p>
                        )}
                        {banner.tagline && (
                          <h2 className="mt-2 text-lg font-bold leading-tight sm:text-2xl md:text-3xl">
                            {banner.tagline}
                          </h2>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {diningHeroBanners.length > 1 && (
                <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/25 px-3 py-1.5 backdrop-blur-sm">
                  {diningHeroBanners.map((banner, index) => (
                    <button
                      key={`${banner.id}-dot`}
                      type="button"
                      aria-label={`Go to dining banner ${index + 1}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        setCurrentBannerIndex(index)
                        resetBannerAutoSlide()
                      }}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        currentBannerIndex === index ? "w-5 bg-white" : "w-2 bg-white/55"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className={`relative h-full w-full bg-[radial-gradient(circle_at_top_left,_rgba(204,37,50,0.22),_transparent_35%),linear-gradient(135deg,#fff5f5_0%,#fff9f9_55%,#fff5f5_100%)] ${shimmerClassName}`}>
              <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(204,37,50,0.05)_35%,transparent_70%)]" />
              <div className="absolute bottom-6 left-6 max-w-[70%]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#b46f37]">Dining</p>
                <h2 className="mt-2 text-2xl font-black text-[#2e1d11] sm:text-3xl">
                  {loading ? "Curating dining picks near you" : "Fresh dining picks near you"}
                </h2>
                <p className="mt-2 text-sm font-medium text-[#6d5744]">
                  {loading
                    ? "Hold tight while we load categories, offers, and the best tables around you."
                    : "Banner will appear here as soon as a dining hero banner is available from the new API."}
                </p>
              </div>
              {loading && (
                <div className="absolute right-5 top-5 rounded-full border border-white/50 bg-white/55 px-3 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-[#8d5324] backdrop-blur-sm">
                  Loading
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 pt-6 sm:pt-8 md:pt-10 lg:pt-12 pb-6 md:pb-8 lg:pb-10">
        {/* Categories Section */}
        <div className="mb-6">
          <div className="mb-4 sm:mb-5">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="h-px flex-1 bg-[#ece5dc]" />
              <h3 className="font-['Poppins',_'Nunito_Sans',sans-serif] text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.38em] text-[#8f8478] text-center whitespace-nowrap">
                What are you looking for?
              </h3>
              <div className="h-px flex-1 bg-[#ece5dc]" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 md:gap-4">
            {loading
              ? loadingCategoryCards.map((key, index) => (
                <DiningCategorySkeleton key={key} index={index} />
              ))
              : filteredCategories.map((category, index) => (
              <Link
                key={category._id || category.id}
                to={`/user/dining/${category.slug}`}
              >
                <motion.div
                  className="relative h-[138px] sm:h-[154px] md:h-[166px] overflow-hidden rounded-[18px] border border-[#e9e1d8] bg-white shadow-[0_1px_2px_rgba(35,24,12,0.05)] cursor-pointer group"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  whileHover={{ y: -2, boxShadow: "0 10px 24px -18px rgba(63, 38, 18, 0.24)" }}
                >
                  <div className="absolute inset-x-0 top-0 z-10 px-3 pt-3 sm:px-4 sm:pt-4">
                    <p className="font-['Poppins',_'Nunito_Sans',sans-serif] max-w-[74%] text-[13px] sm:text-[15px] md:text-[16px] font-semibold leading-[1.02] tracking-[-0.02em] text-[#2d2722]">
                      {category.name}
                    </p>
                  </div>

                  <div className="absolute inset-x-0 bottom-0 h-[64%] overflow-hidden rounded-b-[18px]">
                    {category.imageUrl ? (
                      <OptimizedImage
                        src={category.imageUrl}
                        alt={category.name}
                        className="w-full h-full transition-transform duration-500 group-hover:scale-[1.03]"
                        objectFit="cover"
                        sizes="(max-width: 640px) 31vw, (max-width: 768px) 180px, 220px"
                        placeholder="blur"
                        priority={index < 6}
                      />
                    ) : (
                      <div className={`relative h-full w-full bg-[radial-gradient(circle_at_20%_20%,rgba(204,37,50,0.22),transparent_35%),linear-gradient(180deg,#fff9f9_0%,#fff5f5_100%)] ${shimmerClassName}`}>
                        <div className="absolute inset-x-0 bottom-0 h-[70%] rounded-t-[60%] bg-white/55" />
                      </div>
                    )}
                  </div>
                </motion.div>
              </Link>
              ))}
          </div>
        </div>

        {/* Popular Restaurants Around You Section */}
        <div className="mb-6 mt-8 sm:mt-12">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                Popular Restaurants Within 10km
              </h3>
              <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                {filteredRestaurants.length} nearby places
              </p>
            </div>
          </div>

          {loading ? (
            <section className="mb-4 py-1">
              <div className="flex items-center gap-2 overflow-hidden pb-1">
                {Array.from({ length: 6 }, (_, index) => (
                  <div
                    key={`filter-skeleton-${index}`}
                    className={`relative h-8 rounded-md border border-[#efe3d7] bg-[#fff7f1] ${shimmerClassName}`}
                    style={{ width: index === 0 ? 90 : index % 2 === 0 ? 122 : 108 }}
                  />
                ))}
              </div>
            </section>
          ) : (
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
                  className="h-7 sm:h-8 px-2 sm:px-3 rounded-md flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 font-medium transition-all bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                >
                  <SlidersHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm font-bold text-black dark:text-white">Filters</span>
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
                        ? 'bg-[#FE5502] text-white border border-[#FE5502] hover:bg-[#C83C00]'
                        : 'bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'
                        }`}
                    >
                      {Icon && <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${isActive ? 'text-white fill-white' : 'text-current'}`} />}
                      <span className={`text-xs sm:text-sm font-bold ${isActive ? 'text-white' : 'text-black dark:text-white'}`}>{filter.label}</span>
                    </Button>
                  )
                })}
              </div>
            </section>
          )}

          {/* Restaurant Cards */}
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3 lg:gap-8">
              {loadingRestaurantCards.map((key, index) => (
                <DiningRestaurantSkeleton key={key} index={index} />
              ))}
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#eadfce] bg-[#fffaf4] px-6 py-12 text-center text-sm font-medium text-gray-500">
              No popular dining restaurants were found within 10 km for the current location.
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
            {/* First 2 Restaurants */}
            {filteredRestaurants.slice(0, 2).map((restaurant, index) => {
              const restaurantSlug = restaurant.slug || restaurant.name.toLowerCase().replace(/\s+/g, "-")
              const diningDetailPath = `/food/user/dining/${restaurant.diningType || "dining"}/${restaurantSlug}`
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
                <motion.div
                  key={restaurant._id || restaurant.id}
                  className="h-full"
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 100
                  }}
                  style={{ perspective: 1000 }}
                >
                  <motion.div
                    className="h-full"
                    whileHover="hover"
                    initial="rest"
                    variants={{
                      rest: {
                        y: 0,
                        scale: 1,
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                      },
                      hover: {
                        y: -12,
                        scale: 1.02,
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(34, 197, 94, 0.1)",
                        transition: {
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                          mass: 0.5
                        }
                      }
                    }}
                  >
                    <Link
                      to={diningDetailPath}
                      state={{ restaurant }}
                      className="h-full flex"
                    >
                      <Card className="overflow-hidden gap-0 cursor-pointer border-0 dark:border-gray-800 group bg-white dark:bg-[#1a1a1a] shadow-md transition-all duration-500 py-0 rounded-2xl h-full flex flex-col w-full relative">
                        {/* Image Section */}
                        <div className="relative h-48 sm:h-56 md:h-60 lg:h-64 xl:h-72 w-full overflow-hidden rounded-t-2xl flex-shrink-0">
                          <motion.div
                            className="absolute inset-0"
                            variants={{
                              rest: { scale: 1 },
                              hover: { scale: 1.15 }
                            }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                          >
                            {restaurant.image ? (
                              <OptimizedImage
                                src={restaurant.image}
                                alt={restaurant.name}
                                className="w-full h-full"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                objectFit="cover"
                                placeholder="blur"
                                priority={index < 3}
                              />
                            ) : (
                              <div className={`relative h-full w-full bg-[radial-gradient(circle_at_top_left,rgba(204,37,50,0.24),transparent_30%),linear-gradient(135deg,#fff5f5_0%,#fffaf4_55%,#ffe5d0_100%)] ${shimmerClassName}`} />
                            )}
                          </motion.div>

                          {/* Gradient Overlay on Hover */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0"
                            variants={{
                              rest: { opacity: 0 },
                              hover: { opacity: 1 }
                            }}
                            transition={{ duration: 0.4 }}
                          />

                          {/* Shine Effect */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
                            variants={{
                              rest: { x: "-100%" },
                              hover: {
                                x: "200%",
                                transition: {
                                  duration: 0.8,
                                  ease: "easeInOut",
                                  delay: 0.2
                                }
                              }
                            }}
                          />

                          {/* Featured Dish Badge - Top Left */}
                          <motion.div
                            className="absolute top-3 left-3 flex items-center z-10"
                            variants={{
                              rest: { scale: 1, y: 0 },
                              hover: { scale: 1.05, y: -2 }
                            }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="bg-gray-800/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium shadow-lg">
                              {restaurant.featuredDish} • ₹{restaurant.featuredPrice}
                            </div>
                          </motion.div>

                          {/* Bookmark Icon - Top Right */}
                          <motion.div
                            variants={{
                              rest: { scale: 1, rotate: 0 },
                              hover: { scale: 1.1, rotate: 5 }
                            }}
                            transition={{ duration: 0.3 }}
                            className="absolute top-3 right-3 z-10"
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 bg-white/90 dark:bg-[#1a1a1a]/90 backdrop-blur-sm rounded-lg hover:bg-white dark:hover:bg-[#2a2a2a] transition-colors"
                              onClick={handleToggleFavorite}
                            >
                              <Bookmark className={`h-5 w-5 ${favorite ? "fill-gray-800 dark:fill-gray-200 text-gray-800 dark:text-gray-200" : "text-gray-600 dark:text-gray-400"}`} strokeWidth={2} />
                            </Button>
                          </motion.div>

                          {/* Blue Section - Bottom 40% */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-[#FE5502] to-transparent" style={{ height: '40%' }}>
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
                        <motion.div
                          variants={{
                            rest: { y: 0 },
                            hover: { y: -4 }
                          }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                        >
                          <CardContent className="p-3 sm:p-4 pt-3 sm:pt-4">
                            {/* Restaurant Name & Rating */}
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1 min-w-0">
                                <motion.h3
                                  className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white line-clamp-1"
                                  variants={{
                                    rest: {},
                                    hover: { color: "#FE5502" }
                                  }}
                                  transition={{ duration: 0.3 }}
                                >
                                  {restaurant.name}
                                </motion.h3>
                              </div>
                              <motion.div
                                className="flex-shrink-0 bg-green-600 text-white px-2 py-1 rounded-lg flex items-center gap-1"
                                variants={{
                                  rest: { scale: 1, rotate: 0 },
                                  hover: { scale: 1.1, rotate: 5 }
                                }}
                                transition={{ duration: 0.3, type: "spring", stiffness: 400 }}
                              >
                                <span className="text-sm font-bold">{restaurant.rating}</span>
                                <Star className="h-3 w-3 fill-white text-white" />
                              </motion.div>
                            </div>

                            {/* Delivery Time & Distance */}
                            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-2">
                              <Clock className="h-4 w-4" strokeWidth={1.5} />
                              <span className="font-medium">{restaurant.deliveryTime}</span>
                              <span className="mx-1">|</span>
                              <span className="font-medium">{restaurant.distance}</span>
                            </div>

                            {/* Offer Badge */}
                            {restaurant.offer && (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FFF5F5] px-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#FE5502]">
                                  Offer
                                </span>
                                <span className="text-gray-700 dark:text-gray-300 font-medium">{restaurant.offer}</span>
                              </div>
                            )}
                          </CardContent>
                        </motion.div>
                      </Card>
                    </Link>
                  </motion.div>
                </motion.div>
              )
            })}

            {/* Remaining Restaurants */}
            {filteredRestaurants.slice(2).map((restaurant, index) => {
              const restaurantSlug = restaurant.slug || restaurant.name.toLowerCase().replace(/\s+/g, "-")
              const diningDetailPath = `/food/user/dining/${restaurant.diningType || "dining"}/${restaurantSlug}`
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
                <motion.div
                  key={restaurant._id || restaurant.id}
                  className="h-full"
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{
                    duration: 0.5,
                    delay: (index + 2) * 0.1,
                    type: "spring",
                    stiffness: 100
                  }}
                  style={{ perspective: 1000 }}
                >
                  <motion.div
                    className="h-full"
                    whileHover="hover"
                    initial="rest"
                    variants={{
                      rest: {
                        y: 0,
                        scale: 1,
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                      },
                      hover: {
                        y: -12,
                        scale: 1.02,
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(34, 197, 94, 0.1)",
                        transition: {
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                          mass: 0.5
                        }
                      }
                    }}
                  >
                    <Link
                      to={diningDetailPath}
                      state={{ restaurant }}
                      className="h-full flex"
                    >
                      <Card className="overflow-hidden cursor-pointer border-0 dark:border-gray-800 group bg-white dark:bg-[#1a1a1a] shadow-md transition-all duration-500 py-0 rounded-2xl h-full flex flex-col w-full relative">
                        {/* Image Section */}
                        <div className="relative h-48 sm:h-56 md:h-60 lg:h-64 xl:h-72 w-full overflow-hidden rounded-t-2xl flex-shrink-0">
                          <motion.div
                            className="absolute inset-0"
                            variants={{
                              rest: { scale: 1 },
                              hover: { scale: 1.15 }
                            }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                          >
                            {restaurant.image ? (
                              <OptimizedImage
                                src={restaurant.image}
                                alt={restaurant.name}
                                className="w-full h-full"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                objectFit="cover"
                                placeholder="blur"
                              />
                            ) : (
                              <div className={`relative h-full w-full bg-[radial-gradient(circle_at_top_left,rgba(204,37,50,0.24),transparent_30%),linear-gradient(135deg,#fff5e8_0%,#fffaf4_55%,#ffe5d0_100%)] ${shimmerClassName}`} />
                            )}
                          </motion.div>

                          {/* Gradient Overlay on Hover */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0"
                            variants={{
                              rest: { opacity: 0 },
                              hover: { opacity: 1 }
                            }}
                            transition={{ duration: 0.4 }}
                          />

                          {/* Shine Effect */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
                            variants={{
                              rest: { x: "-100%" },
                              hover: {
                                x: "200%",
                                transition: {
                                  duration: 0.8,
                                  ease: "easeInOut",
                                  delay: 0.2
                                }
                              }
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
                            className="absolute top-3 right-3 h-9 w-9 bg-white/90 dark:bg-[#1a1a1a]/90 backdrop-blur-sm rounded-lg hover:bg-white dark:hover:bg-[#2a2a2a] transition-colors"
                            onClick={handleToggleFavorite}
                          >
                            <Bookmark className={`h-5 w-5 ${favorite ? "fill-gray-800 dark:fill-gray-200 text-gray-800 dark:text-gray-200" : "text-gray-600 dark:text-gray-400"}`} strokeWidth={2} />
                          </Button>

                          {/* Blue Section - Bottom 40% */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-[#FE5502] to-transparent" style={{ height: '40%' }}>
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
                              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white line-clamp-1">
                                {restaurant.name}
                              </h3>
                            </div>
                            <div className="flex-shrink-0 bg-green-600 text-white px-2 py-1 rounded-lg flex items-center gap-1">
                              <span className="text-sm font-bold">{restaurant.rating}</span>
                              <Star className="h-3 w-3 fill-white text-white" />
                            </div>
                          </div>

                          {/* Delivery Time & Distance */}
                          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-2">
                            <Clock className="h-4 w-4" strokeWidth={1.5} />
                            <span className="font-medium">{restaurant.deliveryTime}</span>
                            <span className="mx-1">|</span>
                            <span className="font-medium">{restaurant.distance}</span>
                          </div>

                          {/* Offer Badge */}
                          {restaurant.offer && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FFF5F5] px-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#FE5502]">
                                Offer
                              </span>
                              <span className="text-gray-700 dark:text-gray-300 font-medium">{restaurant.offer}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                </motion.div>
              )
            })}
          </div>
          )}
        </div>
      </div>

      {/* Filter Modal */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[100]" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsFilterOpen(false)}
          />

          {/* Modal Content */}
          <div className="absolute bottom-0 left-0 right-0 md:left-1/2 md:right-auto md:-translate-x-1/2 md:max-w-4xl bg-white dark:bg-[#1a1a1a] rounded-t-3xl md:rounded-3xl max-h-[85vh] md:max-h-[90vh] flex flex-col animate-[slideUp_0.3s_ease-out]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 md:px-6 py-4 md:py-5 border-b dark:border-gray-800">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Filters and sorting</h2>
              <button
                onClick={() => {
                  setActiveFilters(new Set())
                  setSortBy(null)
                  setSelectedCuisine(null)
                }}
                className="text-[#FE5502] font-medium text-sm md:text-base"
              >
                Clear all
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left Sidebar - Tabs */}
              <div className="w-24 sm:w-28 md:w-32 bg-gray-50 dark:bg-[#0a0a0a] border-r dark:border-gray-800 flex flex-col">
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
                      className={`flex flex-col items-center gap-1 py-4 px-2 text-center relative transition-colors ${isActive ? 'bg-white dark:bg-[#1a1a1a] text-[#FE5502]' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FE5502] rounded-r" />
                      )}
                      <Icon className="h-5 w-5 md:h-6 md:w-6" strokeWidth={1.5} />
                      <span className="text-xs md:text-sm font-medium leading-tight">{tab.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Right Content Area - Scrollable */}
              <div ref={rightContentRef} className="flex-1 overflow-y-auto p-4 md:p-6">
                {/* Sort By Tab */}
                {activeFilterTab === 'sort' && (
                  <div className="space-y-4 mb-8">
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-4">Sort by</h3>
                    <div className="flex flex-col gap-3 md:gap-4">
                      {[
                        { id: null, label: 'Relevance' },
                        { id: 'rating-high', label: 'Rating: High to Low' },
                        { id: 'rating-low', label: 'Rating: Low to High' },
                      ].map((option) => (
                        <button
                          key={option.id || 'relevance'}
                          onClick={() => setSortBy(option.id)}
                          className={`px-4 md:px-5 py-3 md:py-4 rounded-xl border text-left transition-colors ${sortBy === option.id
                            ? 'border-[#FE5502] bg-[#FFF5F5] dark:bg-[#FE5502]/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-[#FE5502]'
                            }`}
                        >
                          <span className={`text-sm md:text-base font-medium ${sortBy === option.id ? 'text-[#FE5502]' : 'text-gray-700 dark:text-gray-300'}`}>
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
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Estimated Time</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => toggleFilter('delivery-under-30')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors ${activeFilters.has('delivery-under-30')
                          ? 'border-[#FE5502] bg-[#FFF5F5] dark:bg-[#FE5502]/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-[#FE5502]'
                          }`}
                      >
                        <Timer className={`h-6 w-6 ${activeFilters.has('delivery-under-30') ? 'text-[#FE5502]' : 'text-gray-600 dark:text-gray-400'}`} strokeWidth={1.5} />
                        <span className={`text-sm font-medium ${activeFilters.has('delivery-under-30') ? 'text-[#FE5502]' : 'text-gray-700 dark:text-gray-300'}`}>Under 30 mins</span>
                      </button>
                      <button
                        onClick={() => toggleFilter('delivery-under-45')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors ${activeFilters.has('delivery-under-45')
                          ? 'border-[#FE5502] bg-[#FFF5F5] dark:bg-[#FE5502]/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-[#FE5502]'
                          }`}
                      >
                        <Timer className={`h-6 w-6 ${activeFilters.has('delivery-under-45') ? 'text-[#FE5502]' : 'text-gray-600 dark:text-gray-400'}`} strokeWidth={1.5} />
                        <span className={`text-sm font-medium ${activeFilters.has('delivery-under-45') ? 'text-[#FE5502]' : 'text-gray-700 dark:text-gray-300'}`}>Under 45 mins</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Rating Tab */}
                {activeFilterTab === 'rating' && (
                  <div className="space-y-4 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Restaurant Rating</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => toggleFilter('rating-35-plus')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors ${activeFilters.has('rating-35-plus')
                          ? 'border-[#FE5502] bg-[#FFF5F5] dark:bg-[#FE5502]/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-[#FE5502]'
                          }`}
                      >
                        <Star className={`h-6 w-6 ${activeFilters.has('rating-35-plus') ? 'text-[#FE5502] fill-[#FE5502]' : 'text-gray-400 dark:text-gray-500'}`} />
                        <span className={`text-sm font-medium ${activeFilters.has('rating-35-plus') ? 'text-[#FE5502]' : 'text-gray-700 dark:text-gray-300'}`}>Rated 3.5+</span>
                      </button>
                      <button
                        onClick={() => toggleFilter('rating-4-plus')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors ${activeFilters.has('rating-4-plus')
                          ? 'border-[#FE5502] bg-[#FFF5F5] dark:bg-[#FE5502]/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-[#FE5502]'
                          }`}
                      >
                        <Star className={`h-6 w-6 ${activeFilters.has('rating-4-plus') ? 'text-[#FE5502] fill-[#FE5502]' : 'text-gray-400 dark:text-gray-500'}`} />
                        <span className={`text-sm font-medium ${activeFilters.has('rating-4-plus') ? 'text-[#FE5502]' : 'text-gray-700 dark:text-gray-300'}`}>Rated 4.0+</span>
                      </button>
                      <button
                        onClick={() => toggleFilter('rating-45-plus')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors ${activeFilters.has('rating-45-plus')
                          ? 'border-[#FE5502] bg-[#FFF5F5] dark:bg-[#FE5502]/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-[#FE5502]'
                          }`}
                      >
                        <Star className={`h-6 w-6 ${activeFilters.has('rating-45-plus') ? 'text-[#FE5502] fill-[#FE5502]' : 'text-gray-400 dark:text-gray-500'}`} />
                        <span className={`text-sm font-medium ${activeFilters.has('rating-45-plus') ? 'text-[#FE5502]' : 'text-gray-700 dark:text-gray-300'}`}>Rated 4.5+</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Distance Tab */}
                {activeFilterTab === 'distance' && (
                  <div className="space-y-4 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Distance</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => toggleFilter('distance-under-1km')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors ${activeFilters.has('distance-under-1km')
                          ? 'border-[#FE5502] bg-[#FFF5F5] dark:bg-[#FE5502]/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-[#FE5502]'
                          }`}
                      >
                        <MapPin className={`h-6 w-6 ${activeFilters.has('distance-under-1km') ? 'text-[#FE5502]' : 'text-gray-600 dark:text-gray-400'}`} strokeWidth={1.5} />
                        <span className={`text-sm font-medium ${activeFilters.has('distance-under-1km') ? 'text-[#FE5502]' : 'text-gray-700 dark:text-gray-300'}`}>Under 1 km</span>
                      </button>
                      <button
                        onClick={() => toggleFilter('distance-under-2km')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors ${activeFilters.has('distance-under-2km')
                          ? 'border-[#FE5502] bg-[#FFF5F5] dark:bg-[#FE5502]/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-[#FE5502]'
                          }`}
                      >
                        <MapPin className={`h-6 w-6 ${activeFilters.has('distance-under-2km') ? 'text-[#FE5502]' : 'text-gray-600 dark:text-gray-400'}`} strokeWidth={1.5} />
                        <span className={`text-sm font-medium ${activeFilters.has('distance-under-2km') ? 'text-[#FE5502]' : 'text-gray-700 dark:text-gray-300'}`}>Under 2 km</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Price Tab */}
                {activeFilterTab === 'price' && (
                  <div className="space-y-4 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Dish Price</h3>
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => toggleFilter('price-under-200')}
                        className={`px-4 py-3 rounded-xl border text-left transition-colors ${activeFilters.has('price-under-200')
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-green-500'
                          }`}
                      >
                        <span className={`text-sm font-medium ${activeFilters.has('price-under-200') ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>Under ₹200</span>
                      </button>
                      <button
                        onClick={() => toggleFilter('price-under-500')}
                        className={`px-4 py-3 rounded-xl border text-left transition-colors ${activeFilters.has('price-under-500')
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-green-500'
                          }`}
                      >
                        <span className={`text-sm font-medium ${activeFilters.has('price-under-500') ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>Under ₹500</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Cuisine Tab */}
                {activeFilterTab === 'cuisine' && (
                  <div className="space-y-4 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cuisine</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {['Continental', 'Italian', 'Asian', 'Indian', 'Chinese', 'American', 'Seafood', 'Cafe'].map((cuisine) => (
                        <button
                          key={cuisine}
                          onClick={() => setSelectedCuisine(selectedCuisine === cuisine ? null : cuisine)}
                          className={`px-4 py-3 rounded-xl border text-center transition-colors ${selectedCuisine === cuisine
                            ? 'border-[#FE5502] bg-[#FFF5F5] dark:bg-[#FE5502]/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-[#FE5502]'
                            }`}
                        >
                          <span className={`text-sm font-medium ${selectedCuisine === cuisine ? 'text-[#FE5502]' : 'text-gray-700 dark:text-gray-300'}`}>
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
            <div className="flex items-center gap-4 md:gap-6 px-4 md:px-6 py-4 md:py-5 border-t dark:border-gray-800 bg-white dark:bg-[#1a1a1a]">
              <button
                onClick={() => setIsFilterOpen(false)}
                className="flex-1 py-3 md:py-4 text-center font-semibold text-gray-700 dark:text-gray-300 text-sm md:text-base"
              >
                Close
              </button>
              <button
                onClick={() => setIsFilterOpen(false)}
                className={`flex-1 py-3 md:py-4 font-semibold rounded-xl transition-colors text-sm md:text-base ${activeFilters.size > 0 || sortBy || selectedCuisine
                  ? 'bg-[#FE5502] text-white hover:bg-[#C83C00]'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
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


