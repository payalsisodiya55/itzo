import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, ChevronDown } from "lucide-react"
import { Button } from "@food/components/ui/button"
import AnimatedPage from "@food/components/user/AnimatedPage"
import { diningAPI, restaurantAPI } from "@food/api"
import useAppBackNavigation from "@food/hooks/useAppBackNavigation"
import { buildDiningGuestOptions, normalizeSelectedDiningGuests } from "@food/utils/diningGuests"
import Loader from "@food/components/Loader"
import { toast } from "sonner"

const BOOKING_DRAFT_KEY = "food_dining_booking_draft_v1"

const buildDates = (count = 7) =>
  Array.from({ length: count }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() + index)
    return date
  })

const formatTimeValue = (value) => {
  if (!value) return null
  if (/[ap]m/i.test(value)) return value.toUpperCase()
  const date = new Date(`2000-01-01T${String(value).padStart(5, "0")}`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })
}

const parseTimeToMinutes = (value) => {
  if (!value) return null
  const raw = String(value).trim()

  const hhmmMatch = raw.match(/^(\d{1,2}):(\d{2})$/)
  if (hhmmMatch) {
    return Number(hhmmMatch[1]) * 60 + Number(hhmmMatch[2])
  }

  const meridiemMatch = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i)
  if (!meridiemMatch) return null

  let hour = Number(meridiemMatch[1])
  const minute = Number(meridiemMatch[2] || 0)
  const meridiem = meridiemMatch[3].toUpperCase()

  if (meridiem === "PM" && hour !== 12) hour += 12
  if (meridiem === "AM" && hour === 12) hour = 0

  return hour * 60 + minute
}

const getDayName = (date) => date.toLocaleDateString("en-US", { weekday: "long" })

const buildSlots = (timing) => {
  if (!timing || timing.isOpen === false) return []
  const opening = parseTimeToMinutes(timing.openingTime)
  const closing = parseTimeToMinutes(timing.closingTime)
  if (opening === null || closing === null) return []

  const slots = []
  let cursor = opening
  const end = closing > opening ? closing : opening + 240

  while (cursor <= end && slots.length < 48) {
    const hours = Math.floor((cursor % (24 * 60)) / 60)
    const minutes = cursor % 60
    slots.push(formatTimeValue(`${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`))
    cursor += 30
  }

  return slots
}

const buildFallbackTiming = (restaurant) => {
  const openingTime = String(
    restaurant?.openingTime ||
      restaurant?.diningSettings?.openingTime ||
      "12:00",
  ).trim()
  const closingTime = String(
    restaurant?.closingTime ||
      restaurant?.diningSettings?.closingTime ||
      "23:00",
  ).trim()

  return {
    isOpen: true,
    openingTime,
    closingTime,
  }
}

const getMealPeriod = (slot) => {
  if (!slot) return "all"
  const normalized = String(slot).toUpperCase()
  const match = normalized.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/)
  if (!match) return "all"

  let hour = Number(match[1])
  const minute = Number(match[2])
  const meridiem = match[3]

  if (meridiem === "PM" && hour !== 12) hour += 12
  if (meridiem === "AM" && hour === 12) hour = 0

  const totalMinutes = hour * 60 + minute
  if (totalMinutes < 17 * 60) return "lunch"
  return "dinner"
}

const getOfferLabel = (slot) => {
  const period = getMealPeriod(slot)
  return period === "lunch" ? "Lunch" : "Carnival"
}

export default function TableBooking() {
  const { slug } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const goBack = useAppBackNavigation()

  const [restaurant, setRestaurant] = useState(location.state?.restaurant || null)
  const [loading, setLoading] = useState(!location.state?.restaurant)
  const [outletTimings, setOutletTimings] = useState({})
  const [selectedGuests, setSelectedGuests] = useState(location.state?.guestCount || 2)
  const [selectedDate, setSelectedDate] = useState(() => {
    const initial = location.state?.selectedDate ? new Date(location.state.selectedDate) : new Date()
    return Number.isNaN(initial.getTime()) ? new Date() : initial
  })
  const [selectedSlot, setSelectedSlot] = useState(location.state?.selectedTime || null)
  const [selectedMealPeriod, setSelectedMealPeriod] = useState("lunch")
  const [now, setNow] = useState(new Date())

  // Keep 'now' updated every minute for real-time slot filtering
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        setLoading(true)
        const response = await diningAPI.getRestaurantBySlug(slug)
        if (response?.data?.success) {
          const apiRestaurant = response?.data?.data?.restaurant || response?.data?.data
          setRestaurant(apiRestaurant || null)

          const restaurantId = apiRestaurant?._id || apiRestaurant?.id || slug
          const timingsResponse = await restaurantAPI.getOutletTimingsByRestaurantId(restaurantId)
          setOutletTimings(timingsResponse?.data?.data?.outletTimings || {})
        }
      } catch {
        setRestaurant(null)
      } finally {
        setLoading(false)
      }
    }

    if (location.state?.restaurant) {
      const restaurantId = location.state.restaurant?._id || location.state.restaurant?.id || slug
      restaurantAPI
        .getOutletTimingsByRestaurantId(restaurantId)
        .then((response) => setOutletTimings(response?.data?.data?.outletTimings || {}))
        .catch(() => setOutletTimings({}))
      setLoading(false)
      return
    }

    fetchRestaurant()
  }, [location.state?.restaurant, slug])

  const dates = useMemo(() => buildDates(7), [])
  const selectedDayTiming = useMemo(() => {
    const fromOutletTimings = outletTimings?.[getDayName(selectedDate)] || null
    if (fromOutletTimings && fromOutletTimings.isOpen !== false) {
      return fromOutletTimings
    }
    return buildFallbackTiming(restaurant)
  }, [outletTimings, selectedDate, restaurant])
  const allSlots = useMemo(() => {
    const rawSlots = buildSlots(selectedDayTiming)
    const isToday = selectedDate.toDateString() === now.toDateString()
    if (!isToday) return rawSlots

    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    // Buffer of 15 minutes to allow for lead time
    const BUFFER_MINUTES = 15

    return rawSlots.filter((slot) => {
      const slotMinutes = parseTimeToMinutes(slot)
      return slotMinutes !== null && slotMinutes > currentMinutes + BUFFER_MINUTES
    })
  }, [selectedDayTiming, selectedDate, now])
  const filteredSlots = useMemo(
    () => allSlots.filter((slot) => getMealPeriod(slot) === selectedMealPeriod),
    [allSlots, selectedMealPeriod]
  )
  const guestOptions = useMemo(() => buildDiningGuestOptions(restaurant, 10), [restaurant])

  useEffect(() => {
    if (!selectedSlot && filteredSlots.length > 0) {
      setSelectedSlot(filteredSlots[0])
      return
    }

    if (selectedSlot && filteredSlots.length > 0 && !filteredSlots.includes(selectedSlot)) {
      setSelectedSlot(filteredSlots[0])
      return
    }

    if (filteredSlots.length === 0) {
      setSelectedSlot(null)
    }
  }, [filteredSlots, selectedSlot])

  useEffect(() => {
    if (allSlots.length === 0) return
    const hasLunch = allSlots.some((slot) => getMealPeriod(slot) === "lunch")
    const hasDinner = allSlots.some((slot) => getMealPeriod(slot) === "dinner")

    if (selectedMealPeriod === "lunch" && !hasLunch && hasDinner) {
      setSelectedMealPeriod("dinner")
    }
    if (selectedMealPeriod === "dinner" && !hasDinner && hasLunch) {
      setSelectedMealPeriod("lunch")
    }
  }, [allSlots, selectedMealPeriod])

  useEffect(() => {
    setSelectedGuests((currentGuests) => normalizeSelectedDiningGuests(currentGuests, restaurant, 10))
  }, [restaurant])

  if (loading) return <Loader />
  if (!restaurant) return <div className="p-6 text-center">Restaurant not found</div>

  const isDiningEnabled = restaurant?.diningSettings?.isEnabled !== false
  const canProceed = Boolean(isDiningEnabled && restaurant && selectedSlot && selectedDate && selectedGuests)

  const handleProceed = () => {
    if (!isDiningEnabled) {
      toast.error("Dining bookings are currently paused for this restaurant.")
      return
    }
    if (!canProceed) {
      toast.error("Please select date, time, and guests to continue.")
      return
    }

    // Final real-time validation before proceeding
    const isToday = selectedDate.toDateString() === now.toDateString()
    if (isToday) {
      const slotMinutes = parseTimeToMinutes(selectedSlot)
      const currentMinutes = now.getHours() * 60 + now.getMinutes()
      if (slotMinutes !== null && slotMinutes <= currentMinutes) {
        toast.error("The selected time slot has already passed. Please choose a later time.")
        return
      }
    }

    const bookingDraft = {
      restaurant: {
        _id: restaurant?._id || restaurant?.id || restaurant?.restaurant?._id || restaurant?.restaurant?.id || null,
        id: restaurant?.id || restaurant?._id || restaurant?.restaurant?.id || restaurant?.restaurant?._id || null,
        name: restaurant?.name || restaurant?.restaurantName || "Restaurant",
        restaurantName: restaurant?.restaurantName || restaurant?.name || "Restaurant",
        profileImage: restaurant?.profileImage || restaurant?.restaurant?.profileImage || null,
        image: restaurant?.image || restaurant?.restaurant?.image || restaurant?.profileImage?.url || "",
        location: restaurant?.location || restaurant?.restaurant?.location || null,
        slug: restaurant?.slug || slug || "",
        diningSettings: restaurant?.diningSettings || restaurant?.restaurant?.diningSettings || null,
      },
      guests: selectedGuests,
      date: selectedDate,
      timeSlot: selectedSlot,
      discount: selectedSlot,
    }

    try {
      sessionStorage.setItem(BOOKING_DRAFT_KEY, JSON.stringify(bookingDraft))
    } catch {}

    navigate("/food/user/dining/book-confirmation", { state: bookingDraft })
  }

  return (
    <AnimatedPage className="min-h-screen bg-[#f5f6fb] pb-40">
      <div className="relative overflow-hidden bg-gradient-to-b from-[#ffe7c6] via-[#fff1d7] to-[#f5f6fb] px-4 pb-10 pt-5">
        <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.65),transparent_65%)]" />

        <div className="relative z-10">
          <button
            onClick={goBack}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#383838] shadow-sm"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="mt-6 text-center">
            <h1 className="text-[30px] font-black tracking-tight text-[#25314a]">Book a table</h1>
            <p className="mt-1 text-sm font-medium text-[#636363]">{restaurant.name || restaurant.restaurantName}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto -mt-4 max-w-md space-y-4 px-4">
        {!isDiningEnabled && (
          <section className="rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <p className="text-sm font-semibold text-amber-900">Dining bookings are paused by this restaurant.</p>
            <p className="mt-1 text-xs text-amber-800">You can still view details, but new table bookings are disabled right now.</p>
          </section>
        )}

        <section className="rounded-[22px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-[#2f3545]">Select number of guests</span>
            <div className="relative">
              <select
                value={selectedGuests}
                onChange={(event) => setSelectedGuests(parseInt(event.target.value, 10))}
                className="appearance-none rounded-full bg-[#f7f7fb] py-2 pl-4 pr-9 text-sm font-semibold text-[#404040] outline-none"
              >
                {guestOptions.map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#808080]" />
            </div>
          </div>
        </section>

        <section className="rounded-[22px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <h3 className="text-sm font-medium text-[#2f3545]">Select date</h3>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {dates.slice(0, 3).map((date, index) => {
              const active = selectedDate.toDateString() === date.toDateString()
              return (
                <button
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(date)}
                  className={`rounded-[18px] border px-3 py-4 text-center transition-colors ${
                    active
                      ? "border-[#ef8f98] bg-[#fffaf9]"
                      : "border-[#ececf2] bg-white"
                  }`}
                >
                  <span className="block text-sm font-medium text-[#444b5f]">
                    {index === 0 ? "Today" : index === 1 ? "Tomorrow" : date.toLocaleDateString("en-IN", { weekday: "long" })}
                  </span>
                  <span className="mt-1 block text-sm text-[#7b8191]">
                    {date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="rounded-[22px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <h3 className="text-sm font-medium text-[#2f3545]">Select time of day</h3>

          <div className="mt-4 flex gap-2">
            {[
              { id: "lunch", label: "Lunch" },
              { id: "dinner", label: "Dinner" },
            ].map((period) => {
              const active = selectedMealPeriod === period.id
              return (
                <button
                  key={period.id}
                  onClick={() => setSelectedMealPeriod(period.id)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "border-[#ef8f98] bg-white text-[#d64f63]"
                      : "border-[#ececf2] bg-[#fafafc] text-[#666f82]"
                  }`}
                >
                  {period.label}
                </button>
              )
            })}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {filteredSlots.length === 0 ? (
              <div className="col-span-3 rounded-[18px] border border-dashed border-[#e5e7ef] px-4 py-8 text-center text-sm text-[#7c8394]">
                No {selectedMealPeriod} slots available for the selected date.
              </div>
            ) : (
              filteredSlots.map((slot) => {
                const active = selectedSlot === slot
                return (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={`rounded-[16px] border px-3 py-4 text-center transition-colors ${
                      active
                        ? "border-[#ef8f98] bg-[#fffaf9]"
                        : "border-[#ececf2] bg-white"
                    }`}
                  >
                    <span className="block text-sm font-medium text-[#334155]">{slot}</span>
                    <span className="mt-1 block text-xs font-medium text-[#2d5ea8]">
                      {getOfferLabel(slot)}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </section>

        <section className="rounded-[18px] bg-white px-4 py-5 text-center shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
          <p className="text-sm text-[#6f7687]">
            Select your preferred time slot to view available booking options
          </p>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-[70] border-t border-[#e6e7ef] bg-[#f5f6fb]/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-xl">
        <div className="mx-auto max-w-md">
          <Button
            disabled={!canProceed}
            onClick={handleProceed}
            className={`h-14 w-full rounded-2xl text-lg font-bold ${
              canProceed
                ? "bg-[#eb4d60] text-white hover:bg-[#d73f52]"
                : "bg-[#a4abba] text-white/95"
            }`}
          >
            {!isDiningEnabled
              ? "Dining paused"
              : canProceed
                ? "Proceed to confirmation"
                : "Select a time slot to proceed"}
          </Button>
        </div>
      </div>
    </AnimatedPage>
  )
}
