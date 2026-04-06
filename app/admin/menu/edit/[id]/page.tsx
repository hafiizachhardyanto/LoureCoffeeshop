"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { db, doc, getDoc, updateDoc, Timestamp } from "@/lib/firebase";
import { useNetwork } from "@/context/NetworkContext";
import Link from "next/link";
import type { MenuItem } from "@/types";

export default function EditMenuPage() {
  const router = useRouter();
  const params = useParams();
  const { isOnline } = useNetwork();
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: "",
    rating: "",
    isAvailable: true,
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const categories = ["Kopi", "Teh", "Minuman Dingin", "Makanan Ringan", "Dessert", "Paket"];

  useEffect(() => {
    fetchMenuItem();
  }, [params.id]);

  const fetchMenuItem = async () => {
    try {
      const docSnap = await getDoc(doc(db, "menu", params.id as string));
      
      if (!docSnap.exists()) {
        setError("Menu tidak ditemukan");
        setLoading(false);
        return;
      }

      const data = docSnap.data() as MenuItem;
      setFormData({
        name: data.name,
        description: data.description,
        price: data.price.toString(),
        category: data.category,
        stock: data.stock.toString(),
        rating: data.rating.toString(),
        isAvailable: data.isAvailable,
      });
    } catch (err) {
      setError("Gagal memuat data menu");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isOnline) {
      setError("Jaringan pengguna sedang terganggu silahkan coba lagi");
      return;
    }

    setSaving(true);

    try {
      await updateDoc(doc(db, "menu", params.id as string), {
        name: formData.name,
        description: formData.description,
        price: parseInt(formData.price),
        category: formData.category,
        stock: parseInt(formData.stock),
        rating: parseFloat(formData.rating),
        isAvailable: formData.isAvailable,
        updatedAt: new Date().toISOString(),
      });

      router.push("/menu");
    } catch (err) {
      setError("Gagal mengupdate menu");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="page-transition max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/menu" className="btn btn-ghost btn-sm">
          ← Kembali
        </Link>
        <h1 className="text-3xl font-bold text-blue-900">Edit Menu</h1>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <span>{error}</span>
        </div>
      )}

      <div className="card bg-white shadow-lg">
        <form onSubmit={handleSubmit} className="card-body space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Nama Menu</span>
            </label>
            <input
              type="text"
              className="input input-bordered"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Deskripsi</span>
            </label>
            <textarea
              className="textarea textarea-bordered"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Harga (Rp)</span>
              </label>
              <input
                type="number"
                className="input input-bordered"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                min="0"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Stok</span>
              </label>
              <input
                type="number"
                className="input input-bordered"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                min="0"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Kategori</span>
              </label>
              <select
                className="select select-bordered"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                <option value="">Pilih Kategori</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Rating (1-5)</span>
              </label>
              <input
                type="number"
                className="input input-bordered"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                min="1"
                max="5"
                step="0.1"
                required
              />
            </div>
          </div>

          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-4">
              <input
                type="checkbox"
                className="checkbox checkbox-primary"
                checked={formData.isAvailable}
                onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
              />
              <span className="label-text">Tersedia untuk dijual</span>
            </label>
          </div>

          <div className="pt-4 flex gap-4">
            <Link href="/menu" className="btn btn-ghost flex-1">
              Batal
            </Link>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={saving || !isOnline}
            >
              {saving ? <span className="loading loading-spinner"></span> : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}