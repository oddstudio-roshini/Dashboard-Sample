'use client';

/**
 * components/SuspendModal.tsx
 * ────────────────────────────
 * Handles both Suspend and Unsuspend confirmations.
 * If doctor is suspended → shows "Unsuspend" UI (green/restore).
 * If doctor is active   → shows "Suspend" UI (red/warning) with reason textarea.
 *
 * components/ForceLogoutModal.tsx (also in this file)
 * ─────────────────────────────────────────────────────
 * Confirms force-logout with explanation about session termination.
 * Shows warning about immediate effect.
 */

import { useState } from 'react';
import { X, ShieldOff, ShieldCheck, LogOut, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { doctorsAPI } from '@/lib/api';
import { Doctor } from '@/types';

// ─── SUSPEND MODAL ────────────────────────────────────────────────────────────

interface SuspendProps {
  isOpen: boolean;
  doctor: Doctor | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function SuspendModal({ isOpen, doctor, onClose, onSuccess }: SuspendProps) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');

  if (!isOpen || !doctor) return null;

  const isSuspended = doctor.isSuspended;

  const handleAction = async () => {
    setLoading(true);
    try {
      const res = isSuspended
        ? await doctorsAPI.unsuspend(doctor.id)
        : await doctorsAPI.suspend(doctor.id, reason || undefined);

      if (res.success) {
        toast.success(isSuspended ? 'Doctor account reinstated' : 'Doctor suspended');
        onSuccess();
        onClose();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Action failed');
    } finally {
      setLoading(false);
      setReason('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">

        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSuspended ? 'bg-green-100' : 'bg-red-100'}`}>
              {isSuspended
                ? <ShieldCheck className="w-5 h-5 text-green-600" />
                : <ShieldOff className="w-5 h-5 text-red-600" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {isSuspended ? 'Reinstate Doctor' : 'Suspend Doctor'}
              </h2>
              <p className="text-xs text-gray-500">
                {isSuspended ? 'Restore full access' : 'Block all access immediately'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            {isSuspended ? (
              <>
                This will restore access for{' '}
                <span className="font-semibold text-gray-900">{doctor.firstName} {doctor.lastName}</span>.
                Their account will be set back to <span className="text-green-600 font-semibold">Active</span>.
              </>
            ) : (
              <>
                This will immediately block{' '}
                <span className="font-semibold text-gray-900">{doctor.firstName} {doctor.lastName}</span>{' '}
                from accessing the system. Their account status will be set to <span className="text-red-600 font-semibold">Blocked</span>.
              </>
            )}
          </p>

          {!isSuspended && (
            <div className="mb-5">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Reason for Suspension <span className="text-gray-400 font-normal normal-case">(optional)</span>
              </label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="e.g., Pending investigation, Policy violation..."
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-red-200 focus:border-red-400 resize-none"
              />
            </div>
          )}

          {!isSuspended && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 mb-5">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-600">
                The doctor will be immediately logged out and unable to access the system until reinstated.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleAction} disabled={loading}
              className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 ${
                isSuspended ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              }`}>
              {loading
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : isSuspended ? 'Confirm Reinstate' : 'Confirm Suspend'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── FORCE LOGOUT MODAL ───────────────────────────────────────────────────────

interface ForceLogoutProps {
  isOpen: boolean;
  doctor: Doctor | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ForceLogoutModal({ isOpen, doctor, onClose, onSuccess }: ForceLogoutProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !doctor) return null;

  const handleForceLogout = async () => {
    setLoading(true);
    try {
      const res = await doctorsAPI.forceLogout(doctor.id);
      if (res.success) {
        toast.success('Session terminated successfully');
        onSuccess();
        onClose();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Force logout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">

        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
              <LogOut className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Force Logout</h2>
              <p className="text-xs text-gray-500">Terminate active session immediately</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            This will terminate the active session for{' '}
            <span className="font-semibold text-gray-900">{doctor.firstName} {doctor.lastName}</span>.
            On backend, this should invalidate the current session/token immediately.
          </p>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-5">
            <p className="text-xs text-amber-700 leading-relaxed">
              Use this when admin needs immediate session termination for security or support reasons.
              The logout timestamp will be recorded in the audit logs.
            </p>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleForceLogout} disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2">
              {loading
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : 'Confirm Force Logout'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}