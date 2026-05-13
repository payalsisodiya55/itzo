import { useLocation, useNavigate } from "react-router-dom"
import { CheckCircle2, Calendar, Clock, Users, MapPin, Share2, Home, List } from "lucide-react"
import { Button } from "@food/components/ui/button"
import AnimatedPage from "@food/components/user/AnimatedPage"
import { motion } from "framer-motion"
import confetti from "canvas-confetti"
import { useEffect } from "react"

export default function TableBookingSuccess() {
    const location = useLocation()
    const navigate = useNavigate()
    const { booking } = location.state || {}

    useEffect(() => {
        // Trigger confetti on mount
        const duration = 3 * 1000
        const animationEnd = Date.now() + duration
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

        const randomInRange = (min, max) => Math.random() * (max - min) + min

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now()

            if (timeLeft <= 0) {
                return clearInterval(interval)
            }

            const particleCount = 50 * (timeLeft / duration)
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } })
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } })
        }, 250)

        return () => clearInterval(interval)
    }, [])

    if (!booking) {
        navigate("/food/user/dining")
        return null
    }

    const formattedDate = new Date(booking.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

    return (
        <AnimatedPage className="bg-white min-h-screen flex flex-col items-center justify-center p-6 pb-24">
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6"
            >
                <CheckCircle2 className="w-12 h-12 text-[#FE5502]" />
            </motion.div>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center space-y-2 mb-10"
            >
                <h1 className="text-3xl font-black text-gray-900">
                    {booking.status === "pending" ? "Booking Requested!" : "Seat Confirmed!"}
                </h1>
                <p className="text-gray-500 font-medium tracking-wide italic">
                    {booking.status === "pending" ? "Awaiting restaurant's approval" : "Your table is ready for you"}
                </p>
                <div className="pt-2">
                    <span className="bg-red-50 text-[#FE5502] px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-[#FE5502]/20">
                        BOOKING ID: {booking.bookingId}
                    </span>
                </div>
            </motion.div>

            {/* Ticket Card */}
            <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="w-full max-w-sm bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden shadow-xl shadow-slate-200"
            >
                <div className="p-6 space-y-6 relative">
                    {/* Circle cutouts for ticket look */}
                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border border-slate-100"></div>
                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border border-slate-100"></div>

                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 flex-shrink-0 p-1">
                            <img
                                src={booking.restaurant?.image || booking.restaurant?.profileImage?.url || ""}
                                className="w-full h-full object-cover rounded-xl"
                                alt="restaurant"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none'
                                }}
                            />
                        </div>
                        <div className="min-w-0">
                            <h2 className="font-black text-lg text-gray-900 truncate">{booking.restaurant?.name || "The Great Indian Restaurant"}</h2>
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate">
                                    {typeof booking.restaurant?.location === 'string'
                                        ? booking.restaurant.location
                                        : (booking.restaurant?.location?.formattedAddress || booking.restaurant?.location?.address || `${booking.restaurant?.location?.city || ''}${booking.restaurant?.location?.area ? ', ' + booking.restaurant.location.area : ''}`)}
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-6 border-y border-dashed border-slate-200">
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Date</p>
                            <div className="flex items-center gap-2 font-bold text-gray-800">
                                <Calendar className="w-4 h-4 text-red-500" />
                                <span>{formattedDate}</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Time</p>
                            <div className="flex items-center gap-2 font-bold text-gray-800">
                                <Clock className="w-4 h-4 text-red-500" />
                                <span>{booking.timeSlot}</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Guests</p>
                            <div className="flex items-center gap-2 font-bold text-gray-800">
                                <Users className="w-4 h-4 text-red-500" />
                                <span>{booking.guests} People</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Status</p>
                            <div className={`px-2 py-0.5 rounded-lg text-[10px] font-black w-fit uppercase ${
                                booking.status === "pending" 
                                    ? "bg-amber-100 text-amber-700 border border-amber-200" 
                                    : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                            }`}>
                                {booking.status || "PENDING"}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-indigo-600">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></div>
                            <span className="font-bold text-sm">10% Cashback with Tastizo Pay</span>
                        </div>
                        <Share2 className="w-5 h-5 cursor-pointer hover:scale-110 transition-transform" />
                    </div>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-12 w-full max-w-sm space-y-3"
            >
                <Button
                    onClick={() => navigate("/food/user/bookings")}
                    className="w-full h-14 bg-red-500 hover:bg-red-600 text-white font-bold text-lg rounded-2xl shadow-xl shadow-red-100 flex items-center justify-center gap-2"
                >
                    <List className="w-5 h-5" />
                    View My Bookings
                </Button>
                <Button
                    onClick={() => navigate("/food/user")}
                    variant="outline"
                    className="w-full h-14 bg-white border-2 border-slate-100 text-slate-600 font-bold text-lg rounded-2xl hover:bg-slate-50 flex items-center justify-center gap-2"
                >
                    <Home className="w-5 h-5" />
                    Go to Home
                </Button>
            </motion.div>

            <p className="fixed bottom-10 text-[10px] font-bold text-slate-300 uppercase tracking-widest px-10 text-center">
                Show this ticket at the restaurant for a smooth entry
            </p>
        </AnimatedPage>
    )
}
