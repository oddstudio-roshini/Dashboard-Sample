'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen, CalendarDays, CheckCircle2, CreditCard, Eye,
  RefreshCw, Search, UserCheck, Users, XCircle, Filter, UserX,
  Clock, AlertTriangle, PauseCircle, ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { patientApi, getFileUrl } from '@/lib/patientApi';
import type { WeeklyPaymentStat } from '@/lib/patientApi';
import type { PatientListItem } from '@/types/patients';

/* ── Badges ── */
function StatusBadge({ status, paymentStatus }: { status?: string; paymentStatus?: string }) {
  const v = (status || '').toUpperCase();
  // Expired plan with no renewal → show Inactive regardless of payment state
  if (v === 'INACTIVE')
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-500">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />Inactive
      </span>
    );
  if ((paymentStatus || '').toUpperCase() === 'FAILED')
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-700">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 inline-block" />Pending
      </span>
    );
  if (v === 'ACTIVE')
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-700">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />Active
      </span>
    );
  if (v === 'RENEWAL_DUE')
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-700">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />Expired
      </span>
    );
  if (v === 'PAYMENT_FAILURE')
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-700">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />Renewal Due
      </span>
    );
  if (v === 'COMPLETED')
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />Completed
      </span>
    );
  if (v === 'ON_HOLD')
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-orange-100 text-orange-700">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />On Hold
      </span>
    );
  if (v === 'EXPIRING_SOON')
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block animate-pulse" />Expiring Soon
      </span>
    );
  // Legacy INACTIVE fallback
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-500">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />Inactive
    </span>
  );
}

function PaymentBadge({ status, patientStatus }: { status?: string; patientStatus?: string }) {
  const ps = (patientStatus || '').toUpperCase();
  if (ps === 'INACTIVE')
    return <span className="text-gray-400 text-sm">—</span>;
  // Payment failed mid-process takes priority over subscription status
  if ((status || '').toUpperCase() === 'FAILED')
    return <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-700">Failed</span>;
  if (ps === 'RENEWAL_DUE')
    return <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-orange-100 text-orange-700">Renewal Due</span>;
  return <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-700">Paid</span>;
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
      title={patient.prescriptionFileName || 'Prescription'}
    >
      <Eye className="h-3.5 w-3.5" />
      View
    </button>
  );
}

/* ── Loading skeleton ── */
function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="border-b border-gray-100">
          {Array.from({ length: 9 }).map((_, j) => (
            <td key={j} className="px-5 py-4">
              <div className="h-4 bg-gray-100 rounded-lg animate-pulse" style={{ width: j === 1 ? '120px' : j === 5 ? '100px' : '64px' }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/* ── Empty state ── */
function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <tr>
      <td colSpan={9} className="px-5 py-16 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
            <UserX className="w-7 h-7 text-gray-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-700">{hasSearch ? 'No results found' : 'No patients yet'}</p>
            <p className="text-sm text-gray-400 mt-1">
              {hasSearch ? 'Try adjusting your search or filter.' : 'Patients will appear here once added.'}
            </p>
          </div>
        </div>
      </td>
    </tr>
  );
}

const STATUS_OPTIONS = [
  { value: 'ACTIVE',        label: 'Active',        dot: 'bg-green-500',  text: 'text-green-700',  bg: 'bg-green-50'  },
  { value: 'INACTIVE',      label: 'Inactive',      dot: 'bg-gray-400',   text: 'text-gray-500',   bg: 'bg-gray-100'  },
  { value: 'COMPLETED',     label: 'Completed',     dot: 'bg-blue-500',   text: 'text-blue-700',   bg: 'bg-blue-50'   },
  { value: 'ON_HOLD',       label: 'On Hold',       dot: 'bg-orange-400', text: 'text-orange-600', bg: 'bg-orange-50' },
  { value: 'RENEWAL_DUE',   label: 'Expired',       dot: 'bg-red-500',    text: 'text-red-600',    bg: 'bg-red-50'    },
  { value: 'EXPIRING_SOON', label: 'Expiring Soon', dot: 'bg-amber-400',  text: 'text-amber-600',  bg: 'bg-amber-50'  },
];

function StatusChanger({ patient, onChange }: { patient: PatientListItem; onChange: (updated: PatientListItem) => void }) {
  const [open, setOpen]       = useState(false);
  const [saving, setSaving]   = useState(false);
  const ref                   = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const current = STATUS_OPTIONS.find(o => o.value === String(patient.status).toUpperCase())
    ?? STATUS_OPTIONS.find(o => o.value === 'ACTIVE')!;

  const handleSelect = async (value: string) => {
    if (value === current.value) { setOpen(false); return; }
    setSaving(true);
    setOpen(false);
    try {
      const updated = await patientApi.updateStatus(patient.id, value);
      onChange(updated);
      toast.success(`Status updated to ${STATUS_OPTIONS.find(o => o.value === value)?.label}`);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(v => !v)}
        disabled={saving}
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${current.bg} ${current.text} hover:opacity-80 transition-opacity disabled:opacity-50`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${current.dot} inline-block`} />
        {saving ? 'Saving…' : current.label}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[140px]">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 transition-colors text-left
                ${opt.value === current.value ? 'bg-purple-50 text-purple-700' : 'text-gray-700'}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${opt.dot} flex-shrink-0`} />
              {opt.label}
              {opt.value === current.value && <span className="ml-auto text-purple-500 text-[10px]">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main page ── */
export default function PatientsPage() {
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [weeklyStats, setWeeklyStats] = useState<WeeklyPaymentStat[]>([]);

  const fetchPatients = useCallback(async () => {
    setRefreshing(true);
    try {
      const [data, weekly] = await Promise.all([
        patientApi.getPatients(),
        patientApi.getWeeklyPaymentStats(),
      ]);
      setPatients(data);
      setWeeklyStats(weekly);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to load patients');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return patients.filter((p) => {
      const matchesSearch = !q || [p.patient, p.injury, p.doctorAssigned, p.prescription]
        .filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
      const s = String(p.status).toUpperCase();
      // Normalise legacy statuses for filter matching
      const normStatus = s === 'PAYMENT_FAILURE' ? 'RENEWAL_DUE' : s;
      return matchesSearch && (status === 'ALL' || normStatus === status);
    });
  }, [patients, search, status]);

  const stats = useMemo(() => {
    const s = (p: PatientListItem) => String(p.status).toUpperCase();
    return {
      total:        patients.length,
      active:       patients.filter(p => s(p) === 'ACTIVE').length,
      renewalDue:   patients.filter(p => ['RENEWAL_DUE','PAYMENT_FAILURE'].includes(s(p))).length,
      completed:    patients.filter(p => s(p) === 'COMPLETED').length,
      onHold:       patients.filter(p => s(p) === 'ON_HOLD').length,
      inactive:     patients.filter(p => s(p) === 'INACTIVE').length,
      expiringSoon: patients.filter(p => s(p) === 'EXPIRING_SOON').length,
    };
  }, [patients]);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-gray-50 p-4 sm:p-5 lg:p-6">

      {/* Header */}
      <div className="mb-5 flex flex-none items-start justify-between gap-4">
        <div>
          <nav className="mb-1.5 flex items-center gap-1.5 text-xs text-gray-400">
            <span>Dashboard</span>
            <span>/</span>
            <span className="font-semibold text-gray-600">Patients</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">Patient Management</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            View patient records, prescriptions, and exercise libraries.
          </p>
        </div>
        <button
          onClick={fetchPatients}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-60 px-4 py-2.5 text-sm font-semibold text-white transition-colors shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="mb-4 flex-none grid grid-cols-2 gap-3 lg:grid-cols-7">
        <StatCard label="Total"         value={stats.total}        icon={<Users className="w-4 h-4 text-indigo-500" />}      iconBg="bg-indigo-50"  />
        <StatCard label="Inactive"      value={stats.inactive}     icon={<UserX className="w-4 h-4 text-gray-500" />}        iconBg="bg-gray-50"    accent="text-gray-600" />
        <StatCard label="Active"        value={stats.active}       icon={<UserCheck className="w-4 h-4 text-green-600" />}   iconBg="bg-green-50"   accent="text-green-700" />
        <StatCard label="Completed"     value={stats.completed}    icon={<CheckCircle2 className="w-4 h-4 text-blue-500" />} iconBg="bg-blue-50"    accent="text-blue-700" />
        <StatCard label="On Hold"       value={stats.onHold}       icon={<PauseCircle className="w-4 h-4 text-orange-500"/>} iconBg="bg-orange-50"  accent="text-orange-700" />
        <StatCard label="Expiring Soon" value={stats.expiringSoon} icon={<Clock className="w-4 h-4 text-amber-500" />}      iconBg="bg-amber-50"   accent="text-amber-700" />
        <PaymentFailureStatCard value={patients.filter(p => String(p.paymentStatus).toUpperCase() === 'FAILED').length} weeklyStats={weeklyStats} />
      </div>

      {/* Search + filter */}
      <div className="mb-4 flex flex-none gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient, injury, doctor…"
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="appearance-none rounded-xl border border-gray-200 bg-white pl-9 pr-10 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="RENEWAL_DUE">Expired</option>
            <option value="COMPLETED">Completed</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="INACTIVE">Inactive</option>
            <option value="EXPIRING_SOON">Expiring Soon</option>
          </select>
        </div>
      </div>

      {/* Result count */}
      {!loading && (
        <p className="mb-2 text-xs text-gray-400 flex-none">
          Showing <span className="font-semibold text-gray-600">{filtered.length}</span> of {patients.length} patients
        </p>
      )}

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-max min-w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <tr>
                {['ID', 'Patient', 'Subscription Status', 'Join Date', 'Injury', 'Doctor Assigned', 'Payment', 'Prescription', 'Exercise Library'].map((h, i) => (
                  <th key={h} className={`px-5 py-3.5 font-semibold text-sm whitespace-nowrap ${i === 8 ? 'text-center' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <TableSkeleton />
              ) : filtered.length === 0 ? (
                <EmptyState hasSearch={!!(search || status !== 'ALL')} />
              ) : filtered.map((patient) => (
                <tr key={patient.id} className="hover:bg-purple-50/40 transition-colors group">
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-purple-100 text-purple-700 font-bold text-xs">
                      {patient.id}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-gray-900 whitespace-nowrap">{patient.patient}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {[patient.age && `${patient.age}y`, patient.gender].filter(Boolean).join(' · ') || '—'}
                    </p>
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusChanger
                      patient={patient}
                      onChange={(updated) =>
                        setPatients(prev => prev.map(p => p.id === updated.id ? updated : p))
                      }
                    />
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600 whitespace-nowrap">{patient.joinDate || '—'}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-700">{patient.injury || '—'}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-700 whitespace-nowrap">{patient.doctorAssigned || '—'}</td>
                  <td className="px-5 py-3.5"><PaymentBadge status={patient.paymentStatus} patientStatus={patient.status} /></td>
                  <td className="px-5 py-3.5"><PrescriptionCell patient={patient} /></td>
                  <td className="px-5 py-3.5 text-center">
                    <Link
                      href={`/dashboard/patients/${patient.id}/library`}
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
  );
}

/* ── Stat card ── */
function StatCard({ label, value, icon, iconBg, accent }: {
  label: string; value: number; icon: React.ReactNode; iconBg: string; accent?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-tight">{label}</p>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>{icon}</div>
      </div>
      <p className={`text-2xl font-bold ${accent ?? 'text-gray-900'}`}>{value}</p>
    </div>
  );
}

/* ── Payment failure card ── */
function PaymentFailureStatCard({ value, weeklyStats }: {
  value: number; weeklyStats: WeeklyPaymentStat[];
}) {
  const thisWeek  = weeklyStats.length > 0 ? weeklyStats[weeklyStats.length - 1] : null;
  const lastWeek  = weeklyStats.length > 1 ? weeklyStats[weeklyStats.length - 2] : null;
  const weekCount = thisWeek?.count ?? 0;
  const lastCount = lastWeek?.count ?? 0;
  const pct       = value > 0 ? Math.round((weekCount / value) * 100) : 0;
  const trend     = weekCount - lastCount;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Payment Failure</p>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-red-50">
          <CreditCard className="w-3.5 h-3.5 text-red-500" />
        </div>
      </div>

      {/* Total + trend */}
      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {lastCount > 0 && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            trend > 0 ? 'bg-red-100 text-red-600' : trend < 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
          }`}>
            {trend > 0 ? `↑ ${trend}` : trend < 0 ? `↓ ${Math.abs(trend)}` : '→ 0'} vs last week
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <div>
            <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide">This Week</span>
            {thisWeek?.weekLabel && (
              <p className="text-[9px] text-gray-400 mt-0.5">{thisWeek.weekLabel}</p>
            )}
          </div>
          <span className="text-[10px] font-bold text-red-500">{weekCount} <span className="text-gray-300 font-normal">({pct}%)</span></span>
        </div>
        <div className="h-1.5 w-full bg-red-50 rounded-full overflow-hidden">
          <div className="h-full bg-red-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}
