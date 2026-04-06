"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNetwork } from "@/context/NetworkContext";
import { db, doc, updateDoc } from "@/lib/firebase";
import NetworkError from "@/components/shared/NetworkError";

export default function ProfilePage() {
  const { user, refreshUser, logout } = useAuth();
  const { isOnline } = useNetwork();
  
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess("");
    setError("");

    if (!isOnline) {
      return;
    }

    if (!user?.id) return;

    setLoading(true);

    try {
      await updateDoc(doc(db, "users", user.id), {
        name: formData.name,
        phone: formData.phone,
        updatedAt: new Date().toISOString(),
      });

      await refreshUser();
      setSuccess("Profil berhasil diperbarui");
    } catch (err) {
      setError("Gagal memperbarui profil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-transition min-h-screen bg-base-100 py-10">
      <NetworkError />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-blue-900 mb-8">Profil Saya</h1>

        {success && (
          <div className="alert alert-success mb-6">
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-error mb-6">
            <span>{error}</span>
          </div>
        )}

        <div className="card bg-white shadow-lg">
          <div className="card-body p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold text-blue-600">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-blue-900">{user?.name}</h2>
                <p className="text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Nama Lengkap</span>
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
                  <span className="label-text font-medium">Nomor HP</span>
                </label>
                <input
                  type="tel"
                  className="input input-bordered"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Email</span>
                </label>
                <input
                  type="email"
                  className="input input-bordered"
                  value={user?.email || ""}
                  disabled
                />
                <label className="label">
                  <span className="label-text-alt text-gray-500">Email tidak dapat diubah</span>
                </label>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={loading || !isOnline}
                >
                  {loading ? <span className="loading loading-spinner"></span> : "Simpan Perubahan"}
                </button>
              </div>
            </form>

            <div className="divider my-8"></div>

            <button
              onClick={logout}
              className="btn btn-error btn-outline w-full"
            >
              Keluar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}