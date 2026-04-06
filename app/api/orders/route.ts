import { NextRequest, NextResponse } from "next/server";
import { db, collection, query, where, orderBy, getDocs, doc, updateDoc } from "@/lib/firebase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    let q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    if (userId) {
      q = query(q, where("userId", "==", userId));
    }

    if (status) {
      q = query(q, where("status", "==", status));
    }

    const querySnapshot = await getDocs(q);
    let orders = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (dateFrom && dateTo) {
      const fromDate = new Date(dateFrom);
      const toDate = new Date(dateTo);
      orders = orders.filter((order) => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= fromDate && orderDate <= toDate;
      });
    }

    return NextResponse.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("Get Orders Error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}