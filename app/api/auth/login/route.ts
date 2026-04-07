import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { queryFirestore, setDocument, updateDocument } from "@/lib/firebase-rest";

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { email } = body;

    console.log("Login attempt for email:", email);

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, message: "Email harus diisi dan berupa string" },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    const users = await queryFirestore("users", "email", "==", trimmedEmail);

    console.log("Found users:", users.length);

    if (!users || users.length === 0) {
      return NextResponse.json(
        { success: false, message: "Email tidak terdaftar" },
        { status: 400 }
      );
    }

    const userData = users[0];
    const userId = userData.id;

    console.log("User found:", userId);

    const verified = userData.verified ?? userData.isVerified;

    if (verified === false) {
      return NextResponse.json(
        { success: false, message: "Akun belum diverifikasi" },
        { status: 400 }
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    await setDocument("otp", trimmedEmail, {
      userId: userId,
      otp: otp,
      otpExpiry: otpExpiry,
      attempts: 0,
      createdAt: now,
    });

    await updateDocument("users", userId, {
      otp: otp,
      otpExpiry: otpExpiry,
      updatedAt: now,
    });

    return NextResponse.json({
      success: true,
      userId: userId,
      email: userData.email || trimmedEmail,
      otp: otp,
      role: userData.role || "user",
      name: userData.name || "",
      message: "OTP berhasil dibuat",
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}