import { useEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { restaurantAPI } from "@food/api"
import { useProfile } from "@food/context/ProfileContext"
import { getMenuFromResponse } from "@food/utils/menuItems"
import { normalizeSelectedDiningGuests } from "@food/utils/diningGuests"
import useAppBackNavigation from "@food/hooks/useAppBackNavigation"
import {
    ArrowLeft,
    Bookmark,
    CheckCircle2,
  Clock3,
  IndianRupee,
  Loader2,
  MapPin,
  Percent,
  Share2,
  Tag,
  Ticket,
} from "lucide-react"
import { Button } from "@food/components/ui/button"

const formatAddress = (restaurant) =>
  restaurant?.location?.formattedAddress ||
  restaurant?.location?.addressLine1 ||
  restaurant?.location?.address ||
  [restaurant?.location?.area || restaurant?.area, restaurant?.location?.city || restaurant?.city]
    .filter(Boolean)
    .join(", ")

const buildImageList = (restaurant) => {
  const candidates = [
    restaurant?.coverImage?.url,
    restaurant?.coverImage,
    ...(Array.isArray(restaurant?.coverImages) ? restaurant.coverImages.map((image) => image?.url || image) : []),
    ...(Array.isArray(restaurant?.menuImages) ? restaurant.menuImages.map((image) => image?.url || image) : []),
    restaurant?.profileImage?.url,
    restaurant?.profileImage,
  ]
  return candidates
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index)
}

const buildFacilities = (restaurant) => {
  const facilities = []

  if (restaurant?.diningSettings?.tableBookingEnabled !== false) facilities.push("Dinner")
  if (restaurant?.isAcceptingOrders !== false) facilities.push("Lunch")
  if (restaurant?.diningSettings?.homeDeliveryAvailable || restaurant?.homeDeliveryAvailable) facilities.push("Home delivery")
  if (restaurant?.diningSettings?.takeawayAvailable || restaurant?.takeawayAvailable) facilities.push("Takeaway available")
  if (restaurant?.diningSettings?.vegOnly || restaurant?.vegOnly) facilities.push("Vegetarian only")
  if (restaurant?.diningSettings?.lessNoisy || restaurant?.ambience === "quiet") facilities.push("Less noisy")

  return facilities.length > 0
    ? facilities
    : ["Dinner", "Lunch", "Home delivery", "Takeaway available", "Vegetarian only", "Less noisy"]
}

const buildFeaturedSections = (menuSections) =>
  menuSections
    .map((section, index) => {
      const items = [
        ...(Array.isArray(section?.items) ? section.items : []),
        ...((Array.isArray(section?.subsections) ? section.subsections : []).flatMap((subsection) => subsection?.items || [])),
      ]

      return {
        id: `${section?.name || "section"}-${index}`,
        title: section?.name || "Menu",
        pages: items.length || 1,
      }
    })
    .slice(0, 2)

const formatTimeLabel = (value) => {
  if (!value) return null
  if (/[ap]m/i.test(value)) return value.toUpperCase()
  const date = new Date(`2000-01-01T${String(value).padStart(5, "0")}`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })
}

const scrollToSection = (id) => {
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "start" })
  }
}

export default function DiningRestaurantDetails() {
  const { category, slug } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const goBack = useAppBackNavigation()
  const { addFavorite, removeFavorite, isFavorite } = useProfile()

  const [restaurant, setRestaurant] = useState(location.state?.restaurant || null)
  const [menuSections, setMenuSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedGuests, setSelectedGuests] = useState(2)
  const [activeTab, setActiveTab] = useState("prebook")

  useEffect(() => {
    const fetchRestaurantData = async () => {
      try {
        setLoading(true)
        setError(null)

        const routeRestaurant = location.state?.restaurant || null
        const preferredRestaurantLookup =
          routeRestaurant?._id ||
          routeRestaurant?.restaurantId ||
          routeRestaurant?.id ||
          slug

        const restaurantResponse = await restaurantAPI.getRestaurantById(preferredRestaurantLookup)
        if (!restaurantResponse?.data?.success) {
          setError("Restaurant not found")
          setRestaurant(null)
          return
        }

        const resolvedRestaurant =
          restaurantResponse?.data?.data?.restaurant ||
          restaurantResponse?.data?.data ||
          null

        if (!resolvedRestaurant) {
          setError("Restaurant not found")
          setRestaurant(null)
          return
        }

        const restaurantId = resolvedRestaurant?._id || resolvedRestaurant?.id || slug
        const menuResponse = await restaurantAPI.getMenuByRestaurantId(restaurantId).catch(() => null)
        const resolvedMenu = menuResponse ? getMenuFromResponse(menuResponse) : null

        setRestaurant(resolvedRestaurant)
        setMenuSections(Array.isArray(resolvedMenu?.sections) ? resolvedMenu.sections : [])
      } catch {
        setError("Failed to load restaurant")
        setRestaurant(null)
      } finally {
        setLoading(false)
      }
    }

    fetchRestaurantData()
  }, [location.state?.restaurant, slug])

  useEffect(() => {
    setSelectedGuests((currentGuests) => normalizeSelectedDiningGuests(currentGuests, restaurant))
  }, [restaurant])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7fb]">
        <Loader2 className="h-8 w-8 animate-spin text-[#FE5502]" />
      </div>
    )
  }

  if (error || !restaurant) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f6f7fb] px-4 text-center">
        <h2 className="text-2xl font-bold text-[#23180f]">Restaurant not found</h2>
        <Button onClick={goBack} variant="outline">
          Go Back
        </Button>
      </div>
    )
  }

  const restaurantName = restaurant.name || restaurant.restaurantName || "Restaurant"
  const address = formatAddress(restaurant) || "Address unavailable"
  const imageGallery = buildImageList(restaurant)
  const heroImage = imageGallery[0] || ""
  const menuPreviewImages = imageGallery.length > 0 ? imageGallery : [""]
  const featuredSections = buildFeaturedSections(menuSections)
  const cuisines =
    Array.isArray(restaurant?.cuisines) && restaurant.cuisines.length > 0
      ? restaurant.cuisines.join(", ")
      : "Asian, Italian, Continental, Chinese, North Indian, Desserts, Beverages, Coffee"
  const costForTwo = restaurant?.costForTwo ? `${"\u20B9"}${restaurant.costForTwo} for two` : `${"\u20B9"}1900 for two`
  const facilities = buildFacilities(restaurant)
  const rating = Number(restaurant?.rating || restaurant?.avgRating || 0).toFixed(1)
  const reviewCount = restaurant?.totalRatings || restaurant?.reviewCount || restaurant?.reviewsCount || 0
  const openingTime = formatTimeLabel(restaurant?.openingTime || restaurant?.diningSettings?.openingTime || "12:00")
  const closingTime = formatTimeLabel(restaurant?.closingTime || restaurant?.diningSettings?.closingTime || "23:59")
  const isDiningEnabled = restaurant?.diningSettings?.isEnabled !== false
  const topTabs = [
    { id: "prebook", label: "Pre-book offers", target: "restaurant-prebook" },
    { id: "walkin", label: "Walk-in offers", target: "restaurant-prebook" },
    { id: "menu", label: "Menu", target: "restaurant-menu" },
    { id: "photos", label: "Photos", target: "restaurant-photos" },
    { id: "about", label: "About", target: "restaurant-about" },
  ]

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: restaurantName,
          text: `Check out ${restaurantName}`,
          url: window.location.href,
        })
      }
    } catch {}
  }

  const restaurantFavoriteSlug =
    restaurant?.restaurantNameNormalized ||
    restaurant?.slug ||
    slug

  const favorite = isFavorite(restaurantFavoriteSlug)

  const handleBack = () => {
    if (window.history.length > 1) {
      goBack()
      return
    }

    if (category) {
      navigate(`/food/user/dining/${category}`)
      return
    }

    navigate("/food/user/dining")
  }

  const handleToggleFavorite = () => {
    if (favorite) {
      removeFavorite(restaurantFavoriteSlug)
      return
    }

    addFavorite({
      slug: restaurantFavoriteSlug,
      name: restaurantName,
      cuisine: cuisines,
      rating,
      image: heroImage,
    })
  }

  const handleContinueBooking = () => {
    if (!isDiningEnabled) return
    navigate(`/food/user/dining/book/${slug}`, {
      state: {
        guestCount: selectedGuests,
        restaurant,
      },
    })
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb] pb-28">
      <section className="mx-auto max-w-md bg-[#f6f7fb]">
        <div className="relative h-[392px] overflow-hidden">
          {heroImage ? (
            <img src={heroImage} alt={restaurantName} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-[radial-gradient(circle_at_top,#eadcc7,#a09279_58%,#655749)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/18 to-black/0" />

          <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-3 pt-3">
            <button
              onClick={handleBack}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#51586a]/75 text-white backdrop-blur-md"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleFavorite}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#51586a]/75 text-white backdrop-blur-md"
              >
                <Bookmark className={`h-4 w-4 ${favorite ? "fill-current" : ""}`} />
              </button>
              <button
                onClick={handleShare}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#51586a]/75 text-white backdrop-blur-md"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 px-3 pb-4 text-white">
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h1 className="text-[36px] font-black leading-none tracking-[-0.03em]">{restaurantName}</h1>
                <p className="mt-2 max-w-[94%] text-[14px] leading-5 text-white/92">{address}</p>
                <p className="mt-2 text-[14px] text-white/90">
                  {costForTwo}
                  <span className="mx-1.5 text-white/65">•</span>
                  {cuisines}
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-black/28 px-2.5 py-1 text-[13px] font-medium backdrop-blur-sm">
                  <CheckCircle2 className="h-4 w-4 text-[#48d597]" />
                  <span>Open now</span>
                  <span className="text-white/70">|</span>
                  <span>{openingTime} to {closingTime}</span>
                </div>
              </div>

              <div className="mb-1 shrink-0 rounded-[18px] bg-white px-3 py-2 text-center text-[#1f2328] shadow-xl">
                <div className="flex items-center justify-center gap-1 text-[31px] font-black leading-none">
                  <span>{rating}</span>
                  <span className="text-[18px] text-[#18b54f]">★</span>
                </div>
                <p className="mt-1 text-[13px] leading-4 text-[#6e7481]">{reviewCount} Reviews</p>
              </div>
            </div>
          </div>
        </div>

          <div className="px-3 pb-1 pt-3">
            <button
              onClick={handleContinueBooking}
              disabled={!isDiningEnabled}
              className={`flex h-[52px] w-full items-center justify-center gap-2 rounded-full border px-3 text-[15px] font-medium shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition-all active:scale-[0.98] ${
                isDiningEnabled
                  ? "border-[#f1ebee] bg-white text-[#2b2118]"
                  : "cursor-not-allowed border-[#f2d7da] bg-[#fff5f6] text-[#c06a79] opacity-80"
              }`}
            >
              <Ticket className="h-[15px] w-[15px] text-[#ef4c62]" />
              <span>{isDiningEnabled ? "Book a table" : "Dining paused"}</span>
            </button>

            {!isDiningEnabled && (
              <div className="mt-3 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Dining bookings are currently turned off by the restaurant.
              </div>
            )}

          <div className="mt-4 overflow-hidden rounded-[18px] bg-[linear-gradient(180deg,#fff0ce,#fff8ea)] px-4 py-4 shadow-[0_8px_24px_rgba(238,184,68,0.22)]">
            <div className="flex items-center justify-between gap-3">
              <div className="rounded-full bg-[#8e77ff]/10 p-2 text-[#7f69eb]">
                <Percent className="h-5 w-5" />
              </div>
              <div className="flex-1 text-center">
                <p className="text-[33px] font-black leading-none tracking-[-0.04em] text-[#2c2352]">20% CASHBACK</p>
                <p className="mt-1 text-[14px] font-medium text-[#4a4068]">on every dining bill</p>
              </div>
              <div className="rounded-full bg-[#8e77ff]/10 p-2 text-[#7f69eb]">
                <Percent className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="sticky top-0 z-30 border-b border-[#ececf3] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto max-w-md px-3 pb-3 pt-3">
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {topTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  scrollToSection(tab.target)
                }}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-[#ef6b73] bg-white text-[#2a2018]"
                    : "border-[#ece9e1] bg-[#fafafa] text-[#8b8881]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 pt-4">
        <section id="restaurant-prebook">
          <div>
            <h2 className="text-[29px] font-black leading-none text-[#23180f]">Pre-book offers</h2>
            <p className="mt-1 text-[15px] text-[#ef4c62]">Limited slots with extra offers</p>
          </div>

          <div className="mt-3 overflow-hidden rounded-[18px] bg-[linear-gradient(135deg,#0f4a87,#0b2954_70%)] text-white shadow-[0_10px_26px_rgba(8,52,95,0.25)]">
            <div className="flex items-start justify-between px-4 pb-3 pt-4">
              <div>
                <p className="text-[28px] font-black leading-none">Flat 50% OFF</p>
                <p className="mt-2 text-[14px] text-white/80">Dining Carnival offer</p>
              </div>
              <button className="rounded-full bg-black/45 px-4 py-2 text-[13px] font-semibold text-white backdrop-blur-sm">
                Book now
              </button>
            </div>
            <div className="border-t border-white/10 px-4 py-2 text-center text-[12px] text-white/75">
              3 slots available from 3:30 PM today
            </div>
          </div>
        </section>

        <section id="restaurant-menu" className="mt-5 border-t border-[#e8e8ef] pt-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-[28px] font-black leading-none text-[#23180f]">Menu</h2>
              <p className="mt-2 text-[13px] text-[#e19135]">Last updated a month ago</p>
            </div>
            <div className="rounded-full bg-[#fff3e6] px-3 py-1 text-xs font-semibold text-[#e58a2c]">
              {featuredSections.length || 2} dishes
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {(featuredSections.length > 0
              ? featuredSections
              : [
                  { id: "food", title: "Food", pages: 16 },
                  { id: "beverages", title: "Beverages", pages: 10 },
                ]).map((section, index) => (
              <div key={section.id} className="overflow-hidden rounded-[18px] border border-[#ede8dd] bg-white">
                <div className="aspect-[0.88] bg-[#f7f1e7]">
                  {menuPreviewImages[index] ? (
                    <img src={menuPreviewImages[index]} alt={section.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,#fff3e0,#f3eadf)] text-sm font-medium text-[#a28868]">
                      Menu preview
                    </div>
                  )}
                </div>
                <div className="px-2 pb-3 pt-2 text-center">
                  <p className="text-[16px] font-medium leading-tight text-[#2b2218]">{section.title}</p>
                  <p className="mt-1 text-[12px] text-[#7f7a73]">{section.pages} pages</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="restaurant-photos" className="mt-5 border-t border-[#e8e8ef] pt-4">
          <h2 className="text-[28px] font-black leading-none text-[#23180f]">Photos</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {(imageGallery.length > 0 ? imageGallery.slice(0, 4) : menuPreviewImages.slice(0, 2)).map((image, index) => (
              <div
                key={`${image || "placeholder"}-${index}`}
                className={`overflow-hidden rounded-[18px] bg-[#f6efe4] ${
                  index === 0 ? "col-span-2 aspect-[1.72]" : "aspect-[1.08]"
                }`}
              >
                {image ? (
                  <img src={image} alt={`${restaurantName} ${index + 1}`} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-[#a28868]">Photo coming soon</div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section id="restaurant-about" className="mt-5 border-t border-[#e8e8ef] pt-4">
          <h2 className="text-[28px] font-black leading-none text-[#23180f]">About the restaurant</h2>

          <div className="mt-4 rounded-[18px] border border-[#ececf4] bg-[#fafbff] p-4">
            <div className="space-y-4 text-[14px] text-[#5f6474]">
              <div className="flex items-start gap-3">
                <IndianRupee className="mt-0.5 h-4 w-4 shrink-0 text-[#f0b500]" />
                <p>{costForTwo}</p>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-[7px] h-2 w-2 shrink-0 rounded-full bg-[#8a8f9d]" />
                <p>{cuisines}</p>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#ef4c62]" />
                <p>{address}</p>
              </div>
            </div>

            <div className="mt-5 border-t border-[#e8e8ef] pt-4">
              <h3 className="text-[20px] font-semibold text-[#23180f]">Featured In</h3>
              <div className="mt-3 overflow-hidden rounded-[16px] bg-white shadow-sm">
                <div className="aspect-[1.2] bg-[#efe8df]">
                  {heroImage ? (
                    <img src={heroImage} alt={restaurantName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-[#a28868]">Featured image</div>
                  )}
                </div>
                <div className="-mt-14 bg-[linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,0.72))] p-3 pt-10 text-sm font-medium text-white">
                  Pan-Asian Restaurants
                </div>
              </div>
            </div>

            <div className="mt-5 border-t border-[#e8e8ef] pt-4">
              <h3 className="text-[20px] font-semibold text-[#23180f]">Facilities</h3>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
                {facilities.slice(0, 6).map((facility) => (
                  <div key={facility} className="flex items-center gap-2 text-[14px] text-[#5f6474]">
                    <span className="inline-block h-[7px] w-[7px] rounded-full border border-[#8a8f9d]" />
                    <span>{facility}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#ebe5da] bg-white/95 p-4 backdrop-blur-xl">
        <div className="mx-auto max-w-md">
          <Button
            onClick={handleContinueBooking}
            disabled={!isDiningEnabled}
            className={`h-12 w-full rounded-2xl border text-[17px] font-medium transition-colors ${
              isDiningEnabled
                ? "border-[#f3b4be] bg-white text-[#ef4c62] hover:bg-[#fff6f8]"
                : "cursor-not-allowed border-[#f2d7da] bg-[#fff5f6] text-[#c06a79] opacity-80"
            }`}
          >
            {isDiningEnabled ? "Book a table" : "Dining paused"}
          </Button>
        </div>
      </div>
    </div>
  )
}
