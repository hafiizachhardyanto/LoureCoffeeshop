import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const EMAILJS_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
const EMAILJS_PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY;

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

async function firestoreQuery(collection: string, field: string, op: string, value: string) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`;
  
  const body = {
    structuredQuery: {
      from: [{ collectionId: collection }],
      where: {
        fieldFilter: {
          field: { fieldPath: field },
          op: op === "==" ? "EQUAL" : op,
          value: { stringValue: value }
        }
      }
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return response.json();
}

async function firestoreSet(collection: string, docId: string, data: any) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${docId}`;
  
  const fields: any = {};
  Object.keys(data).forEach(key => {
    if (typeof data[key] === 'string') {
      fields[key] = { stringValue: data[key] };
    } else if (typeof data[key] === 'number') {
      fields[key] = { integerValue: data[key] };
    } else if (typeof data[key] === 'boolean') {
      fields[key] = { booleanValue: data[key] };
    }
  });

  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });

  return response.json();
}

async function firestoreDelete(collection: string, docId: string) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${docId}`;
  
  const response = await fetch(url, {
    method: 'DELETE',
  });

  return response.ok;
}

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

    const queryResult = await firestoreQuery("users", "email", "==", email);

    if (queryResult && queryResult.length > 0 && queryResult[0].document) {
      return NextResponse.json(
        { success: false, message: "Email sudah terdaftar" },
        { status: 400 }
      );
    }

    const userId = crypto.randomUUID();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    await firestoreSet("users", userId, {
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

    await firestoreSet("otp", email, {
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
      
      await firestoreDelete("users", userId);
      await firestoreDelete("otp", email);
      
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