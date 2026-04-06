"use client";

import { useState, useEffect } from "react";
import { db, collection, getDocs, doc, setDoc, Timestamp, increment, updateDoc } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useNetwork } from "@/context/NetworkContext";
import { formatCurrency, generateOrderId } from "@/lib/utils";
import type { MenuItem, OrderItem } from "@/types";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";

export default function ManualCashierPage() {
  const { user } = useAuth();
  const { isOnline } = useNetwork();
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "menu"));
      const items: MenuItem[] = [];
      querySnapshot.forEach((docSnapshot: QueryDocumentSnapshot<DocumentData>) => {
        const data = docSnapshot.data() as MenuItem;
        if (data.isAvailable && data.stock > 0) {
          items.push({ ...data, id: docSnapshot.id });
        }
      });
      setMenuItems(items);
    } catch (error) {
      console.error("Error fetching menu:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: MenuItem) => {
    const existing = cart.find((c) => c.menuId === item.id);
    
    if (existing) {
      if (existing.quantity >= item.stock) {
        alert("Stok tidak mencukupi");
        return;
      }
      setCart(cart.map((c) =>
        c.menuId === item.id
          ? { ...c, quantity: c.quantity + 1, subtotal: (c.quantity + 1) * c.price }
          : c
      ));
    } else {
      setCart([
        ...cart,
        {
          menuId: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          subtotal: item.price,
        },
      ]);
    }
  };

  const updateQuantity = (menuId: string, delta: number) => {
    const item = cart.find((c) => c.menuId === menuId);
    if (!item) return;

    const menuItem = menuItems.find((m) => m.id === menuId);
    if (!menuItem) return;

    const newQuantity = item.quantity + delta;
    
    if (newQuantity <= 0) {
      setCart(cart.filter((c) => c.menuId !== menuId));
      return;
    }

    if (newQuantity > menuItem.stock) {
      alert("Stok tidak mencukupi");
      return;
    }

    setCart(cart.map((c) =>
      c.menuId === menuId
        ? { ...c, quantity: newQuantity, subtotal: newQuantity * c.price }
        : c
    ));
  };

  const removeFromCart = (menuId: string) => {
    setCart(cart.filter((c) => c.menuId !== menuId));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);

  const handleCheckout = async () => {
    if (!isOnline) {
      alert("Jaringan pengguna sedang terganggu silahkan coba lagi");
      return;
    }

    if (cart.length === 0) {
      alert("Keranjang masih kosong");
      return;
    }

    if (!customerName.trim()) {
      alert("Nama pembeli harus diisi");
      return;
    }

    if (processing) return;
    setProcessing(true);

    try {
      const orderId = generateOrderId();

      await setDoc(doc(db, "orders", orderId), {
        id: orderId,
        orderId,
        userId: "manual",
        userName: customerName,
        userPhone: "-",
        items: cart,
        totalAmount,
        status: "waiting",
        paymentMethod: "manual",
        paymentStatus: "success",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        processedBy: user?.name,
      });

      for (const item of cart) {
        await updateDoc(doc(db, "menu", item.menuId), {
          stock: increment(-item.quantity),
        });
      }

      setCart([]);
      setCustomerName("");
      alert(`Pesanan ${orderId} berhasil dibuat`);
      fetchMenu();
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Gagal membuat pesanan");
    } finally {
      setProcessing(false);
    }
  };

  const categories = ["all", ...Array.from(new Set(menuItems.map((item) => item.category)))];
  const filteredItems = selectedCategory === "all"
    ? menuItems
    : menuItems.filter((item) => item.category === selectedCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="page-transition space-y-6">
      <h1 className="text-3xl font-bold text-blue-900">Kasir Manual</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-white shadow-lg p-4">
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`btn btn-sm ${selectedCategory === cat ? "btn-primary" : "btn-outline"}`}
                >
                  {cat === "all" ? "Semua" : cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <div key={item.id} className="card bg-white shadow hover:shadow-lg transition-shadow">
                <div className="card-body p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-blue-900">{item.name}</h3>
                      <p className="text-sm text-gray-500">{item.category}</p>
                    </div>
                    <span className="badge badge-primary">{formatCurrency(item.price)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{item.description}</p>
                  <div className="flex justify-between items-center mt-3">
                    <span className={`text-sm ${item.stock < 10 ? "text-error" : "text-success"}`}>
                      Stok: {item.stock}
                    </span>
                    <button
                      onClick={() => addToCart(item)}
                      className="btn btn-primary btn-sm"
                      disabled={item.stock === 0}
                    >
                      Tambah
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card bg-white shadow-lg sticky top-6">
            <div className="card-body">
              <h2 className="card-title text-blue-900">Keranjang</h2>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text font-medium">Nama Pembeli</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Masukkan nama pembeli"
                />
              </div>

              <div className="divider"></div>

              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Keranjang kosong</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.menuId} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500">{formatCurrency(item.price)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.menuId, -1)}
                          className="btn btn-xs btn-outline"
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.menuId, 1)}
                          className="btn btn-xs btn-outline"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(item.menuId)}
                          className="btn btn-xs btn-error text-white ml-2"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="divider"></div>

              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-bold text-blue-900">Total</span>
                <span className="text-2xl font-bold text-blue-600">{formatCurrency(totalAmount)}</span>
              </div>

              <button
                onClick={handleCheckout}
                className="btn btn-primary btn-block"
                disabled={cart.length === 0 || !customerName.trim() || processing || !isOnline}
              >
                {processing ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    Memproses...
                  </>
                ) : (
                  "Buat Pesanan"
                )}
              </button>

              {!isOnline && (
                <p className="text-xs text-error text-center mt-2">
                  Jaringan pengguna sedang terganggu silahkan coba lagi
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}