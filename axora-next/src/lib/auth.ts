import { supabase } from "@/supabase/client";

export const getUser = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.user || null;
};