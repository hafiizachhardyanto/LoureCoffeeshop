import { NextRequest, NextResponse } from "next/server";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

async function firestoreQuery(collection: string, orderByField?: string, orderDirection?: string) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`;
  
  const body: any = {
    structuredQuery: {
      from: [{ collectionId: collection }],
    }
  };

  if (orderByField) {
    body.structuredQuery.orderBy = [{
      field: { fieldPath: orderByField },
      direction: orderDirection === 'desc' ? 'DESCENDING' : 'ASCENDING'
    }];
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return response.json();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const queryResult = await firestoreQuery("orders", "createdAt", "desc");

    let orders: any[] = [];

    if (queryResult && Array.isArray(queryResult)) {
      orders = queryResult
        .filter((doc: any) => doc.document)
        .map((doc: any) => {
          const data = doc.document.fields;
          return {
            id: doc.document.name.split('/').pop(),
            orderId: data.orderId?.stringValue,
            userId: data.userId?.stringValue,
            userName: data.userName?.stringValue,
            userPhone: data.userPhone?.stringValue,
            items: data.items?.arrayValue?.values?.map((item: any) => ({
              menuId: item.mapValue.fields.menuId?.stringValue,
              name: item.mapValue.fields.name?.stringValue,
              price: parseInt(item.mapValue.fields.price?.integerValue),
              quantity: parseInt(item.mapValue.fields.quantity?.integerValue),
              subtotal: parseInt(item.mapValue.fields.subtotal?.integerValue),
            })) || [],
            totalAmount: parseInt(data.totalAmount?.integerValue),
            status: data.status?.stringValue,
            paymentMethod: data.paymentMethod?.stringValue,
            paymentStatus: data.paymentStatus?.stringValue,
            createdAt: data.createdAt?.stringValue,
            updatedAt: data.updatedAt?.stringValue,
          };
        });
    }

    if (userId) {
      orders = orders.filter((order: any) => order.userId === userId);
    }

    if (status) {
      orders = orders.filter((order: any) => order.status === status);
    }

    if (dateFrom && dateTo) {
      const fromDate = new Date(dateFrom);
      const toDate = new Date(dateTo);
      orders = orders.filter((order: any) => {
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