"use client";
import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/axios";
import { Spinner } from "./ui/spinner";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const verifyUser = async () => {
      try {
        const res = await api.get("/auth/verify", {
          withCredentials: true, // ✅ مهم لإرسال الكوكي
        });
        if (res.status === 200) {
          setAuthorized(true);
        } else {
          router.push("/login");
        }
      } catch (err) {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    verifyUser();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600">
        <Spinner />
      </div>
    );
  }

  if (!authorized) return null; // المستخدم غير مصرح له

  return <>{children}</>;
}
