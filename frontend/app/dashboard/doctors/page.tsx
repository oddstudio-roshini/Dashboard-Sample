"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Download,
  Search,
  ChevronDown,
  Users,
  UserCheck,
  UserMinus,
  Trash2,
  RefreshCw,
  Clock,
  Eye,
} from "lucide-react";

import toast from "react-hot-toast";

import { doctorsAPI } from "@/lib/api";
import { Doctor, DoctorStats } from "@/types";

import CreateDoctorModal from "@/components/CreateDoctorModal";
import EditDoctorModal from "@/components/EditDoctorModal";
import ViewLogsModal from "@/components/ViewLogsModal";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700 border-green-200",
  INACTIVE: "bg-yellow-100 text-yellow-700 border-yellow-200",
  BLOCKED: "bg-red-100 text-red-700 border-red-200",
};

// ─── TOOLTIP CELL ─────────────────────────────────────────────────────────────

function TooltipCell({
  text,
  maxLen = 20,
  className = "",
  emptyText = "—",
}: {
  text: string | undefined | null;
  maxLen?: number;
  className?: string;
  emptyText?: string;
}) {
  if (!text) return <span className="text-gray-400 text-xs">{emptyText}</span>;
  const isTruncated = text.length > maxLen;
  return (
    <span
      className={`block truncate max-w-[120px] ${className}`}
      title={isTruncated ? text : undefined}
    >
      {text}
    </span>
  );
}

// ─── STATUS DOT ───────────────────────────────────────────────────────────────

function StatusDot({ isOnline }: { isOnline: boolean }) {
  if (isOnline) {
    return (
      <span
        className="inline-block w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse flex-shrink-0"
        title="Online — doctor is active in their dashboard"
      />
    );
  }
  return (
    <span
      className="inline-block w-2.5 h-2.5 bg-red-400 rounded-full flex-shrink-0"
      title="Offline — doctor is not logged in"
    />
  );
}

// ─── PAGE COMPONENT ───────────────────────────────────────────────────────────

export default function DoctorsPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [stats, setStats] = useState<DoctorStats>({
    totalDoctors: 0,
    activeDoctors: 0,
    inactiveDoctors: 0,
  });

  // FIX: Separate initial loading from background refresh loading.
  // `initialLoading` shows the full spinner (first load only).
  // `refreshing` shows only the small spinner on the refresh button.
  // Background auto-polls NEVER set initialLoading — no table flash/glitch.
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);

  // Keep search/filter in refs so the interval callback always sees latest values
  // without being recreated every time they change (which caused the glitch).
  const searchRef = useRef(search);
  const filterRef = useRef(statusFilter);
  searchRef.current = search;
  filterRef.current = statusFilter;

  // Core fetch — `silent` = true means don't show spinner (background poll)
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const [doctorsRes, statsRes] = await Promise.all([
        doctorsAPI.getAll(
          searchRef.current || undefined,
          filterRef.current !== "ALL" ? filterRef.current : undefined
        ),
        doctorsAPI.getStats(),
      ]);
      if (doctorsRes.success) setDoctors(doctorsRes.data);
      if (statsRes.success) setStats(statsRes.data);
      setLastUpdated(new Date());
    } catch {
      if (!silent) toast.error("Failed to load doctors");
    } finally {
      setInitialLoading(false);
      if (!silent) setRefreshing(false);
    }
  }, []); // stable — no deps needed because we use refs

  // First load
  useEffect(() => {
    setInitialLoading(true);
    fetchData(false);
  }, [fetchData]);

  // Search / filter change — debounced, shows refreshing spinner
  useEffect(() => {
    const timeout = setTimeout(() => fetchData(false), search ? 400 : 0);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  // FIX: Auto-poll every 10 seconds SILENTLY — no spinner, no table flash.
  // Uses a stable ref-based approach so the interval never needs to be recreated.
  useEffect(() => {
    const interval = setInterval(() => fetchData(true), 300000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Manual refresh button handler
  const handleManualRefresh = () => {
    fetchData(false);
  };

  // Format last updated time
  const formatLastUpdated = (date: Date) => {
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // FIX: Optimistic update — immediately update a single doctor's isOnline in
  // local state without waiting for a re-fetch. This makes status changes
  // appear instant instead of waiting 2-3 seconds for the network round-trip.
  const updateDoctorLocally = (id: number, patch: Partial<Doctor>) => {
    setDoctors((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...patch } : d))
    );
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete Dr. ${name}? This cannot be undone.`)) return;
    try {
      await doctorsAPI.delete(id);
      toast.success("Doctor deleted");
      setDoctors((prev) => prev.filter((d) => d.id !== id));
      fetchData(true); // silent refresh to sync stats
    } catch {
      toast.error("Failed to delete doctor");
    }
  };

  const handleExport = () => {
    const csv = [
      ["Clinical ID", "Name", "Username", "Email", "Specialization", "Status", "Clinic", "Online", "Created"],
      ...doctors.map((d) => [
        d.clinicalId,
        d.fullName,
        d.username,
        d.email,
        d.specialization || "",
        d.status,
        d.clinicHospital || "",
        d.isOnline ? "Online" : "Offline",
        new Date(d.createdAt).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "doctors.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onlineCount = doctors.filter((d) => d.isOnline).length;

  return (
    <div className="flex h-full flex-col overflow-hidden p-4 sm:p-6 lg:p-8">
      {/* HEADER */}
      <div className="flex-none flex flex-wrap items-start justify-between gap-4 mb-6 lg:mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">
              Doctor Accounts Control
            </h1>
            {onlineCount > 0 && (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full"
                title={`${onlineCount} doctor(s) currently active in their dashboard`}
              >
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                {onlineCount} Online
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 max-w-2xl">
            Admin controls doctor access and permissions.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button> */}

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Doctor
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="flex-none grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 mb-6 lg:mb-8">
        <StatCard
          label="Total Doctors"
          value={stats.totalDoctors}
          icon={<Users className="w-5 h-5 text-indigo-500" />}
          iconBg="bg-indigo-50"
        />
        <StatCard
          label="Active Doctors"
          value={stats.activeDoctors}
          icon={<UserCheck className="w-5 h-5 text-green-500" />}
          iconBg="bg-green-50"
        />
        <StatCard
          label="Inactive Doctors"
          value={stats.inactiveDoctors}
          icon={<UserMinus className="w-5 h-5 text-yellow-500" />}
          iconBg="bg-yellow-50"
        />
      </div>

      {/* TABLE */}
      <div className="flex-1 min-h-0 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm">
        {/* TOP BAR */}
        <div className="flex-none flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">Doctors Directory</h2>
            {/* <p className="text-xs text-gray-500 mt-0.5">
              Showing {doctors.length} of {stats.totalDoctors} registered doctors
            </p> */}
          </div>

          {/* REFRESH BUTTON + LAST UPDATED TIMESTAMP */}
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                <span>Updated {formatLastUpdated(lastUpdated)}</span>
              </div>
            )}
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              title="Refresh doctors directory"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                refreshing
                  ? "border-purple-200 text-purple-400 bg-purple-50 cursor-not-allowed"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 cursor-pointer"
              }`}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
            {/* <SlidersHorizontal className="w-4 h-4 text-gray-400" /> */}
            <Download
              className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600"
              onClick={handleExport}
            />
          </div>
        </div>

        {/* SEARCH + FILTER */}
        <div className="flex-none flex flex-wrap items-center gap-3 px-4 sm:px-6 py-4 border-b border-gray-50">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search doctors by name, clinical ID, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-4 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          </div>
        </div>

        {/* TABLE BODY */}
        {initialLoading ? (
          // Full spinner only on very first load
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : doctors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-gray-500">No doctors found.</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-3 text-purple-600 text-sm hover:underline"
            >
              Create your first doctor →
            </button>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="border-b border-gray-100">
                  {[
                    "Arthomove ID",
                    "Doctor",
                    "Clinical ID",
                    "Doctor ID",
                    "Mobile",
                    "Status",
                    "Patients",
                    "Last Login",
                    "Device",
                    "Actions",
                  ].map((col) => (
                    <th
                      key={col}
                      className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {doctors.map((doc) => (
                  <tr
                    key={doc.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      doc.isOnline ? "bg-green-50/30" : ""
                    }`}
                  >
                    {/* ARTHOMOVE ID */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-xs font-bold font-mono text-indigo-700">
                        {doc.arthomoveId ?? `ARTH-${String(doc.id).padStart(3, "0")}`}
                      </span>
                    </td>

                    {/* DOCTOR — status dot + name */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <StatusDot isOnline={!!doc.isOnline} />
                        <div className="min-w-0">
                          <p
                            className="font-medium text-gray-900 text-sm truncate max-w-[140px]"
                            title={doc.fullName}
                          >
                            {doc.fullName}
                          </p>
                          <p
                            className="text-xs text-gray-500 truncate max-w-[140px]"
                            title={doc.email}
                          >
                            {doc.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* CLINICAL ID */}
                    <td className="px-4 py-3.5">
                      <TooltipCell
                        text={doc.clinicalId}
                        maxLen={12}
                        className="text-sm font-mono text-gray-700"
                      />
                    </td>

                    {/* USERNAME */}
                    <td className="px-4 py-3.5">
                      <TooltipCell
                        text={doc.username}
                        maxLen={10}
                        className="text-sm text-gray-700 font-mono"
                      />
                    </td>


                    {/* MOBILE */}
                    <td className="px-4 py-3.5">
                      <TooltipCell
                        text={doc.mobileNumber}
                        maxLen={12}
                        className="text-sm text-gray-600"
                      />
                    </td>

                    {/* STATUS */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[doc.status]}`}
                        title={`Status: ${doc.status}${doc.isSuspended ? " (Suspended by admin)" : ""}`}
                      >
                        {doc.status}
                      </span>
                    </td>

                    {/* PATIENTS */}
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        (doc.patientCount ?? 0) > 0
                          ? 'bg-blue-50 text-blue-700 border border-blue-100'
                          : 'bg-gray-50 text-gray-400 border border-gray-100'
                      }`}>
                        <Users className="w-3 h-3" />
                        {doc.patientCount ?? 0}
                      </span>
                    </td>

                    {/* LAST LOGIN */}
                    <td className="px-4 py-3.5">
                      {doc.lastLogin ? (
                        <span
                          className="text-xs text-gray-600"
                          title={`Last login: ${new Date(doc.lastLogin).toLocaleString("en-IN", {
                            day: "2-digit", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit", hour12: true,
                          })}`}
                        >
                          {new Date(doc.lastLogin).toLocaleDateString("en-IN", {
                            day: "2-digit", month: "short",
                          })}{" "}
                          <span className="text-gray-400">
                            {new Date(doc.lastLogin).toLocaleTimeString("en-IN", {
                              hour: "2-digit", minute: "2-digit", hour12: true,
                            })}
                          </span>
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>

                    {/* DEVICE */}
                    <td className="px-4 py-3.5">
                      <TooltipCell
                        text={doc.device}
                        maxLen={8}
                        className="text-xs text-gray-500"
                      />
                    </td>

                    {/* ACTIONS */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => router.push(`/dashboard/doctors/${doc.id}`)}
                          title="View doctor profile"
                          className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
                        >
                          <Eye className="w-3 h-3" /> View
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDoctor(doc);
                            setShowEditModal(true);
                          }}
                          title="Edit doctor profile"
                          className="px-2 py-1 text-xs rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => {
                            setSelectedDoctor(doc);
                            setShowLogsModal(true);
                          }}
                          title="View activity logs for this doctor"
                          className="px-2 py-1 text-xs rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                        >
                          Logs
                        </button>

                        <button
                          onClick={() => handleDelete(doc.id, doc.fullName)}
                          title="Delete this doctor account permanently"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* FOOTER */}
        <div className="flex-none px-6 py-3 border-t border-gray-50 flex items-center justify-between">
          {/* <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <p className="text-[11px] text-gray-400">
              Doctors with no login for{" "}
              <span className="font-semibold text-gray-500">3+ days</span> are
              auto-set to{" "}
              <span className="font-semibold text-yellow-600">Inactive</span>.
              Status restores on next login.
            </p>
          </div> */}
        </div>
      </div>

      {/* MODALS */}
      <CreateDoctorModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => fetchData(false)}
      />

      {selectedDoctor && (
        <>
          <EditDoctorModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            doctor={selectedDoctor}
            onSuccess={() => fetchData(false)}
          />

          <ViewLogsModal
            isOpen={showLogsModal}
            onClose={() => setShowLogsModal(false)}
            doctor={selectedDoctor}
          />
        </>
      )}
    </div>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  iconBg,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {label}
        </p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
