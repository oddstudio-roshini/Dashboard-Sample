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
  ChevronDown,
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

function formatFrequency(frequency?: string | null): string {
  if (!frequency) return "—";
  if (/^daily$/i.test(frequency.trim())) return "Daily";
  if (/^weekly$/i.test(frequency.trim())) return "Weekly";
  const dm = frequency.match(/^(\d+)×\s*daily$/i);
  if (dm) return `${dm[1]}x / Day`;
  const wm = frequency.match(/^(\d+)×\s*weekly$/i);
  if (wm) return `${wm[1]}x / Week`;
  return frequency;
}
const PAGE_SIZE = 15;

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
  const [logMonth, setLogMonth] = useState<string>(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
  });
  const [historyPeriod, setHistoryPeriod] = useState<"this_month" | "last_month">("this_month");

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

  const singleParts   = useMemo(() => bodyParts.filter(p => String(p.type).toUpperCase() === 'SINGLE'), [bodyParts]);
  const bundleParts   = useMemo(() => bodyParts.filter(p => String(p.type).toUpperCase() === 'BUNDLE'), [bodyParts]);
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

  const isLocked      = (patient.paymentStatus || '').toUpperCase() === 'FAILED';
  const isCompleted   = (patient.status || '').toUpperCase() === 'COMPLETED';

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
          <div className="grid grid-cols-2 divide-y divide-gray-100 md:grid-cols-4 md:divide-x md:divide-y-0">
            <ProfileField icon={<User className="h-4 w-4" />}         label="Patient Name"       value={patient.patient} />
            <ProfileField icon={<Shield className="h-4 w-4" />}       label="Injury / Diagnosis" value={patient.injury || (patient as any).diagnosis || "—"} />
            <ProfileField icon={<CalendarDays className="h-4 w-4" />} label="Join Date"          value={String(patient.joinDate || "—")} />
            <ProfileField icon={<User className="h-4 w-4" />}         label="Doctor Assigned"    value={patient.doctorAssigned || "—"} />
          </div>
        </div>

        {/* ── Section header ── */}
        <div className="mb-2 flex flex-none items-center justify-between">
          <h2 className="text-base font-bold text-gray-950">Body Parts &amp; Exercises</h2>
        </div>

        {/* ── Payment-failed: show history panel ── */}
        {isLocked && (
          <div className="flex-1 min-h-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-20 text-gray-400 gap-3">
                <History className="h-12 w-12 opacity-30" />
                <p className="text-sm font-semibold text-gray-500">No History</p>
                <p className="text-xs text-gray-400">This is a new customer with no prior activity.</p>
              </div>
            ) : (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <p className="text-sm font-bold text-gray-900">Patient History</p>
                  <p className="text-xs text-gray-400 mt-0.5">Showing previous activity for this customer.</p>
                </div>
                <div className="flex-1 overflow-auto p-5">
                  <ol className="space-y-4">
                    {history.map((h) => (
                      <HistoryEntry key={h.id} item={h} />
                    ))}
                  </ol>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Table + Side panel ── */}
        {!isLocked && <div className="flex flex-1 min-h-0 gap-4 overflow-hidden">

          {/* Table card */}
          <div className="flex flex-1 min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex-1 overflow-auto">
              {bodyParts.length === 0 && (
                <p className="px-4 py-10 text-center text-sm text-gray-400">No body parts assigned yet.</p>
              )}

              {/* ── Single Exercises table (no Actions column) ── */}
              {singleParts.length > 0 && (
                <>
                  <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Single Exercises</span>
                    <span className="text-[10px] text-blue-400">{singleParts.length} body part{singleParts.length !== 1 ? 's' : ''}</span>
                  </div>
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Body Part</th>
                        <th className="px-4 py-3 font-semibold">Exercise Name</th>
                        <th className="px-4 py-3 font-semibold">Progress</th>
                        <th className="px-4 py-3 font-semibold">Duration</th>
                        <th className="px-4 py-3 font-semibold">Reps Done</th>
                        <th className="px-4 py-3 font-semibold">Sets Done</th>
                        <th className="px-4 py-3 font-semibold">Sessions</th>
                        <th className="px-4 py-3 font-semibold">Frequency</th>
                        <th className="px-4 py-3 font-semibold">Difficulty</th>
                        <th className="px-4 py-3 font-semibold">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                  {singleParts.map((item) => {
                    const status = String(item.status).toUpperCase();
                    const type   = String(item.type).toUpperCase();
                    // Completed patients → treat all exercises as active
                    const active = isCompleted ? true : status === "ACTIVE";

                    // For COMPLETED patients everything is 100%
                    const completedReps = isCompleted ? (item.targetReps ?? 0) : (item.completedReps ?? 0);
                    const targetReps    = item.targetReps ?? 0;
                    const completedSets = isCompleted ? (item.targetSets ?? 0) : (item.completedSets ?? 0);
                    const targetSets    = item.targetSets ?? 0;
                    // hasStarted: true only when the patient has recorded ANY real activity
                    const hasStarted = completedReps > 0 || completedSets > 0 || (item.sessionCount ?? 0) > 0;
                    const pct = isCompleted ? 100 :
                      targetReps > 0
                        ? Math.min((completedReps / targetReps) * 100, 100)
                        : targetSets > 0
                          ? Math.min((completedSets / targetSets) * 100, 100)
                          : 0;

                    function getProgress() {
                      if (isCompleted)           return { label: "Excellent",   color: "text-green-600",  bar: "bg-green-500" };
                      // Check hasStarted FIRST — status field is irrelevant for "Not Started"
                      if (!hasStarted)           return { label: "Not Started", color: "text-gray-400",   bar: "" };
                      if (!active && hasStarted) return { label: "Inactive",    color: "text-orange-500", bar: "" };
                      if (pct > 90)              return { label: "Excellent",   color: "text-green-600",  bar: "bg-green-500" };
                      if (pct >= 70)             return { label: "Good",        color: "text-blue-600",   bar: "bg-blue-500"  };
                      if (pct >= 40)             return { label: "Average",     color: "text-yellow-600", bar: "bg-yellow-400"};
                      return                            { label: "Low",         color: "text-red-500",    bar: "bg-red-400"   };
                    }
                    const progress = getProgress();

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

                        {/* Progress */}
                        <td className="px-4 py-3 min-w-[140px]">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-[11px] font-bold ${progress.color}`}>{progress.label}</span>
                              {active && hasStarted && (targetReps > 0 || targetSets > 0) && (
                                <span className="text-[10px] text-gray-400 font-medium">{Math.round(pct)}%</span>
                              )}
                            </div>
                            {active && hasStarted && (targetReps > 0 || targetSets > 0) ? (
                              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-500 ${progress.bar}`}
                                  style={{ width: `${Math.min(pct, 100)}%` }} />
                              </div>
                            ) : (
                              <div className="h-1.5 w-full bg-gray-100 rounded-full" />
                            )}
                          </div>
                        </td>

                        {/* Duration */}
                        <td className="px-4 py-3 text-gray-700">
                          {isLocked ? <span className="text-gray-400">—</span> :
                            !hasStarted && !isCompleted ? <span className="text-gray-400">—</span> :  /* NOT STARTED */
                            !active     &&  hasStarted  ? <span className="text-gray-400">{(item.completedDurationMins ?? 0) > 0 ? `${item.completedDurationMins} min` : "—"}</span> :  /* INACTIVE */
                            isCompleted ? `${item.completedDurationMins ?? 0} min` :
                            (item.completedDurationMins ?? 0) > 0
                              ? `${item.completedDurationMins} min`
                              : <span className="text-gray-400">0 min</span>}
                        </td>

                        {/* Reps Done */}
                        <td className="px-4 py-3">
                          {isLocked ? <span className="text-gray-400">—</span> :
                            !hasStarted && !isCompleted ? (
                              /* NOT STARTED — patient hasn't touched this exercise at all */
                              <span className="text-gray-400">—</span>
                            ) : !active ? (
                              /* INACTIVE — show actual reps done before stopping */
                              (item.targetReps ?? 0) > 0
                                ? <span className="font-semibold text-orange-500">{completedReps} / {targetReps}</span>
                                : <span className="text-gray-400">—</span>
                            ) : (item.targetReps ?? 0) > 0 ? (
                              <span className="font-semibold text-blue-600">
                                {completedReps} / {targetReps}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                        </td>

                        {/* Sets Done */}
                        <td className="px-4 py-3">
                          {isLocked ? <span className="text-gray-400">—</span> :
                            !hasStarted && !isCompleted ? (
                              /* NOT STARTED — patient hasn't touched this exercise at all */
                              <span className="text-gray-400">—</span>
                            ) : !active ? (
                              /* INACTIVE — show actual sets done before stopping */
                              (item.targetSets ?? 0) > 0
                                ? <span className="font-semibold text-orange-500">{completedSets} / {targetSets}</span>
                                : <span className="text-gray-400">—</span>
                            ) : (item.targetSets ?? 0) > 0 ? (
                              <span className="font-semibold text-green-600">
                                {completedSets} / {targetSets}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                        </td>

                        {/* Sessions */}
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                          {isLocked ? <span className="text-gray-400">—</span> :
                            isCompleted ? (
                              <span className="font-semibold text-green-600">
                                {Math.max(item.sessionCount ?? 0, targetSets > 0 ? targetSets : 3)} sessions
                              </span>
                            ) : !hasStarted && !isCompleted ? (
                              /* NOT STARTED — no sessions at all */
                              <span className="text-gray-400">—</span>
                            ) : !active ? (
                              /* INACTIVE — show sessions done before stopping */
                              <span className="font-semibold text-orange-500">
                                {item.sessionCount ?? 0} session{(item.sessionCount ?? 0) !== 1 ? "s" : ""}
                              </span>
                            ) : (item.sessionCount ?? 0) > 0
                              ? `${item.sessionCount} session${(item.sessionCount ?? 0) !== 1 ? "s" : ""}`
                              : <span className="text-gray-400">0 sessions</span>}
                        </td>

                        {/* Frequency — always shown (doctor-prescribed, applies to both NOT STARTED and INACTIVE) */}
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                          {isLocked ? <span className="text-gray-400">—</span> :
                            item.frequency
                              ? <span className="text-xs font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">{formatFrequency(item.frequency)}</span>
                              : <span className="text-gray-400">—</span>}
                        </td>

                        <td className="px-4 py-3">{isLocked ? <span className="text-gray-400">—</span> : <Badge value={item.difficulty} type="difficulty" />}</td>
                        <td className="px-4 py-3">{isLocked ? <span className="text-gray-400">—</span> : <Badge value={item.type} type="purchase" />}</td>
                      </tr>
                    );
                  })}
                    </tbody>
                  </table>
                </>
              )}

              {/* ── Bundle Packages table (with Actions column) ── */}
              {bundleParts.length > 0 && (
                <>
                  <div className="px-4 py-2 bg-purple-50 border-b border-purple-100 flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600">Bundle Packages</span>
                    <span className="ml-2 text-[10px] text-purple-400">{bundleParts.length} body part{bundleParts.length !== 1 ? 's' : ''}</span>
                  </div>
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Body Part</th>
                        <th className="px-4 py-3 font-semibold">Exercise Name</th>
                        <th className="px-4 py-3 font-semibold">Progress</th>
                        <th className="px-4 py-3 font-semibold">Duration</th>
                        <th className="px-4 py-3 font-semibold">Reps Done</th>
                        <th className="px-4 py-3 font-semibold">Sets Done</th>
                        <th className="px-4 py-3 font-semibold">Sessions</th>
                        <th className="px-4 py-3 font-semibold">Frequency</th>
                        <th className="px-4 py-3 font-semibold">Difficulty</th>
                        <th className="px-4 py-3 font-semibold">Type</th>
                        <th className="px-4 py-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                  {bundleParts.map((item) => {
                    const status = String(item.status).toUpperCase();
                    const type   = String(item.type).toUpperCase();
                    const active = isCompleted ? true : status === "ACTIVE";
                    const completedReps = isCompleted ? (item.targetReps ?? 0) : (item.completedReps ?? 0);
                    const targetReps    = item.targetReps ?? 0;
                    const completedSets = isCompleted ? (item.targetSets ?? 0) : (item.completedSets ?? 0);
                    const targetSets    = item.targetSets ?? 0;
                    const hasStarted = completedReps > 0 || completedSets > 0 || (item.sessionCount ?? 0) > 0;
                    const pct = isCompleted ? 100 :
                      targetReps > 0 ? Math.min((completedReps / targetReps) * 100, 100) :
                      targetSets > 0 ? Math.min((completedSets / targetSets) * 100, 100) : 0;
                    function getBundleProgress() {
                      if (isCompleted)           return { label: "Excellent",   color: "text-green-600",  bar: "bg-green-500" };
                      if (!hasStarted)           return { label: "Not Started", color: "text-gray-400",   bar: "" };
                      if (!active && hasStarted) return { label: "Inactive",    color: "text-orange-500", bar: "" };
                      if (pct > 90)              return { label: "Excellent",   color: "text-green-600",  bar: "bg-green-500" };
                      if (pct >= 70)             return { label: "Good",        color: "text-blue-600",   bar: "bg-blue-500"  };
                      if (pct >= 40)             return { label: "Average",     color: "text-yellow-600", bar: "bg-yellow-400"};
                      return                            { label: "Low",         color: "text-red-500",    bar: "bg-red-400"   };
                    }
                    const progress = getBundleProgress();
                    return (
                      <tr key={item.bodyPartId} className="hover:bg-purple-50/30">
                        <td className="px-4 py-3"><span className="font-semibold text-gray-950">{item.bodyPart}</span></td>
                        <td className="px-4 py-3 text-gray-700">{item.exerciseName || "—"}</td>
                        <td className="px-4 py-3 min-w-[140px]">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-[11px] font-bold ${progress.color}`}>{progress.label}</span>
                              {active && hasStarted && (targetReps > 0 || targetSets > 0) && (
                                <span className="text-[10px] text-gray-400 font-medium">{Math.round(pct)}%</span>
                              )}
                            </div>
                            {active && hasStarted && (targetReps > 0 || targetSets > 0) ? (
                              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-500 ${progress.bar}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                              </div>
                            ) : <div className="h-1.5 w-full bg-gray-100 rounded-full" />}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {isLocked ? <span className="text-gray-400">—</span> :
                            !hasStarted && !isCompleted ? <span className="text-gray-400">—</span> :
                            !active && hasStarted ? <span className="text-gray-400">{(item.completedDurationMins ?? 0) > 0 ? `${item.completedDurationMins} min` : "—"}</span> :
                            isCompleted ? `${item.completedDurationMins ?? 0} min` :
                            (item.completedDurationMins ?? 0) > 0 ? `${item.completedDurationMins} min` : <span className="text-gray-400">0 min</span>}
                        </td>
                        <td className="px-4 py-3">
                          {isLocked ? <span className="text-gray-400">—</span> :
                            !hasStarted && !isCompleted ? <span className="text-gray-400">—</span> :
                            !active ? ((item.targetReps ?? 0) > 0 ? <span className="font-semibold text-orange-500">{completedReps} / {targetReps}</span> : <span className="text-gray-400">—</span>) :
                            (item.targetReps ?? 0) > 0 ? <span className="font-semibold text-blue-600">{completedReps} / {targetReps}</span> : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          {isLocked ? <span className="text-gray-400">—</span> :
                            !hasStarted && !isCompleted ? <span className="text-gray-400">—</span> :
                            !active ? ((item.targetSets ?? 0) > 0 ? <span className="font-semibold text-orange-500">{completedSets} / {targetSets}</span> : <span className="text-gray-400">—</span>) :
                            (item.targetSets ?? 0) > 0 ? <span className="font-semibold text-green-600">{completedSets} / {targetSets}</span> : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                          {isLocked ? <span className="text-gray-400">—</span> :
                            isCompleted ? <span className="font-semibold text-green-600">{Math.max(item.sessionCount ?? 0, targetSets > 0 ? targetSets : 3)} sessions</span> :
                            !hasStarted && !isCompleted ? <span className="text-gray-400">—</span> :
                            !active ? <span className="font-semibold text-orange-500">{item.sessionCount ?? 0} session{(item.sessionCount ?? 0) !== 1 ? "s" : ""}</span> :
                            (item.sessionCount ?? 0) > 0 ? `${item.sessionCount} session${(item.sessionCount ?? 0) !== 1 ? "s" : ""}` : <span className="text-gray-400">0 sessions</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                          {isLocked ? <span className="text-gray-400">—</span> :
                            item.frequency ? <span className="text-xs font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">{formatFrequency(item.frequency)}</span> : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3">{isLocked ? <span className="text-gray-400">—</span> : <Badge value={item.difficulty} type="difficulty" />}</td>
                        <td className="px-4 py-3">{isLocked ? <span className="text-gray-400">—</span> : <Badge value={item.type} type="purchase" />}</td>
                        <td className="px-4 py-3">
                          {isLocked ? <span className="text-gray-400">—</span> :
                            type === "BUNDLE" && (item.totalExerciseCount ?? 0) > 0 ? (
                              <Link href={`/dashboard/patients/${patientId}/library/${item.bodyPartId}`}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-purple-700">
                                <BookOpen className="h-3 w-3" /> View Bundle
                              </Link>
                            ) : <span className="text-gray-400">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                    </tbody>
                  </table>
                </>
              )}
            </div>

            {/* Footer summary */}
            <div className="flex items-center gap-4 border-t border-gray-100 px-4 py-3">
              <p className="text-xs text-gray-500">
                {bodyParts.length} body part{bodyParts.length !== 1 ? 's' : ''} total
              </p>
              {singleParts.length > 0 && (
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {singleParts.length} Single
                </span>
              )}
              {bundleParts.length > 0 && (
                <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                  {bundleParts.length} Bundle
                </span>
              )}
            </div>
          </div>

          {/* ── Side panel ── */}
          <div className="w-96 shrink-0 flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
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
              {activeTab === "history" && (() => {
                const now = new Date();
                const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const filteredHistory = history.filter(h => {
                  const d = new Date(h.createdAt);
                  if (historyPeriod === "this_month") return d >= thisMonthStart;
                  return d >= lastMonthStart && d < thisMonthStart;
                });
                return (
                  <div className="flex flex-col gap-3">
                    {/* Toggle */}
                    <div className="flex gap-1.5">
                      <button onClick={() => setHistoryPeriod("this_month")}
                        className={`flex-1 text-[10px] py-1 rounded-lg font-semibold transition-colors ${
                          historyPeriod === "this_month" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}>This Month</button>
                      <button onClick={() => setHistoryPeriod("last_month")}
                        className={`flex-1 text-[10px] py-1 rounded-lg font-semibold transition-colors ${
                          historyPeriod === "last_month" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}>Last Month</button>
                    </div>
                    {filteredHistory.length === 0 ? (
                      <EmptyState icon={<History className="h-8 w-8" />}
                        text={`No history for ${historyPeriod === "this_month" ? "this month" : "last month"}.`} />
                    ) : (
                      <ol className="space-y-4">
                        {filteredHistory.map((h) => (
                          <HistoryEntry key={h.id} item={h} />
                        ))}
                      </ol>
                    )}
                  </div>
                );
              })()}

              {/* Logs */}
              {activeTab === "logs" && (() => {
                // Last 6 months as dropdown options
                const monthOptions = Array.from({ length: 6 }, (_, i) => {
                  const d = new Date();
                  d.setDate(1);
                  d.setMonth(d.getMonth() - i);
                  const key   = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                  const label = d.toLocaleString("default", { month: "long", year: "numeric" });
                  return { key, label };
                });

                const [selYear, selMon] = logMonth.split("-").map(Number);
                const monthStart = new Date(selYear, selMon - 1, 1);
                const monthEnd   = new Date(selYear, selMon, 1);

                const filteredLogs = activityStats.recentLogs.filter(log => {
                  const d = new Date(log.loggedAt);
                  const inMonth = d >= monthStart && d < monthEnd;
                  // Logs tab shows only login/logout — exercise completions go in Previous tab
                  const isSession = log.eventType === "LOGIN" || log.eventType === "LOGOUT";
                  return inMonth && isSession;
                });

                const selectedLabel = monthOptions.find(m => m.key === logMonth)?.label ?? logMonth;

                return (
                  <div className="space-y-4">
                    {/* Month selector dropdown */}
                    <div className="relative">
                      <select
                        value={logMonth}
                        onChange={e => setLogMonth(e.target.value)}
                        className="w-full appearance-none text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:border-purple-400 pr-8"
                      >
                        {monthOptions.map(m => (
                          <option key={m.key} value={m.key}>{m.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>

                    {/* 7-day progress */}
                    <SevenDayProgress activeDays={activityStats.activeDays7} />

                    {/* Monthly heatmap for selected month */}
                    <ThirtyDayHeatmap
                      activityMap={activityStats.activityMap30}
                      selectedMonth={logMonth}
                      joinDate={activityStats.joinDate}
                      exerciseDates={activityStats.exerciseDates}
                    />

                    {/* Log entries for selected month */}
                    <div>
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                        {selectedLabel} Activity
                      </p>
                      {filteredLogs.length === 0 ? (
                        <EmptyState icon={<Activity className="h-8 w-8" />}
                          text={`No activity logs for ${selectedLabel}.`} />
                      ) : (
                        <div className="space-y-2">
                          {filteredLogs.map(log => <ActivityLogEntry key={log.id} log={log} />)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

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
        </div>}</div>
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
  const isLogin    = log.eventType === "LOGIN";
  const isExercise = log.eventType === "EXERCISE";
  const DeviceIcon = (!isExercise && log.device?.toLowerCase().includes("mobile"))
    ? Smartphone : Monitor;

  if (isExercise) {
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-purple-100 bg-purple-50/40 p-2.5 shadow-sm">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-100">
          <Activity className="h-3.5 w-3.5 text-purple-600" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-bold text-purple-700">Exercise Completed</span>
          <div className="mt-0.5 flex items-center gap-1.5">
            <Clock className="h-2.5 w-2.5 shrink-0 text-gray-400" />
            <span className="text-[10px] text-gray-500">
              {new Date(log.loggedAt).toLocaleString(undefined, {
                month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
              })}
            </span>
          </div>
          {log.device && (
            <div className="mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="h-2.5 w-2.5 text-purple-400" />
              <span className="text-[10px] text-purple-600 font-medium">{log.device}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

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
    const y   = d.getFullYear();
    const m   = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dateStr  = `${y}-${m}-${day}`;
    const dayName  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()];
    const dateNum  = d.getDate();
    const monthShort = d.toLocaleString("default", { month: "short" });
    const isToday  = i === 6;
    return { dateStr, dayName, dateNum, monthShort, active: activeSet.has(dateStr), isToday };
  });

  const activeCount = days.filter(d => d.active).length;
  const startLabel  = `${days[0].monthShort} ${days[0].dateNum}`;
  const endLabel    = `${days[6].monthShort} ${days[6].dateNum}`;

  return (
    <div>
      {/* Header with date range */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">7-Day Activity</p>
        <span className="text-[9px] text-gray-400 font-medium">{startLabel} – {endLabel}</span>
      </div>

      {/* Day circles */}
      <div className="flex items-end justify-between gap-1">
        {days.map((d) => (
          <div key={d.dateStr} className="flex flex-col items-center gap-1"
            title={`${d.dayName}, ${d.monthShort} ${d.dateNum} — ${d.active ? "Active" : "No activity"}`}>
            <div className={`w-9 h-9 rounded-full flex flex-col items-center justify-center transition-all ${
              d.active
                ? "bg-[#40c463] shadow-sm shadow-green-200"
                : d.isToday
                  ? "bg-gray-100 border-2 border-[#40c463]"
                  : "bg-[#ebedf0]"
            }`}>
              <span className={`text-[9px] font-bold leading-none ${
                d.active ? "text-white" : d.isToday ? "text-green-600" : "text-gray-400"
              }`}>{d.dateNum}</span>
              <span className={`text-[8px] leading-none mt-0.5 ${
                d.active ? "text-white" : "text-gray-300"
              }`}>{d.active ? "✓" : ""}</span>
            </div>
            <span className={`text-[8px] font-semibold ${d.isToday ? "text-green-600" : "text-gray-400"}`}>
              {d.dayName.slice(0,3)}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-1.5 text-[10px] text-gray-400">
        {activeCount} of 7 days active
      </p>
    </div>
  );
}

/* ── Monthly calendar heatmap ────────────────────────────────────────────── */
function ThirtyDayHeatmap({ activityMap, selectedMonth, joinDate, exerciseDates }: {
  activityMap: Record<string, number>;
  selectedMonth: string;
  joinDate?: string;
  exerciseDates?: string[];
}) {
  const joinSet     = new Set(joinDate     ? [joinDate]     : []);
  const exerciseSet = new Set(exerciseDates ?? []);

  const today = new Date(); today.setHours(0,0,0,0);
  const [selYear, selMon] = selectedMonth.split("-").map(Number);
  const daysInMonth = new Date(selYear, selMon, 0).getDate();
  const firstDow    = new Date(selYear, selMon - 1, 1).getDay();
  const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function toDateStr(day: number) {
    return `${selYear}-${String(selMon).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  }

  const activeDaysThisMonth = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    .filter(d => (activityMap[toDateStr(d)] || 0) > 0).length;

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const joinDateObj = joinDate ? new Date(joinDate + "T00:00:00") : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Monthly Activity</p>
        <span className="text-sm font-bold text-blue-600">{activeDaysThisMonth} active days</span>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1.5">
        {DAY_HEADERS.map(h => (
          <div key={h} className="text-center text-[10px] font-semibold text-gray-400">{h}</div>
        ))}
      </div>

      {/* Calendar grid — large card-style cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} className="aspect-square" />;

          const dateStr  = toDateStr(day);
          const count    = activityMap[dateStr] || 0;
          const cellDate = new Date(selYear, selMon - 1, day);
          const isToday      = cellDate.getTime() === today.getTime();
          const isFuture     = cellDate > today;
          const isBeforeJoin = joinDateObj ? cellDate < joinDateObj : false;

          // Milestone flags
          const isJoin     = joinSet.has(dateStr);
          const isExercise = exerciseSet.has(dateStr);

          // Tooltip
          const tips: string[] = [];
          if (isJoin)     tips.push("Joined & Subscribed");
          if (isExercise) tips.push("Exercises Assigned by Doctor");
          if (!isFuture && count > 0) tips.push(`${count} session${count !== 1 ? "s" : ""}`);

          // ── Determine cell appearance ─────────────────────────────────────
          let bgCls = "", numberCls = "", countCls = "";

          if (isJoin) {
            bgCls     = "bg-blue-500" + (isToday ? " ring-2 ring-offset-1 ring-blue-300" : "");
            numberCls = "text-white font-bold";
            countCls  = "text-blue-100 text-[9px]";
          } else if (isExercise) {
            bgCls     = "bg-purple-500" + (isToday ? " ring-2 ring-offset-1 ring-purple-300" : "");
            numberCls = "text-white font-bold";
            countCls  = "text-purple-100 text-[9px]";
          } else if (isFuture) {
            bgCls     = "bg-gray-50";
            numberCls = "text-gray-200";
          } else if (isBeforeJoin && count === 0) {
            bgCls     = "bg-gray-50";
            numberCls = "text-gray-200";
          } else if (count === 0) {
            bgCls     = isToday ? "bg-gray-100 ring-2 ring-green-400" : "bg-gray-100";
            numberCls = isToday ? "text-gray-700 font-bold" : "text-gray-400";
          } else if (count === 1) {
            bgCls     = isToday ? "bg-[#9be9a8] ring-2 ring-green-400" : "bg-[#9be9a8]";
            numberCls = "text-green-900 font-bold";
            countCls  = "text-green-700 text-[9px]";
          } else if (count === 2) {
            bgCls     = isToday ? "bg-[#40c463] ring-2 ring-green-300" : "bg-[#40c463]";
            numberCls = "text-white font-bold";
            countCls  = "text-white/80 text-[9px]";
          } else {
            bgCls     = isToday ? "bg-[#216e39] ring-2 ring-green-300" : "bg-[#216e39]";
            numberCls = "text-white font-bold";
            countCls  = "text-white/80 text-[9px]";
          }

          const milestoneLabel = isJoin ? "Joined" : isExercise ? "Assigned" : null;
          const sessionLabel   = !milestoneLabel && !isFuture && count > 0 ? `${count}×` : null;

          return (
            <div
              key={idx}
              title={tips.length ? `${dateStr}: ${tips.join(" · ")}` : ""}
              className={`relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all ${bgCls}`}
            >
              <span className={`text-xs leading-none ${numberCls}`}>{day}</span>
              {milestoneLabel && (
                <span className="leading-none mt-0.5 font-semibold text-white/90 text-[8px]">
                  {milestoneLabel}
                </span>
              )}
              {sessionLabel && (
                <span className={`leading-none mt-0.5 font-semibold ${countCls}`}>
                  {sessionLabel}
                </span>
              )}
              {isToday && !isJoin && !isExercise && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-amber-400 rounded-full ring-1 ring-white" />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
        {/* Patient journey */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
              <span className="text-[8px] text-white font-bold">1</span>
            </div>
            <span className="text-[9px] text-gray-600 font-semibold">Joined &amp; Subscribed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0">
              <span className="text-[8px] text-white font-bold">2</span>
            </div>
            <span className="text-[9px] text-gray-600 font-semibold">Exercises Assigned</span>
          </div>
        </div>
        {/* Activity intensity */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 rounded-lg bg-gray-100" />
            <span className="text-[9px] text-gray-400">No activity</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 rounded-lg bg-[#9be9a8]" />
            <span className="text-[9px] text-gray-400">1 session</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 rounded-lg bg-[#40c463]" />
            <span className="text-[9px] text-gray-400">2 sessions</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 rounded-lg bg-[#216e39]" />
            <span className="text-[9px] text-gray-400">3 sessions</span>
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <div className="w-5 h-5 rounded-lg bg-gray-100 ring-2 ring-green-400" />
            <span className="text-[9px] text-green-600 font-semibold">Today</span>
          </div>
        </div>
      </div>
    </div>
  );
}

