"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, Activity, ShieldCheck, Zap, BarChart2 } from "lucide-react";
import toast from "react-hot-toast";
import { authAPI } from "@/lib/api";
import { saveAuth, isAuthenticated } from "@/lib/auth";
import { PasskeyButton, PasskeyRegisterButton } from "@/components/PasskeyButton";
import type { LoginResponse } from "@/types";

const highlights = [
  { icon: ShieldCheck, text: "Auto-generated secure credentials" },
  { icon: Zap,         text: "Real-time access control" },
  { icon: Activity,    text: "Comprehensive audit trail" },
  { icon: BarChart2,   text: "Passwordless login with Passkeys" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) router.replace("/dashboard");
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const response = await authAPI.login(email, password);
      if (response.success) {
        saveAuth(response.data);
        toast.success(`Welcome back, ${response.data.adminName}!`);
        router.push("/dashboard");
      } else {
        toast.error(response.message || "Login failed");
      }
    } catch (err: any) {
      if (!err.response) {
        toast.error("Unable to connect to server. Please make sure the backend is running.");
      } else {
        toast.error(err.response?.data?.message || "Invalid email or password");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeySuccess = (data: LoginResponse) => {
    saveAuth(data);
    toast.success(`Welcome back, ${data.adminName}!`);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#f0f2f8" }}>

      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex lg:w-[48%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "#1a1d2e" }}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 -left-16 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/40">
            <span className="text-white font-bold text-base">AR+</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-xl leading-tight">ARthoMove</h1>
            <p className="text-gray-400 text-xs">Admin Portal</p>
          </div>
        </div>

        {/* Center content */}
        <div className="relative">
          <div className="w-14 h-14 bg-purple-600/20 rounded-2xl flex items-center justify-center mb-6">
            <Activity className="w-7 h-7 text-purple-400" />
          </div>
          <h2 className="text-white text-3xl font-bold mb-3 leading-tight">
            Rehabilitation
            <br />
            Management System
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-xs">
            Manage doctor profiles, patient recovery programs, and monitor clinical activity from a single unified dashboard.
          </p>

          <div className="space-y-3">
            {highlights.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <span className="text-gray-300 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-gray-600 text-xs">
          © {new Date().getFullYear()} ARthoMove. All rights reserved.
        </p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-base">AR+</span>
            </div>
            <div>
              <h1 className="font-bold text-xl text-gray-900">ARthoMove</h1>
              <p className="text-gray-500 text-xs">Admin Portal</p>
            </div>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
              <p className="text-gray-500 text-sm mt-1.5">Sign in to your admin account to continue</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@arthomove.com"
                    className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:bg-white transition-all"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:bg-white transition-all"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-purple-200 hover:shadow-purple-300 flex items-center justify-center gap-2 mt-1"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in…
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-7">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400 font-medium">or continue with</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Passkey buttons */}
            <div className="space-y-3">
              <PasskeyButton
                email={email}
                onSuccess={handlePasskeySuccess}
                onError={(msg) => toast.error(msg)}
              />

              <PasskeyRegisterButton
                email={email}
                onSuccess={() => alert("Passkey registered successfully")}
                onError={(msg) => alert(msg)}
              />
            </div>

            {!email && (
              <p className="text-xs text-gray-400 text-center mt-3">
                Enter your email above to use a passkey
              </p>
            )}

            {/* Default credentials hint */}
            <div className="mt-8 p-4 bg-purple-50 rounded-xl border border-purple-100">
              <p className="text-xs text-purple-700 text-center leading-relaxed">
                <span className="font-semibold block mb-1">Default credentials</span>
                admin@arthomove.com · Admin@123
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
