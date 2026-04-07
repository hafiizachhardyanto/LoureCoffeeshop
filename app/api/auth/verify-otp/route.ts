import { NextRequest, NextResponse } from "next/server";
import { getDocument, updateDocument, deleteDocument } from "@/lib/firebase-rest";

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
        { success: false, message: "Terlalu banyak percobaan. Silakan daftar ulang" },
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

    const now = new Date().toISOString();

    await updateDocument("users", userId, {
      verified: true,
      otp: null,
      otpExpiry: null,
      updatedAt: now,
    });

    await deleteDocument("otp", trimmedEmail);

    return NextResponse.json({
      success: true,
      message: "Verifikasi berhasil",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}