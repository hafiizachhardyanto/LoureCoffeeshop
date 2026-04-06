import { NextRequest, NextResponse } from "next/server";
import { db, collection, getDocs, doc, setDoc, Timestamp, query, orderBy } from "@/lib/firebase";
import type { MenuItem } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const availableOnly = searchParams.get("available") === "true";

    const q = query(collection(db, "menu"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    let items = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as MenuItem[];

    if (availableOnly) {
      items = items.filter((item) => item.isAvailable && item.stock > 0);
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

    const id = `menu_${Timestamp.now().seconds}_${Math.random().toString(36).substring(2, 9)}`;
    
    await setDoc(doc(db, "menu", id), {
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