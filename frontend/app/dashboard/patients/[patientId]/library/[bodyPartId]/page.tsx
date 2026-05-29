'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Activity, ArrowLeft, BookOpen, CalendarDays, RefreshCw, Shield, User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { patientApi } from '@/lib/patientApi';
import type { BodyPartExercisesResponse, ExerciseItem } from '@/types/patients';

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function formatFrequency(frequency?: string | null): string {
  if (!frequency) return '—';
  if (/^daily$/i.test(frequency.trim())) return 'Daily';
  if (/^weekly$/i.test(frequency.trim())) return 'Weekly';
  const dm = frequency.match(/^(\d+)×\s*daily$/i);
  if (dm) return `${dm[1]}x / Day`;
  const wm = frequency.match(/^(\d+)×\s*weekly$/i);
  if (wm) return `${wm[1]}x / Week`;
  return frequency;
}

/* ── Badges ─────────────────────────────────────────────────────────────── */
function DifficultyBadge({ value }: { value?: string }) {
  const v = (value || '').toUpperCase();
  const cls =
    v === 'HARD'   ? 'bg-red-100 text-red-700 border-red-200' :
    v === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                     'bg-green-100 text-green-700 border-green-200';
  const label = v ? v.charAt(0) + v.slice(1).toLowerCase() : '—';
  return <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>;
}

function StatusBadge({ value }: { value?: string }) {
  const active = (value || '').toUpperCase() === 'ACTIVE';
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
      active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'
    }`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

/* ── Profile field ───────────────────────────────────────────────────────── */
function ProfileField({ icon, label, value, isStatus, paymentStatus }: {
  icon: React.ReactNode; label: string; value: string; isStatus?: boolean; paymentStatus?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-400">{icon}</div>
      <div>
        <p className="text-[11px] text-gray-400">{label}</p>
        {isStatus ? (
          (paymentStatus || '').toUpperCase() === 'FAILED'
            ? <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-700">Pending</span>
            : <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                value?.toUpperCase() === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                value?.toUpperCase() === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-500'
              }`}>
                {value?.toUpperCase() === 'ACTIVE' ? 'Active' :
                 value?.toUpperCase() === 'COMPLETED' ? 'Completed' : 'Inactive'}
              </span>
        ) : (
          <p className="text-sm font-semibold text-gray-900">{value || '—'}</p>
        )}
      </div>
    </div>
  );
}

/* ── Fraction cell ───────────────────────────────────────────────────────── */
function Fraction({ done, target, completeColor }: { done: number; target: number; completeColor: string }) {
  if (!target) return <span className="text-gray-400">—</span>;
  const complete = done >= target;
  const color = complete ? completeColor : '#f97316'; // orange if incomplete
  return (
    <span className="font-semibold text-sm" style={{ color }}>
      {done} / {target}
    </span>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function BodyPartExerciseDetailsPage() {
  const params     = useParams();
  const router     = useRouter();
  const patientId  = Number(params.patientId);
  const bodyPartId = Number(params.bodyPartId);

  const [data, setData]       = useState<BodyPartExercisesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await patientApi.getBodyPartExercises(patientId, bodyPartId);
      setData(res);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to load exercise details');
    } finally {
      setLoading(false);
    }
  }, [patientId, bodyPartId]);

  useEffect(() => {
    if (patientId && bodyPartId) fetchDetails();
  }, [patientId, bodyPartId, fetchDetails]);

  if (loading) return (
    <div className="flex h-full items-center justify-center text-gray-500 text-sm">
      <Activity className="mr-2 h-4 w-4 animate-spin" /> Loading exercises...
    </div>
  );
  if (!data) return (
    <div className="flex h-full items-center justify-center text-red-500 text-sm">
      Exercise details not found.
    </div>
  );

  const patient   = data.patient;
  const bodyPart  = data.bodyPart;
  const exercises = data.exercises || [];
  const isLocked  = (patient.paymentStatus || '').toUpperCase() === 'FAILED';

  return (
    <div className="flex h-full flex-col overflow-hidden bg-gray-50">

      {/* ── Top header ── */}
      <div className="flex-none bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-1.5 text-xs text-gray-500">
              <Link href="/dashboard/patients" className="hover:text-green-700">Patients</Link>
              <span>/</span>
              <Link href={`/dashboard/patients/${patientId}/library`} className="hover:text-green-700">{patient.patient}</Link>
              <span>/</span>
              <span className="font-semibold text-gray-800">{bodyPart.bodyPart}</span>
            </div>
            <h1 className="flex items-center gap-2.5 text-2xl font-bold text-gray-950">
              <BookOpen className="h-6 w-6 text-green-600" />
              {bodyPart.bodyPart} — Exercise Details
            </h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => router.back()}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button onClick={fetchDetails}
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ── Patient profile strip ── */}
      <div className="flex-none bg-white border-b border-gray-100 shadow-sm">
        <div className="grid grid-cols-2 divide-y divide-gray-100 md:grid-cols-5 md:divide-x md:divide-y-0">
          <ProfileField icon={<User className="h-4 w-4" />}         label="Patient Name"       value={patient.patient} />
          <ProfileField icon={<Shield className="h-4 w-4" />}       label="Injury / Diagnosis" value={patient.injury || (patient as any).diagnosis || '—'} />
          <ProfileField icon={<CalendarDays className="h-4 w-4" />} label="Join Date"          value={String(patient.joinDate || '—')} />
          <ProfileField icon={<User className="h-4 w-4" />}         label="Doctor Assigned"    value={patient.doctorAssigned || '—'} />
          <ProfileField icon={<Activity className="h-4 w-4" />}     label="Status"             value={patient.status} isStatus paymentStatus={patient.paymentStatus} />
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6">

        <h2 className="text-lg font-bold text-gray-900 mb-4">Exercises</h2>

        {exercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-gray-400">
            <p className="text-sm">No exercises found.</p>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden shadow-sm border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-green-600 text-white text-left">
                  <th className="px-5 py-3.5 font-semibold">Exercise Name</th>
                  <th className="px-5 py-3.5 font-semibold">Duration</th>
                  <th className="px-5 py-3.5 font-semibold">Sets</th>
                  <th className="px-5 py-3.5 font-semibold">Reps</th>
                  <th className="px-5 py-3.5 font-semibold">Frequency</th>
                  <th className="px-5 py-3.5 font-semibold">Difficulty</th>
                  <th className="px-5 py-3.5 font-semibold">Exercise Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {exercises.map((exercise: ExerciseItem) => (
                  <tr key={exercise.patientExerciseId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-semibold text-gray-900">{exercise.exerciseName}</td>
                    <td className="px-5 py-4 text-gray-700">
                      {isLocked ? <span className="text-gray-400">—</span> :
                        exercise.completedDurationMins ? `${exercise.completedDurationMins} min` : '—'}
                    </td>
                    <td className="px-5 py-4">
                      {isLocked ? <span className="text-gray-400">—</span> :
                        <Fraction done={exercise.completedSets ?? 0} target={exercise.targetSets ?? 0} completeColor="#16a34a" />}
                    </td>
                    <td className="px-5 py-4">
                      {isLocked ? <span className="text-gray-400">—</span> :
                        <Fraction done={exercise.completedReps ?? 0} target={exercise.targetReps ?? 0} completeColor="#2563eb" />}
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {isLocked ? <span className="text-gray-400">—</span> : formatFrequency(exercise.frequency)}
                    </td>
                    <td className="px-5 py-4">
                      {isLocked ? <span className="text-gray-400">—</span> : <DifficultyBadge value={exercise.difficulty} />}
                    </td>
                    <td className="px-5 py-4">
                      {isLocked ? <span className="text-gray-400">—</span> : <StatusBadge value={exercise.status} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
