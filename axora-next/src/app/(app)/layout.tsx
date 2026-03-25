"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/supabase/client";
import { Sidebar } from "@/components/layout/Sidebar";
import { AuthProvider } from "@/context/AuthContext";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/login");
      } else {
        setAuthorized(true);
      }
    });
  }, [router]);

  if (!authorized) return null;

  return (
    <AuthProvider>
      <div className="flex min-h-screen bg-bg">
        <Sidebar />
        <main className="ml-[220px] flex-1 p-8">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
