import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

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

async function firestoreUpdate(collection: string, docId: string, data: any) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${docId}?updateMask.fieldPaths=${Object.keys(data).join('&updateMask.fieldPaths=')}`;
  
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

function getBooleanValue(field: any): boolean | null {
  if (!field) return null;
  if (field.booleanValue !== undefined) return field.booleanValue;
  if (field.stringValue === "true") return true;
  if (field.stringValue === "false") return false;
  return null;
}

function getStringValue(field: any): string | null {
  if (!field) return null;
  if (field.stringValue !== undefined) return field.stringValue;
  return null;
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

    const { email } = body;

    console.log("Login attempt for email:", email);

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, message: "Email harus diisi dan berupa string" },
        { status: 400 }
      );
    }

    const queryResult = await firestoreQuery("users", "email", "==", email);

    console.log("Query result length:", queryResult?.length);

    if (!queryResult || queryResult.length === 0 || !queryResult[0].document) {
      return NextResponse.json(
        { success: false, message: "Email tidak terdaftar" },
        { status: 400 }
      );
    }

    const userDoc = queryResult[0].document;
    const userData = userDoc.fields;
    const userId = userDoc.name.split('/').pop();

    console.log("User found:", userId);
    console.log("User data fields:", Object.keys(userData));
    console.log("Verified field:", JSON.stringify(userData.verified));

    const verified = getBooleanValue(userData.verified);
    const emailVerified = getStringValue(userData.email);

    console.log("Parsed verified:", verified);
    console.log("Stored email:", emailVerified);

    if (verified === false) {
      return NextResponse.json(
        { success: false, message: "Akun belum diverifikasi" },
        { status: 400 }
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await firestoreSet("otp", email, {
      userId,
      otp,
      otpExpiry,
      attempts: 0,
      createdAt: new Date().toISOString(),
    });

    await firestoreUpdate("users", userId, {
      otp,
      otpExpiry,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      userId,
      email,
      otp,
      role: getStringValue(userData.role) || "cashier",
      message: "OTP berhasil dibuat",
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}