import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

async function firestoreGet(collection: string, docId: string) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${docId}`;
  
  const response = await fetch(url);
  if (!response.ok) return null;
  return response.json();
}

async function firestoreUpdate(collection: string, docId: string, data: any) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${docId}?updateMask.fieldPaths=${Object.keys(data).join('&updateMask.fieldPaths=')}`;
  
  const fields: any = {};
  Object.keys(data).forEach(key => {
    if (data[key] === null) {
      fields[key] = { nullValue: null };
    } else if (typeof data[key] === 'string') {
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
    const { userId, email, otp } = body;

    if (!userId || !email || !otp) {
      return NextResponse.json(
        { success: false, message: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    const otpDoc = await firestoreGet("otp", email);

    if (!otpDoc) {
      return NextResponse.json(
        { success: false, message: "OTP tidak valid atau sudah kadaluarsa" },
        { status: 400 }
      );
    }

    const otpData = otpDoc.fields;
    const attempts = parseInt(otpData.attempts?.integerValue || "0");

    if (attempts >= 3) {
      await firestoreDelete("otp", email);
      return NextResponse.json(
        { success: false, message: "Terlalu banyak percobaan" },
        { status: 400 }
      );
    }

    const storedOtp = otpData.otp?.stringValue;

    if (storedOtp !== otp) {
      await firestoreUpdate("otp", email, {
        attempts: attempts + 1,
      });
      return NextResponse.json(
        { success: false, message: "OTP salah" },
        { status: 400 }
      );
    }

    const expiryDate = new Date(otpData.otpExpiry?.stringValue || otpData.otpExpiry?.timestampValue);

    if (new Date() > expiryDate) {
      await firestoreDelete("otp", email);
      return NextResponse.json(
        { success: false, message: "OTP sudah kadaluarsa" },
        { status: 400 }
      );
    }

    const userDoc = await firestoreGet("users", userId);

    if (!userDoc) {
      return NextResponse.json(
        { success: false, message: "User tidak ditemukan" },
        { status: 400 }
      );
    }

    const userData = userDoc.fields;
    const now = new Date().toISOString();
    const sessionToken = crypto.randomBytes(32).toString("hex");

    await firestoreUpdate("users", userId, {
      otp: null,
      otpExpiry: null,
      sessionToken: sessionToken,
      lastLoginAt: now,
      updatedAt: now,
    });

    await firestoreDelete("otp", email);

    return NextResponse.json({
      success: true,
      sessionToken,
      userId,
      role: userData.role?.stringValue || "cashier",
      name: userData.name?.stringValue,
      phone: userData.phone?.stringValue,
      email: userData.email?.stringValue,
      message: "Login berhasil",
    });
  } catch (error) {
    console.error("Verify login error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}