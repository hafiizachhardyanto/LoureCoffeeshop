"use client";

import { useState, useEffect } from "react";
import { db, collection, query, where, onSnapshot, doc, updateDoc } from "@/lib/firebase";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import type { Order } from "@/types";

export default function QueuePage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"waiting" | "processing">("waiting");

  useEffect(() => {
    const q = query(
      collection(db, "orders"),
      where("status", "in", ["waiting", "processing"])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];
      
      setOrders(ordersData.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleProcess = async (order: Order) => {
    try {
      await updateDoc(doc(db, "orders", order.id), {
        status: "processing",
        updatedAt: new Date().toISOString(),
        processedBy: user?.name,
      });
    } catch (error) {
      console.error("Error processing order:", error);
      alert("Gagal memproses pesanan");
    }
  };

  const handleComplete = async (order: Order) => {
    try {
      await updateDoc(doc(db, "orders", order.id), {
        status: "completed",
        updatedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        processedBy: user?.name,
      });
    } catch (error) {
      console.error("Error completing order:", error);
      alert("Gagal menyelesaikan pesanan");
    }
  };

  const filteredOrders = orders.filter((o) => o.status === activeTab);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="page-transition space-y-6">
      <h1 className="text-3xl font-bold text-blue-900">Antrian Pesanan</h1>

      <div className="tabs tabs-boxed bg-white p-2 shadow-lg w-fit">
        <button
          className={`tab ${activeTab === "waiting" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("waiting")}
        >
          Menunggu ({orders.filter((o) => o.status === "waiting").length})
        </button>
        <button
          className={`tab ${activeTab === "processing" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("processing")}
        >
          Diproses ({orders.filter((o) => o.status === "processing").length})
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full card bg-white shadow-lg p-12 text-center">
            <p className="text-gray-500 text-lg">Tidak ada pesanan dalam antrian ini</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="card bg-white shadow-lg border-l-4 border-blue-500">
              <div className="card-body">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-blue-900">{order.orderId}</h3>
                    <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className={`badge badge-lg ${
                    order.status === "waiting" ? "badge-info" : "badge-primary"
                  }`}>
                    {order.status === "waiting" ? "Menunggu" : "Diproses"}
                  </div>
                </div>

                <div className="divider my-2"></div>

                <div className="mb-4">
                  <p className="font-medium text-blue-900">{order.userName}</p>
                  <p className="text-sm text-gray-500">{order.userPhone}</p>
                  <span className={`badge badge-sm mt-2 ${
                    order.paymentMethod === "qris" ? "badge-primary" : "badge-secondary"
                  }`}>
                    {order.paymentMethod === "qris" ? "QRIS" : "Manual"}
                  </span>
                </div>

                <div className="space-y-2 mb-4 bg-gray-50 p-3 rounded-lg">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.name} x {item.quantity}</span>
                      <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <span className="text-gray-600">Total</span>
                  <span className="text-2xl font-bold text-blue-600">{formatCurrency(order.totalAmount)}</span>
                </div>

                <div className="card-actions mt-4">
                  {order.status === "waiting" ? (
                    <button
                      onClick={() => handleProcess(order)}
                      className="btn btn-primary btn-block"
                    >
                      Proses Pesanan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleComplete(order)}
                      className="btn btn-success btn-block text-white"
                    >
                      Selesaikan Pesanan
                    </button>
                  )}
                </div>

                {order.processedBy && (
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Diproses oleh: {order.processedBy}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}