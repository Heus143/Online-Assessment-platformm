import { Navigate } from "react-router-dom";
import { useAuth, AppRole } from "@/hooks/useAuth";

const ProtectedRoute = ({
  children,
  requireRole,
}: {
  children: JSX.Element;
  requireRole?: AppRole;
}) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (requireRole && role && role !== requireRole) {
    return <Navigate to={role === "teacher" ? "/teacher" : "/student"} replace />;
  }
  return children;
};

export default ProtectedRoute;