import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-blue-900 text-white py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-blue-900 font-bold text-sm">L</span>
              </div>
              <span className="text-xl font-bold">LOURE.</span>
            </div>
            <p className="text-blue-200 text-sm">
              Premium coffee experience dengan biji pilihan terbaik Indonesia.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Tautan Cepat</h4>
            <ul className="space-y-2 text-blue-200 text-sm">
              <li><Link href="/" className="hover:text-white transition-colors">Beranda</Link></li>
              <li><Link href="/user/menu" className="hover:text-white transition-colors">Menu</Link></li>
              <li><Link href="/auth/login" className="hover:text-white transition-colors">Masuk</Link></li>
              <li><Link href="/auth/register" className="hover:text-white transition-colors">Daftar</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Kontak</h4>
            <ul className="space-y-2 text-blue-200 text-sm">
              <li>Email: info@loure.coffee</li>
              <li>Telp: +62 123 4567 890</li>
              <li>Alamat: Jl. Kopi No. 123, Jakarta</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-blue-800 mt-8 pt-8 text-center text-blue-300 text-sm">
          <p>&copy; 2024 Loure Coffee Shop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}