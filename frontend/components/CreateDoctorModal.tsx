/**
 * components/CreateDoctorModal.tsx
 * ─────────────────────────────────
 * Modal form for creating a new doctor, matching the reference design.
 *
 * Features:
 *   - All fields from the reference: Clinical ID, First Name, Last Name,
 *     Birth Year, Username (auto/disabled), Temporary Password (auto/disabled),
 *     Mobile Number, Email, Specialization (dropdown), Clinic/Hospital, Status, Notes
 *   - Auto-generates username preview (DRXX0000 placeholder)
 *   - Warning banner about backend password hashing
 *   - Calls doctorsAPI.create() on submit
 *   - Shows success toast with the generated credentials
 *   - Validation: Required fields highlighted
 *   - Loading state on submit button
 *
 * Props:
 *   isOpen     → Controls modal visibility
 *   onClose    → Called when Cancel or X is clicked
 *   onSuccess  → Called with the created Doctor object after success
 */

"use client";

import { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { doctorsAPI } from "@/lib/api";
import { CreateDoctorForm, DoctorStatus, Doctor } from "@/types";

const SPECIALIZATIONS = [
  "Cardiology",
  "Dermatology",
  "Endocrinology",
  "Gastroenterology",
  "General Medicine",
  "Neurology",
  "Obstetrics & Gynecology",
  "Oncology",
  "Ophthalmology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Pulmonology",
  "Radiology",
  "Surgery",
  "Urology",
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (doctor: Doctor) => void;
}

const defaultForm: CreateDoctorForm = {
  firstName: "",
  lastName: "",
  birthYear: "",
  mobileNumber: "",
  email: "",
  specialization: "",
  clinicHospital: "",
  status: "ACTIVE",
  notes: "",
};


export default function CreateDoctorModal({
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const [form, setForm] = useState<CreateDoctorForm>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateDoctorForm, string>>
  >({});

  if (!isOpen) return null;

  const validate = () => {
    const errs: typeof errors = {};
    if (!form.firstName.trim()) errs.firstName = "Required";
    if (!form.lastName.trim()) errs.lastName = "Required";
    if (!form.email.trim()) errs.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Invalid email";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        ...form,
        birthYear: form.birthYear ? Number(form.birthYear) : undefined,

      };
      const res = await doctorsAPI.create(payload);
      if (res.success) {
        toast.success(
          `Doctor created!\nUsername: ${res.data.username}\nTemp Password: ${res.data.temporaryPassword}`,
          { duration: 120000 },
        );
        onSuccess(res.data);
        setForm(defaultForm);
        onClose();
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create doctor");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm(defaultForm);
    setErrors({});
    onClose();
  };

  const field = (
    label: string,
    key: keyof CreateDoctorForm,
    placeholder: string,
    required = false,
    disabled = false,
    type = "text",
  ) => (
    <div>
      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={(form[key] as string) || ""}
        onChange={(e) => {
          setForm({ ...form, [key]: e.target.value });
          if (errors[key]) setErrors({ ...errors, [key]: undefined });
        }}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all ${
          disabled
            ? "bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed"
            : errors[key]
              ? "border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200"
              : "border-gray-200 bg-white focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
        }`}
      />
      {errors[key] && (
        <p className="text-red-500 text-xs mt-1">{errors[key]}</p>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-5 flex items-start justify-between z-10 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Create Doctor</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Enter doctor identity fields. Username and temporary password are
              auto-generated and should be changed on first login.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 ml-4 flex-shrink-0 mt-0.5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-5">

          {/* Row 1 */}
          <div className="grid grid-cols-2 gap-4">
            {field("First Name", "firstName", "Martin", true)}
            {field("Last Name", "lastName", "Rao", true)}
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-2 gap-4">
            {field("Birth Year", "birthYear", "1985", false, false, "number")}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Temporary Password{" "}
                <span className="normal-case text-gray-400 font-normal">(AUTO)</span>
              </label>
              <input
                type="text"
                value="Doctor#XXXXXXX"
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
              />
            </div>
          </div>

          {/* Row 4 */}
          <div className="grid grid-cols-2 gap-4">
            {field("Mobile Number", "mobileNumber", "9876543210")}
            {field("Email", "email", "doctor@clinic.com", true, false, "email")}
          </div>

          {/* Row 5 */}
          <div className="grid grid-cols-2 gap-4">
            {/* Specialization */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Specialization
              </label>
              <select
                value={form.specialization || ""}
                onChange={(e) =>
                  setForm({ ...form, specialization: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all"
              >
                <option value="">Select specialization</option>
                {SPECIALIZATIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            {field(
              "Clinic / Hospital",
              "clinicHospital",
              "City Medical Center",
            )}
          </div>

          {/* Row 6 - Status */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as DoctorStatus })
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Notes
            </label>
            <textarea
              value={form.notes || ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Any additional notes..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all resize-none"
            />
          </div>

          {/* Security Notice */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                Backend should hash this temporary password immediately, set{" "}
                <code className="bg-amber-100 px-1 rounded font-mono font-bold">
                  requirePasswordChange = true
                </code>{" "}
                and prevent dashboard access until doctor creates a permanent
                password.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
          <button
            onClick={handleClose}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              "Create Doctor"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
