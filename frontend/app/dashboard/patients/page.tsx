'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen, CalendarDays, CheckCircle2, CreditCard, Eye,
  RefreshCw, Search, UserCheck, Users, XCircle, Filter, UserX,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { patientApi, getFileUrl } from '@/lib/patientApi';
import type { WeeklyPaymentStat } from '@/lib/patientApi';
import type { PatientListItem } from '@/types/patients';

/* ── Badges ── */
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
      const subStatus = String(p.status).toUpperCase() === 'PAYMENT_FAILURE' ? 'INACTIVE' : String(p.status).toUpperCase();
      return matchesSearch && (status === 'ALL' || subStatus === status);
    });
  }, [patients, search, status]);

  const stats = useMemo(() => ({
    total:   patients.length,
    active:  patients.filter((p) => String(p.status).toUpperCase() === 'ACTIVE').length,
    inactive: patients.filter((p) => ['INACTIVE', 'PAYMENT_FAILURE'].includes(String(p.status).toUpperCase())).length,
    completed: patients.filter((p) => String(p.status).toUpperCase() === 'COMPLETED').length,
    paymentFailure: patients.filter((p) => String(p.status).toUpperCase() === 'PAYMENT_FAILURE').length,
  }), [patients]);

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
      <div className="mb-4 flex-none grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Total"    value={stats.total}          icon={<Users className="w-4 h-4 text-indigo-500" />}     iconBg="bg-indigo-50" />
        <StatCard label="Active"   value={stats.active}         icon={<UserCheck className="w-4 h-4 text-green-500" />}   iconBg="bg-green-50"  />
        <StatCard label="Inactive" value={stats.inactive}       icon={<XCircle className="w-4 h-4 text-gray-400" />}     iconBg="bg-gray-100"  />
        <StatCard label="Completed" value={stats.completed}     icon={<CheckCircle2 className="w-4 h-4 text-blue-500" />} iconBg="bg-blue-50"   />
        <PaymentFailureStatCard value={stats.paymentFailure} weeklyStats={weeklyStats} />
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
            <option value="INACTIVE">Inactive</option>
            <option value="COMPLETED">Completed</option>
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
                  <td className="px-5 py-3.5"><StatusBadge status={patient.status} paymentStatus={patient.paymentStatus} /></td>
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
function StatCard({ label, value, icon, iconBg }: {
  label: string; value: number; icon: React.ReactNode; iconBg: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconBg}`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

/* ── Payment failure card with weekly toggle ── */
function PaymentFailureStatCard({ value, weeklyStats }: {
  value: number; weeklyStats: WeeklyPaymentStat[];
}) {
  const [showThisWeek, setShowThisWeek] = useState(false);
  const thisWeek = weeklyStats.length > 0 ? weeklyStats[weeklyStats.length - 1] : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Payment Failure</p>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-red-50">
          <CreditCard className="w-3.5 h-3.5 text-red-500" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <button
          onClick={() => setShowThisWeek(!showThisWeek)}
          className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold transition-all ${
            showThisWeek ? 'bg-red-500 text-white' : 'bg-red-50 text-red-600 hover:bg-red-100'
          }`}
        >
          <CalendarDays className="w-3 h-3 shrink-0" />
          Week
          {showThisWeek && thisWeek && <span className="font-black ml-0.5">{thisWeek.count}</span>}
        </button>
      </div>
      {showThisWeek && (
        <p className="mt-1 text-[10px] text-red-400 font-medium truncate">
          {thisWeek ? thisWeek.weekLabel : 'No data yet'}
        </p>
      )}
    </div>
  );
}
