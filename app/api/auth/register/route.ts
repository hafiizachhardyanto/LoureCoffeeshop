import { NextRequest, NextResponse } from "next/server";
import { db, collection, doc, setDoc, query, where, getDocs, deleteDoc } from "@/lib/firebase";
import crypto from "crypto";

const EMAILJS_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
const EMAILJS_PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY;

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
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    await setDoc(doc(db, "users", userId), {
      id: userId,
      name,
      phone,
      email,
      role: "cashier",
      otp,
      otpExpiry,
      verified: false,
      createdAt: now,
      lastLoginAt: "-",
    });

    await setDoc(doc(db, "otp", email), {
      userId,
      otp,
      otpExpiry,
      attempts: 0,
      createdAt: now,
    });

    const emailData = {
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      accessToken: EMAILJS_PRIVATE_KEY,
      template_params: {
        email: email,
        passcode: otp,
        time: "10 menit",
        company_name: "Loure Coffee Shop",
      },
    };

    const emailResponse = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailData),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("EmailJS error:", errorText);
      
      await deleteDoc(doc(db, "users", userId));
      await deleteDoc(doc(db, "otp", email));
      
      return NextResponse.json(
        { success: false, message: "Gagal mengirim email OTP" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      userId,
      message: "OTP telah dikirim ke email Anda",
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}