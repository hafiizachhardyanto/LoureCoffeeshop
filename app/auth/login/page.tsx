"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useNetwork } from "@/context/NetworkContext";
import { useAuth } from "@/context/AuthContext";
import { setAuthCookies } from "@/lib/auth";

const EMAILJS_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

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

  const sendEmailOTP = async (emailToSend: string, otpCode: string) => {
    const emailData = {
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        email: emailToSend,
        passcode: otpCode,
        time: "10 menit",
        company_name: "Loure Coffee Shop",
      },
    };

    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`EmailJS error: ${errorText}`);
    }

    return true;
  };

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!checkNetwork()) {
      showNetworkError();
      return;
    }

    if (!email || email.trim() === "") {
      setError("Email tidak boleh kosong");
      return;
    }

    setLoading(true);

    try {
      console.log("Sending login request for:", email.trim());

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      console.log("Response status:", response.status);

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        const text = await response.text();
        console.error("Failed to parse response:", text);
        setError("Server error: Invalid response");
        setLoading(false);
        return;
      }

      console.log("Response result:", result);

      if (result.success) {
        setUserId(result.userId);
        setUserRole(result.role);
        
        try {
          await sendEmailOTP(result.email, result.otp);
          setStep("otp");
        } catch (emailError) {
          console.error("Email error:", emailError);
          setError("Gagal mengirim email. OTP Anda: " + result.otp);
          setStep("otp");
        }
      } else {
        setError(result.message || "Email tidak terdaftar");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setError("Terjadi kesalahan koneksi. Silakan coba lagi.");
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

    if (!otp || otp.length !== 6) {
      setError("OTP harus 6 digit");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/verify-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          email: email.trim(),
          otp,
        }),
      });

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        setError("Server error: Invalid response");
        setLoading(false);
        return;
      }

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
            <div className="alert alert-error mb-4">
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
                className="input text-center text-2xl tracking-widest w-full"
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
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className="input w-full"
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
            {loading ? <span className="loading loading-spinner"></span> : "Kirim OTP"}
          </button>
        </form>

        <div className="divider my-6">atau</div>

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