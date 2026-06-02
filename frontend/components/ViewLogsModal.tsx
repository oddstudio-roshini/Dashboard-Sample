"use client";

import { useState, useEffect } from "react";
import {
  X,
  Activity,
  Monitor,
  User,
  Info,
  LogOut,
  Shield,
  Cpu,
  WifiOff,
} from "lucide-react";
import toast from "react-hot-toast";
import { doctorsAPI } from "@/lib/api";
import { Doctor, DoctorLog, LogAction } from "@/types";

interface Props {
  isOpen: boolean;
  doctor: Doctor | null;
  onClose: () => void;
}

const ACTION_CONFIG: Record<
  LogAction,
  { label: string; color: string; bg: string; dot: string }
> = {
  LOGIN: {
    label: "Login",
    color: "text-green-700",
    bg: "bg-green-100",
    dot: "bg-green-500",
  },
  LOGOUT: {
    label: "Logout",
    color: "text-gray-600",
    bg: "bg-gray-100",
    dot: "bg-gray-400",
  },
  FORCE_LOGOUT: {
    label: "Force Logout",
    color: "text-rose-700",
    bg: "bg-rose-100",
    dot: "bg-rose-500",
  },
  SUSPENDED: {
    label: "Suspended",
    color: "text-orange-700",
    bg: "bg-orange-100",
    dot: "bg-orange-500",
  },
  ACTIVATED: {
    label: "Reinstated",
    color: "text-teal-700",
    bg: "bg-teal-100",
    dot: "bg-teal-500",
  },
  BLOCKED: {
    label: "Blocked",
    color: "text-red-700",
    bg: "bg-red-100",
    dot: "bg-red-500",
  },
  PASSWORD_RESET: {
    label: "Password Reset",
    color: "text-amber-700",
    bg: "bg-amber-100",
    dot: "bg-amber-500",
  },
  PROFILE_UPDATED: {
    label: "Profile Updated",
    color: "text-blue-700",
    bg: "bg-blue-100",
    dot: "bg-blue-500",
  },
  DEACTIVATED: {
    label: "Auto-Deactivated",
    color: "text-slate-600",
    bg: "bg-slate-100",
    dot: "bg-slate-400",
  },
  RECEPTIONIST_LOGIN: {
    label: "Receptionist Login",
    color: "text-violet-700",
    bg: "bg-violet-100",
    dot: "bg-violet-500",
  },
};

function PerformedByBadge({ performedBy }: { performedBy: string }) {
  if (performedBy === "DOCTOR") {
    return (
      <span
        title="Doctor initiated this action"
        className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-green-100 text-green-700"
      >
        <User className="w-2.5 h-2.5" />
        Doctor
      </span>
    );
  }
  if (performedBy === "ADMIN") {
    return (
      <span
        title="Admin initiated this action"
        className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700"
      >
        <Shield className="w-2.5 h-2.5" />
        Admin
      </span>
    );
  }
  if (performedBy === "SYSTEM") {
    return (
      <span
        title="Automatically triggered by the system"
        className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600"
      >
        <Cpu className="w-2.5 h-2.5" />
        System
      </span>
    );
  }
  return (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600">
      {performedBy || "—"}
    </span>
  );
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function TruncText({
  text,
  maxLen = 20,
  className = "",
}: {
  text: string | undefined | null;
  maxLen?: number;
  className?: string;
}) {
  if (!text) return <span className={`text-gray-400 ${className}`}>—</span>;
  return (
    <span
      title={text.length > maxLen ? text : undefined}
      className={`truncate block max-w-full ${className}`}
    >
      {text}
    </span>
  );
}

// Returns start of the current week (Sunday 00:00:00)
function startOfThisWeek(): Date {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

// Returns start of last week
function startOfLastWeek(): Date {
  const d = startOfThisWeek();
  d.setDate(d.getDate() - 7);
  return d;
}

export default function ViewLogsModal({ isOpen, doctor, onClose }: Props) {
  const [logs, setLogs] = useState<DoctorLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [loginPeriod, setLoginPeriod] = useState<"this_week" | "last_week">("this_week");
  const [forceLoggingOut, setForceLoggingOut] = useState(false);

  const fetchLogs = () => {
    if (!doctor) return;
    setLoading(true);
    doctorsAPI
      .getLogs(doctor.id)
      .then((res) => {
        if (res.success) setLogs(res.data);
      })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen && doctor) fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, doctor]);

  if (!isOpen || !doctor) return null;

  // Stats
  const lastLoginLog = logs.find((l) => l.action === "LOGIN");
  const lastDoctorLogoutLog = logs.find(
    (l) => l.action === "LOGOUT" && l.performedBy === "DOCTOR"
  );

  const thisWeekStart = startOfThisWeek();
  const lastWeekStart = startOfLastWeek();

  const thisWeekLoginCount = logs.filter(
    (l) => l.action === "LOGIN" && new Date(l.timestamp) >= thisWeekStart
  ).length;

  const lastWeekLoginCount = logs.filter(
    (l) =>
      l.action === "LOGIN" &&
      new Date(l.timestamp) >= lastWeekStart &&
      new Date(l.timestamp) < thisWeekStart
  ).length;

  const displayedLoginCount =
    loginPeriod === "this_week" ? thisWeekLoginCount : lastWeekLoginCount;

  const forceLogoutLogs = logs.filter((l) => l.action === "FORCE_LOGOUT");

  const handleForceLogout = async () => {
    if (!doctor) return;
    setForceLoggingOut(true);
    try {
      const res = await doctorsAPI.forceLogout(doctor.id);
      if (res.success) {
        toast.success("Doctor session terminated");
        fetchLogs();
      } else {
        toast.error("Force logout failed");
      }
    } catch {
      toast.error("Force logout failed");
    } finally {
      setForceLoggingOut(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="relative ml-auto w-full max-w-4xl bg-white h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Activity Logs</h2>
                <p className="text-xs text-gray-500">
                  Dr. {doctor.firstName} {doctor.lastName} · {doctor.clinicalId}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100">
                    Arthomove: {doctor.arthomoveId ?? `ARTH-${String(doctor.id).padStart(3, "0")}`}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md border border-purple-100">
                    Doctor ID: {doctor.username}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick stats — 3 cards */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            {/* Last Login */}
            <div className="p-3 rounded-xl bg-green-50">
              <User className="w-4 h-4 text-green-600 mb-1" />
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Last Login</p>
              {lastLoginLog ? (
                <div title={formatDateTime(lastLoginLog.timestamp)}>
                  <p className="text-xs font-bold text-green-700">
                    {new Date(lastLoginLog.timestamp).toLocaleTimeString("en-IN", {
                      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
                    })}
                  </p>
                  <p className="text-[10px] text-green-500">
                    {new Date(lastLoginLog.timestamp).toLocaleDateString("en-IN", {
                      day: "2-digit", month: "short", year: "numeric",
                    })}
                  </p>
                </div>
              ) : (
                <p className="text-xs font-bold text-gray-400">—</p>
              )}
            </div>

            {/* Last Logout (doctor-initiated only) */}
            <div className="p-3 rounded-xl bg-gray-50">
              <LogOut className="w-4 h-4 text-gray-500 mb-1" />
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Last Logout</p>
              {lastDoctorLogoutLog ? (
                <div title={formatDateTime(lastDoctorLogoutLog.timestamp)}>
                  <p className="text-xs font-bold text-gray-700">
                    {new Date(lastDoctorLogoutLog.timestamp).toLocaleTimeString("en-IN", {
                      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
                    })}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {new Date(lastDoctorLogoutLog.timestamp).toLocaleDateString("en-IN", {
                      day: "2-digit", month: "short", year: "numeric",
                    })}
                  </p>
                </div>
              ) : (
                <p className="text-xs font-bold text-gray-400">—</p>
              )}
            </div>

            {/* Total Logins — with Last Week / This Week toggle */}
            <div className="p-3 rounded-xl bg-blue-50">
              <User className="w-4 h-4 text-blue-600 mb-1" />
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Total Logins</p>
              <p className="text-sm font-bold text-blue-600 mb-1.5">{displayedLoginCount}</p>
              <div className="flex gap-1">
                <button
                  onClick={() => setLoginPeriod("last_week")}
                  className={`text-[9px] px-1.5 py-0.5 rounded font-semibold transition-colors ${
                    loginPeriod === "last_week"
                      ? "bg-blue-600 text-white"
                      : "bg-blue-100 text-blue-500 hover:bg-blue-200"
                  }`}
                >
                  Last Week
                </button>
                <button
                  onClick={() => setLoginPeriod("this_week")}
                  className={`text-[9px] px-1.5 py-0.5 rounded font-semibold transition-colors ${
                    loginPeriod === "this_week"
                      ? "bg-blue-600 text-white"
                      : "bg-blue-100 text-blue-500 hover:bg-blue-200"
                  }`}
                >
                  This Week
                </button>
              </div>
            </div>

          </div>

          {/* Legend */}
          {/* <div className="flex items-center gap-4 mt-3 px-1">
            <p className="text-[10px] text-gray-400 font-medium">Who acted:</p>
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-green-100 text-green-700 font-semibold">
                <User className="w-2.5 h-2.5" /> Doctor
              </span>
              <span className="text-[10px] text-gray-400">= self-logout / self-login</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 font-semibold">
                <Shield className="w-2.5 h-2.5" /> Admin
              </span>
              <span className="text-[10px] text-gray-400">= admin action</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold">
                <Cpu className="w-2.5 h-2.5" /> System
              </span>
              <span className="text-[10px] text-gray-400">= automated</span>
            </div>
          </div> */}
        </div>

        {/* Log entries */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                <Activity className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">No activity recorded yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Events will appear here as the doctor uses the system
              </p>
            </div>
          ) : displayedLoginCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                <Activity className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">No logins {loginPeriod === "this_week" ? "this week" : "last week"}</p>
              <p className="text-xs text-gray-400 mt-1">
                Switch to {loginPeriod === "this_week" ? "Last Week" : "This Week"} to see other records
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Column headers */}
              <div className="grid grid-cols-8 gap-2 px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <div className="col-span-3">Action</div>
                <div className="col-span-2">Device</div>
                <div className="col-span-2">Timestamp</div>
                <div className="col-span-1">Who Acted</div>
              </div>

              {logs.filter((l) => {
                if (l.action === "PASSWORD_RESET") return false;
                const ts = new Date(l.timestamp);
                if (loginPeriod === "this_week") return ts >= thisWeekStart;
                return ts >= lastWeekStart && ts < thisWeekStart;
              }).map((log, idx) => {
                const config =
                  ACTION_CONFIG[log.action as LogAction] ||
                  ACTION_CONFIG.PROFILE_UPDATED;
                const isForceLogout = log.action === "FORCE_LOGOUT";
                const isReceptionistLogin = log.action === "RECEPTIONIST_LOGIN";

                return (
                  <div
                    key={log.id}
                    className={`grid grid-cols-8 gap-2 px-3 py-3 rounded-xl border transition-colors ${
                      isForceLogout
                        ? "bg-rose-50/40 border-rose-100"
                        : isReceptionistLogin
                        ? "bg-violet-50/40 border-violet-100"
                        : idx % 2 === 0
                        ? "bg-gray-50/50 border-gray-100"
                        : "bg-white border-transparent"
                    } hover:border-gray-200 hover:bg-gray-50`}
                  >
                    {/* Action badge */}
                    <div className="col-span-3 flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dot}`} />
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${config.bg} ${config.color}`}
                        title={config.label}
                      >
                        {config.label}
                      </span>
                    </div>

                    {/* Device */}
                    <div className="col-span-2 flex items-center min-w-0">
                      <div className="flex items-center gap-1 min-w-0 w-full">
                        <Monitor className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <TruncText text={log.device} maxLen={8} className="text-xs text-gray-500" />
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div
                      className="col-span-2 flex items-center"
                      title={formatDateTime(log.timestamp)}
                    >
                      <span className="text-[11px] text-gray-500 leading-tight">
                        {new Date(log.timestamp).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                        })}{" "}
                        <span className="text-gray-400">
                          {new Date(log.timestamp).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </span>
                      </span>
                    </div>

                    {/* Who Acted */}
                    <div className="col-span-1 flex items-center">
                      <PerformedByBadge performedBy={log.performedBy || "ADMIN"} />
                    </div>

                    {/* Notes */}
                    {log.notes && (
                      <div className="col-span-10 flex items-start gap-1.5 pt-1 border-t border-gray-100 mt-1">
                        <Info className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" />
                        <p
                          className="text-[11px] text-gray-500 leading-relaxed"
                          title={log.notes.length > 80 ? log.notes : undefined}
                        >
                          {log.notes}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}

            </div>
          )}

          {/* ── FORCE LOGOUT SECTION ──────────────────────────────────── */}
          <div className="mt-6 pt-5 border-t-2 border-dashed border-rose-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                  <WifiOff className="w-4 h-4 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-800">Force Logout</h3>
                  <p className="text-[10px] text-gray-400">
                    {forceLogoutLogs.length} record{forceLogoutLogs.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              {/* <div className="flex items-center gap-2">
                {doctor.isOnline ? (
                  <button
                    onClick={handleForceLogout}
                    disabled={forceLoggingOut}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white text-xs font-semibold rounded-xl transition-colors"
                  >
                    <WifiOff className="w-3.5 h-3.5" />
                    {forceLoggingOut ? "Logging out…" : "Force Logout Now"}
                  </button>
                ) : (
                  <span className="text-[11px] text-gray-400 italic bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                    Doctor is currently offline
                  </span>
                )}
              </div> */}
            </div>
{/* 
            <p className="text-[11px] text-gray-400 mb-3">
              Use force logout when the doctor is stuck or unable to exit due to network issues. Their session will be terminated immediately.
            </p> */}

            {forceLogoutLogs.length === 0 ? (
              <div className="flex items-center gap-2 py-4 px-3 bg-gray-50 rounded-xl border border-gray-100">
                <WifiOff className="w-4 h-4 text-gray-300 flex-shrink-0" />
                <p className="text-xs text-gray-400">No force logout records for this doctor.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {forceLogoutLogs.map((log, i) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-rose-50 border border-rose-100"
                  >
                    <div className="w-6 h-6 rounded-full bg-rose-200 flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold text-rose-700">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-rose-700">
                          Session terminated by Admin
                        </span>
                        <span className="text-[10px] bg-rose-100 text-rose-500 px-1.5 py-0.5 rounded font-mono">
                          {formatDateTime(log.timestamp)}
                        </span>
                      </div>
                      {log.clinic && (
                        <p className="text-[11px] text-gray-500 mt-0.5">Clinic: {log.clinic}</p>
                      )}
                      {log.notes && (
                        <p className="text-[11px] text-gray-400 mt-0.5">{log.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {/* <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">{logs.length} total events recorded</p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium"
          >
            Close
          </button>
        </div> */}
      </div>
    </div>
  );
}
