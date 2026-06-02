'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Search, Stethoscope, Phone, Mail, ChevronLeft,
  Users, Activity, Calendar, User, FileText,
} from 'lucide-react';
import { clinicsApi } from '@/lib/clinicsApi';
import type { ClinicDoctor, ClinicPatient } from '@/types/clinics';

export default function DoctorPatientsPage() {
  const router   = useRouter();
  const params   = useParams();
  const clinicId   = params.clinicId as string;
  const hospitalId = params.hospitalId as string;
  const branchId   = params.branchId as string;
  const doctorId   = Number(params.doctorId);

  const [doctor,       setDoctor]       = useState<ClinicDoctor | null>(null);
  const [patients,     setPatients]     = useState<ClinicPatient[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [search,        setSearch]        = useState('');
  const [genderFilter,  setGenderFilter]  = useState('');
  const [statusFilter,  setStatusFilter]  = useState('');

  useEffect(() => {
    clinicsApi.getDoctor(doctorId).then(setDoctor).catch(() => {});
  }, [doctorId]);

  const fetchPatients = useCallback(async (s: string, gender: string) => {
    setLoading(true);
    try {
      const data = await clinicsApi.getPatients(doctorId, {
        search: s || undefined,
        gender: gender || undefined,
      });
      setPatients(data);
    } catch { setPatients([]); }
    finally { setLoading(false); }
  }, [doctorId]);

  useEffect(() => { fetchPatients('', ''); }, [fetchPatients]);
  useEffect(() => {
    const t = setTimeout(() => fetchPatients(search, genderFilter), 400);
    return () => clearTimeout(t);
  }, [search, genderFilter, fetchPatients]);

  const filteredPatients = statusFilter
    ? patients.filter(p => p.appointmentStatus === statusFilter)
    : patients;

  const scheduled = patients.filter(p => p.appointmentStatus === 'SCHEDULED').length;
  const completed  = patients.filter(p => p.appointmentStatus === 'COMPLETED').length;

  return (
    <div className="p-6 space-y-5">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
        <button onClick={() => router.push('/dashboard/clinics')} className="hover:text-blue-600 flex items-center gap-1 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" /> Clinics
        </button>
        <span>/</span>
        <button onClick={() => router.push(`/dashboard/clinics/${clinicId}`)} className="hover:text-blue-600 transition-colors">
          {doctor?.hospitalName || 'Hospital'}
        </button>
        <span>/</span>
        <button onClick={() => router.push(`/dashboard/clinics/${clinicId}/hospitals/${hospitalId}/branches/${branchId}`)} className="hover:text-blue-600 transition-colors">
          {doctor?.branchName || 'Branch'}
        </button>
        <span>/</span>
        <span className="text-gray-900 font-medium">{doctor ? `Dr. ${doctor.fullName}` : 'Doctor'}</span>
      </div>

      {/* Doctor Info Card */}
      {doctor && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Stethoscope className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-gray-900">Dr. {doctor.fullName}</h1>
                {doctor.specialization && (
                  <span className="bg-blue-100 text-blue-700 text-xs px-2.5 py-0.5 rounded-full font-medium">
                    {doctor.specialization}
                  </span>
                )}
                {doctor.highestQualification && (
                  <span className="bg-purple-50 text-purple-700 text-xs px-2.5 py-0.5 rounded-full font-medium">
                    {doctor.highestQualification}
                  </span>
                )}
              </div>
              {(doctor.experienceYears !== null && doctor.experienceYears !== undefined && doctor.experienceYears > 0) && (
                <p className="text-sm text-gray-500 mb-2">• {doctor.experienceYears} years experience</p>
              )}
              <div className="flex flex-wrap gap-5 text-sm text-gray-500">
                {doctor.contactPhone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-gray-400" />{doctor.contactPhone}
                  </div>
                )}
                {doctor.contactEmail && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-gray-400" />{doctor.contactEmail}
                  </div>
                )}
                {doctor.availableDays?.trim() && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {doctor.availableDays.trim()}
                    {doctor.consultationHours?.trim() ? ` | ${doctor.consultationHours.trim()}` : ''}
                  </div>
                )}
              </div>
            </div>
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
      )}

      {/* Patients Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-gray-900">Patients</span>
            <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-medium">
              {filteredPatients.length} found
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg w-48 focus:outline-none focus:border-blue-400"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 bg-white"
            >
              <option value="">All Status</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <select
              value={genderFilter}
              onChange={e => setGenderFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 bg-white"
            >
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        </div>

        <div className="overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
              <Activity className="w-4 h-4 mr-2 animate-spin" /> Loading patients...
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Users className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">No patients found</p>
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
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                  <th className="px-5 py-3 text-left font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredPatients.map((p, i) => (
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
                      <div className="text-gray-700 text-xs whitespace-nowrap">{p.contactPhone ? `+${p.contactPhone}` : '—'}</div>
                      {p.contactEmail && <div className="text-gray-400 text-xs mt-0.5">{p.contactEmail}</div>}
                    </td>
                    <td className="px-5 py-4">
                      {p.appointmentDate
                        ? <div className="flex items-center gap-1.5 text-gray-700 text-xs whitespace-nowrap">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />{p.appointmentDate}
                          </div>
                        : <span className="text-gray-300 text-xs">—</span>
                      }
                    </td>
                    <td className="px-5 py-4">
                      {p.visitType
                        ? <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-lg font-medium whitespace-nowrap">{p.visitType}</span>
                        : <span className="text-gray-300 text-xs">—</span>
                      }
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
                        p.appointmentStatus === 'COMPLETED'  ? 'bg-green-50 text-green-600'  :
                        p.appointmentStatus === 'SCHEDULED'  ? 'bg-blue-50 text-blue-600'    :
                        p.appointmentStatus === 'CANCELLED'  ? 'bg-red-50 text-red-500'      :
                        'bg-gray-100 text-gray-400'
                      }`}>
                        {p.appointmentStatus || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4 max-w-[180px]">
                      {p.notes
                        ? <div className="flex items-start gap-1.5 text-gray-500 text-xs">
                            <FileText className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-400" />
                            <span className="line-clamp-2">{p.notes}</span>
                          </div>
                        : <span className="text-gray-300 text-xs">—</span>
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
  );
}
