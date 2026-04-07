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

function getStringValue(field: any): string | null {
  if (!field) return null;
  if (field.stringValue !== undefined) return field.stringValue;
  return null;
}

function getIntegerValue(field: any): number {
  if (!field) return 0;
  if (field.integerValue !== undefined) return parseInt(field.integerValue);
  if (field.doubleValue !== undefined) return Math.floor(field.doubleValue);
  return 0;
}

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { userId, email, otp } = body;

    console.log("Verify login attempt:", { userId, email, otp });

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
    const attempts = getIntegerValue(otpData.attempts);

    if (attempts >= 3) {
      await firestoreDelete("otp", email);
      return NextResponse.json(
        { success: false, message: "Terlalu banyak percobaan" },
        { status: 400 }
      );
    }

    const storedOtp = getStringValue(otpData.otp);

    if (storedOtp !== otp) {
      await firestoreUpdate("otp", email, {
        attempts: attempts + 1,
      });
      return NextResponse.json(
        { success: false, message: "OTP salah" },
        { status: 400 }
      );
    }

    const expiryDateStr = getStringValue(otpData.otpExpiry);
    let expiryDate: Date;

    if (otpData.otpExpiry?.timestampValue) {
      expiryDate = new Date(otpData.otpExpiry.timestampValue);
    } else if (expiryDateStr) {
      expiryDate = new Date(expiryDateStr);
    } else {
      expiryDate = new Date();
    }

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
      role: getStringValue(userData.role) || "cashier",
      name: getStringValue(userData.name),
      phone: getStringValue(userData.phone),
      email: getStringValue(userData.email),
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