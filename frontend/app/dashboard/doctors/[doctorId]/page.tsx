'use client';

/**
 * app/dashboard/doctors/[doctorId]/page.tsx
 * ─────────────────────────────────────────
 * Doctor profile page — overview card (details, hospital / clinic affiliation)
 * + full patient table matching the main Patients module.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, Stethoscope, Phone, Mail, Building2,
  Users, Calendar, Clock, Search, BookOpen, Eye,
  RefreshCw, UserX, CheckCircle2, XCircle, CreditCard,
  Filter, CalendarDays, User, Hash, MapPin, Activity,
  Wifi, WifiOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { doctorsAPI } from '@/lib/api';
import { patientApi, getFileUrl } from '@/lib/patientApi';
import type { Doctor } from '@/types';
import type { PatientListItem } from '@/types/patients';

// ─── Badges (mirrors patients page) ──────────────────────────────────────────

function StatusBadge({ status, paymentStatus }: { status?: string; paymentStatus?: string }) {
  if ((paymentStatus || '').toUpperCase() === 'FAILED')
    return <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-700">Pending</span>;
  const v = (status || '').toUpperCase();
  if (v === 'ACTIVE') return <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-700">Active</span>;
  if (v === 'COMPLETED') return <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700">Completed</span>;
  return <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-500">Inactive</span>;
}

function PaymentBadge({ status, patientStatus }: { status?: string; patientStatus?: string }) {
  if ((patientStatus || '').toUpperCase() === 'INACTIVE')
    return <span className="text-gray-400 text-sm">—</span>;
  const failed = (status || '').toUpperCase() === 'FAILED';
  return failed
    ? <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-700">Failed</span>
    : <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-700">Paid</span>;
}

function PrescriptionCell({ patient }: { patient: PatientListItem }) {
  const hasFile = !!patient.prescriptionUrl;
  return (
    <button
      type="button"
      disabled={!hasFile}
      onClick={() => hasFile && window.open(getFileUrl(patient.prescriptionUrl!), '_blank')}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
        hasFile
          ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer shadow-sm'
          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
      }`}
    >
      <Eye className="h-3.5 w-3.5" /> View
    </button>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-gray-100">
          {Array.from({ length: 9 }).map((_, j) => (
            <td key={j} className="px-5 py-4">
              <div className="h-4 bg-gray-100 rounded-lg animate-pulse"
                style={{ width: j === 1 ? '120px' : j === 5 ? '100px' : '64px' }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <tr>
      <td colSpan={9} className="px-5 py-16 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
            <UserX className="w-7 h-7 text-gray-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-700">
              {hasSearch ? 'No results found' : 'No patients assigned'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {hasSearch
                ? 'Try adjusting your search or filter.'
                : 'Patients will appear here once assigned to this doctor.'}
            </p>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ─── Doctor Info Card ─────────────────────────────────────────────────────────

function DoctorCard({ doctor, patientCount }: { doctor: Doctor; patientCount: number }) {
  const STATUS_COLORS: Record<string, string> = {
    ACTIVE:   'bg-green-100 text-green-700 border-green-200',
    INACTIVE: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    BLOCKED:  'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Gradient header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-500 px-6 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-white">Dr. {doctor.fullName}</h1>
              {doctor.isOnline ? (
                <span className="flex items-center gap-1 bg-green-400/20 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  <Wifi className="w-3 h-3" /> Online
                </span>
              ) : (
                <span className="flex items-center gap-1 bg-white/10 text-white/70 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  <WifiOff className="w-3 h-3" /> Offline
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[doctor.status] || 'bg-gray-100 text-gray-500'}`}>
                {doctor.status}
              </span>
              {doctor.specialization && (
                <span className="bg-white/20 text-white text-xs px-2.5 py-0.5 rounded-full">
                  {doctor.specialization}
                </span>
              )}
            </div>
          </div>
          {/* Quick stats */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="text-center bg-white/10 rounded-xl px-4 py-2">
              <p className="text-purple-100 text-xs">Patients</p>
              <p className="text-white font-bold text-xl">{patientCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* IDs */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Identity</p>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <Hash className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400">Arthomove ID</p>
              <p className="text-sm font-bold font-mono text-indigo-700">
                {doctor.arthomoveId ?? `ARTH-${String(doctor.id).padStart(3, '0')}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
              <User className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400">Clinical ID</p>
              <p className="text-sm font-mono text-gray-700">{doctor.clinicalId || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
              <User className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400">Username</p>
              <p className="text-sm font-mono text-gray-700">{doctor.username || '—'}</p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contact</p>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Mail className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400">Email</p>
              <p className="text-sm text-gray-700 truncate">{doctor.email || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
              <Phone className="w-3.5 h-3.5 text-green-500" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400">Mobile</p>
              <p className="text-sm text-gray-700">{doctor.mobileNumber || '—'}</p>
            </div>
          </div>
        </div>

        {/* Affiliation */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Affiliation</p>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-3.5 h-3.5 text-orange-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400">Hospital / Clinic</p>
              <p className="text-sm text-gray-700 font-medium">{doctor.clinicHospital || 'Not assigned'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-3.5 h-3.5 text-purple-500" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400">Last Login</p>
              <p className="text-sm text-gray-700">
                {doctor.lastLogin
                  ? new Date(doctor.lastLogin).toLocaleString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit', hour12: true,
                    })
                  : 'Never logged in'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400">Member Since</p>
              <p className="text-sm text-gray-700">
                {new Date(doctor.createdAt).toLocaleDateString('en-IN', {
                  day: '2-digit', month: 'short', year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Notes (if any) */}
      {doctor.notes && (
        <div className="px-6 pb-5">
          <div className="bg-yellow-50 border border-yellow-100 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-yellow-700 mb-1">Notes</p>
            <p className="text-sm text-yellow-800">{doctor.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DoctorDetailPage() {
  const params  = useParams();
  const router  = useRouter();
  const doctorId = Number(params.doctorId);

  const [doctor,          setDoctor]          = useState<Doctor | null>(null);
  const [patients,        setPatients]        = useState<PatientListItem[]>([]);
  const [doctorLoading,   setDoctorLoading]   = useState(true);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [refreshing,      setRefreshing]      = useState(false);
  const [search,          setSearch]          = useState('');
  const [statusFilter,    setStatusFilter]    = useState('ALL');

  // ── Load doctor ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!doctorId) return;
    doctorsAPI.getById(doctorId)
      .then((res) => { if (res.success) setDoctor(res.data); })
      .catch(() => toast.error('Failed to load doctor'))
      .finally(() => setDoctorLoading(false));
  }, [doctorId]);

  // ── Load patients assigned to this doctor ────────────────────────────────
  const fetchPatients = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    setPatientsLoading(true);
    try {
      const all = await patientApi.getPatients();
      // Match by doctorId (numeric) first; fall back to name match
      const mine = all.filter((p) => {
        if (p.doctorId != null) return p.doctorId === doctorId;
        // Fallback: name-based match using the loaded doctor's fullName
        return false;
      });
      setPatients(mine);
    } catch {
      toast.error('Failed to load patients');
    } finally {
      setPatientsLoading(false);
      if (!silent) setRefreshing(false);
    }
  }, [doctorId]);

  // Re-run patient fetch once doctor name is available (for name-based fallback)
  useEffect(() => {
    if (!doctor) return;
    patientApi.getPatients().then((all) => {
      const mine = all.filter((p) => {
        if (p.doctorId != null) return p.doctorId === doctorId;
        // Name-based fallback
        if (p.doctorAssigned) {
          return p.doctorAssigned.toLowerCase().includes(doctor.fullName.toLowerCase()) ||
                 doctor.fullName.toLowerCase().includes(p.doctorAssigned.toLowerCase());
        }
        return false;
      });
      setPatients(mine);
      setPatientsLoading(false);
    }).catch(() => {});
  }, [doctor, doctorId]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  // ── Client-side filter ───────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return patients.filter((p) => {
      const matchesSearch = !q ||
        [p.patient, p.injury, p.prescription, p.doctorAssigned]
          .filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
      const sub = String(p.status).toUpperCase() === 'PAYMENT_FAILURE'
        ? 'ACTIVE' : String(p.status).toUpperCase();
      return matchesSearch && (statusFilter === 'ALL' || sub === statusFilter);
    });
  }, [patients, search, statusFilter]);

  const stats = useMemo(() => ({
    total:     patients.length,
    active:    patients.filter((p) => ['ACTIVE','PAYMENT_FAILURE'].includes(String(p.status).toUpperCase())).length,
    inactive:  patients.filter((p) => String(p.status).toUpperCase() === 'INACTIVE').length,
    completed: patients.filter((p) => String(p.status).toUpperCase() === 'COMPLETED').length,
  }), [patients]);

  if (doctorLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading doctor profile…</p>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 font-medium">Doctor not found</p>
          <button onClick={() => router.push('/dashboard/doctors')}
            className="mt-3 text-purple-600 text-sm hover:underline">
            ← Back to Doctors
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-gray-50">
      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-5">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <button
            onClick={() => router.push('/dashboard/doctors')}
            className="flex items-center gap-1 hover:text-purple-600 transition-colors font-medium"
          >
            <ChevronLeft className="w-4 h-4" /> Doctors
          </button>
          <span>/</span>
          <span className="text-gray-900 font-semibold">Dr. {doctor.fullName}</span>
        </div>

        {/* Doctor overview card */}
        <DoctorCard doctor={doctor} patientCount={patients.length} />

        {/* Patients section */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">

          {/* Section header */}
          <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-none">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <Users className="w-4.5 h-4.5 text-blue-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-base">Assigned Patients</h2>
                <p className="text-xs text-gray-400 mt-0.5">All patients managed by Dr. {doctor.fullName}</p>
              </div>
            </div>
            <button
              onClick={() => fetchPatients(false)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-60 px-4 py-2 text-sm font-semibold text-white transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Stats strip */}
          <div className="flex-none grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100">
            {[
              { label: 'Total',     value: stats.total,     color: 'text-gray-900'  },
              { label: 'Active',    value: stats.active,    color: 'text-green-600' },
              { label: 'Inactive',  value: stats.inactive,  color: 'text-gray-400'  },
              { label: 'Completed', value: stats.completed, color: 'text-blue-600'  },
            ].map((s) => (
              <div key={s.label} className="px-4 py-3 text-center">
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Search + filter */}
          <div className="flex-none flex gap-3 px-5 py-3 border-b border-gray-50">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by patient name, injury…"
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none rounded-xl border border-gray-200 bg-white pl-9 pr-10 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 cursor-pointer"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          {/* Result count */}
          {!patientsLoading && (
            <p className="flex-none px-5 py-2 text-xs text-gray-400">
              Showing <span className="font-semibold text-gray-600">{filtered.length}</span> of {patients.length} patients
            </p>
          )}

          {/* Table */}
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <tr>
                  {['ID', 'Patient', 'Status', 'Join Date', 'Injury', 'Payment', 'Prescription', 'Exercise Library'].map((h, i) => (
                    <th key={h} className={`px-5 py-3.5 font-semibold text-sm whitespace-nowrap ${i === 7 ? 'text-center' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {patientsLoading ? (
                  <TableSkeleton />
                ) : filtered.length === 0 ? (
                  <EmptyState hasSearch={!!(search || statusFilter !== 'ALL')} />
                ) : filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-purple-50/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-purple-100 text-purple-700 font-bold text-xs">
                        {p.id}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-900 whitespace-nowrap">{p.patient}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {[p.age && `${p.age}y`, p.gender].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={p.status} paymentStatus={p.paymentStatus} /></td>
                    <td className="px-5 py-3.5 text-sm text-gray-600 whitespace-nowrap">{p.joinDate || '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-700">{p.injury || '—'}</td>
                    <td className="px-5 py-3.5"><PaymentBadge status={p.paymentStatus} patientStatus={p.status} /></td>
                    <td className="px-5 py-3.5"><PrescriptionCell patient={p} /></td>
                    <td className="px-5 py-3.5 text-center">
                      <Link
                        href={`/dashboard/patients/${p.id}/library`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-colors"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        View Library
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
