'use client';

/**
 * components/EditDoctorModal.tsx
 * ───────────────────────────────
 * Modal for editing an existing doctor's profile.
 * Pre-fills all fields from the current doctor data.
 * On save, calls PUT /api/doctors/{id}.
 * Logs PROFILE_UPDATED action on the backend automatically.
 *
 * Non-editable fields: Clinical ID, Username (shown as read-only)
 */

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { doctorsAPI } from '@/lib/api';
import { Doctor, UpdateDoctorForm, DoctorStatus } from '@/types';

const SPECIALIZATIONS = [
  'Cardiology','Dermatology','Endocrinology','Gastroenterology',
  'General Medicine','Neurology','Obstetrics & Gynecology','Oncology',
  'Ophthalmology','Orthopedics','Pediatrics','Psychiatry',
  'Pulmonology','Radiology','Surgery','Urology',
];

interface Props {
  isOpen: boolean;
  doctor: Doctor | null;
  onClose: () => void;
  onSuccess: (updated: Doctor) => void;
}

export default function EditDoctorModal({ isOpen, doctor, onClose, onSuccess }: Props) {
  const [form, setForm] = useState<UpdateDoctorForm>({
    firstName: '', lastName: '', email: '', status: 'ACTIVE',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (doctor) {
      setForm({
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        birthYear: doctor.birthYear || '',
        mobileNumber: doctor.mobileNumber || '',
        email: doctor.email,
        specialization: doctor.specialization || '',
        clinicHospital: doctor.clinicHospital || '',
        status: doctor.status as DoctorStatus,
        notes: doctor.notes || '',
      });
    }
  }, [doctor]);

  if (!isOpen || !doctor) return null;

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      toast.error('Name and email are required');
      return;
    }
    setLoading(true);
    try {
      const res = await doctorsAPI.update(doctor.id, {
        ...form,
        birthYear: form.birthYear ? Number(form.birthYear) : undefined,
      });
      if (res.success) {
        toast.success('Doctor profile updated');
        onSuccess(res.data);
        onClose();
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-5 flex items-start justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Edit Doctor</h2>
            <p className="text-sm text-gray-500 mt-0.5">Update doctor profile and account status.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 mt-0.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Read-only info */}
        <div className="px-6 pt-5 pb-2">
          <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Clinical ID</p>
              <p className="text-sm font-mono text-gray-600">{doctor.clinicalId}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Username</p>
              <p className="text-sm font-mono text-gray-600">{doctor.username}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <InputField label="First Name" required value={form.firstName}
              onChange={v => setForm({ ...form, firstName: v })} placeholder="Martin" />
            <InputField label="Last Name" required value={form.lastName}
              onChange={v => setForm({ ...form, lastName: v })} placeholder="Rao" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Mobile Number" value={form.mobileNumber || ''}
              onChange={v => setForm({ ...form, mobileNumber: v })} placeholder="9876543210" />
            <InputField label="Email" required type="email" value={form.email}
              onChange={v => setForm({ ...form, email: v })} placeholder="doctor@clinic.com" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Specialization
              </label>
              <select value={form.specialization || ''} onChange={e => setForm({ ...form, specialization: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400">
                <option value="">Select specialization</option>
                {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <InputField label="Clinic / Hospital" value={form.clinicHospital || ''}
              onChange={v => setForm({ ...form, clinicHospital: v })} placeholder="City Medical Center" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as DoctorStatus })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400">
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Notes</label>
            <textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Any additional notes..." rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 resize-none" />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm font-semibold flex items-center gap-2">
            {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, required, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; type?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all" />
    </div>
  );
}