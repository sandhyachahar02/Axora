import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const { email, otp } = await req.json();

  if (!email || !otp) {
    return NextResponse.json({ error: "Email and OTP required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("otp_verifications")
    .select("*")
    .eq("email", email)
    .eq("otp", otp)
    .eq("verified", false)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
  }

  if (new Date() > new Date(data.expires_at)) {
    return NextResponse.json({ error: "OTP expired. Please request a new one." }, { status: 400 });
  }

  await supabase
    .from("otp_verifications")
    .update({ verified: true })
    .eq("id", data.id);

  return NextResponse.json({ success: true });
} 
