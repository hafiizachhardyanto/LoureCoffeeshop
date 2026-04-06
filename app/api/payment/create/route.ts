import { NextRequest, NextResponse } from "next/server";
import { createTransaction } from "@/lib/midtrans";
import { db, doc, setDoc, Timestamp, increment, updateDoc } from "@/lib/firebase";
import { generateOrderId } from "@/lib/utils";

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

    const orderId = generateOrderId();

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

    await setDoc(doc(db, "orders", orderId), orderData);

    for (const item of items) {
      await updateDoc(doc(db, "menu", item.menuId), {
        stock: increment(-item.quantity),
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