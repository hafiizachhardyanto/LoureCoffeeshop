import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-100">
      <div className="text-center max-w-md p-6">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl font-bold text-blue-600">404</span>
        </div>
        <h2 className="text-3xl font-bold text-blue-900 mb-2">Halaman Tidak Ditemukan</h2>
        <p className="text-gray-600 mb-8">Maaf, halaman yang Anda cari tidak tersedia atau telah dipindahkan.</p>
        <Link href="/" className="btn btn-primary">
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}