'use client';

/**
 * app/dashboard/exercises/page.tsx
 * Exercise Library – Library tab + Admin tab with Delete / Edit / Publish modals
 * Connected to real backend via exerciseLibraryApi
 */

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  LayoutGrid, Settings2, Play, Edit, Trash2, Download,
  Cloud, Search, Filter, CheckCircle, Clock, BarChart2, DollarSign,
  Lock, AlertCircle, X, Eye, EyeOff, Calendar,
  RefreshCw, FileText, History,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { exerciseLibraryApi } from '@/lib/exerciseLibraryApi';
import type { CategoryDTO, ExerciseDTO, UpdateExerciseRequest, ExerciseLogsResponse } from '@/lib/exerciseLibraryApi';
import { authAPI } from '@/lib/api';
import { getAdmin } from '@/lib/auth';

// ─── Local type aliases (match the API DTOs exactly) ──────────────────────────

type Exercise = ExerciseDTO;
type Category = CategoryDTO;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

// ─── Modal: Confirm Delete ─────────────────────────────────────────────────────

function DeleteModal({ exercise, onCancel, onConfirm }: {
  exercise: Exercise; onCancel: () => void; onConfirm: () => void;
}) {
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!password) { setError('Please enter your password.'); return; }
    setLoading(true);
    const admin = getAdmin();
    const valid = await authAPI.verifyPassword(admin?.email ?? '', password);
    setLoading(false);
    if (!valid) { setError('Incorrect password. Please try again.'); return; }
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-3 sm:mx-4 p-5 sm:p-7">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Confirm Delete</h2>
        <p className="text-gray-600 mb-6">
          Do you really want to delete <strong>"{exercise.name}"</strong>? This action cannot be undone.
        </p>

        <label className="block text-sm font-semibold text-gray-800 mb-2">
          Enter your login password to confirm
        </label>
        <div className="relative mb-1">
          <input
            type={showPw ? 'text' : 'password'}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleDelete()}
            className={`w-full border-2 rounded-xl px-4 py-3 text-sm focus:outline-none transition ${
              error ? 'border-red-400' : 'border-red-200 focus:border-red-400'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {error && <p className="text-red-500 text-xs mb-1">{error}</p>}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition text-sm flex items-center justify-center gap-2"
          >
            {loading
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Verifying…</>
              : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Edit Exercise ──────────────────────────────────────────────────────

function EditModal({ exercise, categories, onCancel, onSave }: {
  exercise: Exercise;
  categories: Category[];
  onCancel: () => void;
  onSave: (updated: Exercise) => void;
}) {
  const [form, setForm] = useState({ ...exercise });
  const set = (field: keyof Exercise, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-3 sm:mx-4 p-5 sm:p-7">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900">Edit Exercise</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exercise Name</label>
            <input value={form.name} onChange={(e) => set('name', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
              <select value={form.level} onChange={(e) => set('level', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white">
                <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
              <input value={form.duration} onChange={(e) => set('duration', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
              <input type="number" value={form.price} onChange={(e) => set('price', Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={form.category} onChange={(e) => set('category', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white">
                {categories.map((c) => <option key={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recommended By</label>
            <input value={form.developer} onChange={(e) => set('developer', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={form.status} onChange={(e) => set('status', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white">
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onCancel}
            className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition text-sm">
            Cancel
          </button>
          <button onClick={() => onSave(form)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition text-sm">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Publish / Schedule ─────────────────────────────────────────────────

function PublishModal({ exercise, onCancel, onPublish, onSchedule }: {
  exercise: Exercise; onCancel: () => void; onPublish: () => void; onSchedule: (date: string) => void;
}) {
  const [scheduleDate, setScheduleDate] = useState('');
  const [mode, setMode]       = useState<'now' | 'schedule'>('now');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const isPublished = exercise.status === 'published';

  const handleConfirm = async (action: () => void) => {
    if (!password) { setError('Please enter your password.'); return; }
    setLoading(true);
    const admin = getAdmin();
    const valid = await authAPI.verifyPassword(admin?.email ?? '', password);
    setLoading(false);
    if (!valid) { setError('Incorrect password. Please try again.'); return; }
    action();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-3 sm:mx-4 p-5 sm:p-7">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-900">
            {isPublished ? 'Unpublish Exercise' : 'Publish Exercise'}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <p className="text-gray-500 text-sm mb-5">
          {isPublished
            ? `"${exercise.name}" is currently published. Unpublishing will hide it from the library.`
            : `Choose how you'd like to publish "${exercise.name}".`}
        </p>

        {!isPublished && (
          <>
            <div className="flex gap-2 bg-gray-100 p-1 rounded-xl mb-5">
              <button onClick={() => setMode('now')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition ${
                  mode === 'now' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>
                <CheckCircle className="w-4 h-4" />Publish Now
              </button>
              <button onClick={() => setMode('schedule')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition ${
                  mode === 'schedule' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>
                <Calendar className="w-4 h-4" />Schedule
              </button>
            </div>

            {mode === 'now' && (
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-5">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">This exercise will be immediately visible in the library.</span>
                </div>
              </div>
            )}

            {mode === 'schedule' && (
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Schedule publish date &amp; time</label>
                <input type="datetime-local" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
            )}
          </>
        )}

        {isPublished && (
          <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 mb-5">
            <div className="flex items-center gap-2 text-yellow-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">This exercise will be moved to Draft and hidden from users.</span>
            </div>
          </div>
        )}

        {/* ── Password confirmation ─────────────────────────────────────── */}
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          Enter your login password to confirm
        </label>
        <div className="relative mb-1">
          <input
            type={showPw ? 'text' : 'password'}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            className={`w-full border-2 rounded-xl px-4 py-3 text-sm focus:outline-none transition ${
              error ? 'border-red-400' : 'border-gray-200 focus:border-blue-400'
            }`}
          />
          <button type="button" onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {error && <p className="text-red-500 text-xs mb-1">{error}</p>}

        <div className="flex gap-3 mt-5">
          <button onClick={onCancel}
            className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition text-sm">
            Cancel
          </button>
          {isPublished ? (
            <button onClick={() => handleConfirm(onPublish)} disabled={loading}
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition text-sm flex items-center justify-center gap-2">
              {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Verifying…</> : 'Unpublish'}
            </button>
          ) : mode === 'now' ? (
            <button onClick={() => handleConfirm(onPublish)} disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition text-sm flex items-center justify-center gap-2">
              {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Verifying…</> : 'Publish Now'}
            </button>
          ) : (
            <button onClick={() => scheduleDate && handleConfirm(() => onSchedule(scheduleDate))} disabled={!scheduleDate || loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition text-sm flex items-center justify-center gap-2">
              {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Verifying…</> : 'Schedule'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Drawer: Exercise Logs ─────────────────────────────────────────────────────

const ACTION_CFG: Record<string, { color: string; bg: string; border: string; label: string; defaultDetail: string }> = {
  PUBLISHED:   { color: '#7C3AED', bg: '#F5F3FF', border: '#C4B5FD', label: 'Published',   defaultDetail: 'Exercise was published to the library.' },
  UPDATED:     { color: '#7C3AED', bg: '#F5F3FF', border: '#C4B5FD', label: 'Updated',     defaultDetail: 'Exercise details were updated.' },
  UNPUBLISHED: { color: '#7C3AED', bg: '#F5F3FF', border: '#C4B5FD', label: 'Unpublished', defaultDetail: 'Exercise was moved back to draft.' },
};

const FILTER_BTNS = [
  { action: 'PUBLISHED',   label: 'Publish',   activeColor: '#059669', activeBg: '#ECFDF5', activeBorder: '#6EE7B7' },
  { action: 'UPDATED',     label: 'Update',    activeColor: '#2563EB', activeBg: '#EFF6FF', activeBorder: '#93C5FD' },
  { action: 'UNPUBLISHED', label: 'Unpublish', activeColor: '#D97706', activeBg: '#FFFBEB', activeBorder: '#FCD34D' },
] as const;

const FILTER_ACTIONS = FILTER_BTNS.map((b) => b.action);

function fmtTs(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'numeric', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true,
    });
  } catch { return iso; }
}

function LogsDrawer({ exercise, onClose }: { exercise: Exercise; onClose: () => void }) {
  const [data, setData] = useState<ExerciseLogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(
    new Set(['PUBLISHED', 'UPDATED', 'UNPUBLISHED'])
  );

  useEffect(() => {
    exerciseLibraryApi.getLogs(exercise.id)
      .then(setData)
      .catch(() => toast.error('Failed to load logs'))
      .finally(() => setLoading(false));
  }, [exercise.id]);

  const toggleFilter = (action: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(action)) next.delete(action);
      else next.add(action);
      return next;
    });
  };

  const filteredLogs = (data?.logs ?? []).filter(
    (l) => (FILTER_ACTIONS as readonly string[]).includes(l.action) && activeFilters.has(l.action)
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer panel */}
      <div className="relative w-full max-w-[440px] bg-white h-full shadow-2xl flex flex-col">

        {/* ── Header ── */}
        <div className="p-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="text-base font-bold text-gray-900 truncate">
                  {data?.exerciseName ?? exercise.name}
                </h2>
                {data && (
                  <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
                    v{data.version}
                  </span>
                )}
              </div>
              {data?.updatedAt ? (
                <p className="text-xs text-gray-400">Last updated: {fmtTs(data.updatedAt)}</p>
              ) : !loading && (
                <p className="text-xs text-gray-400 italic">Never edited</p>
              )}
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Filter buttons ── */}
        <div className="px-5 pt-4 pb-3 border-b border-gray-100 flex-shrink-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5" /> History
          </p>
          <div className="flex gap-2">
            {FILTER_BTNS.map((btn) => {
              const active = activeFilters.has(btn.action);
              return (
                <button
                  key={btn.action}
                  onClick={() => toggleFilter(btn.action)}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold border-2 transition-all duration-150"
                  style={active
                    ? { backgroundColor: btn.activeBg, color: btn.activeColor, borderColor: btn.activeBorder }
                    : { backgroundColor: '#F9FAFB', color: '#9CA3AF', borderColor: '#E5E7EB' }
                  }
                >
                  {btn.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Timeline ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />Loading logs…
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <FileText className="w-9 h-9 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No events yet</p>
              <p className="text-xs mt-1 text-gray-300">
                Publish, edit, or unpublish this exercise to see history here.
              </p>
            </div>
          ) : (
            /* Timeline list — matches the screenshot style exactly */
            <div className="relative pl-7">
              {/* Vertical line */}
              <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-purple-200" />

              <div className="space-y-7">
                {filteredLogs.map((log) => {
                  const cfg = ACTION_CFG[log.action] ?? ACTION_CFG.UPDATED;
                  return (
                    <div key={log.id} className="relative">
                      {/* Circle dot on the line */}
                      <div
                        className="absolute -left-7 top-0.5 w-4 h-4 rounded-full border-2 bg-white z-10"
                        style={{ borderColor: '#7C3AED' }}
                      />

                      {/* Content — exactly like the screenshot */}
                      <p className="font-semibold text-gray-900 text-sm leading-snug">{cfg.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        {log.details || cfg.defaultDetail}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-400">{fmtTs(log.timestamp)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Modal: View AR JSON ───────────────────────────────────────────────────────

function ViewJsonModal({ title, exercises, onClose }: {
  title: string;
  exercises: Exercise[];
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Exercise | null>(exercises.length === 1 ? exercises[0] : null);
  const [jsonData, setJsonData] = useState<object | null>(null);
  const [jsonLoading, setJsonLoading] = useState(false);
  const [jsonError, setJsonError] = useState('');

  const fetchJson = useCallback(async (ex: Exercise) => {
    setSelected(ex);
    setJsonData(null);
    setJsonError('');
    setJsonLoading(true);
    const key = ex.name.toLowerCase().replace(/\s+/g, '_');
    const url = `https://odd-studio.in/ARthomovev1/exercises/${key}.json`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('not found');
      const data = await res.json();
      setJsonData(data);
    } catch {
      setJsonError('No AR data available for this exercise.');
    } finally {
      setJsonLoading(false);
    }
  }, []);

  useEffect(() => {
    if (exercises.length === 1) fetchJson(exercises[0]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const jsonKey = selected ? selected.name.toLowerCase().replace(/\s+/g, '_') : '';
  const jsonUrl = selected ? `https://odd-studio.in/ARthomovev1/exercises/${jsonKey}.json` : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-3 sm:mx-4 p-5 sm:p-7 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">AR Exercise Data</h2>
            <p className="text-xs text-gray-400 mt-0.5">{title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        {exercises.length > 1 && (
          <div className="mb-4 flex-shrink-0 flex flex-wrap gap-2">
            {exercises.map((ex) => (
              <button
                key={ex.id}
                onClick={() => fetchJson(ex)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                  selected?.id === ex.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                }`}
              >
                {ex.name}
              </button>
            ))}
          </div>
        )}

        {jsonUrl && (
          <div className="mb-4 flex-shrink-0 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-xs text-gray-500 font-mono truncate">{jsonUrl}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto min-h-0">
          {!selected ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Eye className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">Select an exercise to view its AR data</p>
            </div>
          ) : jsonLoading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />Loading AR data…
            </div>
          ) : jsonError ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <AlertCircle className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">{jsonError}</p>
            </div>
          ) : (
            <pre className="bg-gray-950 text-green-400 rounded-xl p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {JSON.stringify(jsonData, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ExerciseLibraryPage() {
  const [activeTab, setActiveTab] = useState<'library' | 'admin'>('library');

  // ── Data from API ──────────────────────────────────────────────────────────
  const [categories, setCategories] = useState<Category[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCategories = useCallback(async () => {
    try {
      const data = await exerciseLibraryApi.getCategories();
      setCategories(data);
      setExercises(data.flatMap((c) => c.exercises));
    } catch {
      toast.error('Failed to load exercise library');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  // ── Library purchase state (client-side only) ──────────────────────────────
  const [purchasedExercises, setPurchasedExercises] = useState<Set<number>>(new Set());

  // ── Filters ────────────────────────────────────────────────────────────────
  const [adminSearch, setAdminSearch] = useState('');
  const [adminStatusFilter, setAdminStatusFilter] = useState('All Status');
  const [adminCategoryFilter, setAdminCategoryFilter] = useState('All Categories');

  // ── Cloud ──────────────────────────────────────────────────────────────────
  const [cloudPulling, setCloudPulling] = useState(false);
  const [cloudPulled, setCloudPulled] = useState(false);

  // ── Modal / drawer state ──────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<Exercise | null>(null);
  const [editTarget, setEditTarget] = useState<Exercise | null>(null);
  const [publishTarget, setPublishTarget] = useState<Exercise | null>(null);
  const [logsTarget, setLogsTarget] = useState<Exercise | null>(null);
  const [viewJsonTarget, setViewJsonTarget] = useState<{ title: string; exercises: Exercise[] } | null>(null);

  // ── Filtered admin list ────────────────────────────────────────────────────
  const adminExercises = useMemo(() =>
    exercises.filter((ex) => {
      const ms = adminSearch === '' ||
        ex.name.toLowerCase().includes(adminSearch.toLowerCase()) ||
        ex.developer.toLowerCase().includes(adminSearch.toLowerCase());
      const mst = adminStatusFilter === 'All Status' || ex.status === adminStatusFilter.toLowerCase().replace(' ', '');
      const mc = adminCategoryFilter === 'All Categories' || ex.category === adminCategoryFilter;
      return ms && mst && mc;
    }), [exercises, adminSearch, adminStatusFilter, adminCategoryFilter]
  );

  const totalViews = exercises.reduce((s, e) => s + e.views, 0);
  const totalPurchasesSum = exercises.reduce((s, e) => s + e.purchases, 0);
  const publishedCount = exercises.filter((e) => e.status === 'published').length;
  const draftCount = exercises.filter((e) => e.status === 'draft').length;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handlePurchaseExercise = (id: number) =>
    setPurchasedExercises((prev) => new Set([...prev, id]));

  const handlePullFromCloud = async () => {
    setCloudPulling(true);
    try {
      await exerciseLibraryApi.cloudSync();
      await loadCategories();
      setCloudPulled(true);
      toast.success('Exercise library is up to date');
    } catch {
      toast.error('Cloud sync failed');
    } finally {
      setCloudPulling(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await exerciseLibraryApi.deleteExercise(deleteTarget.id);
      setExercises((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success('Exercise deleted');
    } catch {
      toast.error('Failed to delete exercise');
    }
  };

  const handleEditSave = async (updated: Exercise) => {
    try {
      const req: UpdateExerciseRequest = {
        name: updated.name,
        level: updated.level,
        duration: updated.duration,
        price: updated.price,
        category: updated.category,
        developer: updated.developer,
        status: updated.status,
      };
      const result = await exerciseLibraryApi.updateExercise(updated.id, req);
      setExercises((prev) => prev.map((e) => (e.id === result.id ? result : e)));
      setEditTarget(null);
      toast.success('Exercise updated');
    } catch {
      toast.error('Failed to update exercise');
    }
  };

  const handlePublishToggle = async () => {
    if (!publishTarget) return;
    try {
      const result = await exerciseLibraryApi.togglePublish(publishTarget.id, { mode: 'now' });
      setExercises((prev) => prev.map((e) => (e.id === result.id ? result : e)));
      setPublishTarget(null);
      toast.success(result.status === 'published' ? 'Exercise published' : 'Exercise unpublished');
    } catch {
      toast.error('Failed to update publish status');
    }
  };

  const handleSchedulePublish = async (date: string) => {
    if (!publishTarget) return;
    try {
      const result = await exerciseLibraryApi.togglePublish(publishTarget.id, {
        mode: 'schedule',
        scheduleDate: date,
      });
      setExercises((prev) => prev.map((e) => (e.id === result.id ? result : e)));
      setPublishTarget(null);
      toast.success('Exercise scheduled for publishing');
    } catch {
      toast.error('Failed to schedule publish');
    }
  };

  // ── Shared header ──────────────────────────────────────────────────────────

  const TabHeader = () => (
    <div className="flex flex-wrap items-start sm:items-center justify-between gap-4 mb-6 lg:mb-8">

      {/* Tab switcher */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl border border-gray-200 shadow-inner flex-shrink-0">
        <button
          onClick={() => setActiveTab('library')}
          className={`relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
            activeTab === 'library'
              ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-200'
              : 'text-gray-500 hover:text-gray-800 hover:bg-white/60'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span className="hidden sm:inline">Browse </span>Library
        </button>
        <button
          onClick={() => setActiveTab('admin')}
          className={`relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
            activeTab === 'admin'
              ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-md shadow-purple-200'
              : 'text-gray-500 hover:text-gray-800 hover:bg-white/60'
          }`}
        >
          <Settings2 className="w-4 h-4" />
          <span className="hidden sm:inline">Manage </span>Exercises
        </button>
      </div>
    </div>
  );

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <TabHeader />
        <div className="flex items-center justify-center py-24 text-gray-400">
          <RefreshCw className="w-6 h-6 animate-spin mr-3" />
          Loading exercise library…
        </div>
      </div>
    );
  }

  // ── Admin tab (full-height, only table scrolls) ───────────────────────────

  if (activeTab === 'admin') {
    return (
      <>
        {logsTarget && <LogsDrawer exercise={logsTarget} onClose={() => setLogsTarget(null)} />}
        {deleteTarget && <DeleteModal exercise={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={handleDeleteConfirm} />}
        {editTarget && <EditModal exercise={editTarget} categories={categories} onCancel={() => setEditTarget(null)} onSave={handleEditSave} />}
        {publishTarget && <PublishModal exercise={publishTarget} onCancel={() => setPublishTarget(null)} onPublish={handlePublishToggle} onSchedule={handleSchedulePublish} />}
        {viewJsonTarget && <ViewJsonModal title={viewJsonTarget.title} exercises={viewJsonTarget.exercises} onClose={() => setViewJsonTarget(null)} />}

        <div className="flex h-full flex-col overflow-hidden bg-gray-50">

          {/* ── Tab switcher ── */}
          <div className="flex-none bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl border border-gray-200 shadow-inner w-fit">
              <button
                onClick={() => setActiveTab('library')}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-gray-500 hover:text-gray-800 hover:bg-white/60 transition-all duration-200"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Browse </span>Library
              </button>
              <button className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-md shadow-purple-200">
                <Settings2 className="w-4 h-4" />
                <span className="hidden sm:inline">Manage </span>Exercises
              </button>
            </div>
          </div>

          {/* ── Stats + cloud banner (fixed) ── */}
          <div className="flex-none px-6 pt-5 pb-4 space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Exercise Management</h2>
              <p className="text-sm text-gray-500 mt-0.5">Manage exercises pulled from cloud storage and monitor performance</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: 'Total Exercises', value: exercises.length, icon: <Play className="w-5 h-5 text-blue-500" />, bg: 'bg-blue-50' },
                { label: 'Published', value: publishedCount, icon: <CheckCircle className="w-5 h-5 text-green-500" />, bg: 'bg-green-50' },
                { label: 'Draft', value: draftCount, icon: <Clock className="w-5 h-5 text-yellow-500" />, bg: 'bg-yellow-50' },
                { label: 'Total Views', value: totalViews.toLocaleString(), icon: <Play className="w-5 h-5 text-purple-500" />, bg: 'bg-purple-50' },
                { label: 'Total Purchases', value: totalPurchasesSum.toLocaleString(), icon: <DollarSign className="w-5 h-5 text-indigo-500" />, bg: 'bg-indigo-50' },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">{s.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  </div>
                  <div className={`w-11 h-11 ${s.bg} rounded-xl flex items-center justify-center`}>{s.icon}</div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Cloud className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold">Cloud Storage Integration</p>
                  <p className="text-blue-100 text-sm">Pull new exercises uploaded by developers from cloud storage</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewJsonTarget({ title: 'AR Exercise Data', exercises })}
                  className="bg-white/20 hover:bg-white/30 border border-white/30 text-white font-semibold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 transition"
                >
                  <Eye className="w-4 h-4" />View JSON
                </button>
                <button
                  onClick={handlePullFromCloud}
                  disabled={cloudPulling}
                  className="bg-white hover:bg-blue-50 text-blue-700 font-semibold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 transition disabled:opacity-70"
                >
                  {cloudPulling
                    ? <><span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />Pulling…</>
                    : cloudPulled
                    ? <><CheckCircle className="w-4 h-4 text-green-600" />Up to date</>
                    : <><Download className="w-4 h-4" />Pull from Cloud</>}
                </button>
              </div>
            </div>
          </div>

          {/* ── Table card ── */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden mx-6 mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
            {/* Filter bar */}
            <div className="flex-none p-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search exercises..."
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={adminStatusFilter}
                  onChange={(e) => setAdminStatusFilter(e.target.value)}
                  className="pl-9 pr-8 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 appearance-none bg-white"
                >
                  <option>All Status</option><option>Published</option><option>Draft</option><option>Scheduled</option>
                </select>
              </div>
              <select
                value={adminCategoryFilter}
                onChange={(e) => setAdminCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
              >
                <option>All Categories</option>
                {categories.map((c) => <option key={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* Scrollable table */}
            <div className="flex-1 overflow-y-auto overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white z-10 border-b border-gray-100">
                  <tr>
                    {['Exercise', 'Category', 'Duration', 'Status', 'Recommended By', 'Performance', 'Logs', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {adminExercises.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-gray-400">
                        <AlertCircle className="w-5 h-5 mx-auto mb-2" />No exercises match your filters
                      </td>
                    </tr>
                  ) : adminExercises.map((ex) => (
                    <tr key={ex.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Play className="w-4 h-4 text-white fill-white" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{ex.name}</p>
                            <p className="text-xs text-gray-400">{ex.level}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">{ex.category}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{ex.duration}</td>
                      <td className="px-4 py-3">
                        {ex.status === 'published' ? (
                          <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                            <CheckCircle className="w-3.5 h-3.5" />Published
                          </span>
                        ) : ex.status === 'scheduled' ? (
                          <div>
                            <span className="flex items-center gap-1 text-blue-600 text-xs font-medium">
                              <Calendar className="w-3.5 h-3.5" />Scheduled
                            </span>
                            {ex.scheduledAt && (
                              <p className="text-[10px] text-blue-400 mt-0.5">
                                {new Date(ex.scheduledAt).toLocaleString('en-IN', {
                                  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true,
                                })}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="flex items-center gap-1 text-yellow-600 text-xs font-medium">
                            <Clock className="w-3.5 h-3.5" />Draft
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-700 font-medium text-xs">{ex.developer}</p>
                        <p className="text-gray-400 text-xs">{ex.developerDate}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-700 text-xs">{ex.views.toLocaleString()} views</p>
                        <p className="text-green-600 text-xs font-medium">{ex.purchases.toLocaleString()} purchases</p>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setLogsTarget(ex)}
                          className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium px-2.5 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-50 transition-colors whitespace-nowrap"
                          title="View activity logs"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Logs
                          {ex.updatedAt && (
                            <span className="ml-1 bg-indigo-100 text-indigo-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">!</span>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setPublishTarget(ex)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
                              ex.status === 'published' ? 'hover:bg-yellow-50 text-yellow-500' : 'hover:bg-green-50 text-green-500'}`}
                            title={ex.status === 'published' ? 'Unpublish' : 'Publish'}
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditTarget(ex)}
                            className="w-7 h-7 rounded-lg hover:bg-blue-50 flex items-center justify-center transition"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4 text-blue-500" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(ex)}
                            className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </>
    );
  }

  // ── Library tab ──────────────────────────────────────────────────────────────

  return (
    <>
      {logsTarget && <LogsDrawer exercise={logsTarget} onClose={() => setLogsTarget(null)} />}
      {deleteTarget && <DeleteModal exercise={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={handleDeleteConfirm} />}
      {editTarget && <EditModal exercise={editTarget} categories={categories} onCancel={() => setEditTarget(null)} onSave={handleEditSave} />}
      {publishTarget && <PublishModal exercise={publishTarget} onCancel={() => setPublishTarget(null)} onPublish={handlePublishToggle} onSchedule={handleSchedulePublish} />}
      {viewJsonTarget && <ViewJsonModal title={viewJsonTarget.title} exercises={viewJsonTarget.exercises} onClose={() => setViewJsonTarget(null)} />}

      <div className="p-4 sm:p-6 lg:p-8">
        <TabHeader />
        {exercises.length === 0 ? (
          <div className="flex items-center justify-center py-24 text-gray-400">
            <AlertCircle className="w-5 h-5 mr-2" />No exercises found
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {exercises.map((ex) => {
              const isPurchased = purchasedExercises.has(ex.id);
              const catImage = categories.find((c) => c.name === ex.category)?.image || '';
              return (
                <div key={ex.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  {/* Image — same layout as before, image sourced from parent category */}
                  <div className="relative h-48">
                    <img
                      src={catImage || `https://via.placeholder.com/500x300/e2e8f0/94a3b8?text=${encodeURIComponent(ex.name)}`}
                      alt={ex.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          `https://via.placeholder.com/500x300/e2e8f0/94a3b8?text=${encodeURIComponent(ex.name)}`;
                      }}
                    />
                    <div className={`absolute top-3 right-3 text-white text-xs font-semibold px-3 py-1 rounded-full ${
                      ex.status === 'published' ? 'bg-green-500' : ex.status === 'scheduled' ? 'bg-blue-500' : 'bg-yellow-500'
                    }`}>
                      {ex.status === 'published' ? 'Published' : ex.status === 'scheduled' ? 'Scheduled' : 'Draft'}
                    </div>
                  </div>

                  {/* Card body — same structure as before */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-gray-900 text-base truncate">{ex.name}</h3>
                      <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ml-2">{ex.category}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{ex.duration}</span>
                      <span className="flex items-center gap-1"><BarChart2 className="w-3 h-3" />{ex.level}</span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-[10px] text-gray-400">Recommended by</p>
                        <p className="text-xs font-medium text-gray-700">{ex.developer}</p>
                      </div>
                      <div className="text-right text-xs">
                        <p className="text-gray-500">{ex.views.toLocaleString()} views</p>
                        <p className="text-green-600 font-medium">{ex.purchases.toLocaleString()} purchases</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-gray-400">Price</p>
                        <p className="font-bold text-gray-900 text-sm">{fmt(ex.price)}</p>
                      </div>
                      {isPurchased ? (
                        <div className="flex items-center gap-1.5 text-green-700 text-sm font-semibold">
                          <CheckCircle className="w-4 h-4" /> Purchased
                        </div>
                      ) : (
                        <button
                          onClick={() => handlePurchaseExercise(ex.id)}
                          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
                        >
                          <Lock className="w-3 h-3" /> Purchase
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
