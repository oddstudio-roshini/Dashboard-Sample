"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Building2, Users, Stethoscope, ChevronRight,
  X, LayoutGrid, Activity, ArrowRight, SlidersHorizontal,
  MapPin, ChevronDown, Check, Filter,
} from "lucide-react";
import { clinicsApi } from "@/lib/clinicsApi";
import type { Hospital, Branch, ClinicStats, BodyPartCount } from "@/types/clinics";
import MapModal from "@/components/MapModal";

/* ── Body part config with SVG paths ─────────────────────────────────────── */
const BODY_PARTS = [
  { label: "Shoulder", icon: "💪" },
  { label: "Neck",     icon: "🫀" },
  { label: "Back",     icon: "🧍" },
  { label: "Ankle",    icon: "🦶" },
  { label: "Knee",     icon: "🦵" },
  { label: "Wrist",    icon: "✋" },
  { label: "Toes",     icon: "🦶" },
  { label: "Elbows",   icon: "💪" },
  { label: "Finger",   icon: "☝️" },
  { label: "Thumb",    icon: "👍" },
  { label: "Torso",    icon: "🫁" },
  { label: "Stroke",   icon: "🧠" },
];

type FilterBy = "" | "name" | "area" | "pincode";

function buildFilterParams(text: string, by: FilterBy) {
  const t = text.trim();
  if (!t) return {};
  switch (by) {
    case "name":    return { hospitalName: t };
    case "area":    return { area: t };
    case "pincode": return { pincode: t };
    default:        return { search: t };
  }
}

/* ── Main Page ────────────────────────────────────────────────────────────── */
export default function ClinicsPage() {
  const router = useRouter();
  const [stats, setStats]                       = useState<ClinicStats | null>(null);
  const [bodyPartCounts, setBodyPartCounts]     = useState<BodyPartCount[]>([]);
  const [selectedBodyPart, setSelectedBodyPart] = useState<string | null>(null);
  const [hospitals, setHospitals]               = useState<Hospital[]>([]);
  const [loading, setLoading]                   = useState(false);
  const [searchResults, setSearchResults]       = useState<Hospital[]>([]);
  const [branchResults, setBranchResults]       = useState<Branch[]>([]);
  const [searchLoading, setSearchLoading]       = useState(false);
  const [searchText, setSearchText]             = useState("");
  const [filterBy, setFilterBy]                 = useState<FilterBy>("");
  const [filterOpen, setFilterOpen]             = useState(false);
  const [bpSearch, setBpSearch]                 = useState("");
  const [bpFilterBy, setBpFilterBy]             = useState<FilterBy>("");
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    clinicsApi.getStats().then(setStats).catch(() => {});
    clinicsApi.getBodyPartCounts().then(setBodyPartCounts).catch(() => {});
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const bpCountMap = bodyPartCounts.reduce<Record<string, BodyPartCount>>((acc, c) => {
    acc[c.bodyPart.toLowerCase()] = c;
    return acc;
  }, {});

  useEffect(() => {
    if (!searchText.trim()) { setSearchResults([]); setBranchResults([]); return; }
    setSearchLoading(true);
    const t = setTimeout(async () => {
      try {
        const fp = buildFilterParams(searchText, filterBy);
        const [hosp, branches] = await Promise.all([
          clinicsApi.getHospitals(fp),
          filterBy === "pincode" ? Promise.resolve([]) : clinicsApi.getAllBranches({ search: searchText.trim() }),
        ]);
        setSearchResults(hosp); setBranchResults(branches as Branch[]);
      } catch { setSearchResults([]); setBranchResults([]); }
      finally { setSearchLoading(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [searchText, filterBy]);

  const fetchByBodyPart = useCallback(async (bp: string, text: string, by: FilterBy) => {
    setLoading(true);
    try { setHospitals(await clinicsApi.getHospitals({ bodyPart: bp, ...buildFilterParams(text, by) })); }
    catch { setHospitals([]); }
    finally { setLoading(false); }
  }, []);

  const handleBodyPartClick = (bp: string) => {
    const next = selectedBodyPart === bp ? null : bp;
    setSelectedBodyPart(next); setBpSearch(""); setBpFilterBy("");
    if (next) fetchByBodyPart(next, "", ""); else setHospitals([]);
  };

  const clearSelection = () => { setSelectedBodyPart(null); setHospitals([]); setBpSearch(""); setBpFilterBy(""); };

  useEffect(() => {
    if (!selectedBodyPart) return;
    const t = setTimeout(() => fetchByBodyPart(selectedBodyPart, bpSearch, bpFilterBy), 400);
    return () => clearTimeout(t);
  }, [bpSearch, bpFilterBy, selectedBodyPart, fetchByBodyPart]);

  const showSearch = searchText.trim() !== "";

  const FILTER_LABELS: Record<FilterBy, string> = {
    "": "All Filters", name: "Name", area: "Area", pincode: "Pincode",
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-gray-50/50 p-5 lg:p-6 gap-5">

      {/* ── Header ── */}
      <div className="flex-none">
        <h1 className="text-2xl font-bold text-gray-900">Clinics &amp; Hospitals</h1>
        <p className="text-sm text-gray-500 mt-0.5">Search and browse healthcare facilities</p>
      </div>

      {/* ── Stats ── */}
      <div className="flex-none grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Hospitals", value: stats ? stats.totalHospitals + stats.totalBranches : "—", icon: <Building2 className="w-6 h-6" />, color: "blue"   },
          { label: "Branches",        value: stats?.totalBranches ?? "—",                               icon: <LayoutGrid className="w-6 h-6" />,  color: "green"  },
          { label: "Doctors",         value: stats?.totalDoctors  ?? "—",                               icon: <Stethoscope className="w-6 h-6" />, color: "purple" },
          { label: "Patients",        value: stats?.totalPatients ?? "—",                               icon: <Users className="w-6 h-6" />,       color: "orange" },
        ].map(({ label, value, icon, color }) => (
          <StatCard key={label} label={label} value={value} icon={icon} color={color} />
        ))}
      </div>

      {/* ── Search bar ── */}
      <div className="flex-none bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-3 flex items-center gap-3">
        <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search hospitals, area, city, pincode..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          className="flex-1 text-sm text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none"
        />
        {searchText && (
          <button onClick={() => setSearchText("")} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        )}
        <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
        {/* Filter dropdown */}
        <div className="relative flex-shrink-0" ref={filterRef}>
          <button
            onClick={() => setFilterOpen(v => !v)}
            className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg transition-colors ${filterBy ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-50"}`}
          >
            <Filter className="w-4 h-4" />
            <span className="font-medium">{FILTER_LABELS[filterBy]}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${filterOpen ? "rotate-180" : ""}`} />
          </button>
          {filterOpen && (
            <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden py-1">
              {(["", "name", "area", "pincode"] as FilterBy[]).map(v => (
                <button key={v} onClick={() => { setFilterBy(v); setFilterOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${filterBy === v ? "text-blue-600 font-semibold bg-blue-50" : "text-gray-700"}`}>
                  {FILTER_LABELS[v]}
                  {filterBy === v && <Check className="w-3.5 h-3.5 text-blue-500" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-5 pb-2">

        {/* Search results */}
        {showSearch && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">Search Results</h2>
              {!searchLoading && (
                <span className="bg-blue-100 text-blue-700 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                  {searchResults.length + branchResults.length} found
                </span>
              )}
            </div>
            {searchLoading ? (
              <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
                <Activity className="w-4 h-4 animate-spin" /> Searching...
              </div>
            ) : searchResults.length === 0 && branchResults.length === 0 ? (
              <div className="py-16 flex flex-col items-center gap-2 text-gray-400">
                <Search className="w-10 h-10 opacity-20" />
                <p className="text-sm">No results for &ldquo;{searchText}&rdquo;</p>
              </div>
            ) : (
              <UnifiedResultsList
                hospitals={searchResults} branches={branchResults}
                onHospitalClick={id => router.push(`/dashboard/clinics/${id}/doctors`)}
                onBranchClick={id => router.push(`/dashboard/clinics/${id}/doctors`)}
              />
            )}
          </div>
        )}

        {/* Browse by body part */}
        {!showSearch && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Browse by Body Part</h2>
              <span className="text-xs text-gray-400">{BODY_PARTS.length} categories</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {BODY_PARTS.map(bp => {
                const isActive = selectedBodyPart === bp.label;
                const cnt = bpCountMap[bp.label.toLowerCase()];
                const total = cnt ? cnt.hospitalCount + cnt.branchCount : 0;
                return (
                  <button
                    key={bp.label}
                    onClick={() => handleBodyPartClick(bp.label)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl border transition-all text-left ${
                      isActive
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-100 bg-gray-50 hover:border-indigo-200 hover:bg-indigo-50/50"
                    }`}
                  >
                    <span className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${
                      isActive ? "bg-indigo-100" : "bg-white border border-gray-100"
                    }`}>{bp.icon}</span>
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold truncate ${isActive ? "text-indigo-700" : "text-gray-700"}`}>{bp.label}</p>
                      <p className={`text-[10px] font-medium mt-0.5 ${isActive ? "text-indigo-500" : "text-gray-400"}`}>{total > 0 ? total : "—"}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Body-part hospitals table */}
        {selectedBodyPart && !showSearch && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">{selectedBodyPart} Hospitals</span>
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-semibold">{hospitals.length}</span>
                <button onClick={clearSelection} className="text-gray-400 hover:text-gray-600 ml-1"><X className="w-3.5 h-3.5" /></button>
              </div>
              <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 w-56">
                <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <input
                  type="text" placeholder="Search..."
                  value={bpSearch} onChange={e => setBpSearch(e.target.value)}
                  className="flex-1 text-xs bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                />
              </div>
            </div>
            <div className="overflow-auto max-h-[480px]">
              {loading ? (
                <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
                  <Activity className="w-4 h-4 animate-spin" /> Loading...
                </div>
              ) : hospitals.length === 0 ? (
                <div className="flex flex-col items-center py-16 gap-2 text-gray-400">
                  <Building2 className="w-10 h-10 opacity-20" />
                  <p className="text-sm">No hospitals found for <b>{selectedBodyPart}</b></p>
                </div>
              ) : (
                <HospitalsTable hospitals={hospitals} onRowClick={id => router.push(`/dashboard/clinics/${id}`)} />
              )}
            </div>
          </div>
        )}

        {/* Directory cards */}
        {!selectedBodyPart && !showSearch && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Hospitals */}
            <div
              onClick={() => router.push("/dashboard/clinics/hospitals")}
              className="relative overflow-hidden rounded-2xl cursor-pointer group border border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50 hover:shadow-lg transition-all"
            >
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                    <Building2 className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Hospitals Directory</h3>
                    <p className="text-sm text-gray-500 mt-0.5">Browse all hospitals with detailed info, doctors, and patient records.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-5">
                  <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
                    {stats ? stats.totalHospitals + stats.totalBranches : "—"} Hospitals
                  </span>
                  <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                    {stats?.totalDoctors ?? "—"} Doctors
                  </span>
                </div>
                <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors group-hover:gap-3">
                  View All <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              {/* Decorative */}
              <Building2 className="absolute -bottom-4 -right-4 w-36 h-36 text-indigo-200/50 pointer-events-none" />
            </div>

            {/* Clinics */}
            <div
              onClick={() => router.push("/dashboard/clinics/hospitals?type=clinic")}
              className="relative overflow-hidden rounded-2xl cursor-pointer group border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 hover:shadow-lg transition-all"
            >
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                    <Stethoscope className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Clinics Directory</h3>
                    <p className="text-sm text-gray-500 mt-0.5">Explore specialized clinics and outpatient rehabilitation facilities.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-5">
                  <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
                    {stats?.totalBranches ?? "—"} Branches
                  </span>
                  <span className="text-xs font-semibold bg-teal-100 text-teal-700 px-3 py-1 rounded-full">
                    {stats?.totalPatients ?? "—"} Patients
                  </span>
                </div>
                <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors group-hover:gap-3">
                  View All <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <Stethoscope className="absolute -bottom-4 -right-4 w-36 h-36 text-emerald-200/50 pointer-events-none" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Stat Card ────────────────────────────────────────────────────────────── */
function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  const s: Record<string, { iconBg: string; iconColor: string; valueCls: string; border: string }> = {
    blue:   { iconBg: "bg-blue-100",   iconColor: "text-blue-600",   valueCls: "text-blue-600",   border: "border-b-blue-500"   },
    green:  { iconBg: "bg-green-100",  iconColor: "text-green-600",  valueCls: "text-green-600",  border: "border-b-green-500"  },
    purple: { iconBg: "bg-purple-100", iconColor: "text-purple-600", valueCls: "text-purple-600", border: "border-b-purple-500" },
    orange: { iconBg: "bg-orange-100", iconColor: "text-orange-600", valueCls: "text-orange-500", border: "border-b-orange-500" },
  };
  const st = s[color] ?? s.blue;
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 border-b-4 ${st.border} shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow`}>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${st.iconBg}`}>
        <span className={st.iconColor}>{icon}</span>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-bold mt-0.5 ${st.valueCls}`}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
      </div>
    </div>
  );
}

/* ── Unified results list ─────────────────────────────────────────────────── */
function UnifiedResultsList({ hospitals, branches, onHospitalClick, onBranchClick }: {
  hospitals: Hospital[]; branches: Branch[];
  onHospitalClick: (id: number) => void;
  onBranchClick: (id: number) => void;
}) {
  const [mapTarget, setMapTarget] = useState<{ lat: number; lng: number; label: string; address: string } | null>(null);
  return (
    <>
      <div className="divide-y divide-gray-50">
        {hospitals.map(h => (
          <div key={`h-${h.id}`} onClick={() => onHospitalClick(h.id)}
            className="flex items-center gap-4 px-6 py-3.5 hover:bg-blue-50/40 cursor-pointer transition-colors">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 text-sm">{h.name}</span>
                <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">Hospital</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{[h.area, h.city, h.pincode].filter(Boolean).join(" · ")}</p>
            </div>
            {h.latitude && h.longitude && (
              <button onClick={e => { e.stopPropagation(); setMapTarget({ lat: h.latitude!, lng: h.longitude!, label: h.name, address: `${h.address}, ${h.city}` }); }}
                className="text-xs text-blue-600 border border-blue-200 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 flex items-center gap-1 flex-shrink-0">
                <MapPin className="w-3 h-3" /> Map
              </button>
            )}
            <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
          </div>
        ))}
        {branches.map(b => (
          <div key={`b-${b.id}`} onClick={() => onBranchClick(b.hospitalId)}
            className="flex items-center gap-4 px-6 py-3.5 hover:bg-emerald-50/40 cursor-pointer transition-colors">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <LayoutGrid className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 text-sm">{b.branchName}</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-medium">Branch</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{[b.hospitalName, b.city].filter(Boolean).join(" · ")}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
          </div>
        ))}
      </div>
      {mapTarget && <MapModal open={!!mapTarget} onClose={() => setMapTarget(null)} latitude={mapTarget.lat} longitude={mapTarget.lng} label={mapTarget.label} address={mapTarget.address} />}
    </>
  );
}

/* ── Hospitals table ──────────────────────────────────────────────────────── */
function HospitalsTable({ hospitals, onRowClick }: { hospitals: Hospital[]; onRowClick: (id: number) => void }) {
  const [mapTarget, setMapTarget] = useState<Hospital | null>(null);
  return (
    <>
      <table className="w-max min-w-full text-sm">
        <thead className="sticky top-0 bg-gray-50 border-b border-gray-100">
          <tr className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
            <th className="px-5 py-3 text-left">#</th>
            <th className="px-5 py-3 text-left">Hospital Name</th>
            <th className="px-5 py-3 text-left">Area</th>
            <th className="px-5 py-3 text-left">City</th>
            <th className="px-5 py-3 text-left">Pincode</th>
            <th className="px-5 py-3 text-left">Specialization</th>
            <th className="px-5 py-3 text-left">Contact</th>
            <th className="px-5 py-3 text-left">Map</th>
            <th className="px-5 py-3 text-left"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {hospitals.map((h, i) => (
            <tr key={h.id} onClick={() => onRowClick(h.id)} className="hover:bg-indigo-50/40 cursor-pointer transition-colors">
              <td className="px-5 py-3.5 text-xs text-gray-400 font-mono">{i + 1}</td>
              <td className="px-5 py-3.5">
                <p className="font-semibold text-gray-900 whitespace-nowrap">{h.name}</p>
                {h.bodyPart && <p className="text-[10px] text-indigo-500 font-medium mt-0.5">{h.bodyPart}</p>}
              </td>
              <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">{h.area || "—"}</td>
              <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">{[h.city, h.state].filter(Boolean).join(", ") || "—"}</td>
              <td className="px-5 py-3.5"><span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{h.pincode || "—"}</span></td>
              <td className="px-5 py-3.5">{h.specialization ? <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">{h.specialization}</span> : <span className="text-gray-300 text-xs">—</span>}</td>
              <td className="px-5 py-3.5">
                <p className="text-xs text-gray-700 whitespace-nowrap">{h.contactName || "—"}</p>
                {h.contactNumber && <p className="text-[10px] text-gray-400 mt-0.5">{h.contactNumber}</p>}
              </td>
              <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                {h.latitude && h.longitude
                  ? <button onClick={() => setMapTarget(h)} className="flex items-center gap-1 text-xs text-blue-600 border border-blue-200 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap"><MapPin className="w-3 h-3" /> Map</button>
                  : <span className="text-gray-300 text-xs">—</span>}
              </td>
              <td className="px-5 py-3.5"><ChevronRight className="w-4 h-4 text-gray-300" /></td>
            </tr>
          ))}
        </tbody>
      </table>
      {mapTarget && mapTarget.latitude && mapTarget.longitude && (
        <MapModal open={!!mapTarget} onClose={() => setMapTarget(null)} latitude={mapTarget.latitude} longitude={mapTarget.longitude} label={mapTarget.name} address={`${mapTarget.address}, ${mapTarget.city}`} />
      )}
    </>
  );
}
