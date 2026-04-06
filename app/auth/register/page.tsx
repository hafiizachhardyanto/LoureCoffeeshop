"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useNetwork } from "@/context/NetworkContext";

export default function RegisterPage() {
  const router = useRouter();
  const { checkNetwork, showNetworkError } = useNetwork();
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  });
  
  const [otp, setOtp] = useState("");
  const [userId, setUserId] = useState("");
  const [step, setStep] = useState<"form" | "otp">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!checkNetwork()) {
      showNetworkError();
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setUserId(result.userId);
        setStep("otp");
      } else {
        setError(result.message || "Gagal mendaftar");
      }
    } catch (error) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!checkNetwork()) {
      showNetworkError();
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          email: formData.email,
          otp,
        }),
      });

      const result = await response.json();

      if (result.success) {
        router.push("/auth/login?registered=true");
      } else {
        setError(result.message || "OTP salah");
      }
    } catch (error) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "otp") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="card w-full max-w-md p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-center text-blue-900 mb-2">
            Verifikasi OTP
          </h2>
          <p className="text-center text-gray-600 mb-6">
            Masukkan kode OTP yang dikirim ke {formData.email}
          </p>

          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Kode OTP</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                className="input text-center text-2xl tracking-widest"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading || otp.length !== 6}
            >
              {loading ? <span className="loading-spinner"></span> : "Verifikasi"}
            </button>
          </form>

          <div className="text-center mt-4">
            <button
              onClick={() => setStep("form")}
              className="text-sm text-gray-600 hover:underline"
            >
              Kembali ke form pendaftaran
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="card w-full max-w-md p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-center text-blue-900 mb-2">
          Daftar Akun
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Bergabung dengan Loure Coffee Shop
        </p>

        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nama Lengkap</label>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Masukkan nama Anda"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nomor HP</label>
            <input
              type="tel"
              className="input"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="08xxxxxxxxxx"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className="input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@example.com"
              required
            />
            <p className="text-sm text-gray-600 mt-1">OTP akan dikirim ke email ini</p>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? <span className="loading-spinner"></span> : "Daftar"}
          </button>
        </form>

        <div className="divider">atau</div>

        <p className="text-center text-gray-600">
          Sudah punya akun?{" "}
          <Link href="/auth/login" className="text-blue-900 font-medium hover:underline">
            Masuk sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}