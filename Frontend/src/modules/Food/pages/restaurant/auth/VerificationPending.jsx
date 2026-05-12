import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Clock3, ShieldCheck } from "lucide-react"
import { Button } from "@food/components/ui/button"
import { useCompanyName } from "@food/hooks/useCompanyName"
import { restaurantAPI } from "@food/api"
import {
  clearRestaurantPendingPhone,
  getModuleToken,
  getRestaurantPendingPhone,
} from "@food/utils/auth"

export default function VerificationPending() {
  const companyName = useCompanyName()
  const navigate = useNavigate()
  const location = useLocation()
  const [checkingStatus, setCheckingStatus] = useState(true)

  const pendingPhone = useMemo(() => {
    return (
      location.state?.phone ||
      getRestaurantPendingPhone() ||
      ""
    )
  }, [location.state?.phone])

  useEffect(() => {
    let cancelled = false

    const checkApprovalStatus = async () => {
      const token = getModuleToken("restaurant")
      if (!token) {
        if (!cancelled) setCheckingStatus(false)
        return
      }

      try {
        const response = await restaurantAPI.getCurrentRestaurant()
        const restaurant =
          response?.data?.data?.restaurant ||
          response?.data?.restaurant ||
          response?.data?.data?.user ||
          response?.data?.user

        if (cancelled) return

        if (String(restaurant?.status || "").toLowerCase() === "approved") {
          clearRestaurantPendingPhone()
          navigate("/food/restaurant", { replace: true })
          return
        }
      } catch (_) {
        // Keep the pending screen visible if the status check fails.
      } finally {
        if (!cancelled) setCheckingStatus(false)
      }
    }

    checkApprovalStatus()

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        checkApprovalStatus()
      }
    }

    window.addEventListener("focus", handleVisibilityOrFocus)
    document.addEventListener("visibilitychange", handleVisibilityOrFocus)

    return () => {
      cancelled = true
      window.removeEventListener("focus", handleVisibilityOrFocus)
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus)
    }
  }, [navigate])

  return (
    <div className="min-h-screen bg-[#f8fafc] px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-md flex-col justify-center">
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <div className="mb-6 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <Clock3 className="h-8 w-8" />
            </div>
          </div>

          <div className="mb-6 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.32em] text-amber-600">
              Verification Pending
            </p>
            <h1 className="text-3xl font-extrabold text-slate-950">
              Your restaurant is under review
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {companyName} received your onboarding details successfully. Our team will verify your restaurant and activate your dashboard once approval is complete.
            </p>
            {checkingStatus ? (
              <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                Checking latest approval status...
              </p>
            ) : null}
          </div>

          <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-600" />
              <div className="text-sm text-slate-700">
                <p className="font-semibold text-slate-900">What happens next</p>
                <p className="mt-1">We will notify you once the verification is approved.</p>
                {pendingPhone ? (
                  <p className="mt-2 text-slate-500">
                    Registered phone: <span className="font-medium text-slate-700">{pendingPhone}</span>
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              className="h-12 w-full rounded-xl bg-blue-600 text-base font-semibold hover:bg-blue-700"
              onClick={() => {
                clearRestaurantPendingPhone()
                navigate("/food/restaurant/login", { replace: true })
              }}
            >
              Back to login
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
