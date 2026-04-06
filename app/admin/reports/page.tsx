"use client";

import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Order, DailyReport, MonthlyReport } from "@/types";

export default function ReportsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [reportType, setReportType] = useState<"daily" | "monthly">("daily");

  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setDateFrom(firstDay.toISOString().split("T")[0]);
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
    
    return orderDate >= from && orderDate <= to && order.status === "completed";
  });

  const generateReportData = (): DailyReport[] | MonthlyReport[] => {
    if (reportType === "daily") {
      const grouped: Record<string, DailyReport> = {};
      
      filteredOrders.forEach((order) => {
        const date = new Date(order.createdAt).toISOString().split("T")[0];
        if (!grouped[date]) {
          grouped[date] = { date, orders: 0, revenue: 0, items: 0 };
        }
        grouped[date].orders += 1;
        grouped[date].revenue += order.totalAmount;
        grouped[date].items += order.items.reduce((sum, i) => sum + i.quantity, 0);
      });

      return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
    } else {
      const grouped: Record<string, MonthlyReport> = {};
      
      filteredOrders.forEach((order) => {
        const date = new Date(order.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const monthLabel = date.toLocaleDateString("id-ID", { year: "numeric", month: "long" });
        
        if (!grouped[monthKey]) {
          grouped[monthKey] = { month: monthLabel, orders: 0, revenue: 0, items: 0 };
        }
        grouped[monthKey].orders += 1;
        grouped[monthKey].revenue += order.totalAmount;
        grouped[monthKey].items += order.items.reduce((sum, i) => sum + i.quantity, 0);
      });

      return Object.values(grouped).sort((a, b) => a.month.localeCompare(b.month));
    }
  };

  const downloadExcel = () => {
    const data = generateReportData();
    const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
    const totalOrders = data.reduce((sum, d) => sum + d.orders, 0);
    
    const worksheetData: (string | number)[][] = [
      ["LAPORAN LOURE COFFEE SHOP"],
      ["Periode:", `${dateFrom} s/d ${dateTo}`],
      ["Tipe:", reportType === "daily" ? "Harian" : "Bulanan"],
      [],
      reportType === "daily" 
        ? ["Tanggal", "Jumlah Pesanan", "Total Item", "Pendapatan"]
        : ["Bulan", "Jumlah Pesanan", "Total Item", "Pendapatan"],
      ...data.map((row) => [
        reportType === "daily" ? (row as DailyReport).date : (row as MonthlyReport).month,
        row.orders,
        row.items,
        row.revenue,
      ]),
      [],
      ["TOTAL", totalOrders, data.reduce((sum, d) => sum + d.items, 0), totalRevenue],
    ];

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan");
    
    const fileName = `Laporan_Loure_${reportType}_${dateFrom}_${dateTo}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const reportData = generateReportData();
  const totalRevenue = reportData.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = reportData.reduce((sum, d) => sum + d.orders, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="page-transition space-y-6">
      <h1 className="text-3xl font-bold text-blue-900">Laporan Penjualan</h1>

      <div className="card bg-white shadow-lg p-6">
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
              <span className="label-text">Tipe Laporan</span>
            </label>
            <select
              className="select select-bordered"
              value={reportType}
              onChange={(e) => setReportType(e.target.value as "daily" | "monthly")}
            >
              <option value="daily">Harian</option>
              <option value="monthly">Bulanan</option>
            </select>
          </div>
          <button
            onClick={downloadExcel}
            className="btn btn-success text-white"
            disabled={reportData.length === 0}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-white shadow-lg p-6">
          <p className="text-gray-500 text-sm">Total Pendapatan</p>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="card bg-white shadow-lg p-6">
          <p className="text-gray-500 text-sm">Total Pesanan</p>
          <p className="text-3xl font-bold text-blue-900">{totalOrders}</p>
        </div>
        <div className="card bg-white shadow-lg p-6">
          <p className="text-gray-500 text-sm">Rata-rata per Pesanan</p>
          <p className="text-3xl font-bold text-blue-600">
            {totalOrders > 0 ? formatCurrency(totalRevenue / totalOrders) : formatCurrency(0)}
          </p>
        </div>
      </div>

      <div className="card bg-white shadow-lg overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-blue-900">
            Detail Laporan {reportType === "daily" ? "Harian" : "Bulanan"}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead className="bg-blue-50">
              <tr>
                <th className="text-blue-900">{reportType === "daily" ? "Tanggal" : "Bulan"}</th>
                <th className="text-blue-900 text-right">Jumlah Pesanan</th>
                <th className="text-blue-900 text-right">Total Item</th>
                <th className="text-blue-900 text-right">Pendapatan</th>
              </tr>
            </thead>
            <tbody>
              {reportData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-500">
                    Tidak ada data untuk periode ini
                  </td>
                </tr>
              ) : (
                reportData.map((row, idx) => (
                  <tr key={idx}>
                    <td className="font-medium">
                      {reportType === "daily" 
                        ? formatDate((row as DailyReport).date)
                        : (row as MonthlyReport).month
                      }
                    </td>
                    <td className="text-right">{row.orders}</td>
                    <td className="text-right">{row.items}</td>
                    <td className="text-right font-semibold text-blue-600">
                      {formatCurrency(row.revenue)}
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