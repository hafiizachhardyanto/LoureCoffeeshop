"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Order, MenuItem } from "@/types";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalOrdersToday: 0,
    totalRevenueToday: 0,
    pendingOrders: 0,
    processingOrders: 0,
    totalMenuItems: 0,
    lowStockItems: 0,
  });
  
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      
      const [ordersRes, menuRes] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/menu"),
      ]);

      const ordersData = await ordersRes.json();
      const menuData = await menuRes.json();

      if (ordersData.success && menuData.success) {
        const todayOrders = ordersData.data.filter((order: Order) => 
          order.createdAt.startsWith(today)
        );

        const pending = ordersData.data.filter((order: Order) => order.status === "waiting").length;
        const processing = ordersData.data.filter((order: Order) => order.status === "processing").length;
        
        const lowStock = menuData.data.filter((item: MenuItem) => item.stock < 10).length;

        setStats({
          totalOrdersToday: todayOrders.length,
          totalRevenueToday: todayOrders.reduce((sum: number, order: Order) => sum + order.totalAmount, 0),
          pendingOrders: pending,
          processingOrders: processing,
          totalMenuItems: menuData.data.length,
          lowStockItems: lowStock,
        });

        setRecentOrders(ordersData.data.slice(0, 5));
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
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
      <h1 className="text-3xl font-bold text-blue-900">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-white shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Pesanan Hari Ini</p>
              <p className="text-3xl font-bold text-blue-900">{stats.totalOrdersToday}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card bg-white shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Pendapatan Hari Ini</p>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(stats.totalRevenueToday)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card bg-white shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Menunggu Diproses</p>
              <p className="text-3xl font-bold text-orange-600">{stats.pendingOrders + stats.processingOrders}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card bg-white shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Stok Menipis</p>
              <p className="text-3xl font-bold text-red-600">{stats.lowStockItems}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-white shadow-lg">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-blue-900">Pesanan Terbaru</h2>
              <Link href="/orders" className="text-blue-600 hover:underline text-sm">
                Lihat Semua
              </Link>
            </div>
            
            <div className="space-y-3">
              {recentOrders.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Belum ada pesanan</p>
              ) : (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-blue-900">{order.orderId}</p>
                      <p className="text-sm text-gray-500">{order.userName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-blue-600">{formatCurrency(order.totalAmount)}</p>
                      <span className={`badge badge-sm ${
                        order.status === "completed" ? "badge-success" :
                        order.status === "processing" ? "badge-primary" :
                        order.status === "waiting" ? "badge-info" :
                        "badge-warning"
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="card bg-white shadow-lg">
          <div className="card-body">
            <h2 className="text-xl font-bold text-blue-900 mb-4">Aksi Cepat</h2>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/manual-cashier" className="btn btn-primary btn-lg h-auto py-6 flex flex-col gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Kasir Manual</span>
              </Link>
              
              <Link href="/queue" className="btn btn-info btn-lg h-auto py-6 flex flex-col gap-2 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Antrian</span>
              </Link>
              
              <Link href="/menu" className="btn btn-success btn-lg h-auto py-6 flex flex-col gap-2 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>Kelola Menu</span>
              </Link>
              
              <Link href="/reports" className="btn btn-warning btn-lg h-auto py-6 flex flex-col gap-2 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Laporan</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}