import { NextRequest, NextResponse } from "next/server";
import { checkTransactionStatus } from "@/lib/midtrans";
import { db, doc, getDoc, updateDoc } from "@/lib/firebase";

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

    const orderDoc = await getDoc(doc(db, "orders", orderId));
    
    if (!orderDoc.exists()) {
      return NextResponse.json(
        { success: false, message: "Pesanan tidak ditemukan" },
        { status: 404 }
      );
    }

    const orderData = orderDoc.data();

    if (orderData.paymentStatus === "success") {
      return NextResponse.json({
        success: true,
        status: orderData.status,
        paymentStatus: orderData.paymentStatus,
      });
    }

    const midtransStatus = await checkTransactionStatus(orderId);

    if (!midtransStatus) {
      return NextResponse.json({
        success: true,
        status: orderData.status,
        paymentStatus: orderData.paymentStatus,
      });
    }

    const { transaction_status } = midtransStatus;
    let newStatus = orderData.status;
    let paymentStatus = orderData.paymentStatus;

    if (transaction_status === "capture" || transaction_status === "settlement") {
      newStatus = "waiting";
      paymentStatus = "success";
    } else if (["deny", "cancel", "expire"].includes(transaction_status)) {
      newStatus = "cancelled";
      paymentStatus = "failed";
    }

    if (newStatus !== orderData.status || paymentStatus !== orderData.paymentStatus) {
      await updateDoc(doc(db, "orders", orderId), {
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