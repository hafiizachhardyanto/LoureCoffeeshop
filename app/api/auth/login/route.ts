import { NextRequest, NextResponse } from "next/server";
import { db, collection, query, where, getDocs, updateDoc, doc } from "@/lib/firebase";
import { generateOTP, sendOTP, storeOTP } from "@/lib/emailjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email harus diisi" },
        { status: 400 }
      );
    }

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json(
        { success: false, message: "Email tidak terdaftar" },
        { status: 404 }
      );
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    if (!userData.isVerified) {
      return NextResponse.json(
        { success: false, message: "Akun belum terverifikasi" },
        { status: 403 }
      );
    }

    const otp = generateOTP();

    await updateDoc(doc(db, "users", userId), {
      tempOTP: otp,
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });

    storeOTP(email, otp);
    const emailSent = await sendOTP({ 
      email, 
      name: userData.name, 
      otp 
    });

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
      role: userData.role,
    });
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}