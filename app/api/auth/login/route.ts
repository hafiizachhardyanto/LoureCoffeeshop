import { NextRequest, NextResponse } from "next/server";

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

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Firestore query failed: ${response.status} - ${errorText}`);
  }

  return response.json();
}

async function firestoreSet(collection: string, docId: string, data: any) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${docId}`;
  
  const fields: any = {};
  Object.keys(data).forEach(key => {
    if (typeof data[key] === 'string') {
      fields[key] = { stringValue: data[key] };
    } else if (typeof data[key] === 'number') {
      fields[key] = { integerValue: String(data[key]) };
    } else if (typeof data[key] === 'boolean') {
      fields[key] = { booleanValue: data[key] };
    }
  });

  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Firestore set failed: ${response.status} - ${errorText}`);
  }

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
      fields[key] = { integerValue: String(data[key]) };
    } else if (typeof data[key] === 'boolean') {
      fields[key] = { booleanValue: data[key] };
    }
  });

  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Firestore update failed: ${response.status} - ${errorText}`);
  }

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

    const trimmedEmail = email.trim().toLowerCase();
    
    if (!PROJECT_ID) {
      console.error("FIREBASE_PROJECT_ID not set");
      return NextResponse.json(
        { success: false, message: "Server configuration error" },
        { status: 500 }
      );
    }

    const queryResult = await firestoreQuery("users", "email", "==", trimmedEmail);

    console.log("Query result count:", queryResult?.length || 0);

    if (!queryResult || !Array.isArray(queryResult) || queryResult.length === 0) {
      return NextResponse.json(
        { success: false, message: "Email tidak terdaftar" },
        { status: 400 }
      );
    }

    const firstResult = queryResult[0];
    if (!firstResult.document) {
      return NextResponse.json(
        { success: false, message: "Email tidak terdaftar" },
        { status: 400 }
      );
    }

    const userDoc = firstResult.document;
    const userData = userDoc.fields;
    const userId = userDoc.name.split('/').pop();

    console.log("User found:", userId);

    const verified = getBooleanValue(userData.verified) ?? getBooleanValue(userData.isVerified);
    console.log("User verified status:", verified);

    if (verified === false) {
      return NextResponse.json(
        { success: false, message: "Akun belum diverifikasi" },
        { status: 400 }
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    await firestoreSet("otp", trimmedEmail, {
      userId: userId as string,
      otp: otp,
      otpExpiry: otpExpiry,
      attempts: 0,
      createdAt: now,
    });

    await firestoreUpdate("users", userId as string, {
      otp: otp,
      otpExpiry: otpExpiry,
      updatedAt: now,
    });

    const userEmail = getStringValue(userData.email) || trimmedEmail;
    const userRole = getStringValue(userData.role) || "user";
    const userName = getStringValue(userData.name) || "";

    console.log("Login success for:", userEmail, "Role:", userRole);

    return NextResponse.json({
      success: true,
      userId: userId,
      email: userEmail,
      otp: otp,
      role: userRole,
      name: userName,
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