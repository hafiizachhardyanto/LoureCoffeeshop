import { NextRequest, NextResponse } from "next/server";
import { db, doc, setDoc, Timestamp } from "@/lib/firebase";
import { generateOTP, sendOTP, storeOTP } from "@/lib/emailjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, email } = body;

    if (!name || !phone || !email) {
      return NextResponse.json(
        { success: false, message: "Semua field harus diisi" },
        { status: 400 }
      );
    }

    const userId = `user_${Timestamp.now().seconds}_${Math.random().toString(36).substring(2, 9)}`;
    const otp = generateOTP();

    const userData = {
      id: userId,
      name,
      phone,
      email,
      role: "user",
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      isVerified: false,
    };

    await setDoc(doc(db, "users", userId), userData);
    await setDoc(doc(db, "otp_verifications", userId), {
      otp,
      email,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });

    storeOTP(email, otp);
    const emailSent = await sendOTP({ email, name, otp });

    if (!emailSent) {
      return NextResponse.json(
        { success: false, message: "Gagal mengirim OTP" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "OTP telah dikirim ke email Anda",
      userId,
    });
  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}