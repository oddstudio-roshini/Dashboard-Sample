"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  KeyRound, CheckCircle, LogOut, Stethoscope, Building2,
  Fingerprint, BadgeCheck,
} from "lucide-react";
import toast from "react-hot-toast";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

interface DoctorInfo {
  doctorId?: number;
  arthomoveId?: string;
  fullName?: string;
  doctorName?: string;
  username?: string;
  clinicalId?: string;
  clinicHospital?: string;
  specialization?: string;
  requirePasswordChange?: boolean;
}

export default function DoctorDashboard() {
  const router = useRouter();
  const [doctor, setDoctor] = useState<DoctorInfo>({});
  const [token, setToken] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [showPwSection, setShowPwSection] = useState(false);

  useEffect(() => {
    const data = localStorage.getItem("doctor_data");
    const tok = localStorage.getItem("doctor_token") || "";
    if (!data) { router.push("/doctor-login"); return; }
    setDoctor(JSON.parse(data));
    setToken(tok);
  }, [router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      if (doctor?.doctorId) {
        await fetch(`${API_BASE}/api/doctors/doctor-signout/${doctor.doctorId}`, {
          method: "POST",
        });
      }
    } catch { /* ignore */ }
    finally {
      localStorage.removeItem("doctor_token");
      localStorage.removeItem("doctor_data");
      router.push("/doctor-login");
    }
  };

  const handleChangePassword = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
      toast.error("All fields are required"); return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error("New passwords do not match"); return;
    }
    if (pwForm.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters"); return;
    }
    setPwLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/doctors/${doctor.doctorId}/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Password changed successfully");
        setPwSuccess(true);
        setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        const stored = localStorage.getItem("doctor_data");
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.requirePasswordChange = false;
          localStorage.setItem("doctor_data", JSON.stringify(parsed));
        }
      } else {
        toast.error(data.message || "Failed to change password");
      }
    } catch { toast.error("Failed to change password"); }
    finally { setPwLoading(false); }
  };

  const displayName = doctor.fullName || doctor.doctorName || "Doctor";

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── TOP NAV ─────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Arthomove</p>
              <p className="text-sm font-bold text-gray-900 leading-tight">Doctor Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPwSection(!showPwSection)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" />
              Change Password
            </button>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              {loggingOut ? "Logging out…" : "Logout"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">

        {/* ── DOCTOR PROFILE CARD ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4">
            {/* Avatar + Name */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Dr. {displayName}</h1>
                {doctor.specialization && (
                  <p className="text-sm text-gray-500 mt-0.5">{doctor.specialization}</p>
                )}
                {doctor.clinicHospital && (
                  <div className="flex items-center gap-1 mt-1">
                    <Building2 className="w-3.5 h-3.5 text-gray-400" />
                    <p className="text-xs text-gray-400">{doctor.clinicHospital}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Online badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-green-700">Online</span>
            </div>
          </div>

          {/* IDs row */}
          <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-gray-100">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <BadgeCheck className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Arthomove ID</p>
                <p className="text-sm font-bold text-indigo-700 font-mono mt-0.5">
                  {doctor.arthomoveId ?? (doctor.doctorId ? `ARTH-${String(doctor.doctorId).padStart(3, "0")}` : "—")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                <Fingerprint className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Doctor ID</p>
                <p className="text-sm font-bold text-purple-700 font-mono mt-0.5">
                  {doctor.username ?? "—"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4 text-teal-600" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Clinical ID</p>
                <p className="text-sm font-bold text-teal-700 font-mono mt-0.5">
                  {doctor.clinicalId ?? "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── CHANGE PASSWORD (collapsible) ───────────────────────── */}
        {showPwSection && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <KeyRound className="w-4 h-4 text-purple-600" />
              <h2 className="text-sm font-bold text-gray-900">Change Password</h2>
            </div>
            {pwSuccess && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl mb-4">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-700 font-medium">Password changed successfully</p>
              </div>
            )}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Current Password", key: "currentPassword" as const },
                { label: "New Password", key: "newPassword" as const },
                { label: "Confirm New Password", key: "confirmPassword" as const },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    {label}
                  </label>
                  <input
                    type="password"
                    value={pwForm[key]}
                    onChange={(e) => { setPwForm({ ...pwForm, [key]: e.target.value }); setPwSuccess(false); }}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleChangePassword}
                disabled={pwLoading}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center gap-2"
              >
                {pwLoading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Changing…</>
                ) : "Change Password"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
