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
  const [debugInfo, setDebugInfo] = useState("");

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccessMessage("Pendaftaran berhasil! Silakan login.");
    }
  }, [searchParams]);

  const getBaseUrl = () => {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return "";
  };

  const sendEmailOTP = async (emailToSend: string, otpCode: string) => {
    const emailData = {
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        to_email: emailToSend,
        passcode: otpCode,
        time: "10 menit",
        company_name: "Loure Coffee Shop",
      },
    };

    console.log("Sending email with EmailJS to:", emailToSend);

    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("EmailJS error:", errorText);
      throw new Error(`EmailJS error: ${errorText}`);
    }

    return true;
  };

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setDebugInfo("");

    if (!checkNetwork()) {
      showNetworkError();
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError("Email tidak boleh kosong");
      return;
    }

    setLoading(true);

    try {
      const baseUrl = getBaseUrl();
      const apiUrl = `${baseUrl}/api/auth/login`;
      
      console.log("API URL:", apiUrl);
      setDebugInfo(`Requesting: ${apiUrl}`);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const responseText = await response.text();
      let result;
      
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Parse error:", responseText);
        setError("Server error: Invalid response format");
        setDebugInfo(`Raw response: ${responseText.substring(0, 200)}`);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        setError(result.message || `Error ${response.status}`);
        setDebugInfo(`Status: ${response.status}, Message: ${result.message}`);
        setLoading(false);
        return;
      }

      if (result.success) {
        setUserId(result.userId);
        setUserRole(result.role);
        
        try {
          await sendEmailOTP(result.email, result.otp);
          setStep("otp");
        } catch (emailError) {
          console.error("Email failed:", emailError);
          setError(`Gagal mengirim email. OTP Anda: ${result.otp}`);
          setStep("otp");
        }
      } else {
        setError(result.message || "Login gagal");
      }
    } catch (error) {
      console.error("Network error:", error);
      setError("Terjadi kesalahan koneksi. Periksa jaringan Anda.");
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
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/auth/verify-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          email: email.trim().toLowerCase(),
          otp: otp,
        }),
      });

      let result;
      try {
        result = await response.json();
      } catch {
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
    } catch {
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

          {debugInfo && (
            <div className="alert alert-info mb-4 text-xs">
              <span>{debugInfo}</span>
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
            <Link href="/auth/register" className="text-blue-600 font-medium hover:underline">
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}