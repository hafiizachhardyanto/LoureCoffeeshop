import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc, setDoc } from "firebase/firestore";
import crypto from "crypto";

const EMAILJS_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
const EMAILJS_PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY;

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
      return NextResponse.json(
        { success: false, message: "Gagal mengirim email OTP" },
        { status: 500 }
      );
    }

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