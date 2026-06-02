'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Search, Stethoscope, ChevronLeft, ChevronRight,
  Activity, IndianRupee,
} from 'lucide-react';
import { clinicsApi } from '@/lib/clinicsApi';
import type { Hospital, ClinicDoctor } from '@/types/clinics';

export default function HospitalDoctorsPage() {
  const router = useRouter();
  const params = useParams();
  const clinicId = Number(params.clinicId);

  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [doctors, setDoctors]   = useState<ClinicDoctor[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');

  useEffect(() => {
    clinicsApi.getHospital(clinicId).then(setHospital).catch(() => {});
  }, [clinicId]);

  const fetchDoctors = useCallback(async (s: string) => {
    setLoading(true);
    try {
      const data = await clinicsApi.getDoctorsByHospital(clinicId, { search: s || undefined });
      setDoctors(data);
    } catch { setDoctors([]); }
    finally { setLoading(false); }
  }, [clinicId]);

  useEffect(() => { fetchDoctors(''); }, [fetchDoctors]);
  useEffect(() => {
    const t = setTimeout(() => fetchDoctors(search), 400);
    return () => clearTimeout(t);
  }, [search, fetchDoctors]);

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
        <button onClick={() => router.push('/dashboard/clinics')} className="hover:text-blue-600 flex items-center gap-1 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" /> Clinics
        </button>
        <span>/</span>
        <span className="text-gray-900 font-medium">{hospital?.name || 'Hospital'} — Doctors</span>
      </div>

      {/* Doctors Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-gray-900">
                {hospital?.name ? `${hospital.name} — Doctors` : 'Doctors'}
              </span>
              <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-medium">
                {doctors.length} found
              </span>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search doctors..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg w-52 focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>
        </div>

        <div className="overflow-auto max-h-[600px]">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
              <Activity className="w-4 h-4 mr-2 animate-spin" /> Loading doctors...
            </div>
          ) : doctors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Stethoscope className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">No doctors found</p>
            </div>
          ) : (
            <table className="w-max min-w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3 text-left font-medium">#</th>
                  <th className="px-4 py-3 text-left font-medium">Doctor Name</th>
                  <th className="px-4 py-3 text-left font-medium">Branch</th>
                  <th className="px-4 py-3 text-left font-medium">Specialization</th>
                  <th className="px-4 py-3 text-left font-medium">Contact Number</th>
                  <th className="px-4 py-3 text-left font-medium">Email ID</th>
                  <th className="px-4 py-3 text-left font-medium">Highest Qualification</th>
                  <th className="px-4 py-3 text-left font-medium">Consultation Fee</th>
                  <th className="px-4 py-3 text-left font-medium">Registration No.</th>
                  <th className="px-4 py-3 text-left font-medium">Patients</th>
                  <th className="px-4 py-3 text-left font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {doctors.map((d, i) => (
                  <tr
                    key={d.id}
                    className="hover:bg-purple-50/30 cursor-pointer transition-colors"
                    onClick={() => router.push(
                      `/dashboard/clinics/${clinicId}/hospitals/${clinicId}/branches/${d.branchId}/doctors/${d.id}`
                    )}
                  >
                    <td className="px-4 py-3.5 text-gray-400 font-mono text-xs">{i + 1}</td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-gray-900 whitespace-nowrap">Dr. {d.fullName}</div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 text-xs whitespace-nowrap">{d.branchName}</td>
                    <td className="px-4 py-3.5">
                      <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
                        {d.specialization}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 text-xs whitespace-nowrap">{d.contactPhone}</td>
                    <td className="px-4 py-3.5 text-gray-500 text-xs">{d.contactEmail}</td>
                    <td className="px-4 py-3.5 text-gray-600 text-xs">{d.highestQualification}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-0.5 text-gray-700 font-medium text-xs whitespace-nowrap">
                        <IndianRupee className="w-3 h-3" />{d.consultationFee}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded font-mono whitespace-nowrap">
                        {d.registrationNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="bg-orange-50 text-orange-700 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                        {d.patientCount} patients
                      </span>
                    </td>
                    <td className="px-4 py-3.5"><ChevronRight className="w-4 h-4 text-gray-400" /></td>
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
