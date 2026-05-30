'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronLeft, Stethoscope, Phone, Mail, Calendar,
  Users, Activity, Search, User, FileText, Clock,
  Pencil, Trash2, ScrollText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { doctorsAPI } from '@/lib/api';
import { clinicsApi } from '@/lib/clinicsApi';
import type { Doctor } from '@/types';
import type { ClinicDoctor, ClinicPatient } from '@/types/clinics';
import EditDoctorModal from '@/components/EditDoctorModal';
import ViewLogsModal from '@/components/ViewLogsModal';

export default function DoctorProfilePage() {
  const router   = useRouter();
  const params   = useParams();
  const doctorId = Number(params.doctorId);

  const [doctor,        setDoctor]        = useState<Doctor | null>(null);
  const [clinicDoctor,  setClinicDoctor]  = useState<ClinicDoctor | null>(null);
  const [patients,      setPatients]      = useState<ClinicPatient[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [genderFilter,  setGenderFilter]  = useState('');
  const [showEdit,      setShowEdit]      = useState(false);
  const [showLogs,      setShowLogs]      = useState(false);

  const refreshDoctor = () => {
    doctorsAPI.getById(doctorId)
      .then(res => { if (res.success) setDoctor(res.data); })
      .catch(() => {});
  };

  const handleDelete = async () => {
    if (!doctor) return;
    if (!confirm(`Delete Dr. ${doctor.fullName}? This cannot be undone.`)) return;
    try {
      await doctorsAPI.delete(doctor.id);
      toast.success('Doctor deleted');
      router.push('/dashboard/doctors');
    } catch { toast.error('Failed to delete doctor'); }
  };

  // Step 1 — load admin Doctor account
  useEffect(() => {
    doctorsAPI.getById(doctorId)
      .then(res => { if (res.success) setDoctor(res.data); })
      .catch(() => {});
  }, [doctorId]);

  // Step 2 — load ClinicDoctor profile matched by email (same service as clinics module)
  useEffect(() => {
    doctorsAPI.getClinicProfile(doctorId)
      .then(res => {
        if (res.success && res.data) {
          setClinicDoctor(res.data as unknown as ClinicDoctor);
        }
      })
      .catch(() => {});
  }, [doctorId]);

  // Step 3 — fetch patients using the SAME clinicsApi endpoint the clinics module uses
  const fetchPatients = useCallback(async (s: string, gender: string) => {
    if (!clinicDoctor?.id) return;
    setLoading(true);
    try {
      // Calls GET /api/clinics/doctors/{clinicDoctorId}/patients — same as clinics module
      const data = await clinicsApi.getPatients(clinicDoctor.id, {
        search: s || undefined,
        gender: gender || undefined,
      });
      setPatients(data);
    } catch { setPatients([]); }
    finally { setLoading(false); }
  }, [clinicDoctor?.id]);

  useEffect(() => {
    if (clinicDoctor?.id) fetchPatients('', '');
    else setLoading(false);
  }, [clinicDoctor?.id, fetchPatients]);

  useEffect(() => {
    if (!clinicDoctor?.id) return;
    const t = setTimeout(() => fetchPatients(search, genderFilter), 400);
    return () => clearTimeout(t);
  }, [search, genderFilter, fetchPatients, clinicDoctor?.id]);

  const scheduled = patients.filter(p => p.appointmentStatus === 'SCHEDULED').length;
  const completed  = patients.filter(p => p.appointmentStatus === 'COMPLETED').length;

  // Display data — prefer ClinicDoctor fields, fall back to admin Doctor
  const cd = clinicDoctor as any; // ClinicDoctorResponse from backend
  const displayName  = cd ? `Dr. ${cd.fullName}` : (doctor ? `Dr. ${doctor.fullName}` : 'Doctor');
  const displayPhone = cd?.contactPhone || doctor?.mobileNumber;
  const displayEmail = cd?.contactEmail || doctor?.email;
  const displaySpec  = cd?.specialization || doctor?.specialization;
  const displayHosp  = cd?.hospitalName   || doctor?.clinicHospital;
  const displayStatus = doctor?.status || 'ACTIVE';

  return (
    <>
    <div className="p-6 space-y-5">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
        <button onClick={() => router.push('/dashboard/doctors')}
          className="hover:text-purple-600 flex items-center gap-1 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" /> Doctors
        </button>
        {displayHosp && <><span>/</span><span className="text-gray-600">{displayHosp}</span></>}
        {cd?.branchName && <><span>/</span><span className="text-gray-600">{cd.branchName}</span></>}
        <span>/</span>
        <span className="text-gray-900 font-medium">{displayName}</span>
      </div>

      {/* Doctor Info Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        {/* Action buttons — top right of card */}
        <div className="flex justify-end gap-2 mb-4">
          <button
            onClick={() => setShowLogs(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-green-50 text-green-700 hover:bg-green-100 font-medium transition-colors"
          >
            <ScrollText className="w-3.5 h-3.5" /> Logs
          </button>
          <button
            onClick={() => setShowEdit(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start gap-4">

          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Stethoscope className="w-6 h-6 text-purple-600" />
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                displayStatus === 'ACTIVE'   ? 'bg-green-100 text-green-700'  :
                displayStatus === 'INACTIVE' ? 'bg-yellow-100 text-yellow-700' :
                                               'bg-red-100 text-red-700'
              }`}>{displayStatus}</span>
              {displaySpec && (
                <span className="bg-blue-100 text-blue-700 text-xs px-2.5 py-0.5 rounded-full font-medium">
                  {displaySpec}
                </span>
              )}
              {cd?.highestQualification && (
                <span className="bg-purple-50 text-purple-700 text-xs px-2.5 py-0.5 rounded-full font-medium">
                  {cd.highestQualification}
                </span>
              )}
            </div>

            <p className="text-sm text-gray-500 mb-3">
              • {cd?.experienceYears ?? '—'} years experience
            </p>

            <div className="flex flex-wrap gap-5 text-sm text-gray-500">
              {displayPhone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-gray-400" />{displayPhone}
                </div>
              )}
              {displayEmail && (
                <div className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-gray-400" />{displayEmail}
                </div>
              )}
              {cd?.availableDays && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {cd.availableDays}{cd.consultationHours ? ` | ${cd.consultationHours}` : ''}
                </div>
              )}
              {doctor?.lastLogin && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-gray-400" />
                  Last login: {new Date(doctor.lastLogin).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-8 flex-shrink-0 pt-1">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{scheduled}</p>
              <p className="text-xs text-gray-400 mt-0.5">Scheduled</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{completed}</p>
              <p className="text-xs text-gray-400 mt-0.5">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-500">{patients.length}</p>
              <p className="text-xs text-gray-400 mt-0.5">Total Patients</p>
            </div>
          </div>
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">

        <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-gray-900">Patients</span>
            <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-medium">
              {patients.length} found
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search patients..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg w-48 focus:outline-none focus:border-purple-400"
              />
            </div>
            <select value={genderFilter} onChange={e => setGenderFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-400 bg-white">
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
              <Activity className="w-4 h-4 mr-2 animate-spin" /> Loading patients...
            </div>
          ) : patients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Users className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm font-medium">No patients found</p>
              <p className="text-xs mt-1 text-gray-300">
                {!clinicDoctor ? 'No clinic profile linked to this doctor.' : 'This doctor has no patients yet.'}
              </p>
            </div>
          ) : (
            <table className="w-max min-w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  <th className="px-5 py-3 text-left font-medium w-10">#</th>
                  <th className="px-5 py-3 text-left font-medium">Patient Name</th>
                  <th className="px-5 py-3 text-left font-medium">Age / Gender</th>
                  <th className="px-5 py-3 text-left font-medium">Diagnosis</th>
                  <th className="px-5 py-3 text-left font-medium">Contact</th>
                  <th className="px-5 py-3 text-left font-medium">Appointment</th>
                  <th className="px-5 py-3 text-left font-medium">Visit Type</th>
                  <th className="px-5 py-3 text-left font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {patients.map((p, i) => (
                  <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-4 text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-5 py-4 font-semibold text-gray-900 whitespace-nowrap">{p.fullName}</td>
                    <td className="px-5 py-4">
                      <div className="text-gray-700 text-sm">{p.age} yrs</div>
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                        <User className="w-3 h-3" />{p.gender}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-red-500 text-sm font-medium">{p.diagnosis || '—'}</span>
                    </td>
                    <td className="px-5 py-4">
                      {p.contactPhone && <div className="text-gray-700 text-xs whitespace-nowrap">+{p.contactPhone}</div>}
                      {p.contactEmail && <div className="text-gray-400 text-xs mt-0.5">{p.contactEmail}</div>}
                    </td>
                    <td className="px-5 py-4">
                      {p.appointmentDate && (
                        <div className="flex items-center gap-1.5 text-gray-700 text-xs whitespace-nowrap">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />{p.appointmentDate}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {p.visitType
                        ? <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-lg font-medium whitespace-nowrap">{p.visitType}</span>
                        : <span className="text-gray-300">—</span>
                      }
                    </td>
                    <td className="px-5 py-4 max-w-[180px]">
                      {p.notes
                        ? <div className="flex items-start gap-1.5 text-gray-500 text-xs">
                            <FileText className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-400" />
                            <span className="line-clamp-2">{p.notes}</span>
                          </div>
                        : <span className="text-gray-300">—</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>

    {/* Edit Modal */}
    {doctor && (
      <EditDoctorModal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        doctor={doctor}
        onSuccess={() => { setShowEdit(false); refreshDoctor(); }}
      />
    )}

    {/* Logs Modal */}
    {doctor && (
      <ViewLogsModal
        isOpen={showLogs}
        onClose={() => setShowLogs(false)}
        doctor={doctor}
      />
    )}
    </>
  );
}
