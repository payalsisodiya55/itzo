import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import useRestaurantBackNavigation from "@food/hooks/useRestaurantBackNavigation"
import Lenis from "lenis"
import { ArrowLeft, CheckCircle } from "lucide-react"
import { Card, CardContent } from "@food/components/ui/card"
import { Button } from "@food/components/ui/button"
import BottomNavbar from "@food/components/restaurant/BottomNavbar"
import MenuOverlay from "@food/components/restaurant/MenuOverlay"
import { formatCurrency, usdToInr } from "@food/utils/currency"
const debugLog = (...args) => {}
const debugWarn = (...args) => {}
const debugError = (...args) => {}


export default function BusinessPlanPage() {
  const navigate = useNavigate()
  const goBack = useRestaurantBackNavigation()
  const [showMenu, setShowMenu] = useState(false)
  const [showPlans, setShowPlans] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState("basic")

  // Lenis smooth scrolling for consistency
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })

    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
    }
  }, [])

  const plan = {
    title: "Commission Base Plan",
    rate: "10.0 %",
    description:
      "Restaurant will pay 10.0% commission to StackFood from each order. You will get access of all the features and options in restaurant panel , app and interaction with user.",
  }

  const plans = [
    {
      id: "starter",
      name: "Starter",
      price: formatCurrency(usdToInr(199.00)),
      duration: "60 days",
      features: ["Max Order (200)", "Max Product (15)", "POS", "Mobile App"],
    },
    {
      id: "basic",
      name: "Basic",
      price: formatCurrency(usdToInr(399.00)),
      duration: "120 days",
      features: [
        "Max Order (400)",
        "Max Product (30)",
        "POS",
        "Mobile App",
        "Review",
      ],
    },
    {
      id: "premium",
      name: "Premium",
      price: formatCurrency(usdToInr(699.00)),
      duration: "180 days",
      features: [
        "Max Order (Unlimited)",
        "Max Product (Unlimited)",
        "POS",
        "Mobile App",
        "Review",
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-[#f6f6f6] pb-24 md:pb-6">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50 flex items-center gap-3">
        <button
          onClick={goBack}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 flex-1 text-center -ml-8">
          My Business Plan
        </h1>
      </div>

      {/* Content */}
      <div className="px-4 py-6 flex justify-center">
        <Card className="w-full max-w-md bg-white shadow-sm border-0">
          <CardContent className="pt-10 pb-16 px-6 text-center">
            <h2 className="text-base font-semibold text-[#008069] mb-4">
              {plan.title}
            </h2>
            <p className="text-4xl font-extrabold text-[#008069] mb-6">
              {plan.rate}
            </p>
            <p className="text-sm leading-relaxed text-gray-600 max-w-xs mx-auto">
              {plan.description}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Plans Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 z-40 space-y-2">
        <Button
          variant="outline"
          className="w-full border-[#ff8100] text-[#ff8100] hover:bg-[#ff8100]/5 font-semibold py-2.5 rounded-xl text-sm"
          onClick={() => {
            setShowPlans(true)
          }}
        >
          Plans
        </Button>
        <Button
          className="w-full bg-[#ff8100] hover:bg-[#e67300] text-white font-semibold py-3 rounded-xl text-base"
          onClick={() => {
            // Future: open change plan flow
            debugLog("Change Business Plan clicked")
          }}
        >
          Change Business Plan
        </Button>
      </div>

      {/* Bottom Navigation Bar - Mobile Only */}
      <BottomNavbar onMenuClick={() => setShowMenu(true)} />

      {/* Menu Overlay */}
      <MenuOverlay showMenu={showMenu} setShowMenu={setShowMenu} />

      {/* Plans Bottom Sheet */}
      <AnimatePresence>
        {showPlans && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 z-[70]"
              onClick={() => setShowPlans(false)}
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 25 }}
              className="fixed inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl z-[80] max-h-[85vh] overflow-hidden"
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-4 pb-3 text-center border-b border-gray-100">
                <h2 className="text-base md:text-lg font-semibold text-gray-900">
                  Change Subscription Plan
                </h2>
                <p className="mt-1 text-xs md:text-sm text-gray-500">
                  Renew or shift your plan to get a better experience
                </p>
              </div>

              {/* Plans carousel */}
              <div className="px-4 py-5 overflow-x-auto scrollbar-hide -mx-2">
                <div className="flex gap-3 px-2 min-w-max pb-2">
                  {plans.map((p, index) => {
                    const isActive = p.id === selectedPlanId
                    return (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 30, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{
                          duration: 0.3,
                          delay: 0.05 + index * 0.05,
                        }}
                        className="w-60 flex-shrink-0"
                      >
                        <div
                          onClick={() => setSelectedPlanId(p.id)}
                          className={`w-full rounded-3xl overflow-hidden shadow-md border transition-all cursor-pointer ${
                            isActive
                              ? "bg-[#243447] border-[#243447]"
                              : "bg-white border-gray-200"
                          }`}
                        >
                          <div className="px-5 pt-5 pb-6 text-left">
                            <p
                              className={`text-sm font-semibold mb-3 ${
                                isActive ? "text-white" : "text-gray-800"
                              }`}
                            >
                              {p.name}
                            </p>
                            <p
                              className={`text-3xl font-extrabold mb-1 ${
                                isActive ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {p.price}
                            </p>
                            <p
                              className={`text-xs mb-4 ${
                                isActive ? "text-gray-200" : "text-gray-500"
                              }`}
                            >
                              {p.duration}
                            </p>

                            <div className="space-y-2 mb-5">
                              {p.features.map((feature) => (
                                <div
                                  key={feature}
                                  className="flex items-center gap-2 text-xs text-gray-100"
                                >
                                  <CheckCircle
                                    className={`w-3.5 h-3.5 ${
                                      isActive
                                        ? "text-white"
                                        : "text-[#ff8100]"
                                    }`}
                                  />
                                  <span
                                    className={
                                      isActive
                                        ? "text-gray-100"
                                        : "text-gray-700"
                                    }
                                  >
                                    {feature}
                                  </span>
                                </div>
                              ))}
                            </div>

                            <Button
                              className={`w-full rounded-xl py-2.5 text-sm font-semibold ${
                                isActive
                                  ? "bg-[#ff8100] hover:bg-[#e67300] text-white"
                                  : "bg-white text-[#ff8100] border border-[#ff8100] hover:bg-[#ff8100]/5"
                              }`}
                              variant={isActive ? "default" : "outline"}
                              onClick={(e) => {
                                e.stopPropagation()
                                debugLog("Shift plan to:", p.id)
                                setSelectedPlanId(p.id)
                                setShowPlans(false)
                              }}
                            >
                              Shift This Plan
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}



