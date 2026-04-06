"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useNetwork } from "@/context/NetworkContext";
import { formatCurrency } from "@/lib/utils";
import type { MenuItem } from "@/types";

export default function UserMenuPage() {
  const { addToCart } = useCart();
  const { checkNetwork, showNetworkError } = useNetwork();
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState<string[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const response = await fetch("/api/menu?available=true");
      const result = await response.json();
      
      if (result.success) {
        setMenuItems(result.data);
        const uniqueCategories: string[] = [...new Set<string>(result.data.map((item: MenuItem) => item.category))];
        setCategories(uniqueCategories);
        
        const initialQuantities: Record<string, number> = {};
        result.data.forEach((item: MenuItem) => {
          initialQuantities[item.id] = 1;
        });
        setQuantities(initialQuantities);
      }
    } catch (error) {
      console.error("Error fetching menu:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item: MenuItem) => {
    if (!checkNetwork()) {
      showNetworkError();
      return;
    }

    const quantity = quantities[item.id] || 1;
    
    if (quantity > item.stock) {
      alert("Stok tidak mencukupi");
      return;
    }

    addToCart(item, quantity);
    alert(`${item.name} ditambahkan ke keranjang`);
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(1, (prev[itemId] || 1) + delta)
    }));
  };

  const filteredItems = selectedCategory === "all" 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="page-transition min-h-screen bg-base-100 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-blue-900 mb-4">Menu Kami</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Pilih menu favorit Anda dan tambahkan ke keranjang
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-10">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`btn ${selectedCategory === "all" ? "btn-primary" : "btn-outline"}`}
          >
            Semua
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`btn ${selectedCategory === category ? "btn-primary" : "btn-outline"}`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="card card-loure bg-white shadow-lg">
              <figure className="h-48 bg-gray-200 flex items-center justify-center">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-6xl font-bold text-blue-300">LOURE</div>
                )}
              </figure>
              <div className="card-body">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="card-title text-lg text-blue-900">{item.name}</h3>
                  <div className="badge badge-primary">{item.category}</div>
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>
                
                <div className="flex items-center gap-1 mb-3">
                  <div className="rating rating-sm">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <input
                        key={star}
                        type="radio"
                        className="mask mask-star-2 bg-orange-400"
                        checked={Math.round(item.rating) === star}
                        readOnly
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">({item.rating})</span>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-bold text-blue-600">
                    {formatCurrency(item.price)}
                  </span>
                  <span className={`text-sm ${item.stock > 0 ? "text-success" : "text-error"}`}>
                    {item.stock > 0 ? `Stok: ${item.stock}` : "Habis"}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <button 
                    className="btn btn-sm btn-outline"
                    onClick={() => updateQuantity(item.id, -1)}
                    disabled={quantities[item.id] <= 1}
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-medium">{quantities[item.id] || 1}</span>
                  <button 
                    className="btn btn-sm btn-outline"
                    onClick={() => updateQuantity(item.id, 1)}
                    disabled={quantities[item.id] >= item.stock}
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => handleAddToCart(item)}
                  className="btn btn-primary btn-block"
                  disabled={item.stock === 0}
                >
                  {item.stock === 0 ? "Stok Habis" : "Tambah ke Keranjang"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">Tidak ada menu dalam kategori ini</p>
          </div>
        )}
      </div>
    </div>
  );
}