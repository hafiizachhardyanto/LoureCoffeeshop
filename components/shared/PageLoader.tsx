export default function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-100">
      <div className="loading-spinner mb-4"></div>
      <p className="text-gray-500 animate-pulse">Memuat halaman...</p>
    </div>
  );
}