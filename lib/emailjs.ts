import emailjs from "@emailjs/browser";

const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "";
const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "template_7wvt99k";
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "";

export interface OTPData {
  email: string;
  name: string;
  otp: string;
}

export async function sendOTP(data: OTPData): Promise<boolean> {
  try {
    const templateParams = {
      to_email: data.email,
      to_name: data.name,
      otp_code: data.otp,
      message: `Kode OTP Anda adalah: ${data.otp}. Kode ini berlaku selama 10 menit.`,
    };

    await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
    return true;
  } catch (error) {
    console.error("EmailJS Error:", error);
    return false;
  }
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function storeOTP(email: string, otp: string): void {
  const expiry = Date.now() + 10 * 60 * 1000;
  const data = { otp, expiry };
  localStorage.setItem(`otp_${email}`, JSON.stringify(data));
}

export function verifyOTP(email: string, inputOTP: string): boolean {
  const stored = localStorage.getItem(`otp_${email}`);
  if (!stored) return false;

  const { otp, expiry } = JSON.parse(stored);
  if (Date.now() > expiry) {
    localStorage.removeItem(`otp_${email}`);
    return false;
  }

  if (otp === inputOTP) {
    localStorage.removeItem(`otp_${email}`);
    return true;
  }

  return false;
}

export function clearOTP(email: string): void {
  localStorage.removeItem(`otp_${email}`);
}