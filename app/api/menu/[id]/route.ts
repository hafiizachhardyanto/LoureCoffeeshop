import { NextRequest, NextResponse } from "next/server";
import { db, doc, getDoc, updateDoc, deleteDoc } from "@/lib/firebase";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const docSnap = await getDoc(doc(db, "menu", id));

    if (!docSnap.exists()) {
      return NextResponse.json(
        { success: false, message: "Menu tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: docSnap.id, ...docSnap.data() },
    });
  } catch (error) {
    console.error("Get Menu Item Error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
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
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await deleteDoc(doc(db, "menu", id));

    return NextResponse.json({
      success: true,
      message: "Menu berhasil dihapus",
    });
  } catch (error) {
    console.error("Delete Menu Error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}