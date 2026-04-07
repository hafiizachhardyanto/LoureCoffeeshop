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

async function firestoreDelete(collection: string, docId: string) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${docId}`;
  
  const response = await fetch(url, {
    method: 'DELETE',
  });

  return response.ok;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const doc = await firestoreGet("menu", params.id);
    
    if (!doc) {
      return NextResponse.json(
        { success: false, message: "Menu tidak ditemukan" },
        { status: 404 }
      );
    }

    const data = doc.fields;
    const menuItem = {
      id: doc.name.split('/').pop(),
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

    return NextResponse.json({
      success: true,
      data: menuItem,
    });
  } catch (error) {
    console.error("Get Menu Error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { name, description, price, category, stock, rating, isAvailable } = body;

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (category !== undefined) updateData.category = category;
    if (stock !== undefined) updateData.stock = stock;
    if (rating !== undefined) updateData.rating = rating;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;

    await firestoreUpdate("menu", params.id, updateData);

    return NextResponse.json({
      success: true,
      message: "Menu berhasil diupdate",
    });
  } catch (error) {
    console.error("Update Menu Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengupdate menu" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await firestoreDelete("menu", params.id);

    return NextResponse.json({
      success: true,
      message: "Menu berhasil dihapus",
    });
  } catch (error) {
    console.error("Delete Menu Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus menu" },
      { status: 500 }
    );
  }
}