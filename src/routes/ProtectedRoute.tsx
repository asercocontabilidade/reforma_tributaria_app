import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute() {
  const { token, isActive } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (!isActive) return <Navigate to="/login?blocked=1" replace />;
  return <Outlet />;
}
