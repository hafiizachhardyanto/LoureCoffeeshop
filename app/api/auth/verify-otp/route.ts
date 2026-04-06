import { NextRequest, NextResponse } from "next/server";
import { db, doc, getDoc, updateDoc, deleteDoc } from "@/lib/firebase";
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

    const otpDoc = await getDoc(doc(db, "otp_verifications", userId));
    
    if (!otpDoc.exists()) {
      return NextResponse.json(
        { success: false, message: "OTP tidak valid atau sudah kadaluarsa" },
        { status: 400 }
      );
    }

    const otpData = otpDoc.data();
    const now = new Date();
    const expiresAt = new Date(otpData.expiresAt);

    if (now > expiresAt) {
      await deleteDoc(doc(db, "otp_verifications", userId));
      return NextResponse.json(
        { success: false, message: "OTP sudah kadaluarsa" },
        { status: 400 }
      );
    }

    const isValid = verifyOTP(email, otp) || otpData.otp === otp;

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "OTP salah" },
        { status: 400 }
      );
    }

    await updateDoc(doc(db, "users", userId), {
      isVerified: true,
      verifiedAt: new Date().toISOString(),
    });

    await deleteDoc(doc(db, "otp_verifications", userId));

    return NextResponse.json({
      success: true,
      message: "Verifikasi berhasil",
      userId,
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}