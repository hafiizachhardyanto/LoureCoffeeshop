import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import crypto from "crypto";

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

    const otpDocRef = doc(db, "otp", email);
    const otpDoc = await getDoc(otpDocRef);

    if (!otpDoc.exists()) {
      return NextResponse.json(
        { success: false, message: "OTP tidak valid atau sudah kadaluarsa" },
        { status: 400 }
      );
    }

    const otpData = otpDoc.data();

    if (otpData.attempts >= 3) {
      await deleteDoc(otpDocRef);
      return NextResponse.json(
        { success: false, message: "Terlalu banyak percobaan" },
        { status: 400 }
      );
    }

    if (otpData.otp !== otp) {
      await updateDoc(otpDocRef, {
        attempts: otpData.attempts + 1,
      });
      return NextResponse.json(
        { success: false, message: "OTP salah" },
        { status: 400 }
      );
    }

    if (new Date() > otpData.otpExpiry.toDate()) {
      await deleteDoc(otpDocRef);
      return NextResponse.json(
        { success: false, message: "OTP sudah kadaluarsa" },
        { status: 400 }
      );
    }

    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return NextResponse.json(
        { success: false, message: "User tidak ditemukan" },
        { status: 400 }
      );
    }

    const userData = userDoc.data();

    await updateDoc(userDocRef, {
      otp: null,
      otpExpiry: null,
      lastLoginAt: new Date(),
    });

    await deleteDoc(otpDocRef);

    const sessionToken = crypto.randomBytes(32).toString("hex");

    return NextResponse.json({
      success: true,
      sessionToken,
      userId,
      role: userData.role,
      name: userData.name,
      phone: userData.phone,
      email: userData.email,
      message: "Login berhasil",
    });
  } catch (error) {
    console.error("Verify login error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}