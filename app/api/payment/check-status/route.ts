import { NextRequest, NextResponse } from "next/server";
import { checkTransactionStatus } from "@/lib/midtrans";

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "Order ID diperlukan" },
        { status: 400 }
      );
    }

    const orderDoc = await firestoreGet("orders", orderId);
    
    if (!orderDoc) {
      return NextResponse.json(
        { success: false, message: "Pesanan tidak ditemukan" },
        { status: 404 }
      );
    }

    const orderData = orderDoc.fields;

    if (orderData.paymentStatus?.stringValue === "success") {
      return NextResponse.json({
        success: true,
        status: orderData.status?.stringValue,
        paymentStatus: orderData.paymentStatus?.stringValue,
      });
    }

    const midtransStatus = await checkTransactionStatus(orderId);

    if (!midtransStatus) {
      return NextResponse.json({
        success: true,
        status: orderData.status?.stringValue,
        paymentStatus: orderData.paymentStatus?.stringValue,
      });
    }

    const { transaction_status } = midtransStatus;
    let newStatus = orderData.status?.stringValue;
    let paymentStatus = orderData.paymentStatus?.stringValue;

    if (transaction_status === "capture" || transaction_status === "settlement") {
      newStatus = "waiting";
      paymentStatus = "success";
    } else if (["deny", "cancel", "expire"].includes(transaction_status)) {
      newStatus = "cancelled";
      paymentStatus = "failed";
    }

    if (newStatus !== orderData.status?.stringValue || paymentStatus !== orderData.paymentStatus?.stringValue) {
      await firestoreUpdate("orders", orderId, {
        status: newStatus,
        paymentStatus,
        updatedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
      paymentStatus,
    });
  } catch (error) {
    console.error("Check Status Error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}