"use client";

import { useNetwork } from "@/context/NetworkContext";

export default function NetworkError() {
  const { networkErrorVisible, isOnline, hideNetworkError } = useNetwork();

  if (!networkErrorVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center">
          <div className="w-16 h-16 bg-error rounded-full flex items-center justify-center mx-auto mb-4">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-8 w-8 text-white" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Gangguan Jaringan
          </h3>
          
          <p className="text-gray-600 mb-6">
            Jaringan pengguna sedang terganggu. Silahkan coba lagi.
          </p>
          
          <button
            onClick={() => {
              hideNetworkError();
              if (!isOnline) {
                window.location.reload();
              }
            }}
            className="btn btn-primary w-full"
          >
            {isOnline ? "Tutup" : "Muat Ulang"}
          </button>
        </div>
      </div>
    </div>
  );
}