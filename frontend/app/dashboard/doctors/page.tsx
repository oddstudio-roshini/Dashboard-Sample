"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Download, Search, ChevronDown, Users, UserCheck,
  UserMinus, RefreshCw, Clock, Upload,
  FileSpreadsheet, X, CheckCircle, AlertCircle, ScrollText,
} from "lucide-react";
import toast from "react-hot-toast";
import { doctorsAPI } from "@/lib/api";
import { Doctor, DoctorStats } from "@/types";
import CreateDoctorModal from "@/components/CreateDoctorModal";
import ViewLogsModal from "@/components/ViewLogsModal";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:   "bg-green-100 text-green-700 border-green-200",
  INACTIVE: "bg-yellow-100 text-yellow-700 border-yellow-200",
  BLOCKED:  "bg-red-100 text-red-700 border-red-200",
};

// ── Online dot ────────────────────────────────────────────────────────────────
function StatusDot({ isOnline }: { isOnline: boolean }) {
  return isOnline
    ? <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0" title="Online" />
    : <span className="inline-block w-2 h-2 bg-gray-300 rounded-full flex-shrink-0" title="Offline" />;
}

// ── CSV Upload Modal ───────────────────────────────────────────────────────────
function CsvUploadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [file, setFile]           = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult]       = useState<{ created: number; skipped: number; errors: string[] } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.name.endsWith('.csv')) { toast.error('Please upload a .csv file'); return; }
    setFile(f); setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await doctorsAPI.importCsv(file);
      if (res.success) {
        setResult(res.data);
        if (res.data.created > 0) onSuccess();
        toast.success(`${res.data.created} doctors imported`);
      } else {
        toast.error(res.message || 'Import failed');
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Import Doctors via CSV</h2>
              <p className="text-xs text-gray-500">Bulk-add doctors from a spreadsheet</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* CSV format hint */}
          <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700 space-y-1">
            <p className="font-semibold">Required CSV columns (header row):</p>
            <p className="font-mono bg-white/60 rounded px-2 py-1">
              firstName, lastName, email, mobileNumber, specialization, clinicHospital, status
            </p>
            <p className="text-blue-500">status values: ACTIVE, INACTIVE, BLOCKED (default: ACTIVE)</p>
          </div>

          {/* Drop zone */}
          {!result && (
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                file ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
              }`}
            >
              <input ref={inputRef} type="file" accept=".csv" className="hidden"
                onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <FileSpreadsheet className="w-8 h-8 text-purple-500" />
                  <p className="font-semibold text-gray-800 text-sm">{file.name}</p>
                  <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-gray-300" />
                  <p className="text-sm font-medium text-gray-600">Drop CSV here or <span className="text-purple-600">browse</span></p>
                  <p className="text-xs text-gray-400">Only .csv files supported</p>
                </div>
              )}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-green-700">{result.created}</p>
                  <p className="text-xs text-green-600">Doctors Created</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <AlertCircle className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-amber-600">{result.skipped}</p>
                  <p className="text-xs text-amber-500">Skipped / Errors</p>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="bg-red-50 rounded-xl p-3 max-h-32 overflow-y-auto space-y-1">
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-xs text-red-600">• {e}</p>
                  ))}
                </div>
              )}
              <button onClick={() => { setFile(null); setResult(null); }}
                className="w-full text-sm text-purple-600 hover:underline">
                Import another file
              </button>
            </div>
          )}

          {/* Actions */}
          {!result && (
            <div className="flex gap-3 pt-1">
              <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                {uploading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Importing...</> : <><Upload className="w-4 h-4" /> Import Doctors</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DoctorsPage() {
  const router = useRouter();
  const [doctors, setDoctors]       = useState<Doctor[]>([]);
  const [stats, setStats]           = useState<DoctorStats>({ totalDoctors: 0, activeDoctors: 0, inactiveDoctors: 0 });
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [showCsv, setShowCsv]       = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showLogs, setShowLogs]     = useState(false);

  const searchRef = useRef(search);
  const filterRef = useRef(statusFilter);
  searchRef.current = search;
  filterRef.current = statusFilter;

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const [doctorsRes, statsRes] = await Promise.all([
        doctorsAPI.getAll(searchRef.current || undefined, filterRef.current !== 'ALL' ? filterRef.current : undefined),
        doctorsAPI.getStats(),
      ]);
      if (doctorsRes.success) setDoctors(doctorsRes.data);
      if (statsRes.success) setStats(statsRes.data);
      setLastUpdated(new Date());
    } catch {
      if (!silent) toast.error('Failed to load doctors');
    } finally {
      setInitialLoading(false);
      if (!silent) setRefreshing(false);
    }
  }, []);

  useEffect(() => { setInitialLoading(true); fetchData(false); }, [fetchData]);
  useEffect(() => {
    const t = setTimeout(() => fetchData(false), search ? 400 : 0);
    return () => clearTimeout(t);
  }, [search, statusFilter]); // eslint-disable-line
  useEffect(() => {
    const i = setInterval(() => fetchData(true), 300000);
    return () => clearInterval(i);
  }, [fetchData]);


  const handleExport = () => {
    const csv = [
      ['ARthoMove ID', 'Doctor Name', 'Hospital/Clinic', 'Clinical ID', 'Email', 'Phone', 'Status', 'Last Login'],
      ...doctors.map(d => [
        d.arthomoveId ?? `ARTH-${String(d.id).padStart(3, '0')}`,
        d.fullName, d.clinicHospital ?? '', d.clinicalId,
        d.email, d.mobileNumber ?? '', d.status,
        d.lastLogin ? new Date(d.lastLogin).toLocaleDateString() : '',
      ]),
    ].map(r => r.map(v => `"${v}"`).join(',')).join('\n');

    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'doctors.csv'; a.click();
  };

  const onlineCount = doctors.filter(d => d.isOnline).length;

  const TABLE_COLS = [
    'ARthoMove ID', 'Doctor Name', 'Hospital / Clinic', 'Clinical ID',
    'Email ID', 'Phone Number', 'Status', 'Patients', 'Last Login', 'Actions',
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-gray-50 p-4 sm:p-6">

      {/* HEADER */}
      <div className="flex-none flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">Doctor Accounts</h1>
            {onlineCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                {onlineCount} Online
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">Manage doctor access, profiles, and patient assignments.</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setShowCsv(true)}
            className="flex items-center gap-2 px-4 py-2.5 border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl text-sm font-semibold transition-colors">
            <Upload className="w-4 h-4" /> Upload CSV
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" /> Create Doctor
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="flex-none grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        <StatCard label="Total Doctors"    value={stats.totalDoctors}    icon={<Users className="w-5 h-5 text-indigo-500" />}  iconBg="bg-indigo-50" />
        <StatCard label="Active Doctors"   value={stats.activeDoctors}   icon={<UserCheck className="w-5 h-5 text-green-500" />} iconBg="bg-green-50" />
        <StatCard label="Inactive Doctors" value={stats.inactiveDoctors} icon={<UserMinus className="w-5 h-5 text-yellow-500" />} iconBg="bg-yellow-50" />
      </div>

      {/* TABLE CARD */}
      <div className="flex-1 min-h-0 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm">

        {/* Top bar */}
        <div className="flex-none flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-sm">Doctors Directory</h2>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </span>
            )}
            <button onClick={() => fetchData(false)} disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50">
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <Download className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" onClick={handleExport} />
          </div>
        </div>

        {/* Search + filter */}
        <div className="flex-none flex flex-wrap items-center gap-3 px-5 py-3 border-b border-gray-50">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by name, clinical ID, email..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>
          <div className="relative">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="appearance-none pl-4 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="BLOCKED">Blocked</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Table */}
        {initialLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : doctors.length === 0 ? (
          /* Empty state with centered CSV upload */
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
              <Users className="w-8 h-8 text-gray-300" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-700">No doctors found</p>
              <p className="text-sm text-gray-400 mt-1">Create a doctor manually or import from CSV</p>
            </div>
            <div className="flex gap-3 mt-2">
              <button onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-colors">
                <Plus className="w-4 h-4" /> Create Doctor
              </button>
              <button onClick={() => setShowCsv(true)}
                className="flex items-center gap-2 px-5 py-2.5 border-2 border-dashed border-purple-300 text-purple-600 hover:bg-purple-50 rounded-xl text-sm font-semibold transition-colors">
                <Upload className="w-4 h-4" /> Upload CSV
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                <tr>
                  {TABLE_COLS.map(col => (
                    <th key={col} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {doctors.map(doc => (
                  <tr
                    key={doc.id}
                    onClick={() => router.push(`/dashboard/doctors/${doc.id}`)}
                    className={`cursor-pointer hover:bg-purple-50/50 transition-colors ${doc.isOnline ? 'bg-green-50/20' : ''}`}
                  >

                    {/* ARthoMove ID */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-xs font-bold font-mono text-indigo-700">
                        {doc.arthomoveId ?? `ARTH-${String(doc.id).padStart(3, '0')}`}
                      </span>
                    </td>

                    {/* Doctor Name + online dot */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <StatusDot isOnline={!!doc.isOnline} />
                        <p className="font-semibold text-gray-900 text-sm whitespace-nowrap">{doc.fullName}</p>
                      </div>
                    </td>

                    {/* Hospital / Clinic */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-gray-600 max-w-[140px] truncate block" title={doc.clinicHospital || '—'}>
                        {doc.clinicHospital || <span className="text-gray-400">—</span>}
                      </span>
                    </td>

                    {/* Clinical ID */}
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-mono text-gray-700">{doc.clinicalId}</span>
                    </td>

                    {/* Email ID */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-gray-600 max-w-[160px] truncate block" title={doc.email}>
                        {doc.email}
                      </span>
                    </td>

                    {/* Phone Number */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-gray-600 whitespace-nowrap">
                        {doc.mobileNumber || <span className="text-gray-400">—</span>}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[doc.status] ?? STATUS_COLORS.INACTIVE}`}>
                        {doc.status}
                      </span>
                    </td>

                    {/* Patients */}
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

                    {/* Last Login */}
                    <td className="px-4 py-3.5">
                      {doc.lastLogin ? (
                        <div>
                          <p className="text-xs text-gray-600 whitespace-nowrap">
                            {new Date(doc.lastLogin).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </p>
                          <p className="text-[10px] text-gray-400 whitespace-nowrap">
                            {new Date(doc.lastLogin).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">Never</span>
                      )}
                    </td>

                    {/* Actions — only Logs; click row to open profile */}
                    <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => { setSelectedDoctor(doc); setShowLogs(true); }}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg bg-green-50 text-green-700 hover:bg-green-100 font-medium transition-colors"
                      >
                        <ScrollText className="w-3 h-3" /> Logs
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="flex-none px-5 py-2.5 border-t border-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-400">{doctors.length} doctors</p>
        </div>
      </div>

      {/* MODALS */}
      <CreateDoctorModal isOpen={showCreate} onClose={() => setShowCreate(false)} onSuccess={() => fetchData(false)} />

      {showCsv && (
        <CsvUploadModal onClose={() => setShowCsv(false)} onSuccess={() => fetchData(false)} />
      )}

      {selectedDoctor && (
        <ViewLogsModal
          isOpen={showLogs}
          onClose={() => setShowLogs(false)}
          doctor={selectedDoctor}
        />
      )}
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, iconBg }: { label: string; value: number; icon: React.ReactNode; iconBg: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>{icon}</div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
