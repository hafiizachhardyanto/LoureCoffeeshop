import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getDocument, updateDocument, deleteDocument } from "@/lib/firebase-rest";

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

    const { userId, email, otp } = body;

    console.log("Verify OTP for:", email);

    if (!userId || !email || !otp) {
      return NextResponse.json(
        { success: false, message: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const otpDoc = await getDocument("otp", trimmedEmail);

    if (!otpDoc) {
      return NextResponse.json(
        { success: false, message: "OTP tidak valid atau sudah kadaluarsa" },
        { status: 400 }
      );
    }

    const attempts = otpDoc.attempts || 0;

    if (attempts >= 3) {
      await deleteDocument("otp", trimmedEmail);
      return NextResponse.json(
        { success: false, message: "Terlalu banyak percobaan" },
        { status: 400 }
      );
    }

    if (otpDoc.otp !== otp) {
      await updateDocument("otp", trimmedEmail, {
        attempts: attempts + 1,
      });
      return NextResponse.json(
        { success: false, message: "OTP salah" },
        { status: 400 }
      );
    }

    const expiryDate = new Date(otpDoc.otpExpiry);
    if (new Date() > expiryDate) {
      await deleteDocument("otp", trimmedEmail);
      return NextResponse.json(
        { success: false, message: "OTP sudah kadaluarsa" },
        { status: 400 }
      );
    }

    const userDoc = await getDocument("users", userId);

    if (!userDoc) {
      return NextResponse.json(
        { success: false, message: "User tidak ditemukan" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const sessionToken = crypto.randomBytes(32).toString("hex");

    await updateDocument("users", userId, {
      otp: "",
      otpExpiry: "",
      sessionToken: sessionToken,
      lastLoginAt: now,
      updatedAt: now,
    });

    await deleteDocument("otp", trimmedEmail);

    return NextResponse.json({
      success: true,
      sessionToken: sessionToken,
      userId: userId,
      role: userDoc.role || "user",
      name: userDoc.name || "",
      phone: userDoc.phone || "",
      email: userDoc.email || trimmedEmail,
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