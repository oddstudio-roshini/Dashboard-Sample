"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Clock,
  ExternalLink,
  FileText,
  History,
  LogIn,
  LogOut,
  RefreshCw,
  Shield,
  Smartphone,
  Monitor,
  User,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { patientApi, getFileUrl } from "@/lib/patientApi";
import type {
  ActivityLogItem,
  ActivityStats,
  BodyPartLibraryItem,
  HistoryItem,
  PatientExerciseLibraryResponse,
  ScheduleItem,
} from "@/types/patients";

type SideTab = "history" | "previous" | "upcoming" | "logs";
const PAGE_SIZE = 5;

/* ── Badges ─────────────────────────────────────────────────────────────── */
function Badge({
  value,
  type = "neutral",
}: {
  value?: string;
  type?: "status" | "purchase" | "difficulty" | "neutral";
}) {
  const v = (value || "—").toUpperCase();
  let cls = "bg-gray-100 text-gray-600 border-gray-200";
  if (type === "status")
    cls =
      v === "ACTIVE"
        ? "bg-green-100 text-green-700 border-green-200"
        : "bg-gray-100 text-gray-600 border-gray-200";
  if (type === "purchase")
    cls =
      v === "SINGLE"
        ? "bg-orange-100 text-orange-700 border-orange-200"
        : v === "BUNDLE"
          ? "bg-purple-100 text-purple-700 border-purple-200"
          : "bg-gray-100 text-gray-500 border-gray-200";
  if (type === "difficulty")
    cls =
      v === "HARD"
        ? "bg-red-100 text-red-700 border-red-200"
        : v === "MEDIUM"
          ? "bg-yellow-100 text-yellow-700 border-yellow-200"
          : "bg-green-100 text-green-700 border-green-200";
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {v === "—" ? "—" : v.charAt(0) + v.slice(1).toLowerCase()}
    </span>
  );
}

/* ── File viewer modal ───────────────────────────────────────────────────── */
function FileViewerModal({ url, label, onClose }: { url: string; label: string; onClose: () => void }) {
  const fullUrl = getFileUrl(url);
  const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/i.test(fullUrl);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-gray-950">{label}</h3>
          </div>
          <div className="flex items-center gap-2">
            <a href={fullUrl} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
              <ExternalLink className="h-3.5 w-3.5" /> Open in Tab
            </a>
            <button onClick={onClose} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {isImage ? (
            <img src={fullUrl} alt={label} className="mx-auto max-h-[75vh] rounded-xl object-contain" />
          ) : (
            <iframe src={fullUrl} title={label} className="h-[75vh] w-full rounded-xl border border-gray-200" />
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Side-panel tabs ─────────────────────────────────────────────────────── */
const TABS: { key: SideTab; label: string; icon: React.ReactNode }[] = [
  { key: "history",  label: "History",  icon: <History className="h-3.5 w-3.5" /> },
  { key: "logs",     label: "Logs",     icon: <Activity className="h-3.5 w-3.5" /> },
  { key: "previous", label: "Previous", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  { key: "upcoming", label: "Upcoming", icon: <CalendarDays className="h-3.5 w-3.5" /> },
];

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function PatientExerciseLibraryPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = Number(params.patientId);

  const [data, setData]       = useState<PatientExerciseLibraryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewer, setViewer]   = useState<{ url: string; label: string } | null>(null);
  const [activeTab, setActiveTab] = useState<SideTab>("history");
  const [page, setPage]       = useState(1);

  const fetchLibrary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await patientApi.getExerciseLibrary(patientId);
      setData(res);
      setPage(1);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.response?.data?.error || "Patient exercise library not found.");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => { if (patientId) fetchLibrary(); }, [patientId, fetchLibrary]);

  const patient  = data?.patient;
  const bodyParts = useMemo(() => data?.bodyParts || [], [data]);

  const totalPages    = Math.max(1, Math.ceil(bodyParts.length / PAGE_SIZE));
  const pagedRows     = useMemo(() => bodyParts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [bodyParts, page]);
  const showStart     = bodyParts.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showEnd       = Math.min(page * PAGE_SIZE, bodyParts.length);

  if (loading) return (
    <div className="flex h-full items-center justify-center text-gray-500 text-sm">
      <Activity className="mr-2 h-4 w-4 animate-spin" /> Loading patient exercise library...
    </div>
  );
  if (!data || !patient) return (
    <div className="flex h-full items-center justify-center text-red-500 text-sm">
      Patient exercise library not found.
    </div>
  );

  const isLocked     = (patient.paymentStatus || '').toUpperCase() === 'FAILED';

  const history      = data.history || [];
  const previous     = data.previousExercises || [];
  const upcoming     = data.upcomingExercises || [];
  const activityStats: ActivityStats = data.activityStats ?? { recentLogs: [], activeDays7: [], activityMap30: {} };
  const tabCounts: Record<SideTab, number> = {
    history: history.length,
    logs: activityStats.recentLogs.length,
    previous: previous.length,
    upcoming: upcoming.length,
  };

  return (
    <>
      {viewer && <FileViewerModal url={viewer.url} label={viewer.label} onClose={() => setViewer(null)} />}

      <div className="flex h-full flex-col overflow-hidden bg-gray-50 p-4">

        {/* ── Header ── */}
        <div className="mb-3 flex flex-none items-center justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs text-gray-500">
              <Link href="/dashboard/patients" className="hover:text-purple-700">Patients</Link>
              <span>/</span>
              <span>{patient.patient}</span>
              <span>/</span>
              <span className="font-semibold text-gray-800">Exercise Library</span>
            </div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-950">
              <BookOpen className="h-6 w-6 text-purple-600" />
              Exercise Library — {patient.patient}
            </h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => router.back()}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button onClick={fetchLibrary}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>
        </div>

        {/* ── Patient Profile ── */}
        <div className="mb-3 flex-none overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="grid grid-cols-2 divide-y divide-gray-100 md:grid-cols-5 md:divide-x md:divide-y-0">
            <ProfileField icon={<User className="h-4 w-4" />}         label="Patient Name"       value={patient.patient} />
            <ProfileField icon={<Shield className="h-4 w-4" />}       label="Injury / Diagnosis" value={patient.injury || (patient as any).diagnosis || "—"} />
            <ProfileField icon={<CalendarDays className="h-4 w-4" />} label="Join Date"          value={String(patient.joinDate || "—")} />
            <ProfileField icon={<User className="h-4 w-4" />}         label="Doctor Assigned"    value={patient.doctorAssigned || "—"} />
            <ProfileField icon={<Activity className="h-4 w-4" />}     label="Status"             value={patient.status} isStatus paymentStatus={patient.paymentStatus} />
          </div>
        </div>

        {/* ── Section header ── */}
        <div className="mb-2 flex flex-none items-center justify-between">
          <h2 className="text-base font-bold text-gray-950">Body Parts &amp; Exercises</h2>
        </div>

        {/* ── Table + Side panel ── */}
        <div className="flex flex-1 min-h-0 gap-4 overflow-hidden">

          {/* Table card */}
          <div className="flex flex-1 min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex-1 overflow-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Body Part</th>
                    <th className="px-4 py-3 font-semibold">Exercise Name</th>
                    <th className="px-4 py-3 font-semibold">Exercise Status</th>
                    <th className="px-4 py-3 font-semibold">Duration</th>
                    <th className="px-4 py-3 font-semibold">Reps Done</th>
                    <th className="px-4 py-3 font-semibold">Sets Done</th>
                    <th className="px-4 py-3 font-semibold">Sessions</th>
                    <th className="px-4 py-3 font-semibold">Difficulty</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pagedRows.length === 0 ? (
                    <tr><td colSpan={10} className="px-4 py-10 text-center text-sm text-gray-400">No body parts assigned yet.</td></tr>
                  ) : pagedRows.map((item) => {
                    const status = String(item.status).toUpperCase();
                    const type   = String(item.type).toUpperCase();
                    const active = status === "ACTIVE";
                    return (
                      <tr key={item.bodyPartId} className="hover:bg-purple-50/30">

                        {/* Body Part */}
                        <td className="px-4 py-3">
                          <span className="font-semibold text-gray-950">{item.bodyPart}</span>
                        </td>

                        {/* Exercise Name */}
                        <td className="px-4 py-3 text-gray-700">
                          {item.exerciseName || "—"}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <Badge value={item.status} type="status" />
                        </td>

                        {/* Duration */}
                        <td className="px-4 py-3 text-gray-700">
                          {isLocked ? <span className="text-gray-400">—</span> :
                            (item.completedDurationMins ?? 0) > 0
                              ? `${item.completedDurationMins} min`
                              : <span className="text-gray-400">0 min</span>}
                        </td>

                        {/* Reps Done */}
                        <td className="px-4 py-3">
                          {isLocked ? <span className="text-gray-400">—</span> :
                            (item.targetReps ?? 0) > 0 ? (
                              <span className={`font-semibold ${active ? "text-blue-600" : "text-orange-500"}`}>
                                {item.completedReps ?? 0} / {item.targetReps}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                        </td>

                        {/* Sets Done */}
                        <td className="px-4 py-3">
                          {isLocked ? <span className="text-gray-400">—</span> :
                            (item.targetSets ?? 0) > 0 ? (
                              <span className={`font-semibold ${active ? "text-green-600" : "text-orange-500"}`}>
                                {item.completedSets ?? 0} / {item.targetSets}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                        </td>

                        {/* Sessions */}
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                          {isLocked ? <span className="text-gray-400">—</span> :
                            (item.sessionCount ?? 0) > 0
                              ? `${item.sessionCount} session${(item.sessionCount ?? 0) !== 1 ? "s" : ""}`
                              : <span className="text-gray-400">0 sessions</span>}
                        </td>

                        {/* Difficulty */}
                        <td className="px-4 py-3">
                          {isLocked ? <span className="text-gray-400">—</span> : <Badge value={item.difficulty} type="difficulty" />}
                        </td>

                        {/* Type */}
                        <td className="px-4 py-3">
                          {isLocked ? <span className="text-gray-400">—</span> : <Badge value={item.type} type="purchase" />}
                        </td>

                        {/* Actions — locked if payment failed, else View Bundle if BUNDLE + purchased */}
                        <td className="px-4 py-3">
                          {isLocked ? (
                            <span className="text-gray-400">—</span>
                          ) : type === "BUNDLE" && (item.activePurchasedExerciseCount ?? 0) > 0 ? (
                            <Link
                              href={`/dashboard/patients/${patientId}/library/${item.bodyPartId}`}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-purple-700"
                            >
                              <BookOpen className="h-3 w-3" /> View Bundle
                            </Link>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
              <p className="text-xs text-gray-500">
                Showing {showStart} to {showEnd} of {bodyParts.length} exercises
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                      page === i + 1
                        ? "bg-purple-600 text-white"
                        : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* ── Side panel ── */}
          <div className="w-72 shrink-0 flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            {/* Tab bar */}
            <div className="flex shrink-0 border-b border-gray-200">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex flex-1 items-center justify-center gap-1 py-2.5 text-[11px] font-semibold transition-colors ${
                    activeTab === tab.key
                      ? "border-b-2 border-purple-600 bg-purple-50 text-purple-700"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-auto p-4">

              {/* History */}
              {activeTab === "history" && (
                history.length === 0 ? (
                  <EmptyState icon={<History className="h-8 w-8" />} text="No history yet." />
                ) : (
                  <div className="flex flex-col gap-1">
                    <ol className="space-y-4">
                      {history.map((h) => (
                        <HistoryEntry key={h.id} item={h} />
                      ))}
                    </ol>
                    <div className="mt-4 border-t border-gray-100 pt-3">
                      <button className="flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-800">
                        View all activity <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )
              )}

              {/* Logs */}
              {activeTab === "logs" && (
                <div className="space-y-4">
                  {/* 7-day progress */}
                  <SevenDayProgress activeDays={activityStats.activeDays7} />
                  {/* 30-day heatmap */}
                  <ThirtyDayHeatmap activityMap={activityStats.activityMap30} />
                  {/* Log entries */}
                  <div>
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">Recent Activity</p>
                    {activityStats.recentLogs.length === 0 ? (
                      <EmptyState icon={<Activity className="h-8 w-8" />} text="No activity logs yet." />
                    ) : (
                      <div className="space-y-2">
                        {activityStats.recentLogs.map((log) => (
                          <ActivityLogEntry key={log.id} log={log} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Previous */}
              {activeTab === "previous" && (
                previous.length === 0 ? (
                  <EmptyState icon={<CheckCircle2 className="h-8 w-8" />} text="No previous exercises." />
                ) : (
                  <div className="space-y-3">
                    {previous.map((item) => <ScheduleCard key={item.id} item={item} accent="green" />)}
                  </div>
                )
              )}

              {/* Upcoming */}
              {activeTab === "upcoming" && (
                upcoming.length === 0 ? (
                  <EmptyState icon={<CalendarDays className="h-8 w-8" />} text="No upcoming exercises." />
                ) : (
                  <div className="space-y-3">
                    {upcoming.map((item) => <ScheduleCard key={item.id} item={item} accent="blue" />)}
                  </div>
                )
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Profile field with icon ─────────────────────────────────────────────── */
function ProfileField({
  icon, label, value, isStatus, paymentStatus,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  isStatus?: boolean;
  paymentStatus?: string;
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-400">
        {icon}
      </div>
      <div>
        <p className="mb-0.5 text-xs text-gray-400">{label}</p>
        {isStatus ? (
          (paymentStatus || '').toUpperCase() === 'FAILED'
            ? <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-700">Pending</span>
            : <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                value?.toUpperCase() === "ACTIVE" ? "bg-green-100 text-green-700" :
                value?.toUpperCase() === "COMPLETED" ? "bg-blue-100 text-blue-700" :
                "bg-gray-100 text-gray-500"
              }`}>
                {value?.toUpperCase() === "ACTIVE" ? "Active" :
                 value?.toUpperCase() === "COMPLETED" ? "Completed" : "Inactive"}
              </span>
        ) : (
          <p className="text-sm font-semibold text-gray-900">{value || "—"}</p>
        )}
      </div>
    </div>
  );
}

/* ── History entry with icon ─────────────────────────────────────────────── */
function HistoryEntry({ item }: { item: HistoryItem }) {
  const iconMap: Record<string, React.ReactNode> = {
    ASSESSMENT: <Clipboard className="h-4 w-4 text-purple-600" />,
    CREATED:    <User      className="h-4 w-4 text-purple-600" />,
    UPLOAD:     <FileText  className="h-4 w-4 text-blue-500"   />,
    DELETE:     <X         className="h-4 w-4 text-red-500"    />,
    PUBLISH:    <CheckCircle2 className="h-4 w-4 text-green-600" />,
    UNPUBLISH:  <X         className="h-4 w-4 text-gray-500"   />,
    NOTE:       <History   className="h-4 w-4 text-purple-600" />,
  };
  const icon = iconMap[(item.eventType || "").toUpperCase()] ?? <History className="h-4 w-4 text-purple-600" />;
  return (
    <li className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-50">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-900 leading-snug">{item.title}</p>
        {item.description && (
          <p className="mt-0.5 text-[11px] text-gray-500 leading-snug">{item.description}</p>
        )}
        <p className="mt-1 flex items-center gap-1 text-[10px] text-purple-600">
          <Clock className="h-2.5 w-2.5 shrink-0" />
          {new Date(item.createdAt).toLocaleString()}
        </p>
      </div>
    </li>
  );
}

/* ── Schedule card ───────────────────────────────────────────────────────── */
function ScheduleCard({ item, accent }: { item: ScheduleItem; accent: "green" | "blue" }) {
  const border = accent === "green" ? "border-green-100" : "border-blue-100";
  const dot    = accent === "green" ? "bg-green-500"     : "bg-blue-500";
  const date   = accent === "green" ? "text-green-700"   : "text-blue-700";
  return (
    <div className={`rounded-xl border ${border} bg-white p-3 shadow-sm`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}`} />
          <div>
            <p className="text-xs font-semibold text-gray-900">{item.exerciseName}</p>
            <p className="text-[11px] text-gray-500">
              {item.bodyPart} · {item.sets || 0} sets · {item.reps || 0} reps
            </p>
          </div>
        </div>
        <span className={`shrink-0 text-[11px] font-semibold ${date}`}>{item.scheduledDate}</span>
      </div>
    </div>
  );
}

/* ── Empty state ─────────────────────────────────────────────────────────── */
function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center py-10 text-gray-300">
      {icon}
      <p className="mt-2 text-xs text-gray-400">{text}</p>
    </div>
  );
}

/* ── Activity log entry ──────────────────────────────────────────────────── */
function ActivityLogEntry({ log }: { log: ActivityLogItem }) {
  const isLogin = log.eventType === "LOGIN";
  const DeviceIcon = log.device?.toLowerCase().includes("mobile")
    ? Smartphone
    : Monitor;
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-gray-100 bg-white p-2.5 shadow-sm">
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
        isLogin ? "bg-green-100" : "bg-red-50"
      }`}>
        {isLogin
          ? <LogIn  className="h-3.5 w-3.5 text-green-600" />
          : <LogOut className="h-3.5 w-3.5 text-red-500"  />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className={`text-xs font-bold ${isLogin ? "text-green-700" : "text-red-600"}`}>
            {isLogin ? "Logged In" : "Logged Out"}
          </span>
          {log.sessionDurationMins && (
            <span className="text-[10px] font-medium text-gray-400">
              {log.sessionDurationMins} min
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5">
          <Clock className="h-2.5 w-2.5 shrink-0 text-gray-400" />
          <span className="text-[10px] text-gray-500">
            {new Date(log.loggedAt).toLocaleString(undefined, {
              month: "short", day: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </span>
        </div>
        {log.device && (
          <div className="mt-0.5 flex items-center gap-1">
            <DeviceIcon className="h-2.5 w-2.5 text-gray-400" />
            <span className="text-[10px] text-gray-400">{log.device}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── 7-day progress row ──────────────────────────────────────────────────── */
function SevenDayProgress({ activeDays }: { activeDays: string[] }) {
  const activeSet = new Set(activeDays);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${day}`;
    const label = ["Su","Mo","Tu","We","Th","Fr","Sa"][d.getDay()];
    const isToday = i === 6;
    return { dateStr, label, active: activeSet.has(dateStr), isToday };
  });

  return (
    <div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">7-Day Activity</p>
      <div className="flex items-end justify-between gap-1">
        {days.map((d) => (
          <div key={d.dateStr} className="flex flex-col items-center gap-1">
            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
              d.active
                ? "bg-green-500 text-white shadow-sm shadow-green-200"
                : d.isToday
                  ? "bg-gray-200 text-gray-500 border-2 border-gray-300"
                  : "bg-gray-100 text-gray-400"
            }`}>
              {d.active ? "✓" : ""}
            </div>
            <span className={`text-[9px] font-semibold ${d.isToday ? "text-purple-600" : "text-gray-400"}`}>
              {d.label}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-1.5 text-[10px] text-gray-400">
        {activeDays.length} of 7 days active
      </p>
    </div>
  );
}

/* ── 30-day GitHub-style heatmap ─────────────────────────────────────────── */
function ThirtyDayHeatmap({ activityMap }: { activityMap: Record<string, number> }) {
  // Build a 5-week × 7-day grid aligned to Mon–Sun columns
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dow = today.getDay(); // 0=Sun
  const daysToMonday = dow === 0 ? 6 : dow - 1;
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - daysToMonday - 28); // 4 weeks before current week's Mon

  const cells = Array.from({ length: 35 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const dy = String(d.getDate()).padStart(2, "0");
    const dateStr = `${y}-${mo}-${dy}`;
    const diffDays = Math.round((today.getTime() - d.getTime()) / 86400000);
    return { dateStr, count: activityMap[dateStr] || 0, inRange: diffDays >= 0 && diffDays < 30 };
  });

  // grid[row=0..6][col=0..4]: row=Mon(0)..Sun(6), col=oldest(0)..newest(4)
  const grid = Array.from({ length: 7 }, (_, row) =>
    Array.from({ length: 5 }, (_, col) => cells[col * 7 + row])
  );

  const DAY_LABELS = ["M","T","W","T","F","S","S"];

  function cellColor(count: number, inRange: boolean) {
    if (!inRange) return "bg-gray-50";
    if (count === 0) return "bg-gray-100";
    if (count === 1) return "bg-green-200";
    if (count === 2) return "bg-green-400";
    return "bg-green-600";
  }

  return (
    <div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">30-Day Progress</p>
      <div className="flex gap-1">
        {/* Day-of-week labels */}
        <div className="flex flex-col gap-[3px] mr-0.5">
          {DAY_LABELS.map((l, i) => (
            <div key={i} className="h-[10px] w-3 flex items-center">
              <span className="text-[8px] text-gray-400 leading-none">{l}</span>
            </div>
          ))}
        </div>
        {/* 5 week columns */}
        {Array.from({ length: 5 }, (_, col) => (
          <div key={col} className="flex flex-col gap-[3px]">
            {Array.from({ length: 7 }, (_, row) => {
              const cell = grid[row][col];
              return (
                <div
                  key={row}
                  title={cell.inRange ? `${cell.dateStr}: ${cell.count} session${cell.count !== 1 ? "s" : ""}` : ""}
                  className={`h-[10px] w-[10px] rounded-[2px] ${cellColor(cell.count, cell.inRange)}`}
                />
              );
            })}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="mt-1.5 flex items-center gap-1">
        <span className="text-[9px] text-gray-400">Less</span>
        {["bg-gray-100","bg-green-200","bg-green-400","bg-green-600"].map((c,i) => (
          <div key={i} className={`h-[8px] w-[8px] rounded-[2px] ${c}`} />
        ))}
        <span className="text-[9px] text-gray-400">More</span>
      </div>
    </div>
  );
}
