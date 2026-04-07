import { NextRequest, NextResponse } from "next/server";
import { db, doc, getDoc, updateDoc, deleteDoc } from "@/lib/firebase";
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
        attempts: (otpData.attempts || 0) + 1,
      });
      return NextResponse.json(
        { success: false, message: "OTP salah" },
        { status: 400 }
      );
    }

    let expiryDate: Date;
    if (otpData.otpExpiry && typeof otpData.otpExpiry.toDate === "function") {
      expiryDate = otpData.otpExpiry.toDate();
    } else if (otpData.otpExpiry && otpData.otpExpiry.seconds) {
      expiryDate = new Date(otpData.otpExpiry.seconds * 1000);
    } else {
      expiryDate = new Date(otpData.otpExpiry);
    }

    if (new Date() > expiryDate) {
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
    const now = new Date().toISOString();
    const sessionToken = crypto.randomBytes(32).toString("hex");

    await updateDoc(userDocRef, {
      otp: null,
      otpExpiry: null,
      sessionToken: sessionToken,
      lastLoginAt: now,
      updatedAt: now,
    });

    await deleteDoc(otpDocRef);

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
      { success: false, message: "Terjadi kesalahan server: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}