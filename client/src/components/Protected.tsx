import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { api } from "@/lib/api";
import { Spinner } from "./ui/spinner";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/auth/verify", { withCredentials: true });
        if (res.status === 200) setAuthorized(true);
        else navigate({ to: "/login" });
      } catch {
        navigate({ to: "/login" });
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground">
        <Spinner />
      </div>
    );
  }
  if (!authorized) return null;
  return <>{children}</>;
}
