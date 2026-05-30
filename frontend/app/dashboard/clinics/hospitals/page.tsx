'use client';

/**
 * app/dashboard/clinics/hospitals/page.tsx
 * ──────────────────────────────────────────
 * Hospitals Directory — full list of ALL hospitals with
 * search (name, area, hospital name) + filter (pincode, status).
 * Click any row → /dashboard/clinics/[id] (branches page)
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search, Building2, ChevronLeft, Activity, Stethoscope, MapPin, ChevronRight,
} from 'lucide-react';
import { clinicsApi } from '@/lib/clinicsApi';
import type { Hospital } from '@/types/clinics';

function googleMapsUrl(name: string, area: string, city: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    [name, area, city, "India"].filter(Boolean).join(", ")
  )}`;
}

export default function HospitalsDirectoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isClinics = searchParams.get('type') === 'clinic';

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pincodeFilter, setPincodeFilter] = useState('');

  const fetchHospitals = useCallback(async (s: string, pincode: string) => {
    setLoading(true);
    try {
      const data = await clinicsApi.getHospitals({
        search: s || undefined,
        pincode: pincode || undefined,
      });
      setHospitals(data);
    } catch {
      setHospitals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHospitals('', ''); }, [fetchHospitals]);

  useEffect(() => {
    const t = setTimeout(() => fetchHospitals(search, pincodeFilter), 400);
    return () => clearTimeout(t);
  }, [search, pincodeFilter, fetchHospitals]);

  const title = isClinics ? 'Clinics Directory' : 'Hospitals Directory';
  const Icon = isClinics ? Stethoscope : Building2;
  const iconColor = isClinics ? 'text-green-600' : 'text-blue-600';
  const iconBg = isClinics ? 'bg-green-50' : 'bg-blue-50';
  const badgeColor = isClinics ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700';

  return (
    <div className="flex h-full flex-col overflow-hidden bg-gray-50 p-6 gap-4">
      {/* Breadcrumb */}
      <div className="flex-none flex items-center gap-2 text-sm text-gray-500">
        <button
          onClick={() => router.push('/dashboard/clinics')}
          className="hover:text-blue-600 flex items-center gap-1 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Clinics
        </button>
        <span>/</span>
        <span className="text-gray-900 font-medium">{title}</span>
      </div>

      {/* Header card */}
      <div className="flex-none bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-500">
              {isClinics
                ? 'Explore specialized clinics and outpatient facilities'
                : 'Browse comprehensive list of hospitals with detailed information'}
            </p>
          </div>
          <span className={`text-sm px-3 py-1 rounded-full font-semibold ${badgeColor}`}>
            {hospitals.length} found
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm">
        {/* Filters */}
        <div className="flex-none p-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by hospital name, area, contact name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400"
            />
          </div>
          <input
            type="text"
            placeholder="Filter by pincode"
            value={pincodeFilter}
            onChange={e => setPincodeFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg w-36 focus:outline-none focus:border-blue-400"
          />
        </div>

        <div className="flex-1 min-h-0 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
              <Activity className="w-4 h-4 mr-2 animate-spin" /> Loading...
            </div>
          ) : hospitals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Building2 className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">No hospitals found</p>
            </div>
          ) : (
            <HospitalsTable
              hospitals={hospitals}
              onRowClick={id => router.push(`/dashboard/clinics/${id}`)}
            />
          )}
        </div>
      </div>
    </div>
  );
}


function HospitalsTable({ hospitals, onRowClick }: { hospitals: Hospital[]; onRowClick: (id: number) => void }) {
  return (
    <table className="w-max min-w-full text-left text-sm">
      <thead className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs uppercase">
        <tr>
          <th className="px-4 py-3 font-semibold">#</th>
          <th className="px-4 py-3 font-semibold">Hospital</th>
          <th className="px-4 py-3 font-semibold">Area</th>
          <th className="px-4 py-3 font-semibold">City</th>
          <th className="px-4 py-3 font-semibold">Pincode</th>
          <th className="px-4 py-3 font-semibold">Specialization</th>
          <th className="px-4 py-3 font-semibold">Contact</th>
          <th className="px-4 py-3 font-semibold">Map</th>
          <th className="px-4 py-3 font-semibold"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {hospitals.map((h, i) => (
          <tr key={h.id} onClick={() => onRowClick(h.id)} className="cursor-pointer hover:bg-blue-50/40 transition-colors">
            <td className="px-4 py-3 text-gray-400 text-xs font-mono">{i + 1}</td>
            <td className="px-4 py-3">
              <p className="font-semibold text-gray-900 whitespace-nowrap">{h.name}</p>
              {h.bodyPart && <p className="text-[10px] text-gray-400">{h.bodyPart}</p>}
            </td>
            <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{h.area}</td>
            <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{h.city}</td>
            <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{h.pincode}</td>
            <td className="px-4 py-3 text-xs">
              <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full whitespace-nowrap">{h.specialization}</span>
            </td>
            <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{h.contactName}</td>
            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
              <a
                href={googleMapsUrl(h.name, h.area || "", h.city || "")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium px-2.5 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors whitespace-nowrap"
              >
                <MapPin className="w-3.5 h-3.5" /> Map
              </a>
            </td>
            <td className="px-4 py-3"><ChevronRight className="w-4 h-4 text-gray-400" /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
