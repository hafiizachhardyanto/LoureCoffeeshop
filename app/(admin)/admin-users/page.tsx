"use client";

import { useState, useEffect } from "react";
import { db, collection, query, where, getDocs, doc, setDoc, deleteDoc, Timestamp } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/lib/utils";
import type { User, AdminLog } from "@/types";

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [admins, setAdmins] = useState<User[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    fetchAdmins();
    fetchLogs();
  }, []);

  const fetchAdmins = async () => {
    try {
      const q = query(collection(db, "users"), where("role", "==", "admin"));
      const querySnapshot = await getDocs(q);
      const adminsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];
      setAdmins(adminsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error("Error fetching admins:", error);
    }
  };

  const fetchLogs = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "admin_logs"));
      const logsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AdminLog[];
      setLogs(logsData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10));
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const userId = `admin_${Timestamp.now().seconds}_${Math.random().toString(36).substring(2, 9)}`;
      const now = new Date().toISOString();

      await setDoc(doc(db, "users", userId), {
        id: userId,
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        role: "admin",
        isVerified: true,
        createdAt: now,
        lastLoginAt: "-",
        createdBy: currentUser?.name,
        createdById: currentUser?.id,
      });

      await setDoc(doc(db, "admin_logs", `log_${Date.now()}`), {
        id: `log_${Date.now()}`,
        action: "create",
        targetType: "admin",
        targetId: userId,
        targetName: formData.name,
        performedBy: currentUser?.id,
        performedByName: currentUser?.name,
        timestamp: now,
        details: `Admin ${formData.name} dibuat oleh ${currentUser?.name}`,
      });

      setFormData({ name: "", phone: "", email: "" });
      setShowAddModal(false);
      fetchAdmins();
      fetchLogs();
    } catch (error) {
      console.error("Error adding admin:", error);
      alert("Gagal menambahkan admin");
    }
  };

  const handleDeleteAdmin = async (admin: User) => {
    try {
      const now = new Date().toISOString();

      await deleteDoc(doc(db, "users", admin.id));

      await setDoc(doc(db, "admin_logs", `log_${Date.now()}`), {
        id: `log_${Date.now()}`,
        action: "delete",
        targetType: "admin",
        targetId: admin.id,
        targetName: admin.name,
        performedBy: currentUser?.id,
        performedByName: currentUser?.name,
        timestamp: now,
        details: `Admin ${admin.name} dihapus oleh ${currentUser?.name}`,
      });

      await setDoc(doc(db, "deleted_admins", admin.id), {
        ...admin,
        deletedAt: now,
        deletedBy: currentUser?.name,
        deletedById: currentUser?.id,
      });

      setDeleteConfirm(null);
      fetchAdmins();
      fetchLogs();
    } catch (error) {
      console.error("Error deleting admin:", error);
      alert("Gagal menghapus admin");
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
    <div className="page-transition space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-blue-900">Kelola Admin</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Admin
        </button>
      </div>

      <div className="card bg-white shadow-lg overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-blue-900">Daftar Admin</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead className="bg-blue-50">
              <tr>
                <th className="text-blue-900">Nama</th>
                <th className="text-blue-900">Email</th>
                <th className="text-blue-900">Telepon</th>
                <th className="text-blue-900">Dibuat Oleh</th>
                <th className="text-blue-900">Tanggal Dibuat</th>
                <th className="text-blue-900">Login Terakhir</th>
                <th className="text-blue-900 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {admins.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    Belum ada admin
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id}>
                    <td className="font-medium text-blue-900">{admin.name}</td>
                    <td>{admin.email}</td>
                    <td>{admin.phone}</td>
                    <td>{admin.createdBy || "-"}</td>
                    <td>{formatDate(admin.createdAt)}</td>
                    <td>{admin.lastLoginAt !== "-" ? formatDate(admin.lastLoginAt) : "-"}</td>
                    <td className="text-right">
                      {admin.id !== currentUser?.id && (
                        <button
                          onClick={() => setDeleteConfirm(admin)}
                          className="btn btn-sm btn-error text-white"
                        >
                          Hapus
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card bg-white shadow-lg">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-blue-900">Riwayat Aktivitas</h2>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {logs.length === 0 ? (
              <p className="text-gray-500 text-center">Belum ada aktivitas</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    log.action === "create" ? "bg-green-100 text-green-600" :
                    log.action === "delete" ? "bg-red-100 text-red-600" :
                    "bg-blue-100 text-blue-600"
                  }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {log.action === "create" ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      ) : log.action === "delete" ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      )}
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-blue-900">
                      {log.action === "create" && `Admin ${log.targetName} dibuat oleh ${log.performedByName}`}
                      {log.action === "delete" && `Admin ${log.targetName} dihapus oleh ${log.performedByName}`}
                      {log.action === "update" && `${log.targetName} diupdate oleh ${log.performedByName}`}
                    </p>
                    <p className="text-sm text-gray-500">{formatDate(log.timestamp)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="font-bold text-lg text-blue-900 mb-4">Tambah Admin Baru</h3>
            <form onSubmit={handleAddAdmin} className="space-y-4">
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
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="modal-action">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-ghost"
                >
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-error mb-4">Konfirmasi Hapus</h3>
            <p className="py-4">
              Apakah Anda yakin ingin menghapus admin <strong>{deleteConfirm.name}</strong>?
              <br />
              <span className="text-sm text-gray-500">
                Data yang dihapus akan tercatat dengan timestamp dan nama admin yang menghapus.
              </span>
            </p>
            <div className="modal-action">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="btn btn-ghost"
              >
                Batal
              </button>
              <button
                onClick={() => handleDeleteAdmin(deleteConfirm)}
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