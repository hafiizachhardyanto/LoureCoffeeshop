"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useNetwork } from "@/context/NetworkContext";
import { useAuth } from "@/context/AuthContext";
import { setAuthCookies } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { checkNetwork, showNetworkError } = useNetwork();
  const { refreshUser } = useAuth();
  
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [userId, setUserId] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccessMessage("Pendaftaran berhasil! Silakan login.");
    }
  }, [searchParams]);

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!checkNetwork()) {
      showNetworkError();
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (result.success) {
        setUserId(result.userId);
        setStep("otp");
      } else {
        setError(result.message || "Email tidak terdaftar");
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
      const response = await fetch("/api/auth/verify-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          email,
          otp,
        }),
      });

      const result = await response.json();

      if (result.success) {
        localStorage.setItem("sessionToken", result.sessionToken);
        setAuthCookies({
          id: result.userId,
          role: result.role,
          sessionToken: result.sessionToken,
          name: result.name,
          phone: result.phone,
          email: result.email,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        });
        await refreshUser();
        
        if (result.role === "admin") {
          router.push("/dashboard");
        } else {
          router.push("/menu");
        }
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700 p-4">
        <div className="card bg-white shadow-2xl w-full max-w-md">
          <div className="card-body p-8">
            <h2 className="text-2xl font-bold text-center text-blue-900 mb-2">
              Verifikasi OTP
            </h2>
            <p className="text-center text-gray-600 mb-6">
              Masukkan kode OTP yang dikirim ke {email}
            </p>

            {error && (
              <div className="alert alert-error mb-4">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Kode OTP</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className="input input-bordered text-center text-2xl tracking-widest"
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
                {loading ? <span className="loading loading-spinner"></span> : "Verifikasi & Masuk"}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => setStep("email")}
                className="text-blue-600 hover:underline text-sm"
              >
                Kembali
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700 p-4">
      <div className="card bg-white shadow-2xl w-full max-w-md">
        <div className="card-body p-8">
          <div className="absolute top-4 left-4">
            <Link href="/" className="flex items-center gap-3 text-white hover:text-blue-200 transition-colors">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-blue-900 font-bold text-sm">L</span>
              </div>
              <span className="text-xl font-bold">LOURE.</span>
            </Link>
          </div>

          <h2 className="text-2xl font-bold text-center text-blue-900 mb-2 mt-8">
            Selamat Datang Kembali
          </h2>
          <p className="text-center text-gray-600 mb-6">
            Masuk ke akun Loure Coffee Shop Anda
          </p>

          {successMessage && (
            <div className="alert alert-success mb-4">
              <span>{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmitEmail} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Email</span>
              </label>
              <input
                type="email"
                className="input input-bordered"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
              />
              <label className="label">
                <span className="label-text-alt text-gray-500">OTP akan dikirim ke email ini</span>
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? <span className="loading loading-spinner"></span> : "Kirim OTP"}
            </button>
          </form>

          <div className="divider my-6">atau</div>

          <p className="text-center text-gray-600">
            Belum punya akun?{" "}
            <Link href="/register" className="text-blue-600 font-medium hover:underline">
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}