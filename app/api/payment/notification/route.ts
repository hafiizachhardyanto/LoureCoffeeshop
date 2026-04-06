import { NextRequest, NextResponse } from "next/server";
import { db, doc, updateDoc, getDoc, setDoc, increment } from "@/lib/firebase";

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

    const orderDoc = await getDoc(doc(db, "orders", order_id));
    
    if (!orderDoc.exists()) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    const orderData = orderDoc.data();
    let newStatus = orderData.status;
    let paymentStatus = orderData.paymentStatus;

    if (transaction_status === "capture" || transaction_status === "settlement") {
      newStatus = "waiting";
      paymentStatus = "success";
    } else if (transaction_status === "deny" || transaction_status === "cancel" || transaction_status === "expire") {
      newStatus = "cancelled";
      paymentStatus = "failed";
      
      for (const item of orderData.items) {
        await updateDoc(doc(db, "menu", item.menuId), {
          stock: increment(item.quantity),
        });
      }
    } else if (transaction_status === "pending") {
      paymentStatus = "pending";
    }

    await updateDoc(doc(db, "orders", order_id), {
      status: newStatus,
      paymentStatus,
      updatedAt: new Date().toISOString(),
      midtransResponse: body,
    });

    if (paymentStatus === "success") {
      await setDoc(doc(db, "notifications", `notif_${order_id}`), {
        type: "new_order",
        orderId: order_id,
        userName: orderData.userName,
        totalAmount: orderData.totalAmount,
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