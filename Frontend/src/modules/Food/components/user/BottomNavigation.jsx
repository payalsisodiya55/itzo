import { Link, useLocation } from "react-router-dom"
import { Tag, User, Truck, UtensilsCrossed, ArrowUpRight } from "lucide-react"
import { useAuth } from "@core/context/AuthContext"

export default function BottomNavigation() {
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const pathname = location.pathname
  const profileSource = new URLSearchParams(location.search).get("from")
  const redirectTo = `${location.pathname || "/food/user"}${location.search || ""}${location.hash || ""}`

  // Check active routes - support both /user/* and /* paths
  const isDining = pathname === "/food/dining" || pathname.startsWith("/food/user/dining")
  const isUnder250 = pathname === "/food/under-250" || pathname.startsWith("/food/user/under-250")
  const isSharedFoodProfile =
    (pathname === "/profile" || pathname.startsWith("/profile/")) &&
    profileSource !== "quick"
  const isProfile =
    pathname.startsWith("/food/profile") ||
    pathname.startsWith("/food/user/profile") ||
    isSharedFoodProfile
  const isDelivery =
    !isDining &&
    !isUnder250 &&
    !isProfile &&
    (pathname === "/food" ||
      pathname === "/food/" ||
      pathname === "/food/user" ||
      (pathname.startsWith("/food/user") &&
        !pathname.includes("/dining") &&
        !pathname.includes("/under-250") &&
        !pathname.includes("/profile")))

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-50"
    >
      <Link
        to="/user/auth/portal"
        state={{ redirectTo }}
        className="relative z-10 mb-0.5 ml-4 mr-auto flex h-9 w-fit items-center gap-2 rounded-t-[16px] rounded-b-[8px] border border-gray-200 bg-white px-3 pb-2 pt-1.5 shadow-[0_-1px_0_rgba(255,255,255,0.9),0_-6px_18px_-10px_rgba(0,0,0,0.12)]"
      >
        <div className="pointer-events-none absolute -bottom-2 left-2 right-2 h-2 rounded-b-full bg-white" />
        <div className="text-left leading-none">
          <span className="block text-[8px] font-black uppercase tracking-[0.2em] text-primary-orange">
            Explore
          </span>
        </div>
        <div className="flex h-6 w-6 items-center justify-center rounded-[8px] bg-primary-orange/10 text-primary-orange">
          <ArrowUpRight className="h-3 w-3" strokeWidth={2.6} />
        </div>
      </Link>

      <div
        className="relative bg-white dark:bg-[#1a1a1a] border-t border-gray-200 dark:border-gray-800 shadow-lg"
      >
      <div className="flex items-center justify-around h-auto px-2 sm:px-4">
        {/* Delivery Tab */}
        <Link
          to="/food/user"
          className={`flex flex-1 flex-col items-center gap-1.5 px-2 sm:px-3 py-2 transition-all duration-200 relative ${isDelivery
              ? "text-primary-orange dark:text-primary-orange"
              : "text-gray-600 dark:text-gray-400"
            }`}
        >
          < Truck className={`h-5 w-5 ${isDelivery ? "text-primary-orange dark:text-primary-orange fill-primary-orange dark:fill-primary-orange" : "text-gray-600 dark:text-gray-400"}`} strokeWidth={2} />
          <span className={`text-xs sm:text-sm font-medium ${isDelivery ? "text-primary-orange dark:text-primary-orange font-semibold" : "text-gray-600 dark:text-gray-400"}`}>
            Delivery
          </span>
          {isDelivery && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary-orange dark:bg-primary-orange rounded-b-full" />
          )}
        </Link>

        {/* Divider */}
        <div className="h-8 w-px bg-gray-300 dark:bg-gray-700" />

        {/* Dining Tab */}
        <Link
          to="/food/user/dining"
          className={`flex flex-1 flex-col items-center gap-1.5 px-2 sm:px-3 py-2 transition-all duration-200 relative ${isDining
              ? "text-primary-orange dark:text-primary-orange"
              : "text-gray-600 dark:text-gray-400"
            }`}
        >
          <UtensilsCrossed className={`h-5 w-5 ${isDining ? "text-primary-orange dark:text-primary-orange" : "text-gray-600 dark:text-gray-400"}`} strokeWidth={2} />
          <span className={`text-xs sm:text-sm font-medium ${isDining ? "text-primary-orange dark:text-primary-orange font-semibold" : "text-gray-600 dark:text-gray-400"}`}>
            Dining
          </span>
          {isDining && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary-orange dark:bg-primary-orange rounded-b-full" />
          )}
        </Link>

        {/* Divider */}
        <div className="h-8 w-px bg-gray-300 dark:bg-gray-700" />

        {/* Under 250 Tab */}
        <Link
          to="/food/user/under-250"
          className={`flex flex-1 flex-col items-center gap-1.5 px-2 sm:px-3 py-2 transition-all duration-200 relative ${isUnder250
              ? "text-primary-orange dark:text-primary-orange"
              : "text-gray-600 dark:text-gray-400"
            }`}
        >
          <Tag className={`h-5 w-5 ${isUnder250 ? "text-primary-orange dark:text-primary-orange fill-primary-orange dark:fill-primary-orange" : "text-gray-600 dark:text-gray-400"}`} strokeWidth={2} />
          <span className={`text-xs sm:text-sm font-medium ${isUnder250 ? "text-primary-orange dark:text-primary-orange font-semibold" : "text-gray-600 dark:text-gray-400"}`}>
            Under 250
          </span>
          {isUnder250 && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary-orange dark:bg-primary-orange rounded-b-full" />
          )}
        </Link>

        {/* Divider */}
        <div className="h-8 w-px bg-gray-300 dark:bg-gray-700" />

        {/* Profile Tab */}
        <Link
          to={isAuthenticated ? "/food/user/profile" : "/user/auth/login"}
          state={!isAuthenticated ? { redirectTo: "/food/user/profile" } : undefined}
          className={`flex flex-1 flex-col items-center gap-1.5 px-2 sm:px-3 py-2 transition-all duration-200 relative ${isProfile
              ? "text-primary-orange dark:text-primary-orange"
              : "text-gray-600 dark:text-gray-400"
            }`}
        >
          <User className={`h-5 w-5 ${isProfile ? "text-primary-orange dark:text-primary-orange fill-primary-orange dark:fill-primary-orange" : "text-gray-600 dark:text-gray-400"}`} />
          <span className={`text-xs sm:text-sm font-medium ${isProfile ? "text-primary-orange dark:text-primary-orange font-semibold" : "text-gray-600 dark:text-gray-400"}`}>
            Profile
          </span>
          {isProfile && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary-orange dark:bg-primary-orange rounded-b-full" />
          )}
        </Link>
      </div>
      </div>
    </div>
  )
}
