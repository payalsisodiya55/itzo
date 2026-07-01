import { useState, useEffect, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import useRestaurantBackNavigation from "@food/hooks/useRestaurantBackNavigation"
import { ArrowLeft, MapPin, Navigation, Map as MapIcon } from "lucide-react"
import { Switch } from "@food/components/ui/switch"
import { toast } from "react-hot-toast"
import { Card, CardContent } from "@food/components/ui/card"
import { restaurantAPI } from "@food/api"

export default function LiveLocationControl() {
  const navigate = useNavigate()
  const goBack = useRestaurantBackNavigation()
  const [restaurantData, setRestaurantData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [liveTrackingEnabled, setLiveTrackingEnabled] = useState(false)
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false)
  const [currentLocation, setCurrentLocation] = useState(null)
  const watchIdRef = useRef(null)

  useEffect(() => {
    fetchRestaurantData()
    return () => {
      stopGPSWatch()
    }
  }, [])

  const fetchRestaurantData = async () => {
    try {
      setLoading(true)
      const response = await restaurantAPI.getCurrentRestaurant()
      const data = response?.data?.data?.restaurant || response?.data?.restaurant
      if (data) {
        setRestaurantData(data)
        setLiveTrackingEnabled(data.liveTrackingEnabled || false)
        if (data.currentLocation?.coordinates) {
          setCurrentLocation({
            longitude: data.currentLocation.coordinates[0],
            latitude: data.currentLocation.coordinates[1]
          })
        }
      }
    } catch (error) {
      if (error.code !== 'ERR_NETWORK' && error.code !== 'ECONNABORTED') {
        console.error("Error fetching restaurant data:", error)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleToggleTracking = async (enabled) => {
    try {
      setLiveTrackingEnabled(enabled)
      await restaurantAPI.updateLiveTrackingStatus(enabled)
      toast.success(enabled ? "Live tracking started" : "Live tracking stopped")
      
      if (enabled) {
        startGPSWatch()
      } else {
        stopGPSWatch()
      }
    } catch (error) {
      setLiveTrackingEnabled(!enabled)
      const errMsg = error.response?.data?.message || "Failed to update tracking status"
      toast.error(errMsg)
    }
  }

  const startGPSWatch = () => {
    if ("geolocation" in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setCurrentLocation({ latitude, longitude })
          updateLocationToBackend(latitude, longitude)
        },
        (error) => {
          console.error("Error watching location:", error)
          toast.error("Failed to get GPS location")
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      )
    } else {
      toast.error("Geolocation is not supported by your browser")
    }
  }

  const stopGPSWatch = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }

  const updateLocationToBackend = useCallback(async (lat, lng) => {
    if (isUpdatingLocation) return
    try {
      setIsUpdatingLocation(true)
      await restaurantAPI.updateLiveLocation(lat, lng)
    } catch (error) {
      const errMsg = error.response?.data?.message || "Failed to update location"
      toast.error(errMsg)
    } finally {
      setIsUpdatingLocation(false)
    }
  }, [isUpdatingLocation])

  const handleUpdateLocationManually = () => {
    if ("geolocation" in navigator) {
      toast.loading("Fetching location...", { id: "gps-fetch" })
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          toast.dismiss("gps-fetch")
          const { latitude, longitude } = position.coords
          setCurrentLocation({ latitude, longitude })
          toast.loading("Updating location...", { id: "gps-update" })
          try {
            await restaurantAPI.updateLiveLocation(latitude, longitude)
            toast.success("Location updated successfully", { id: "gps-update" })
          } catch (error) {
            const errMsg = error.response?.data?.message || "Failed to update location"
            toast.error(errMsg, { id: "gps-update" })
          }
        },
        (error) => {
          toast.dismiss("gps-fetch")
          console.error("Error getting location:", error)
          toast.error("Failed to get location")
        },
        { enableHighAccuracy: true }
      )
    } else {
      toast.error("Geolocation is not supported by your browser")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (restaurantData?.businessType !== "Street Food Vendor") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50 flex items-center gap-3">
          <button onClick={goBack} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 flex-1">Live Location</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <MapIcon className="w-16 h-16 text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Not Available</h2>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            Live location features are only available for Street Food Vendors. Your current business type is {restaurantData?.businessType || "Fixed Restaurant"}.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden pb-24 md:pb-6">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50 flex items-center gap-3 shadow-sm">
        <button onClick={goBack} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 flex-1">Live Location</h1>
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto mt-4">
        <Card className="bg-white border-none shadow-sm overflow-hidden rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${liveTrackingEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                  <h3 className="text-base font-bold text-gray-900">Live GPS Tracking</h3>
                </div>
                <p className="text-sm text-gray-500 leading-snug pr-4">
                  Automatically update your location as you move within your zone. 
                  Keep this on while moving to serve customers.
                </p>
              </div>
              <Switch
                checked={liveTrackingEnabled}
                onCheckedChange={handleToggleTracking}
                className="data-[state=checked]:bg-emerald-500 shrink-0 mt-1"
              />
            </div>
            
            {liveTrackingEnabled && (
              <div className="mt-4 p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-medium flex items-start gap-2 border border-emerald-100">
                <Navigation className="w-4 h-4 shrink-0 mt-0.5" />
                <p>Location tracking is active. Customers can see your real-time movement on the map.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-sm rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Current Position</h3>
                <p className="text-sm text-gray-500">
                  {currentLocation 
                    ? `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`
                    : "No location data available"}
                </p>
              </div>
            </div>

            <button
              onClick={handleUpdateLocationManually}
              disabled={liveTrackingEnabled || isUpdatingLocation}
              className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors shadow-sm shadow-orange-200"
            >
              Update Location Now
            </button>
            <p className="text-[11px] text-gray-400 text-center mt-3">
              {liveTrackingEnabled 
                ? "Manual updates are disabled while Live Tracking is on."
                : "Tap to pin your exact location manually when parked."}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
