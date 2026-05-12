import { useCallback } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Star, ArrowLeft } from "lucide-react"
import { Button } from "@food/components/ui/button"
import AnimatedPage from "@food/components/user/AnimatedPage"
import { useLocationSelector } from "@food/components/user/UserLayout"
import useAppBackNavigation from "@food/hooks/useAppBackNavigation"
import { useLocation as useLocationHook } from "@food/hooks/useLocation"
import { FaLocationDot } from "react-icons/fa6"
// Using placeholder for coffee banner
const coffeeBanner = "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200&h=400&fit=crop"
// Using placeholder for starbucks logo
const starbucksLogo = "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=200&h=200&fit=crop"

const starbucksStores = [
  {
    id: 1,
    name: "Starbucks",
    rating: 4.4,
    location: "YN Road, Indore",
    distance: "1.3 km",
    price: "₹900 for two",
    offer: "Flat 25% OFF",
    logo: starbucksLogo
  },
  {
    id: 2,
    name: "Starbucks",
    rating: 2.8,
    location: "YN Road, Indore",
    distance: "1.3 km",
    price: "₹600 for two",
    offer: null,
    logo: starbucksLogo
  },
  {
    id: 3,
    name: "Starbucks",
    rating: 4.5,
    location: "MG Road, Indore",
    distance: "2.1 km",
    price: "₹850 for two",
    offer: "Flat 20% OFF",
    logo: starbucksLogo
  },
  {
    id: 4,
    name: "Starbucks",
    rating: 4.2,
    location: "Vijay Nagar, Indore",
    distance: "0.9 km",
    price: "₹950 for two",
    offer: "Flat 30% OFF",
    logo: starbucksLogo
  },
]

const cafeCoffeeDayStores = [
  {
    id: 5,
    name: "Cafe Coffee Day",
    rating: 4.3,
    location: "Palasia, Indore",
    distance: "1.5 km",
    price: "₹500 for two",
    offer: "Flat 15% OFF",
    logo: null
  },
  {
    id: 6,
    name: "Cafe Coffee Day",
    rating: 4.1,
    location: "Scheme 54, Indore",
    distance: "2.3 km",
    price: "₹450 for two",
    offer: null,
    logo: null
  },
]

const blueTokaiStores = [
  {
    id: 7,
    name: "Blue Tokai",
    rating: 4.6,
    location: "Bhawarkua, Indore",
    distance: "1.8 km",
    price: "₹700 for two",
    offer: "Buy 1 Get 1 Free",
    logo: null
  },
  {
    id: 8,
    name: "Blue Tokai",
    rating: 4.4,
    location: "Press Complex, Indore",
    distance: "2.5 km",
    price: "₹650 for two",
    offer: "Flat 20% OFF",
    logo: null
  },
]

export default function Coffee() {
  const navigate = useNavigate()
  const goBack = useAppBackNavigation()
  const { openLocationSelector } = useLocationSelector()
  const { location } = useLocationHook()
  const cityName = location?.city || "Select"

  const handleLocationClick = useCallback(() => {
    openLocationSelector()
  }, [openLocationSelector])

  const renderStoreList = (stores, sectionTitle) => {
    return (
      <div className="mb-8">
        {/* Section Header */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide text-center">
            {sectionTitle}
          </h3>
        </div>

        {/* Store List */}
        <div className="space-y-0">
          {stores.map((store, index) => {
            const storeSlug = store.name.toLowerCase().replace(/\s+/g, "-")
            const isHighRating = store.rating >= 4.0

            return (
              <Link
                key={store.id}
                to={`/user/restaurants/${storeSlug}`}
                className="block"
              >
                <div className={`flex items-start gap-4 py-4 ${index !== stores.length - 1 ? 'border-b border-gray-200' : ''}`}>
                  {/* Logo - Circular */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                      {store.logo ? (
                        <img
                          src={store.logo}
                          alt={store.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-xs font-semibold">
                            {store.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Store Info */}
                  <div className="flex-1 min-w-0">
                    {/* Location Name */}
                    <h4 className="text-base font-bold text-gray-900 mb-2">
                      {store.location}
                    </h4>

                    {/* Rating Badge */}
                    <div className="mb-2">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded ${isHighRating
                          ? 'bg-green-600 text-white'
                          : 'bg-[#cc2532] text-white'
                        }`}>
                        <span className="text-sm font-semibold">{store.rating}</span>
                        <Star className={`h-3 w-3 ${isHighRating ? 'fill-white text-white' : 'fill-white text-white'}`} />
                      </div>
                    </div>

                    {/* Distance */}
                    <p className="text-sm text-gray-500 mb-1">
                      {store.distance}
                    </p>

                    {/* Price and Offer */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-sm text-gray-700">
                        {store.price}
                      </p>
                      {store.offer && (
                        <span className="text-sm font-medium text-[#cc2532]">
                          {store.offer}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <AnimatedPage className="bg-white" style={{ minHeight: '100vh', paddingBottom: '80px', overflow: 'visible' }}>
      {/* Banner Section with Back Button and Location */}
      <div className="relative w-full overflow-hidden">
        {/* Background with coffee banner */}
        <div className="relative w-full z-0">
          <img
            src={coffeeBanner}
            alt="Coffee"
            className="w-full h-auto object-contain"
            style={{ display: 'block' }}
          />
        </div>

        {/* Navbar with Back Button - Overlay on top of image */}
        <nav className="absolute top-0 left-0 right-0 z-20 w-full px-3 sm:px-6 lg:px-8 py-3 sm:py-4 backdrop-blur-sm">
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
              <div className="flex items-center gap-2 min-w-0">
                <FaLocationDot className="h-4 w-4 sm:h-5 sm:w-5 text-white flex-shrink-0" />
                <span className="text-sm sm:text-base font-semibold text-white truncate border-b-2 border-dotted border-white">
                  {cityName}
                </span>
              </div>
            </Button>
          </div>
        </nav>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Starbucks Coffee
            </h1>
            <p className="text-sm sm:text-base text-gray-500">
              Cafe, Coffee, Beverages
            </p>
            <div className="h-px bg-gray-200 mt-4"></div>
          </div>

          {/* Multiple Store Lists */}
          {renderStoreList(starbucksStores, "DINING OUTLETS NEAR YOU")}
        </div>
      </div>
    </AnimatedPage>
  )
}
