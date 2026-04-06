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
  const [userRole, setUserRole] = useState("");
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
        setUserRole(result.role);
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
          router.push("/admin/dashboard");
        } else {
          router.push("/user/menu");
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="card w-full max-w-md p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-center text-blue-900 mb-2">
            Verifikasi OTP
          </h2>
          <p className="text-center text-gray-600 mb-6">
            Masukkan kode OTP yang dikirim ke {email}
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
              {loading ? <span className="loading-spinner"></span> : "Verifikasi & Masuk"}
            </button>
          </form>

          <div className="text-center mt-4">
            <button
              onClick={() => setStep("email")}
              className="text-sm text-gray-600 hover:underline"
            >
              Kembali
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
          Selamat Datang Kembali
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Masuk ke akun Loure Coffee Shop Anda
        </p>

        {successMessage && (
          <div className="alert alert-success">
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmitEmail} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            {loading ? <span className="loading-spinner"></span> : "Kirim OTP"}
          </button>
        </form>

        <div className="divider">atau</div>

        <p className="text-center text-gray-600">
          Belum punya akun?{" "}
          <Link href="/auth/register" className="text-blue-900 font-medium hover:underline">
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}