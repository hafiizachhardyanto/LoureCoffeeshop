import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc, setDoc } from "firebase/firestore";
import crypto from "crypto";

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
        { status: 400 }
      );
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    if (!userData.verified) {
      return NextResponse.json(
        { success: false, message: "Akun belum diverifikasi" },
        { status: 400 }
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await setDoc(doc(db, "otp", email), {
      userId,
      otp,
      otpExpiry,
      attempts: 0,
    });

    await updateDoc(doc(db, "users", userId), {
      otp,
      otpExpiry,
    });

    return NextResponse.json({
      success: true,
      userId,
      role: userData.role,
      message: "OTP telah dikirim ke email Anda",
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}