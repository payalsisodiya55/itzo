import React, { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from "react-router-dom"
import { Phone, Lock, ArrowRight, ShieldCheck, Loader2, UserRound, Mail, ChevronDown, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { authAPI, userAPI } from "@food/api"
import { isModuleAuthenticated, setAuthData } from "@food/utils/auth"
import { loadBusinessSettings, getCachedSettings, getAppLogo, getCompanyName, setAppType } from "@common/utils/businessSettings"

import loginBanner from "@food/assets/loginbanner.png"
import foodDiscovery from "@food/assets/food_discovery_bg.png"
import offerBanner from "@food/assets/offerpagebanner.png"
import gourmetBanner from "@food/assets/groumetpagebanner.png"
import collectionsBanner from "@food/assets/collectionspagebanner.png"

const defaultBackgroundImages = [
  loginBanner,
  foodDiscovery,
  offerBanner,
  gourmetBanner,
  collectionsBanner
];

export default function UnifiedOTPFastLogin() {
  const [backgroundImages, setBackgroundImages] = useState(defaultBackgroundImages)
  const [currentBg, setCurrentBg] = useState(0)
  const [backgroundVideo, setBackgroundVideo] = useState(null)

  useEffect(() => {
    if (backgroundImages.length === 0) return;
    const interval = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % backgroundImages.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [backgroundImages.length])
  const RESEND_COOLDOWN_SECONDS = 60
  const [phoneNumber, setPhoneNumber] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const [showNameInput, setShowNameInput] = useState(false)
  const [name, setName] = useState("")
  const [nameError, setNameError] = useState("")
  const [logoUrl, setLogoUrl] = useState(() => getAppLogo('user'))
  const [companyName, setCompanyName] = useState(() => getCompanyName())
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setAppType('user')
        const settings = await loadBusinessSettings()
        if (settings) {
          setLogoUrl(getAppLogo('user'))
          setCompanyName(getCompanyName())
          
          const dynamicBanners = [
            settings.userLoginBanner1?.url,
            settings.userLoginBanner2?.url,
            settings.userLoginBanner3?.url,
            settings.userLoginBanner4?.url,
            settings.userLoginBanner5?.url
          ].filter(Boolean);
          
          if (dynamicBanners.length > 0) {
            setBackgroundImages(dynamicBanners);
          }
          if (settings.userLoginVideo?.url) {
            setBackgroundVideo(settings.userLoginVideo.url);
          }
        }
      } catch (error) {}
    }
    fetchSettings()
  }, [])
  const searchParams = new URLSearchParams(location.search)
  const referralCode = searchParams.get("ref") || ""
  
  const submitting = useRef(false)
  const redirectTo = typeof location.state?.redirectTo === "string" && location.state.redirectTo.trim()
    ? location.state.redirectTo.trim()
    : "/food/user"

  useEffect(() => {
    if (!isModuleAuthenticated("user")) return
    navigate(redirectTo, { replace: true })
  }, [navigate, redirectTo])

  const clearNameFlow = () => {
    setShowNameInput(false)
    setName("")
    setNameError("")
  }

  const normalizedPhone = () => {
    const digits = String(phoneNumber).replace(/\D/g, "").slice(-15)
    return digits.length >= 8 ? digits : ""
  }

  const handleSendOTP = async (e) => {
    e.preventDefault()
    const phone = normalizedPhone()
    if (phone.length < 8) {
      toast.error("Please enter a valid phone number (at least 8 digits)")
      return
    }
    if (submitting.current) return
    submitting.current = true
    setLoading(true)
    try {
      clearNameFlow()
      await authAPI.sendOTP(phoneNumber, "login", null)
      setOtpSent(true)
      setOtp("")
      setStep(2)
      setResendTimer(RESEND_COOLDOWN_SECONDS)
      toast.success("OTP sent! Check your phone.")
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to send OTP."
      toast.error(msg)
    } finally {
      setLoading(false)
      submitting.current = false
    }
  }

  const handleResendOTP = async () => {
    const phone = normalizedPhone()
    if (phone.length < 8) {
      toast.error("Please enter a valid phone number (at least 8 digits)")
      return
    }
    if (resendTimer > 0 || submitting.current) return
    submitting.current = true
    setLoading(true)
    try {
      clearNameFlow()
      await authAPI.sendOTP(phoneNumber, "login", null)
      setOtp("")
      setOtpSent(true)
      setResendTimer(RESEND_COOLDOWN_SECONDS)
      toast.success("OTP resent successfully.")
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to resend OTP."
      toast.error(msg)
    } finally {
      setLoading(false)
      submitting.current = false
    }
  }

  const handleEditNumber = () => {
    setStep(1)
    setOtp("")
    setResendTimer(0)
    clearNameFlow()
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    const phone = normalizedPhone()
    const otpDigits = String(otp).replace(/\D/g, "").slice(0, 4)
    if (otpDigits.length !== 4) {
      toast.error("Please enter the 4-digit OTP")
      return
    }
    if (submitting.current) return
    submitting.current = true
    setLoading(true)
    try {
      // Try to get FCM token before verifying OTP
      let fcmToken = null;
      let platform = "web";
      try {
        if (typeof window !== "undefined") {
          if (window.flutter_inappwebview) {
            platform = "mobile";
            const handlerNames = ["getFcmToken", "getFCMToken", "getPushToken", "getFirebaseToken"];
            for (const handlerName of handlerNames) {
              try {
                const t = await window.flutter_inappwebview.callHandler(handlerName, { module: "user" });
                if (t && typeof t === "string" && t.length > 20) {
                  fcmToken = t.trim();
                  break;
                }
              } catch (e) {}
            }
          } else {
            fcmToken = localStorage.getItem("fcm_web_registered_token_user") || null;
          }
        }
      } catch (e) {
        console.warn("Failed to get FCM token during login", e);
      }

      const response = await authAPI.verifyOTP(
        phoneNumber, 
        otpDigits, 
        "login", 
        null, 
        null, 
        "user", 
        null, 
        referralCode, 
        fcmToken, 
        platform
      )
      const data = response?.data?.data || response?.data || {}
      const accessToken = data.accessToken
      const refreshToken = data.refreshToken || null
      const user = data.user

      if (!accessToken || !user) {
        throw new Error("Invalid response from server")
      }

      const hasName =
        user.name &&
        String(user.name).trim().length > 0 &&
        String(user.name).toLowerCase() !== "null"
      const needsName = data.isNewUser === true || !hasName

      if (needsName) {
        setAuthData("user", accessToken, user, refreshToken)
        window.dispatchEvent(new Event("userAuthChanged"))
        setShowNameInput(true)
        setLoading(false)
        submitting.current = false
        return
      }

      setAuthData("user", accessToken, user, refreshToken)
      window.dispatchEvent(new Event("userAuthChanged"))
      toast.success("Login successful!")
      navigate(redirectTo, { replace: true })
    } catch (err) {
      const status = err?.response?.status
      let msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Invalid OTP. Please try again."
      if (status === 401) {
        if (/deactivat(ed|e)/i.test(String(msg))) {
          msg = "Your account is deactivated. Please contact support."
        } else {
          msg = "Invalid or expired code, or account not active."
        }
      }
      toast.error(msg)
    } finally {
      setLoading(false)
      submitting.current = false
    }
  }

  const handleSubmitName = async (e) => {
    e.preventDefault()

    const trimmedName = name.trim()
    if (!trimmedName) {
      setNameError("Please enter your name")
      return
    }

    if (trimmedName.length < 2) {
      setNameError("Name must be at least 2 characters")
      return
    }

    if (submitting.current) return
    submitting.current = true
    setLoading(true)
    setNameError("")

    try {
      const response = await userAPI.updateProfile({ name: trimmedName })
      const updatedUser =
        response?.data?.data?.user ||
        response?.data?.user ||
        response?.data?.data ||
        response?.data
      const storedToken = localStorage.getItem("user_accessToken") || localStorage.getItem("accessToken")
      const storedRefreshToken = localStorage.getItem("user_refreshToken") || null

      if (!storedToken || !updatedUser) {
        throw new Error("Invalid response from server")
      }

      setAuthData("user", storedToken, updatedUser, storedRefreshToken)
      window.dispatchEvent(new Event("userAuthChanged"))
      clearNameFlow()
      toast.success("Profile saved successfully!")
      navigate(redirectTo, { replace: true })
    } catch (err) {
      const status = err?.response?.status
      let msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Failed to save your name."
      if (status === 401) {
        msg = "Invalid or expired code, or account not active."
      }
      toast.error(msg)
    } finally {
      setLoading(false)
      submitting.current = false
    }
  }

  useEffect(() => {
    if (step !== 2 || resendTimer <= 0) return
    const intervalId = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(intervalId)
  }, [step, resendTimer])

  const formatResendTimer = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  // Service images (served from public folder)
  const foodIcon = "/super-app/food.png"

  const groceryIcon = "/super-app/grocery.png"


  const services = [
    { id: 'food', name: 'Food Delivery', icon: foodIcon, label: 'Zomato', color: 'bg-red-500', shadow: 'shadow-red-200' },

    { id: 'grocery', name: 'Quick Commerce', icon: groceryIcon, label: 'Blinkit', color: 'bg-green-500', shadow: 'shadow-green-200' },

  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex flex-col md:flex-row md:items-center md:justify-center relative transition-colors duration-1000 md:p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 z-0 hidden md:block opacity-30 bg-black">
        {backgroundVideo ? (
           <video 
              src={backgroundVideo} 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="absolute inset-0 w-full h-full object-cover blur-sm"
           />
        ) : (
           <AnimatePresence mode="popLayout">
             {backgroundImages.map((img, index) => (
               index === currentBg && (
                 <motion.div
                   key={index}
                   initial={{ opacity: 0, scale: 1.05 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 1.05 }}
                   transition={{ duration: 1.5, ease: "easeInOut" }}
                   className="absolute inset-0 w-full h-full"
                 >
                   <img src={img} alt={`background ${index}`} className="w-full h-full object-cover blur-sm" />
                 </motion.div>
               )
             ))}
           </AnimatePresence>
        )}
        <div className="absolute inset-0 bg-white/70 dark:bg-black/90 z-10" />
      </div>

      {/* Banner (Mobile Only) */}
      <div className="absolute top-0 left-0 right-0 h-[50vh] md:hidden z-0 bg-black">
        {backgroundVideo ? (
           <video 
              src={backgroundVideo} 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="absolute inset-0 w-full h-full object-cover"
           />
        ) : (
           <AnimatePresence mode="popLayout">
             {backgroundImages.map((img, index) => (
               index === currentBg && (
                 <motion.div
                   key={index}
                   initial={{ opacity: 0, scale: 1.05 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 1.05 }}
                   transition={{ duration: 1.5, ease: "easeInOut" }}
                   className="absolute inset-0 w-full h-full"
                 >
                   <img src={img} alt={`Slide ${index + 1}`} className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                 </motion.div>
               )
             ))}
           </AnimatePresence>
        )}
        {backgroundVideo && <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />}
      </div>

      <div className="w-full max-w-[420px] bg-white dark:bg-neutral-900 rounded-none md:rounded-2xl shadow-[0_-8px_30px_rgb(0,0,0,0.12)] md:shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] relative z-20 border-t md:border border-gray-100 dark:border-neutral-800 mt-[50vh] md:mt-0 flex-1 md:flex-initial flex flex-col">
        <div className="p-6 md:p-8 space-y-6 flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate(-1)} 
                className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors text-gray-600 dark:text-gray-300"
                aria-label="Go back"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-100 tracking-tight">
                Login
              </h2>
            </div>
          </div>

          <form onSubmit={showNameInput ? handleSubmitName : step === 1 ? handleSendOTP : handleVerifyOTP} className="space-y-4">
            {step === 1 ? (
              <div className="space-y-1">
                <div className="relative flex items-center group">
                  <div className="flex items-center justify-center gap-1.5 px-3 h-12 md:h-14 border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-700 dark:text-gray-300 rounded-xl rounded-r-none font-medium border-r-0 group-focus-within:border-[#FE5502]">
                    <img src="https://flagcdn.com/w20/in.png" alt="India" className="w-5 h-auto rounded-[2px]" />
                    <span>+91</span>
                  </div>
                  <div className="h-8 w-px bg-gray-300 dark:bg-neutral-700 absolute left-[85px] z-10 group-focus-within:bg-[#FE5502]/50 transition-colors" />
                  <input
                    type="tel"
                    required
                    autoFocus
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    maxLength={10}
                    className="flex-1 h-12 md:h-14 w-full text-lg bg-white dark:bg-neutral-900 text-gray-900 dark:text-white border border-gray-300 dark:border-neutral-700 rounded-xl rounded-l-none pl-4 focus:ring-0 focus:border-[#FE5502] focus:outline-none transition-all shadow-none placeholder:text-gray-400"
                    placeholder="Phone"
                  />
                </div>
              </div>
            ) : showNameInput ? (
              <div className="space-y-6">
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                  <div className="w-10 h-10 bg-[#FE5502]/10 rounded-full flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-[#FE5502]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest leading-none mb-1">Verified Number</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">+91 {phoneNumber}</p>
                  </div>
                  <button type="button" onClick={handleEditNumber} className="text-xs text-[#FE5502] font-semibold hover:underline cursor-pointer">
                    Change
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserRound className="w-5 h-5 text-gray-400 group-focus-within:text-[#FE5502] transition-colors" />
                    </div>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value)
                        if (nameError) setNameError("")
                      }}
                      className={`block w-full pl-10 pr-4 py-3 h-12 md:h-14 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white border border-gray-300 dark:border-neutral-700 rounded-xl focus:border-[#FE5502] focus:outline-none transition-all placeholder:text-gray-400 text-lg ${nameError ? "border-red-500" : ""}`}
                      placeholder="Your full name"
                    />
                  </div>

                  {nameError ? (
                    <p className="text-xs font-semibold text-red-500 text-center">{nameError}</p>
                  ) : (
                    <p className="text-[11px] text-gray-400 text-center leading-relaxed">
                      Please enter your name so we can save it to your profile.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                    <div className="w-10 h-10 bg-[#FE5502]/10 rounded-full flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-[#FE5502]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest leading-none mb-1">Sent to</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">+91 {phoneNumber}</p>
                    </div>
                    <button type="button" onClick={handleEditNumber} className="text-xs text-[#FE5502] font-semibold hover:underline cursor-pointer">Edit</button>
                  </div>

                  <div className="flex justify-center gap-3 mt-4">
                    {[0, 1, 2, 3].map((index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        type="tel"
                        inputMode="numeric"
                        required
                        autoFocus={index === 0}
                        value={otp[index] || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(-1);
                          if (!val) return;
                          const newOtp = otp.split("");
                          newOtp[index] = val;
                          const combined = newOtp.join("").slice(0, 4);
                          setOtp(combined);
                          
                          if (index < 3 && val) {
                            document.getElementById(`otp-${index + 1}`)?.focus();
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace") {
                            if (!otp[index] && index > 0) {
                              document.getElementById(`otp-${index - 1}`)?.focus();
                            } else {
                              const newOtp = otp.split("");
                              newOtp[index] = "";
                              setOtp(newOtp.join(""));
                            }
                          }
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
                          if (pasteData) {
                            setOtp(pasteData);
                            document.getElementById(`otp-${Math.min(pasteData.length, 3)}`)?.focus();
                          }
                        }}
                        className="w-12 h-14 md:w-14 md:h-16 text-center text-xl md:text-2xl font-semibold bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 focus:border-[#FE5502] focus:outline-none rounded-xl transition-all text-gray-900 dark:text-white"
                        placeholder="-"
                      />
                    ))}
                  </div>
                  <div className="text-center mt-4">
                    {resendTimer > 0 ? (
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Resend OTP in {formatResendTimer(resendTimer)}
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOTP}
                        disabled={loading}
                        className="text-xs font-semibold text-[#FE5502] hover:underline disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full h-12 md:h-14 mt-2 bg-[#FE5502] hover:bg-[#E04B00] text-white font-semibold text-base md:text-lg rounded-xl transition-all hover:shadow-lg active:scale-[0.98] ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Please wait...
                </div>
              ) : (
                step === 1 ? "Send One Time Password" : showNameInput ? "Save Name & Continue" : "Verify Code"
              )}
            </button>
          </form>



          <div className="text-center text-[11px] md:text-xs text-gray-400 dark:text-gray-500 pt-4 pb-2 border-t border-gray-100 dark:border-neutral-800 mt-6">
            <p className="mb-2">By continuing, you agree to our</p>
            <div className="flex justify-center gap-1.5 flex-wrap">
              <Link to="/profile/terms" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                Terms of Service
              </Link>
              <span>•</span>
              <Link to="/profile/privacy" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                Privacy Policy
              </Link>
              <span>•</span>
              <Link to="/profile/refund" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                Content Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
