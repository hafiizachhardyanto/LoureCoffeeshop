"use client";

import { useState, useEffect } from "react";
import { db, collection, getDocs, doc, deleteDoc, query, orderBy } from "@/lib/firebase";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import type { MenuItem } from "@/types";

export default function AdminMenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteModal, setDeleteModal] = useState<MenuItem | null>(null);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const q = query(collection(db, "menu"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as MenuItem[];
      setMenuItems(items);
    } catch (error) {
      console.error("Error fetching menu:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item: MenuItem) => {
    try {
      await deleteDoc(doc(db, "menu", item.id));
      setMenuItems((prev) => prev.filter((i) => i.id !== item.id));
      setDeleteModal(null);
    } catch (error) {
      console.error("Error deleting menu:", error);
      alert("Gagal menghapus menu");
    }
  };

  const categories = ["all", ...new Set(menuItems.map((item) => item.category))];

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="page-transition space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-blue-900">Kelola Menu</h1>
        <Link href="/menu/create" className="btn btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Menu
        </Link>
      </div>

      <div className="card bg-white shadow-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Cari menu..."
              className="input input-bordered w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="select select-bordered"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">Semua Kategori</option>
            {categories.filter(c => c !== "all").map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card bg-white shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead className="bg-blue-50">
              <tr>
                <th className="text-blue-900">Menu</th>
                <th className="text-blue-900">Kategori</th>
                <th className="text-blue-900">Harga</th>
                <th className="text-blue-900">Stok</th>
                <th className="text-blue-900">Rating</th>
                <th className="text-blue-900">Status</th>
                <th className="text-blue-900 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    Tidak ada menu ditemukan
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <span className="text-xs font-bold text-gray-400">LOURE</span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-blue-900">{item.name}</p>
                          <p className="text-sm text-gray-500 line-clamp-1">{item.description}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-primary">{item.category}</span>
                    </td>
                    <td className="font-medium text-blue-600">
                      {formatCurrency(item.price)}
                    </td>
                    <td>
                      <span className={`font-medium ${item.stock < 10 ? "text-error" : "text-success"}`}>
                        {item.stock}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <span className="text-orange-500">★</span>
                        <span>{item.rating}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${item.isAvailable ? "badge-success" : "badge-error"}`}>
                        {item.isAvailable ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link 
                          href={`/menu/edit/${item.id}`}
                          className="btn btn-sm btn-info text-white"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => setDeleteModal(item)}
                          className="btn btn-sm btn-error text-white"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {deleteModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-blue-900">Konfirmasi Hapus</h3>
            <p className="py-4">
              Apakah Anda yakin ingin menghapus menu <strong>{deleteModal.name}</strong>?
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="modal-action">
              <button 
                onClick={() => setDeleteModal(null)}
                className="btn btn-ghost"
              >
                Batal
              </button>
              <button 
                onClick={() => handleDelete(deleteModal)}
                className="btn btn-error text-white"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}