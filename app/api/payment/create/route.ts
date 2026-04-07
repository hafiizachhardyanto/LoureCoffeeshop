import { NextRequest, NextResponse } from "next/server";
import { createTransaction } from "@/lib/midtrans";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

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
    } else if (Array.isArray(data[key])) {
      fields[key] = {
        arrayValue: {
          values: data[key].map((item: any) => ({
            mapValue: {
              fields: {
                menuId: { stringValue: item.menuId },
                name: { stringValue: item.name },
                price: { integerValue: item.price },
                quantity: { integerValue: item.quantity },
                subtotal: { integerValue: item.subtotal },
              }
            }
          }))
        }
      };
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
    if (typeof data[key] === 'number') {
      fields[key] = { integerValue: data[key] };
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
      userId, 
      userName, 
      userPhone, 
      userEmail, 
      items, 
      totalAmount 
    } = body;

    if (!userId || !items || !totalAmount) {
      return NextResponse.json(
        { success: false, message: "Data pesanan tidak lengkap" },
        { status: 400 }
      );
    }

    const orderId = `LOURE-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    const midtransItems = items.map((item: any) => ({
      id: item.menuId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    }));

    const transaction = await createTransaction({
      orderId,
      amount: totalAmount,
      customerName: userName,
      customerEmail: userEmail || `${userId}@loure.coffee`,
      customerPhone: userPhone,
      items: midtransItems,
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, message: "Gagal membuat transaksi pembayaran" },
        { status: 500 }
      );
    }

    const orderData = {
      id: orderId,
      orderId,
      userId,
      userName,
      userPhone,
      items: items.map((item: any) => ({
        menuId: item.menuId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.subtotal,
      })),
      totalAmount,
      status: "pending",
      paymentMethod: "qris",
      paymentStatus: "pending",
      midtransToken: transaction.token,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await firestoreSet("orders", orderId, orderData);

    for (const item of items) {
      await firestoreUpdate("menu", item.menuId, {
        stock: -item.quantity,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Transaksi berhasil dibuat",
      orderId,
      token: transaction.token,
      redirectUrl: transaction.redirect_url,
    });
  } catch (error) {
    console.error("Create Payment Error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}