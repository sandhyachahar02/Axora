import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // Delete old OTPs for this email
  await supabase.from("otp_verifications").delete().eq("email", email);

  // Store new OTP
  const { error: dbError } = await supabase.from("otp_verifications").insert({
    email,
    otp,
    expires_at: expiresAt.toISOString(),
    verified: false,
  });

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  // Send email via Gmail
  try {
    await transporter.sendMail({
      from: `"Axora" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Your Axora verification code",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; background: #050505; color: #fff; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-flex; width: 52px; height: 52px; background: linear-gradient(135deg, #635BFF, #3B82F6); border-radius: 14px; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 16px;">✦</div>
            <h1 style="font-size: 24px; font-weight: 700; margin: 0; color: #fff;">Verify your email</h1>
            <p style="color: rgba(230,230,230,0.5); margin-top: 8px; font-size: 14px;">Enter this code in Axora to verify your account</p>
          </div>
          <div style="background: rgba(99,91,255,0.15); border: 1px solid rgba(99,91,255,0.35); border-radius: 14px; padding: 28px; text-align: center; margin-bottom: 24px;">
            <p style="font-size: 48px; font-weight: 800; letter-spacing: 12px; color: #fff; margin: 0; font-family: monospace;">${otp}</p>
            <p style="color: rgba(230,230,230,0.4); font-size: 12px; margin-top: 12px;">⏱ Expires in 10 minutes</p>
          </div>
          <p style="color: rgba(230,230,230,0.3); font-size: 12px; text-align: center; line-height: 1.6;">
            If you didn't request this code, you can safely ignore this email.<br/>
            This code can only be used once.
          </p>
          <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.08); text-align: center;">
            <p style="color: rgba(230,230,230,0.2); font-size: 11px;">Axora — AI-Powered Collaboration Platform</p>
          </div>
        </div>
      `,
    });
  } catch (emailError: unknown) {
    const message = emailError instanceof Error ? emailError.message : "Failed to send email";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}