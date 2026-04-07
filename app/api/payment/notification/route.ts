import { NextRequest, NextResponse } from "next/server";

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

async function firestoreSet(collection: string, docId: string, data: any) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${docId}`;
  
  const fields: any = {};
  Object.keys(data).forEach(key => {
    if (typeof data[key] === 'string') {
      fields[key] = { stringValue: data[key] };
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
    const { 
      order_id, 
      transaction_status, 
      status_code, 
      gross_amount,
      payment_type
    } = body;

    if (!order_id || !transaction_status) {
      return NextResponse.json(
        { success: false, message: "Invalid notification" },
        { status: 400 }
      );
    }

    const orderDoc = await firestoreGet("orders", order_id);
    
    if (!orderDoc) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    const orderData = orderDoc.fields;
    let newStatus = orderData.status?.stringValue;
    let paymentStatus = orderData.paymentStatus?.stringValue;

    if (transaction_status === "capture" || transaction_status === "settlement") {
      newStatus = "waiting";
      paymentStatus = "success";
    } else if (transaction_status === "deny" || transaction_status === "cancel" || transaction_status === "expire") {
      newStatus = "cancelled";
      paymentStatus = "failed";
    } else if (transaction_status === "pending") {
      paymentStatus = "pending";
    }

    await firestoreUpdate("orders", order_id, {
      status: newStatus,
      paymentStatus,
      updatedAt: new Date().toISOString(),
    });

    if (paymentStatus === "success") {
      await firestoreSet("notifications", `notif_${order_id}`, {
        type: "new_order",
        orderId: order_id,
        userName: orderData.userName?.stringValue,
        totalAmount: parseInt(orderData.totalAmount?.integerValue),
        createdAt: new Date().toISOString(),
        isRead: false,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Payment Notification Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}