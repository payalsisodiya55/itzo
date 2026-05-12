import { Navigate, useLocation } from "react-router-dom"
import { hasModuleSession } from "@food/utils/auth"

export default function ProtectedRoute({ children }) {
  const location = useLocation()
  const isAuthenticated = hasModuleSession("admin")

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />
  }

  return children
}
