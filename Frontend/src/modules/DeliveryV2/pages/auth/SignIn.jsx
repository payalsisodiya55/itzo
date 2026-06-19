import { useState, useEffect } from "react"
import { useNavigate, Link, useLocation } from "react-router-dom"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@food/components/ui/select"
import { deliveryAPI } from "@food/api"
import { clearModuleAuth } from "@food/utils/auth"
import { useCompanyName } from "@food/hooks/useCompanyName"
import {
  loadBusinessSettings,
  getCachedSettings,
  getAppFavicon,
  updateBrowserFavicon,
} from "@common/utils/businessSettings"
const debugLog = (...args) => {}
const debugWarn = (...args) => {}
const debugError = (...args) => {}


// Common country codes
const countryCodes = [
  { code: "+91", country: "IN", flag: "🇮🇳" },
]

export default function DeliverySignIn() {
  const companyName = useCompanyName()
  const navigate = useNavigate()
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const referralCode = searchParams.get("ref") || ""
  const [formData, setFormData] = useState({
    phone: "",
    countryCode: "+91",
  })

  // Pre-fill form from sessionStorage if data exists (e.g., when coming back from OTP)
  useEffect(() => {
    const stored = sessionStorage.getItem("deliveryAuthData")
    if (stored) {
      try {
        const data = JSON.parse(stored)
        if (data.phone) {
          // Extract digits after +91
          const phoneDigits = data.phone.replace("+91", "").trim()
          setFormData(prev => ({
            ...prev,
            phone: phoneDigits
          }))
        }
      } catch (err) {
        debugError("Error parsing stored auth data:", err)
      }
    }
  }, [])

  useEffect(() => {
    const applyDeliveryBranding = () => {
      const deliveryFavicon = getAppFavicon("delivery")
      if (deliveryFavicon) {
        updateBrowserFavicon(deliveryFavicon)
      }
    }

    const cached = getCachedSettings()
    if (cached) {
      applyDeliveryBranding()
    } else {
      loadBusinessSettings().then(() => {
        applyDeliveryBranding()
      })
    }

    const handleSettingsUpdate = (event) => {
      const settings = event?.detail
      if (!settings) return
      const favicon = settings.deliveryFavicon?.url || settings.favicon?.url || ""
      if (favicon) {
        updateBrowserFavicon(favicon)
      }
    }

    window.addEventListener("businessSettingsUpdated", handleSettingsUpdate)
    return () => {
      window.removeEventListener("businessSettingsUpdated", handleSettingsUpdate)
    }
  }, [])
  const [error, setError] = useState("")
  const [isSending, setIsSending] = useState(false)

  // Get selected country details dynamically
  const selectedCountry = countryCodes.find(c => c.code === formData.countryCode) || countryCodes[2] // Default to India (+91)

  const validatePhone = (phone, countryCode) => {
    if (!phone || phone.trim() === "") {
      return "Phone number is required"
    }

    const digitsOnly = phone.replace(/\D/g, "")

    if (digitsOnly.length < 7) {
      return "Phone number must be at least 7 digits"
    }

    // India-specific validation
    // India-specific validation (Fixed to +91 only)
    if (digitsOnly.length !== 10) {
      return "Phone number must be exactly 10 digits"
    }

    return ""
  }

  const handleSendOTP = async () => {
    setError("")

    const phoneError = validatePhone(formData.phone, formData.countryCode)
    if (phoneError) {
      setError(phoneError)
      return
    }

    const fullPhone = `${formData.countryCode} ${formData.phone}`.trim()

    try {
      setIsSending(true)
      // Start a fresh login flow and prevent stale-token auto redirects.
      clearModuleAuth("delivery")

      // Call backend to send OTP for delivery login
      await deliveryAPI.sendOTP(fullPhone, "login")

      // Store auth data in sessionStorage for OTP page
      const authData = {
        method: "phone",
        phone: fullPhone,
        isSignUp: false,
        purpose: "login",
        module: "delivery",
      }
      sessionStorage.setItem("deliveryAuthData", JSON.stringify(authData))
      
      if (referralCode) {
        try {
          const existingSignupDetails = JSON.parse(sessionStorage.getItem("deliverySignupDetails") || "{}")
          sessionStorage.setItem("deliverySignupDetails", JSON.stringify({
            ...existingSignupDetails,
            ref: referralCode
          }))
        } catch (e) {}
      }

      // Navigate to OTP page
      navigate("/food/delivery/otp")
    } catch (err) {
      debugError("Send OTP Error:", err)
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to send OTP. Please try again."
      setError(message)
    } finally {
      setIsSending(false)
    }
  }

  const handlePhoneChange = (e) => {
    // Only allow digits and limit to 10 digits
    const value = e.target.value.replace(/\D/g, "").slice(0, 10)
    setFormData({
      ...formData,
      phone: value,
    })
  }

  const handleCountryCodeChange = (value) => {
    setFormData({
      ...formData,
      countryCode: value,
    })
  }

  const isValid = !validatePhone(formData.phone, formData.countryCode)

  return (
    <div className="min-h-[100dvh] bg-[#111] lg:bg-slate-50 flex flex-col lg:flex-row overflow-y-auto overscroll-contain font-sans">
      
      {/* Hero Image Section (Fully Visible) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#111] pt-6 pb-12 lg:py-0 shrink-0">
        <img 
          src="/delivery-promo.png" 
          alt="ITZO Uniform" 
          className="w-full max-w-[600px] h-auto object-contain drop-shadow-2xl px-4 lg:px-8"
        />
      </div>

      {/* Form Section */}
      <div className="w-full lg:w-1/2 flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-8 sm:py-16 bg-white rounded-t-[40px] lg:rounded-none lg:rounded-l-[40px] shadow-[0_-20px_40px_rgba(0,0,0,0.3)] lg:shadow-[-20px_0_40px_rgba(0,0,0,0.1)] -mt-12 lg:mt-0 relative z-10">
        
        <div className="w-full max-w-[400px] flex flex-col items-center flex-1 justify-between">
          
          <div className="w-full flex flex-col items-center">
            {/* Top Section - Logo and Badge */}
            <div className="flex flex-col items-center pb-6 lg:pb-8">
              <div className="w-20 h-20 sm:w-28 sm:h-28 bg-white rounded-full shadow-xl flex items-center justify-center border-4 border-slate-50 mb-3 -mt-16 lg:-mt-0 lg:mb-6 overflow-hidden p-2.5">
                <img 
                  src="/itzo-logo-transparent.png" 
                  alt="Itzo Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl text-black font-extrabold italic lowercase tracking-tight">
                  {companyName.toLowerCase()}
                </h1>
              </div>

              {/* DELIVERY Badge */}
              <div className="bg-orange-500 px-5 py-1.5 rounded-xl mt-2 shadow-md">
                <span className="text-white font-bold text-xs sm:text-sm uppercase tracking-widest">
                  DELIVERY PARTNER
                </span>
              </div>
            </div>

            <div className="w-full space-y-5">
              {/* Sign In Heading */}
              <div className="space-y-1 text-center pb-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Welcome Aboard
                </h2>
                <p className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest">
                  Login to continue
                </p>
              </div>

            {/* Mobile Number Input */}
            <div className="space-y-3 w-full">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Registered Mobile Number</label>
              
              <div className="flex items-center gap-2 h-16 bg-slate-50 border border-slate-100 rounded-[32px] px-6 focus-within:border-[#FE5502]/30 focus-within:ring-4 focus-within:ring-[#FE5502]/5 transition-all overflow-hidden">
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="font-bold text-slate-900 text-lg">🇮🇳 +91</span>
                </div>
                
                <div className="w-[1px] h-6 bg-slate-200 ml-2" />

                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="Mobile number"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  autoComplete="off"
                  autoFocus={false}
                  className="min-w-0 flex-1 h-12 bg-transparent border-0 outline-none ring-0 shadow-none focus:border-0 focus:outline-none focus:ring-0 focus:shadow-none text-left text-lg font-bold leading-none tracking-[0.02em] text-slate-900 placeholder-slate-300 caret-[#FE5502] px-2"
                />
              </div>

              {error && (
                <p className="text-[#FE5502] text-xs font-bold italic ml-4 animate-bounce">
                  {error}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section - Continue Button and Terms */}
        <div className="w-full mt-auto pt-6 pb-2">
            <div className="w-full space-y-5">
              {/* Continue Button */}
              <button
                onClick={handleSendOTP}
                disabled={!isValid || isSending}
                className={`w-full h-14 sm:h-16 rounded-[32px] font-black text-base sm:text-lg tracking-widest uppercase transition-all duration-300 ${
                  isValid && !isSending
                    ? "bg-[#FE5502] hover:bg-[#E64D02] text-white shadow-lg shadow-[#FE5502]/20 transform active:scale-[0.98]"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                {isSending ? "Sending OTP..." : "Continue"}
              </button>

              {/* Terms and Conditions */}
              <div className="text-center">
                <p className="text-slate-400 text-xs font-medium">
                  By logging in, you agree to our <br />
                  <Link to="/food/delivery/terms" className="text-[#FE5502] font-bold hover:underline">
                    Terms & Conditions
                  </Link>
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}


