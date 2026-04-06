"use client";

import { useState, useEffect } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Order } from "@/types";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    setDateFrom(lastWeek.toISOString().split("T")[0]);
    setDateTo(today.toISOString().split("T")[0]);
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders");
      const result = await response.json();
      
      if (result.success) {
        setOrders(result.data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const orderDate = new Date(order.createdAt);
    const from = dateFrom ? new Date(dateFrom) : new Date("2000-01-01");
    const to = dateTo ? new Date(dateTo) : new Date("2099-12-31");
    to.setHours(23, 59, 59);
    
    const matchesDate = orderDate >= from && orderDate <= to;
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesDate && matchesStatus;
  });

  const totalRevenue = filteredOrders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "badge-warning",
      waiting: "badge-info",
      processing: "badge-primary",
      completed: "badge-success",
      cancelled: "badge-error",
    };
    return statusMap[status] || "badge-ghost";
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "Menunggu Pembayaran",
      waiting: "Menunggu Konfirmasi",
      processing: "Sedang Diproses",
      completed: "Selesai",
      cancelled: "Dibatalkan",
    };
    return statusMap[status] || status;
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
      <h1 className="text-3xl font-bold text-blue-900">Riwayat Pesanan</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-white shadow-lg p-4">
          <p className="text-gray-500 text-sm">Total Pesanan</p>
          <p className="text-2xl font-bold text-blue-900">{filteredOrders.length}</p>
        </div>
        <div className="card bg-white shadow-lg p-4">
          <p className="text-gray-500 text-sm">Pendapatan</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="card bg-white shadow-lg p-4">
          <p className="text-gray-500 text-sm">Selesai</p>
          <p className="text-2xl font-bold text-success">
            {filteredOrders.filter((o) => o.status === "completed").length}
          </p>
        </div>
        <div className="card bg-white shadow-lg p-4">
          <p className="text-gray-500 text-sm">Dibatalkan</p>
          <p className="text-2xl font-bold text-error">
            {filteredOrders.filter((o) => o.status === "cancelled").length}
          </p>
        </div>
      </div>

      <div className="card bg-white shadow-lg p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Dari Tanggal</span>
            </label>
            <input
              type="date"
              className="input input-bordered"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Sampai Tanggal</span>
            </label>
            <input
              type="date"
              className="input input-bordered"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Status</span>
            </label>
            <select
              className="select select-bordered"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu Pembayaran</option>
              <option value="waiting">Menunggu Konfirmasi</option>
              <option value="processing">Sedang Diproses</option>
              <option value="completed">Selesai</option>
              <option value="cancelled">Dibatalkan</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card bg-white shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead className="bg-blue-50">
              <tr>
                <th className="text-blue-900">Order ID</th>
                <th className="text-blue-900">Pelanggan</th>
                <th className="text-blue-900">Items</th>
                <th className="text-blue-900">Total</th>
                <th className="text-blue-900">Status</th>
                <th className="text-blue-900">Tanggal</th>
                <th className="text-blue-900">Metode</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    Tidak ada pesanan
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="font-medium text-blue-900">{order.orderId}</td>
                    <td>
                      <p className="font-medium">{order.userName}</p>
                      <p className="text-sm text-gray-500">{order.userPhone}</p>
                    </td>
                    <td>
                      <p className="text-sm">{order.items.length} item</p>
                      <p className="text-xs text-gray-500">
                        {order.items.map((i) => i.name).join(", ")}
                      </p>
                    </td>
                    <td className="font-semibold text-blue-600">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="text-sm text-gray-600">
                      {formatDate(order.createdAt)}
                    </td>
                    <td>
                      <span className={`badge ${order.paymentMethod === "qris" ? "badge-primary" : "badge-secondary"}`}>
                        {order.paymentMethod === "qris" ? "QRIS" : "Manual"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}