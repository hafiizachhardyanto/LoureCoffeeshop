"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import type { MenuItem } from "@/types";

export default function PublicMenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState<string[]>([]);

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
      }
    } catch (error) {
      console.error("Error fetching menu:", error);
    } finally {
      setLoading(false);
    }
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
            Pilihan kopi dan minuman berkualitas untuk menemani hari Anda
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

                <div className="flex justify-between items-center mt-auto">
                  <span className="text-2xl font-bold text-blue-600">
                    {formatCurrency(item.price)}
                  </span>
                  <span className={`text-sm ${item.stock > 0 ? "text-success" : "text-error"}`}>
                    {item.stock > 0 ? `Stok: ${item.stock}` : "Habis"}
                  </span>
                </div>

                <div className="card-actions mt-4">
                  <Link 
                    href="/login" 
                    className="btn btn-primary btn-block"
                  >
                    Login untuk Pesan
                  </Link>
                </div>
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