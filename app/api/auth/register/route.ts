import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, doc, setDoc, query, where, getDocs } from "firebase/firestore";
import crypto from "crypto";

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

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return NextResponse.json(
        { success: false, message: "Email sudah terdaftar" },
        { status: 400 }
      );
    }

    const userId = crypto.randomUUID();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await setDoc(doc(db, "users", userId), {
      name,
      phone,
      email,
      role: "cashier",
      otp,
      otpExpiry,
      verified: false,
      createdAt: new Date(),
    });

    await setDoc(doc(db, "otp", email), {
      userId,
      otp,
      otpExpiry,
      attempts: 0,
    });

    return NextResponse.json({
      success: true,
      userId,
      message: "OTP telah dikirim ke email Anda",
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}