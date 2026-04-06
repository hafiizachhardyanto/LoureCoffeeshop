"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useNetwork } from "@/context/NetworkContext";
import { formatCurrency } from "@/lib/utils";
import NetworkError from "@/components/shared/NetworkError";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalAmount, clearCart, isProcessing, setIsProcessing } = useCart();
  const { user } = useAuth();
  const { isOnline } = useNetwork();
  
  const [error, setError] = useState("");

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-600 mb-4">Keranjang Kosong</h2>
          <p className="text-gray-500 mb-6">Silakan pilih menu terlebih dahulu</p>
          <button 
            onClick={() => router.push("/menu")}
            className="btn btn-primary"
          >
            Lihat Menu
          </button>
        </div>
      </div>
    );
  }

  const handleCheckout = async () => {
    if (!isOnline) {
      return;
    }

    if (isProcessing) {
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      const response = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          userName: user?.name,
          userPhone: user?.phone,
          userEmail: user?.email,
          items: items.map(item => ({
            menuId: item.menuId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            subtotal: item.subtotal,
          })),
          totalAmount,
        }),
      });

      const result = await response.json();

      if (result.success) {
        clearCart();
        window.location.href = result.redirectUrl;
      } else {
        setError(result.message || "Gagal membuat pembayaran");
        setIsProcessing(false);
      }
    } catch (err) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="page-transition min-h-screen bg-base-100 py-10">
      <NetworkError />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-blue-900 mb-8">Checkout</h1>

        {error && (
          <div className="alert alert-error mb-6">
            <span>{error}</span>
          </div>
        )}

        {!isOnline && (
          <div className="network-error mb-6">
            Jaringan pengguna sedang terganggu silahkan coba lagi
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Ringkasan Pesanan</h2>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.menuId} className="card bg-white p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-blue-900">{item.name}</h3>
                    <p className="text-sm text-gray-500">
                      {item.quantity} x {formatCurrency(item.price)}
                    </p>
                  </div>
                  <span className="font-semibold text-blue-600">
                    {formatCurrency(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>

            <div className="card bg-blue-50 p-4 mt-4">
              <div className="flex justify-between items-center text-xl font-bold">
                <span className="text-blue-900">Total</span>
                <span className="text-blue-600">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Informasi Pengiriman</h2>
            <div className="card bg-white p-6">
              <div className="space-y-4">
                <div>
                  <label className="label">
                    <span className="label-text font-medium">Nama</span>
                  </label>
                  <input 
                    type="text" 
                    className="input input-bordered w-full" 
                    value={user?.name || ""} 
                    disabled 
                  />
                </div>
                <div>
                  <label className="label">
                    <span className="label-text font-medium">Nomor HP</span>
                  </label>
                  <input 
                    type="tel" 
                    className="input input-bordered w-full" 
                    value={user?.phone || ""} 
                    disabled 
                  />
                </div>
                <div>
                  <label className="label">
                    <span className="label-text font-medium">Email</span>
                  </label>
                  <input 
                    type="email" 
                    className="input input-bordered w-full" 
                    value={user?.email || ""} 
                    disabled 
                  />
                </div>
              </div>

              <div className="divider"></div>

              <div className="alert alert-info mb-4">
                <span>Pembayaran menggunakan QRIS (GoPay, ShopeePay, dll)</span>
              </div>

              <button
                onClick={handleCheckout}
                className="btn btn-primary btn-block btn-lg"
                disabled={isProcessing || !isOnline}
              >
                {isProcessing ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    Memproses...
                  </>
                ) : (
                  `Bayar ${formatCurrency(totalAmount)}`
                )}
              </button>

              {isProcessing && (
                <p className="text-sm text-gray-500 text-center mt-2">
                  Jangan tutup atau refresh halaman ini
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}