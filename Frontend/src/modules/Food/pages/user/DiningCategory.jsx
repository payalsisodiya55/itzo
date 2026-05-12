import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, BadgePercent, Bookmark, Clock, MapPin, Star, UtensilsCrossed } from "lucide-react"
import { Button } from "@food/components/ui/button"
import { Card, CardContent } from "@food/components/ui/card"
import AnimatedPage from "@food/components/user/AnimatedPage"
import { useLocationSelector } from "@food/components/user/UserLayout"
import useAppBackNavigation from "@food/hooks/useAppBackNavigation"
import { useLocation as useLocationHook } from "@food/hooks/useLocation"
import { useProfile } from "@food/context/ProfileContext"
import { FaLocationDot } from "react-icons/fa6"
import { diningAPI } from "@food/api"
import { getRestaurantAvailabilityStatus } from "@food/utils/restaurantAvailability"

const slugifyRestaurant = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

const formatAddress = (restaurant) =>
  restaurant?.location?.addressLine1 ||
  restaurant?.location?.formattedAddress ||
  restaurant?.location?.address ||
  [restaurant?.location?.area || restaurant?.area, restaurant?.location?.city || restaurant?.city]
    .filter(Boolean)
    .join(", ") ||
  "Address unavailable"

const formatTimeValue = (value) => {
  if (!value) return null
  if (/[ap]m/i.test(value)) return value.toUpperCase()
  const date = new Date(`2000-01-01T${String(value).padStart(5, "0")}`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })
}

const formatTimingLabel = (status) => {
  if (!status?.openingTime || !status?.closingTime) return "Timings not updated"
  return `${formatTimeValue(status.openingTime)} - ${formatTimeValue(status.closingTime)}`
}

const formatCategoryHeading = (category) =>
  String(category || "dining")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")

export default function DiningCategory() {
  const { category } = useParams()
  const navigate = useNavigate()
  const goBack = useAppBackNavigation()
  const { openLocationSelector } = useLocationSelector()
  const { location } = useLocationHook()
  const { addFavorite, removeFavorite, isFavorite } = useProfile()

  const [restaurants, setRestaurants] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setIsLoading(true)
        const response = await diningAPI.getRestaurants(
          category
            ? (location?.city ? { category, city: location.city } : { category })
            : (location?.city ? { city: location.city } : {})
        )

        if (response?.data?.success) {
          const mapped = (Array.isArray(response.data.data) ? response.data.data : [])
            .filter((r) => r?.diningSettings?.isEnabled !== false && r?.isAcceptingOrders !== false)
            .map((restaurant) => {
            const availability = getRestaurantAvailabilityStatus(restaurant)
            return {
              id: restaurant._id || restaurant.id,
              slug: restaurant.restaurantNameNormalized || slugifyRestaurant(restaurant.restaurantName || restaurant.name),
              name: restaurant.restaurantName || restaurant.name || "Restaurant",
              image:
                restaurant.coverImage ||
                restaurant.menuImages?.[0] ||
                restaurant.profileImage?.url ||
                restaurant.profileImage ||
                "",
              address: formatAddress(restaurant),
              cuisine:
                Array.isArray(restaurant.cuisines) && restaurant.cuisines.length > 0
                  ? restaurant.cuisines.join(" • ")
                  : "Multi-cuisine",
              price: restaurant.costForTwo ? `Rs ${restaurant.costForTwo} for two` : "Price on request",
              rating: Number(restaurant.rating || restaurant.avgRating || 0).toFixed(1),
              offer: restaurant.offer || "Pre-book tables and dining offers",
              featuredDish: restaurant.featuredDish || "Chef's special",
              featuredPrice: restaurant.featuredPrice || null,
              availability,
            }
          })
          setRestaurants(mapped)
          setError(null)
        } else {
          setRestaurants([])
        }
      } catch (fetchError) {
        setError("Failed to load dining restaurants")
        setRestaurants([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchRestaurants()
  }, [category, location?.city])

  const cityName = location?.city || "Select location"
  const heading = useMemo(() => formatCategoryHeading(category), [category])

  const handleLocationClick = useCallback(() => {
    openLocationSelector()
  }, [openLocationSelector])

  return (
    <AnimatedPage className="min-h-screen bg-[#fffaf4] pb-24 dark:bg-[#0a0a0a]">
      <div className="sticky top-0 z-30 border-b border-[#efe2d2] bg-[rgba(255,250,244,0.95)] backdrop-blur-xl dark:border-gray-800 dark:bg-[rgba(10,10,10,0.95)]">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={goBack}
            className="h-10 w-10 rounded-full border border-[#e7d8c5] bg-white text-[#2f2215] hover:bg-[#fff1df] dark:border-gray-700 dark:bg-[#1a1a1a] dark:text-white dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            onClick={handleLocationClick}
            className="h-auto rounded-full border border-[#e7d8c5] bg-white px-4 py-2 text-left hover:bg-[#fff3e6] dark:border-gray-700 dark:bg-[#1a1a1a] dark:hover:bg-gray-800"
          >
            <div className="flex items-center gap-2">
              <FaLocationDot className="h-4 w-4 text-[#cc2532]" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#aa8b68] dark:text-gray-400">Dining In</p>
                <p className="text-sm font-bold text-[#2f2215] dark:text-white">{cityName}</p>
              </div>
            </div>
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-6 rounded-[28px] border border-[#f0dfca] bg-gradient-to-br from-[#fff4e7] via-white to-[#fff9f3] p-6 shadow-[0_18px_60px_rgba(90,55,20,0.08)] dark:border-gray-800 dark:bg-gradient-to-br dark:from-[#161616] dark:via-[#101010] dark:to-[#1a1a1a] dark:shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.34em] text-[#c07a3a] dark:text-orange-300">Dining Category</p>
              <h1 className="text-3xl font-black tracking-tight text-[#23180f] sm:text-4xl dark:text-white">{heading}</h1>
              <p className="mt-2 max-w-2xl text-sm text-[#6b5641] dark:text-gray-300">
                Explore all restaurants linked to this dining category, check their timings, preview the menu, and jump straight into table booking.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 self-start rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#6b5641] shadow-sm dark:border dark:border-gray-700 dark:bg-[#1a1a1a] dark:text-gray-300">
              <MapPin className="h-4 w-4 text-[#cc2532]" />
              <span>{restaurants.length} places found</span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-[#7f6850] dark:text-gray-400">Loading dining restaurants...</div>
        ) : error ? (
          <div className="py-20 text-center text-red-600">{error}</div>
        ) : restaurants.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-[#e8d9c5] bg-white px-6 py-16 text-center text-[#7f6850] dark:border-gray-800 dark:bg-[#141414] dark:text-gray-400">
            No restaurants are linked to this dining category yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {restaurants.map((restaurant) => {
              const favorite = isFavorite(restaurant.slug)

              const toggleFavorite = (event) => {
                event.preventDefault()
                event.stopPropagation()

                if (favorite) {
                  removeFavorite(restaurant.slug)
                  return
                }

                addFavorite({
                  slug: restaurant.slug,
                  name: restaurant.name,
                  cuisine: restaurant.cuisine,
                  rating: restaurant.rating,
                  image: restaurant.image,
                })
              }

              return (
                <Link
                  key={restaurant.id}
                  to={`/food/user/dining/${category}/${restaurant.slug}`}
                  state={{ restaurant }}
                >
                  <Card className="group overflow-hidden rounded-[30px] border border-[#f0dfca] bg-white py-0 shadow-[0_18px_60px_rgba(17,24,39,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_80px_rgba(17,24,39,0.14)] dark:border-gray-800 dark:bg-[#141414] dark:shadow-[0_18px_60px_rgba(0,0,0,0.35)] dark:hover:shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={restaurant.image}
                        alt={restaurant.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(event) => {
                          event.currentTarget.style.display = "none"
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3">
                        <div className="rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                          {restaurant.featuredDish}
                          {restaurant.featuredPrice ? ` • ${"\u20B9"}${restaurant.featuredPrice}` : ""}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={toggleFavorite}
                          className="h-10 w-10 rounded-full bg-white/90 text-[#2f2215] backdrop-blur-sm hover:bg-white dark:bg-[#1f1f1f]/90 dark:text-white dark:hover:bg-[#2b2b2b]"
                        >
                          <Bookmark className={`h-5 w-5 ${favorite ? "fill-current" : ""}`} />
                        </Button>
                      </div>

                      <div className="absolute bottom-4 left-4 right-4">
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.32em] text-white/80">Reserve Your Table</p>
                        <p className="max-w-[85%] text-2xl font-black leading-tight text-white">{restaurant.offer}</p>
                      </div>
                    </div>

                    <CardContent className="space-y-4 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h2 className="truncate text-[22px] font-black leading-tight text-[#23180f] dark:text-white">{restaurant.name}</h2>
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#6b5641] dark:text-gray-300">{restaurant.address}</p>
                        </div>
                        <div className="inline-flex items-center gap-1 rounded-2xl bg-emerald-600 px-2.5 py-1.5 text-sm font-bold text-white">
                          <span>{restaurant.rating}</span>
                          <Star className="h-3.5 w-3.5 fill-current" />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-[#5f4c39] dark:text-gray-300">
                        <UtensilsCrossed className="h-4 w-4 text-[#cc2532]" />
                        <span className="line-clamp-1">{restaurant.cuisine}</span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${restaurant.availability?.isOpen ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"}`}>
                          <Clock className="h-3.5 w-3.5" />
                          <span>{restaurant.availability?.isOpen ? "Open now" : "Closed now"}</span>
                        </div>
                        <div className="inline-flex items-center rounded-full bg-[#fff4e7] px-3 py-1.5 text-xs font-semibold text-[#a25b1f] dark:bg-[#2a1d12] dark:text-orange-300">
                          {formatTimingLabel(restaurant.availability)}
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-dashed border-[#ead7c0] pt-4 dark:border-gray-700">
                        <div className="text-sm font-semibold text-[#4c3b2c] dark:text-gray-200">{restaurant.price}</div>
                        <div className="inline-flex items-center gap-2 text-sm font-bold text-[#cc2532]">
                          <BadgePercent className="h-4 w-4" />
                          <span>Menu & booking</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </AnimatedPage>
  )
}
