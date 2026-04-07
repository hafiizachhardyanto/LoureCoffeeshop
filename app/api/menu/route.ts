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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const availableOnly = searchParams.get("available") === "true";

    const queryResult = await firestoreQuery("menu", "createdAt", "desc");
    
    let items: any[] = [];
    
    if (queryResult && Array.isArray(queryResult)) {
      items = queryResult
        .filter((doc: any) => doc.document)
        .map((doc: any) => {
          const data = doc.document.fields;
          return {
            id: doc.document.name.split('/').pop(),
            name: data.name?.stringValue,
            description: data.description?.stringValue,
            price: parseInt(data.price?.integerValue),
            category: data.category?.stringValue,
            stock: parseInt(data.stock?.integerValue),
            rating: parseFloat(data.rating?.doubleValue || data.rating?.integerValue),
            isAvailable: data.isAvailable?.booleanValue,
            imageUrl: data.imageUrl?.stringValue,
            createdAt: data.createdAt?.stringValue,
            updatedAt: data.updatedAt?.stringValue,
          };
        });
    }

    if (availableOnly) {
      items = items.filter((item: any) => item.isAvailable && item.stock > 0);
    }

    return NextResponse.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error("Get Menu Error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, price, category, stock, rating, isAvailable } = body;

    if (!name || !price || !category) {
      return NextResponse.json(
        { success: false, message: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    const id = `menu_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    await firestoreSet("menu", id, {
      id,
      name,
      description: description || "",
      price: parseInt(price),
      category,
      stock: parseInt(stock) || 0,
      rating: parseFloat(rating) || 5,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      imageUrl: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Menu berhasil ditambahkan",
      data: { id },
    });
  } catch (error) {
    console.error("Create Menu Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menambahkan menu" },
      { status: 500 }
    );
  }
}