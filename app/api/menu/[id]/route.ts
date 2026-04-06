import { NextRequest, NextResponse } from "next/server";
import { db, doc, getDoc, updateDoc, deleteDoc } from "@/lib/firebase";
import type { MenuItem } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const docSnap = await getDoc(doc(db, "menu", id));
    
    if (!docSnap.exists()) {
      return NextResponse.json(
        { success: false, message: "Menu tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: docSnap.id, ...docSnap.data() } as MenuItem,
    });
  } catch (error) {
    console.error("Get Menu Error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    await updateDoc(doc(db, "menu", id), {
      ...body,
      updatedAt: new Date().toISOString(),
    });

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await deleteDoc(doc(db, "menu", id));

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