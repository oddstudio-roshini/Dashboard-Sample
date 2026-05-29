"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Search, Building2, MapPin, Phone, Mail,
  ChevronLeft, ChevronRight, Activity, Hash, Users,
} from "lucide-react";
import { clinicsApi } from "@/lib/clinicsApi";
import type { Hospital, Branch } from "@/types/clinics";

function googleMapsUrl(name: string, area: string, city: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    [name, area, city, "India"].filter(Boolean).join(", ")
  )}`;
}

export default function HospitalPage() {
  const router = useRouter();
  const params = useParams();
  const hospitalId = Number(params.clinicId);

  const [hospital, setHospital]   = useState<Hospital | null>(null);
  const [branches, setBranches]   = useState<Branch[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    clinicsApi.getHospital(hospitalId).then(setHospital).catch(() => {});
  }, [hospitalId]);

  const fetchBranches = useCallback(async (s: string) => {
    setLoading(true);
    try {
      const data = await clinicsApi.getBranches(hospitalId, {
        search: s || undefined,
      });
      setBranches(data);
    } catch {
      setBranches([]);
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => { fetchBranches(""); }, [fetchBranches]);

  useEffect(() => {
    const t = setTimeout(() => fetchBranches(search), 400);
    return () => clearTimeout(t);
  }, [search, fetchBranches]);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-gray-50 p-4 sm:p-5 lg:p-6">

      {/* Breadcrumb */}
      <nav className="flex-none mb-4 flex items-center gap-2 text-sm text-gray-500">
        <button
          onClick={() => router.push("/dashboard/clinics")}
          className="hover:text-blue-600 flex items-center gap-1 transition-colors font-medium"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Clinics
        </button>
        <span>/</span>
        <span className="text-gray-900 font-semibold">{hospital?.name || "Hospital"}</span>
      </nav>

      {/* Hospital Info Card */}
      {hospital && (
        <div className="flex-none mb-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-lg font-bold text-gray-900">{hospital.name}</h1>
                {hospital.bodyPart && (
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">{hospital.bodyPart}</span>
                )}
                {hospital.specialization && (
                  <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-medium">{hospital.specialization}</span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  {[hospital.area, hospital.city, hospital.state].filter(Boolean).join(", ")}
                </div>
                <div className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  Pincode: {hospital.pincode}
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  {hospital.contactName} · {hospital.contactNumber}
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  {hospital.email}
                </div>
              </div>
              <a
                href={googleMapsUrl(hospital.name, hospital.area || "", hospital.city || "")}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="mt-2 inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5" /> View on Google Maps
              </a>
            </div>
            <div className="flex items-center gap-5 flex-shrink-0 pt-1">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{hospital.branchCount}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Branches</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{hospital.doctorCount}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Doctors</p>
              </div>
              {hospital.establishedYear && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-700">{hospital.establishedYear}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Est.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex-none mb-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search branches by name, code, manager…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 bg-white rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>
      </div>

      {!loading && (
        <p className="flex-none mb-2 text-xs text-gray-400">
          Showing <span className="font-semibold text-gray-600">{branches.length}</span> branches
        </p>
      )}

      {/* Branches table */}
      <div className="flex-1 min-h-0 overflow-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <Activity className="w-6 h-6 animate-spin" />
            <p className="text-sm">Loading branches…</p>
          </div>
        ) : branches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Building2 className="w-7 h-7 text-gray-400" />
            </div>
            <p className="font-semibold text-gray-700">No branches found</p>
          </div>
        ) : (
          <table className="w-max min-w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <tr>
                {["#", "Branch Name", "Branch Code", "Location", "Manager", "Contact", "Doctors", "Map", ""].map((h, i) => (
                  <th key={i} className={`px-5 py-3.5 font-semibold text-sm whitespace-nowrap ${i === 0 ? "w-10" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {branches.map((b, i) => (
                <tr
                  key={b.id}
                  className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                  onClick={() =>
                    router.push(`/dashboard/clinics/${hospitalId}/hospitals/${hospitalId}/branches/${b.id}`)
                  }
                >
                  <td className="px-5 py-3.5 text-gray-400 text-xs font-mono">{i + 1}</td>
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-gray-900 whitespace-nowrap">{b.branchName}</p>
                    <p className="text-[10px] text-gray-400">{b.city}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded font-mono whitespace-nowrap">{b.branchCode}</span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 text-xs whitespace-nowrap">{b.address}</td>
                  <td className="px-5 py-3.5 text-gray-700 text-xs whitespace-nowrap">{b.managerName}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1 text-xs text-gray-600 whitespace-nowrap">
                      <Phone className="w-3 h-3 text-gray-400" />{b.contactPhone || "—"}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                      <Users className="w-3 h-3" />{b.totalDoctors}
                    </span>
                  </td>
                  <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <a
                      href={googleMapsUrl(b.branchName, b.address || "", b.city || "")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium px-2.5 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors whitespace-nowrap"
                    >
                      <MapPin className="w-3.5 h-3.5" /> Map
                    </a>
                  </td>
                  <td className="px-5 py-3.5"><ChevronRight className="w-4 h-4 text-gray-400" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
