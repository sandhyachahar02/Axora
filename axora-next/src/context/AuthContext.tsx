"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/supabase/client";

type AuthContextType = {
  userId: string | null;
  userEmail: string | null;
  fullName: string | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  userId: null, userEmail: null, fullName: null, loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        setUserEmail(session.user.email ?? null);
        const { data: profile } = await supabase
          .from("profiles").select("full_name")
          .eq("id", session.user.id).single();
        setFullName(profile?.full_name ?? null);
      }
      setLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
      setUserEmail(session?.user.email ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ userId, userEmail, fullName, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);