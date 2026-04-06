import { NextRequest, NextResponse } from "next/server";
import { db, doc, getDoc, updateDoc, deleteField } from "@/lib/firebase";
import { verifyOTP } from "@/lib/emailjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, otp } = body;

    if (!userId || !email || !otp) {
      return NextResponse.json(
        { success: false, message: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    const userDoc = await getDoc(doc(db, "users", userId));
    
    if (!userDoc.exists()) {
      return NextResponse.json(
        { success: false, message: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const now = new Date();
    const otpExpiresAt = new Date(userData.otpExpiresAt);

    if (now > otpExpiresAt) {
      return NextResponse.json(
        { success: false, message: "OTP sudah kadaluarsa" },
        { status: 400 }
      );
    }

    const isValid = verifyOTP(email, otp) || userData.tempOTP === otp;

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "OTP salah" },
        { status: 400 }
      );
    }

    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    await updateDoc(doc(db, "users", userId), {
      lastLoginAt: new Date().toISOString(),
      sessionToken,
      tempOTP: deleteField(),
      otpExpiresAt: deleteField(),
    });

    return NextResponse.json({
      success: true,
      message: "Login berhasil",
      userId,
      role: userData.role,
      name: userData.name,
      phone: userData.phone,
      email: userData.email,
      sessionToken,
    });
  } catch (error) {
    console.error("Verify Login Error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}