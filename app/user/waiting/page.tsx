"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Order } from "@/types";

export default function WaitingPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchOrders = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/orders?userId=${user.id}`);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="page-transition min-h-screen bg-base-100 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-blue-900 mb-8">Pesanan Saya</h1>

        {orders.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">Belum ada pesanan</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="card bg-white shadow-lg">
                <div className="card-body">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-blue-900">{order.orderId}</h3>
                      <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className={`badge ${getStatusBadge(order.status)} badge-lg`}>
                      {getStatusText(order.status)}
                    </div>
                  </div>

                  <div className="divider my-2"></div>

                  <div className="space-y-2 mb-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{item.name} x {item.quantity}</span>
                        <span>{formatCurrency(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <span className="font-semibold text-gray-600">Total</span>
                    <span className="text-xl font-bold text-blue-600">{formatCurrency(order.totalAmount)}</span>
                  </div>

                  {order.status === "pending" && (
                    <div className="alert alert-warning mt-4">
                      <span>Silakan selesaikan pembayaran untuk memproses pesanan</span>
                    </div>
                  )}

                  {order.status === "waiting" && (
                    <div className="alert alert-info mt-4">
                      <span>Pesanan Anda sedang menunggu konfirmasi admin</span>
                    </div>
                  )}

                  {order.status === "processing" && (
                    <div className="alert alert-primary mt-4">
                      <span>Pesanan Anda sedang dipersiapkan</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}