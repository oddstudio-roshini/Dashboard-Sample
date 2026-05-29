// "use client";

// import { useState, useEffect, useCallback } from "react";
// import { useRouter } from "next/navigation";
// import {
//   Search,
//   Building2,
//   Users,
//   Stethoscope,
//   ChevronRight,
//   X,
//   LayoutGrid,
//   Activity,
//   ArrowRight,
//   SlidersHorizontal,
// } from "lucide-react";
// import { clinicsApi } from "@/lib/clinicsApi";
// import type { Hospital, ClinicStats } from "@/types/clinics";

// const BODY_PARTS = [
//   { label: "Shoulder", emoji: "💪" },
//   { label: "Neck", emoji: "🫀" },
//   { label: "Back", emoji: "⬅️" },
//   { label: "Ankle", emoji: "🦶" },
//   { label: "Knee", emoji: "🦵" },
//   { label: "Wrist", emoji: "✋" },
//   { label: "Toes", emoji: "🦶" },
//   { label: "Elbows", emoji: "💪" },
//   { label: "Finger", emoji: "☝️" },
//   { label: "Thumb", emoji: "👍" },
//   { label: "Torso", emoji: "🫁" },
//   { label: "Stroke/Miscellaneous", emoji: "🧠" },
// ];

// export default function ClinicsPage() {
//   const router = useRouter();
//   const [stats, setStats] = useState<ClinicStats | null>(null);
//   const [selectedBodyPart, setSelectedBodyPart] = useState<string | null>(null);
//   const [hospitals, setHospitals] = useState<Hospital[]>([]);
//   const [loading, setLoading] = useState(false);

//   // ── Global search (above body parts) ──────────────────────────────────────
//   const [globalSearch, setGlobalSearch] = useState("");
//   const [globalFilter, setGlobalFilter] = useState("");   // single filter for name/area/pincode
//   const [searchResults, setSearchResults] = useState<Hospital[]>([]);
//   const [searchLoading, setSearchLoading] = useState(false);

//   // ── Per-body-part filters ──────────────────────────────────────────────────
//   const [bodyPartSearch, setBodyPartSearch] = useState("");
//   const [bodyPartFilter, setBodyPartFilter] = useState(""); // single filter for name/area/pincode
//   const [statusFilter, setStatusFilter] = useState("");

//   useEffect(() => {
//     clinicsApi.getStats().then(setStats).catch(() => {});
//   }, []);

//   // ── Global search results (shown when user types in top search bar) ────────
//   useEffect(() => {
//     const query = globalSearch.trim();
//     const filter = globalFilter.trim();
//     if (!query && !filter) {
//       setSearchResults([]);
//       return;
//     }
//     setSearchLoading(true);
//     const t = setTimeout(async () => {
//       try {
//         // Send the combined filter as "search" — backend searches name, area, pincode
//         const data = await clinicsApi.getHospitals({
//           search: query || filter || undefined,
//         });
//         setSearchResults(data);
//       } catch {
//         setSearchResults([]);
//       } finally {
//         setSearchLoading(false);
//       }
//     }, 400);
//     return () => clearTimeout(t);
//   }, [globalSearch, globalFilter]);

//   // ── Body-part hospitals fetch ──────────────────────────────────────────────
//   const fetchByBodyPart = useCallback(
//     async (bodyPart: string, search: string, filter: string, status: string) => {
//       setLoading(true);
//       try {
//         const data = await clinicsApi.getHospitals({
//           bodyPart,
//           search: search || filter || undefined,
//           status: status || undefined,
//         });
//         setHospitals(data);
//       } catch {
//         setHospitals([]);
//       } finally {
//         setLoading(false);
//       }
//     },
//     []
//   );

//   const handleBodyPartClick = (bp: string) => {
//     const next = selectedBodyPart === bp ? null : bp;
//     setSelectedBodyPart(next);
//     setBodyPartSearch(""); setBodyPartFilter(""); setStatusFilter("");
//     if (next) fetchByBodyPart(next, "", "", "");
//     else setHospitals([]);
//   };

//   const clearSelection = () => {
//     setSelectedBodyPart(null);
//     setHospitals([]);
//     setBodyPartSearch(""); setBodyPartFilter(""); setStatusFilter("");
//   };

//   // Debounce body-part filters
//   useEffect(() => {
//     if (!selectedBodyPart) return;
//     const t = setTimeout(
//       () => fetchByBodyPart(selectedBodyPart, bodyPartSearch, bodyPartFilter, statusFilter),
//       400
//     );
//     return () => clearTimeout(t);
//   }, [bodyPartSearch, bodyPartFilter, statusFilter, selectedBodyPart, fetchByBodyPart]);

//   const showSearchResults = globalSearch.trim() !== "" || globalFilter.trim() !== "";

//   return (
//     <div className="p-6 space-y-6">

//       {/* Header */}
//       <div>
//         <h1 className="text-2xl font-bold text-gray-900">Clinics &amp; Hospitals</h1>
//         <p className="text-gray-500 text-sm mt-1">
//           Search through our comprehensive database of hospitals and clinics
//         </p>
//       </div>

//       {/* Stats */}
//       {stats && (
//         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//           <StatCard icon={<Building2 className="w-5 h-5 text-blue-600" />} value={stats.totalHospitals} label="Hospitals" color="blue" />
//           <StatCard icon={<LayoutGrid className="w-5 h-5 text-green-600" />} value={stats.totalBranches} label="Branches" color="green" />
//           <StatCard icon={<Stethoscope className="w-5 h-5 text-purple-600" />} value={`${stats.totalDoctors}+`} label="Doctors" color="purple" />
//           <StatCard icon={<Users className="w-5 h-5 text-orange-600" />} value={stats.totalPatients} label="Patients" color="orange" />
//         </div>
//       )}

//       {/* ── Search + Filter bar (above body parts) ──────────────────────────── */}
//       <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
//         <div className="flex flex-col sm:flex-row gap-3">
//           {/* Main search */}
//           <div className="relative flex-1">
//             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//             <input
//               type="text"
//               placeholder="Search hospitals, doctors, body parts..."
//               value={globalSearch}
//               onChange={(e) => setGlobalSearch(e.target.value)}
//               className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400"
//             />
//           </div>

//           {/* Single combined filter — searches by hospital name, area, or pincode */}
//           <div className="relative sm:w-72">
//             <SlidersHorizontal className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
//             <input
//               type="text"
//               placeholder="Filter by hospital name, area or pincode"
//               value={globalFilter}
//               onChange={(e) => setGlobalFilter(e.target.value)}
//               className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400"
//             />
//             {globalFilter && (
//               <button
//                 onClick={() => setGlobalFilter("")}
//                 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
//               >
//                 <X className="w-4 h-4" />
//               </button>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* ── Global search results ────────────────────────────────────────────── */}
//       {showSearchResults && (
//         <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
//           <div className="p-5 border-b border-gray-100 flex items-center justify-between">
//             <h2 className="text-base font-semibold text-gray-900">Search Results</h2>
//             <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
//               {searchResults.length} found
//             </span>
//           </div>
//           <div className="overflow-x-auto">
//             {searchLoading ? (
//               <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
//                 <Activity className="w-4 h-4 mr-2 animate-spin" /> Searching...
//               </div>
//             ) : searchResults.length === 0 ? (
//               <div className="py-16 flex flex-col items-center text-gray-400">
//                 <Search className="w-10 h-10 mb-2 opacity-30" />
//                 <p className="text-sm">No results found</p>
//               </div>
//             ) : (
//               <HospitalsTable
//                 hospitals={searchResults}
//                 onRowClick={(id) => router.push(`/dashboard/clinics/${id}`)}
//               />
//             )}
//           </div>
//         </div>
//       )}

//       {/* ── Browse by Body Part (hidden while global search is active) ──────── */}
//       {!showSearchResults && (
//         <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
//           <h2 className="text-base font-semibold text-gray-900 mb-4">Browse by Body Part</h2>
//           <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
//             {BODY_PARTS.map((bp) => {
//               const isActive = selectedBodyPart === bp.label;
//               return (
//                 <button
//                   key={bp.label}
//                   onClick={() => handleBodyPartClick(bp.label)}
//                   className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all
//                     ${isActive
//                       ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
//                       : "border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50/50"
//                     }`}
//                 >
//                   <span className="text-2xl">{bp.emoji}</span>
//                   <span className="text-center leading-tight">{bp.label}</span>
//                 </button>
//               );
//             })}
//           </div>
//         </div>
//       )}

//       {/* ── Hospitals table for selected body part ───────────────────────────── */}
//       {selectedBodyPart && !showSearchResults && (
//         <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
//           <div className="p-5 border-b border-gray-100">
//             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
//               <div className="flex items-center gap-2">
//                 <span className="text-base font-semibold text-gray-900">
//                   Hospitals — {selectedBodyPart}
//                 </span>
//                 <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
//                   {hospitals.length} found
//                 </span>
//                 <button onClick={clearSelection} className="text-gray-400 hover:text-gray-600 transition-colors">
//                   <X className="w-4 h-4" />
//                 </button>
//               </div>
//               <div className="flex flex-wrap items-center gap-2">
//                 {/* Search within body part */}
//                 <div className="relative">
//                   <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
//                   <input
//                     type="text"
//                     placeholder="Search hospitals..."
//                     value={bodyPartSearch}
//                     onChange={(e) => setBodyPartSearch(e.target.value)}
//                     className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg w-44 focus:outline-none focus:border-blue-400"
//                   />
//                 </div>
//                 {/* Single filter for name / area / pincode */}
//                 <div className="relative">
//                   <SlidersHorizontal className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
//                   <input
//                     type="text"
//                     placeholder="Name, area or pincode"
//                     value={bodyPartFilter}
//                     onChange={(e) => setBodyPartFilter(e.target.value)}
//                     className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg w-44 focus:outline-none focus:border-blue-400"
//                   />
//                   {bodyPartFilter && (
//                     <button
//                       onClick={() => setBodyPartFilter("")}
//                       className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
//                     >
//                       <X className="w-3.5 h-3.5" />
//                     </button>
//                   )}
//                 </div>
//                 <select
//                   value={statusFilter}
//                   onChange={(e) => setStatusFilter(e.target.value)}
//                   className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 bg-white"
//                 >
//                   <option value="">All Status</option>
//                   <option value="ACTIVE">Active</option>
//                   <option value="INACTIVE">Inactive</option>
//                 </select>
//               </div>
//             </div>
//           </div>

//           <div className="overflow-x-auto">
//             {loading ? (
//               <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
//                 <Activity className="w-4 h-4 mr-2 animate-spin" /> Loading...
//               </div>
//             ) : hospitals.length === 0 ? (
//               <div className="flex flex-col items-center justify-center py-16 text-gray-400">
//                 <Building2 className="w-10 h-10 mb-2 opacity-30" />
//                 <p className="text-sm">
//                   No hospitals found for <span className="font-medium">{selectedBodyPart}</span>
//                 </p>
//               </div>
//             ) : (
//               <HospitalsTable
//                 hospitals={hospitals}
//                 onRowClick={(id) => router.push(`/dashboard/clinics/${id}`)}
//               />
//             )}
//           </div>
//         </div>
//       )}

//       {/* ── Directory Cards (hidden when body part selected or searching) ────── */}
//       {!selectedBodyPart && !showSearchResults && (
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
//           {/* Hospitals Directory */}
//           <div
//             className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group"
//             onClick={() => router.push("/dashboard/clinics/hospitals")}
//           >
//             <div className="flex items-start justify-between mb-4">
//               <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
//                 <Building2 className="w-6 h-6 text-blue-600" />
//               </div>
//               <span className="bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full font-semibold">
//                 {stats?.totalHospitals ?? "—"} Hospitals
//               </span>
//             </div>
//             <h3 className="text-lg font-bold text-gray-900 mb-1">Hospitals Directory</h3>
//             <p className="text-sm text-gray-500 mb-5">
//               Browse comprehensive list of hospitals with detailed information
//             </p>
//             <div className="flex items-center gap-1 text-blue-600 text-sm font-semibold group-hover:gap-2 transition-all">
//               View Directory <ArrowRight className="w-4 h-4" />
//             </div>
//             <div className="mt-4 flex justify-end opacity-20">
//               <Building2 className="w-20 h-20 text-blue-400" />
//             </div>
//           </div>

//           {/* Clinics Directory */}
//           <div
//             className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 cursor-pointer hover:shadow-md hover:border-green-200 transition-all group"
//             onClick={() => router.push("/dashboard/clinics/hospitals?type=clinic")}
//           >
//             <div className="flex items-start justify-between mb-4">
//               <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
//                 <Stethoscope className="w-6 h-6 text-green-600" />
//               </div>
//               <span className="bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-semibold">
//                 {stats?.totalBranches ?? "—"} Clinics
//               </span>
//             </div>
//             <h3 className="text-lg font-bold text-gray-900 mb-1">Clinics Directory</h3>
//             <p className="text-sm text-gray-500 mb-5">
//               Explore specialized clinics and outpatient facilities
//             </p>
//             <div className="flex items-center gap-1 text-green-600 text-sm font-semibold group-hover:gap-2 transition-all">
//               View Directory <ArrowRight className="w-4 h-4" />
//             </div>
//             <div className="mt-4 flex justify-end opacity-20">
//               <Stethoscope className="w-20 h-20 text-green-400" />
//             </div>
//           </div>
//         </div>
//       )}

//     </div>
//   );
// }

// // ── Shared hospitals table ─────────────────────────────────────────────────────
// function HospitalsTable({
//   hospitals,
//   onRowClick,
// }: {
//   hospitals: Hospital[];
//   onRowClick: (id: number) => void;
// }) {
//   return (
//     <table className="w-full text-sm">
//       <thead>
//         <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
//           <th className="px-4 py-3 text-left font-medium">S.No</th>
//           <th className="px-4 py-3 text-left font-medium">Hospital Name</th>
//           <th className="px-4 py-3 text-left font-medium">Area</th>
//           <th className="px-4 py-3 text-left font-medium">City</th>
//           <th className="px-4 py-3 text-left font-medium">Pincode</th>
//           <th className="px-4 py-3 text-left font-medium">Address</th>
//           <th className="px-4 py-3 text-left font-medium">Specialization</th>
//           <th className="px-4 py-3 text-left font-medium">Contact Name</th>
//           <th className="px-4 py-3 text-left font-medium">Contact Number</th>
//           <th className="px-4 py-3 text-left font-medium">Email</th>
//           <th className="px-4 py-3 text-left font-medium">Status</th>
//           <th className="px-4 py-3 text-left font-medium"></th>
//         </tr>
//       </thead>
//       <tbody className="divide-y divide-gray-50">
//         {hospitals.map((h, i) => (
//           <tr
//             key={h.id}
//             className="hover:bg-blue-50/40 cursor-pointer transition-colors"
//             onClick={() => onRowClick(h.id)}
//           >
//             <td className="px-4 py-3.5 text-gray-400 text-xs font-mono">{i + 1}</td>
//             <td className="px-4 py-3.5">
//               <div className="font-semibold text-gray-900 whitespace-nowrap">{h.name}</div>
//               <div className="text-xs text-gray-400">{h.bodyPart}</div>
//             </td>
//             <td className="px-4 py-3.5 text-gray-600 text-xs whitespace-nowrap">{h.area}</td>
//             <td className="px-4 py-3.5 text-gray-600 text-xs whitespace-nowrap">{h.city}, {h.state}</td>
//             <td className="px-4 py-3.5 text-gray-600 text-xs whitespace-nowrap">{h.pincode}</td>
//             <td className="px-4 py-3.5 text-gray-500 text-xs max-w-[160px] truncate" title={h.address}>{h.address}</td>
//             <td className="px-4 py-3.5">
//               <span className="bg-purple-50 text-purple-700 text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
//                 {h.specialization}
//               </span>
//             </td>
//             <td className="px-4 py-3.5 text-gray-700 text-xs whitespace-nowrap">{h.contactName}</td>
//             <td className="px-4 py-3.5 text-gray-600 text-xs whitespace-nowrap">{h.contactNumber}</td>
//             <td className="px-4 py-3.5 text-gray-500 text-xs">{h.email}</td>
//             <td className="px-4 py-3.5">
//               <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
//                 h.status === "ACTIVE" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
//               }`}>
//                 {h.status}
//               </span>
//             </td>
//             <td className="px-4 py-3.5">
//               <ChevronRight className="w-4 h-4 text-gray-400" />
//             </td>
//           </tr>
//         ))}
//       </tbody>
//     </table>
//   );
// }

// function StatCard({
//   icon, value, label, color,
// }: {
//   icon: React.ReactNode; value: string | number; label: string; color: string;
// }) {
//   const colors: Record<string, string> = {
//     blue: "border-l-blue-500", green: "border-l-green-500",
//     purple: "border-l-purple-500", orange: "border-l-orange-500",
//   };
//   return (
//     <div className={`bg-white rounded-xl border border-gray-100 border-l-4 ${colors[color]} shadow-sm p-4`}>
//       <div className="flex items-center gap-3">
//         <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">{icon}</div>
//         <div>
//           <p className="text-xl font-bold text-gray-900">{value}</p>
//           <p className="text-xs text-gray-500">{label}</p>
//         </div>
//       </div>
//     </div>
//   );
// }

// "use client";

// import { useState, useEffect, useCallback, useRef } from "react";
// import { useRouter } from "next/navigation";
// import {
//   Search,
//   Building2,
//   Users,
//   Stethoscope,
//   ChevronRight,
//   X,
//   LayoutGrid,
//   Activity,
//   ArrowRight,
//   SlidersHorizontal,
//   MapPin,
//   ChevronDown,
//   Check,
// } from "lucide-react";
// import { clinicsApi } from "@/lib/clinicsApi";
// import type { Hospital, ClinicStats } from "@/types/clinics";
// import MapModal from "@/components/MapModal";

// const BODY_PARTS = [
//   { label: "Shoulder", emoji: "💪" },
//   { label: "Neck", emoji: "🫀" },
//   { label: "Back", emoji: "🧍" },
//   { label: "Ankle", emoji: "🦶" },
//   { label: "Knee", emoji: "🦵" },
//   { label: "Wrist", emoji: "✋" },
//   { label: "Toes", emoji: "🦶" },
//   { label: "Elbows", emoji: "💪" },
//   { label: "Finger", emoji: "☝️" },
//   { label: "Thumb", emoji: "👍" },
//   { label: "Torso", emoji: "🫁" },
//   { label: "Stroke/Miscellaneous", emoji: "🧠" },
// ];

// // Filter options the user can choose from
// const FILTER_OPTIONS = [
//   { value: "name", label: "Hospital Name" },
//   { value: "area", label: "Area" },
//   { value: "pincode", label: "Pincode" },
// ] as const;
// type FilterBy = (typeof FILTER_OPTIONS)[number]["value"];

// export default function ClinicsPage() {
//   const router = useRouter();
//   const [stats, setStats] = useState<ClinicStats | null>(null);
//   const [selectedBodyPart, setSelectedBodyPart] = useState<string | null>(null);
//   const [hospitals, setHospitals] = useState<Hospital[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [searchResults, setSearchResults] = useState<Hospital[]>([]);
//   const [searchLoading, setSearchLoading] = useState(false);

//   // ── unified search bar ────────────────────────────────────────────────────
//   const [searchText, setSearchText] = useState(""); // what the user types
//   const [filterBy, setFilterBy] = useState<FilterBy>("name"); // selected filter type
//   const [filterOpen, setFilterOpen] = useState(false); // dropdown open
//   const filterRef = useRef<HTMLDivElement>(null);

//   // ── body-part table filters ───────────────────────────────────────────────
//   const [bpSearch, setBpSearch] = useState("");
//   const [bpFilterBy, setBpFilterBy] = useState<FilterBy>("name");
//   const [bpFilterOpen, setBpFilterOpen] = useState(false);
//   const [statusFilter, setStatusFilter] = useState("");
//   const bpFilterRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     clinicsApi
//       .getStats()
//       .then(setStats)
//       .catch(() => {});
//   }, []);

//   // Close dropdowns when clicking outside
//   useEffect(() => {
//     const handler = (e: MouseEvent) => {
//       if (filterRef.current && !filterRef.current.contains(e.target as Node))
//         setFilterOpen(false);
//       if (
//         bpFilterRef.current &&
//         !bpFilterRef.current.contains(e.target as Node)
//       )
//         setBpFilterOpen(false);
//     };
//     document.addEventListener("mousedown", handler);
//     return () => document.removeEventListener("mousedown", handler);
//   }, []);

//   // Build API params from filterBy selection
//   // const buildSearchParams = (text: string, by: FilterBy) => {
//   //   if (!text.trim()) return {};
//   //   if (by === "pincode") return { pincode: text.trim() };
//   //   return { search: text.trim() }; // name + area both use the search param
//   // };
//   const buildSearchParams = (text: string, by: FilterBy) => {
//     if (!text.trim()) return {};

//     switch (by) {
//       case "name":
//         return {
//           search: text.trim(),
//         };

//       case "area":
//         return {
//           search: text.trim(),
//         };

//       case "pincode":
//         return {
//           pincode: text.trim(),
//         };

//       default:
//         return {};
//     }
//   };

//   // Global search — fires when searchText changes
//   useEffect(() => {
//     if (!searchText.trim()) {
//       setSearchResults([]);
//       return;
//     }
//     setSearchLoading(true);
//     const t = setTimeout(async () => {
//       try {
//         const data = await clinicsApi.getHospitals(
//           buildSearchParams(searchText, filterBy),
//         );
//         setSearchResults(data);
//       } catch {
//         setSearchResults([]);
//       } finally {
//         setSearchLoading(false);
//       }
//     }, 400);
//     return () => clearTimeout(t);
//   }, [searchText, filterBy]);

//   // Body-part fetch
//   const fetchByBodyPart = useCallback(
//     async (bodyPart: string, text: string, by: FilterBy, status: string) => {
//       setLoading(true);
//       try {
//         const data = await clinicsApi.getHospitals({
//           bodyPart,
//           status: status || undefined,
//           ...buildSearchParams(text, by),
//         });
//         setHospitals(data);
//       } catch {
//         setHospitals([]);
//       } finally {
//         setLoading(false);
//       }
//     },
//     [],
//   );

//   const handleBodyPartClick = (bp: string) => {
//     const next = selectedBodyPart === bp ? null : bp;
//     setSelectedBodyPart(next);
//     setBpSearch("");
//     setStatusFilter("");
//     if (next) fetchByBodyPart(next, "", "name", "");
//     else setHospitals([]);
//   };

//   const clearSelection = () => {
//     setSelectedBodyPart(null);
//     setHospitals([]);
//     setBpSearch("");
//     setStatusFilter("");
//   };

//   useEffect(() => {
//     if (!selectedBodyPart) return;
//     const t = setTimeout(
//       () =>
//         fetchByBodyPart(selectedBodyPart, bpSearch, bpFilterBy, statusFilter),
//       400,
//     );
//     return () => clearTimeout(t);
//   }, [bpSearch, bpFilterBy, statusFilter, selectedBodyPart, fetchByBodyPart]);

//   const showSearchResults = searchText.trim() !== "";
//   const currentFilterLabel =
//     FILTER_OPTIONS.find((o) => o.value === filterBy)?.label ?? " ";
//   const bpCurrentFilterLabel =
//     FILTER_OPTIONS.find((o) => o.value === bpFilterBy)?.label ??
//     " ";

//   return (
//     <div className="p-6 space-y-6">
//       {/* Header */}
//       <div>
//         <h1 className="text-2xl font-bold text-gray-900">
//           Find Healthcare Facilities
//         </h1>
//         <p className="text-gray-500 text-sm mt-1">
//           Search through our comprehensive database of hospitals and clinics
//         </p>
//       </div>

//       {/* Stats */}
//       {stats && (
//         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//           <StatCard
//             icon={<Building2 className="w-5 h-5 text-blue-600" />}
//             value={stats.totalHospitals}
//             label="Hospitals"
//             color="blue"
//           />
//           <StatCard
//             icon={<LayoutGrid className="w-5 h-5 text-green-600" />}
//             value={stats.totalBranches}
//             label="Branches"
//             color="green"
//           />
//           <StatCard
//             icon={<Stethoscope className="w-5 h-5 text-purple-600" />}
//             value={`${stats.totalDoctors}+`}
//             label="Doctors"
//             color="purple"
//           />
//           <StatCard
//             icon={<Users className="w-5 h-5 text-orange-600" />}
//             value={stats.totalPatients}
//             label="Patients"
//             color="orange"
//           />
//         </div>
//       )}

//       {/* ── Unified search bar with filter-by dropdown ───────────────────────── */}
//       <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
//         <div className="flex items-center gap-0 border border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-400 transition-colors">
//           {/* Search icon + input */}
//           <div className="flex items-center flex-1 px-4 gap-3">
//             <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
//             <input
//               type="text"
//               placeholder={
//                 filterBy === "name"
//                   ? "Search ..."
//                   : filterBy === "area"
//                     ? "Search area..."
//                     : "Search pincode..."
//               }
//               value={searchText}
//               onChange={(e) => setSearchText(e.target.value)}
//               className="flex-1 py-3 text-sm bg-transparent focus:outline-none text-gray-900 placeholder-gray-400"
//             />
//             {searchText && (
//               <button
//                 onClick={() => setSearchText("")}
//                 className="text-gray-400 hover:text-gray-600"
//               >
//                 <X className="w-4 h-4" />
//               </button>
//             )}
//           </div>

//           {/* Divider */}
//           <div className="w-px h-8 bg-gray-200 flex-shrink-0" />

//           {/* Filter-by dropdown trigger */}
//           <div className="relative flex-shrink-0" ref={filterRef}>
//   <button
//     onClick={() => setFilterOpen((v) => !v)}
//     className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-l border-gray-200 min-w-[180px] justify-between"
//   >
//     <div className="flex items-center gap-2">
//       <SlidersHorizontal className="w-4 h-4 text-gray-400" />
//       <span>
//         {filterBy === "name"
//           ? " "
//           : filterBy === "area"
//           ? "Area"
//           : "Pincode"}
//       </span>
//     </div>

//     <ChevronDown
//       className={`w-4 h-4 transition-transform ${
//         filterOpen ? "rotate-180" : ""
//       }`}
//     />
//   </button>

//   {filterOpen && (
//     <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">

//       <button
//         onClick={() => {
//           setFilterBy("name");
//           setFilterOpen(false);
//         }}
//         className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 ${
//           filterBy === "name"
//             ? "bg-blue-50 text-blue-600 font-medium"
//             : "text-gray-700"
//         }`}
//       >
//         Hospital Name
//       </button>

//       <button
//         onClick={() => {
//           setFilterBy("area");
//           setFilterOpen(false);
//         }}
//         className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 ${
//           filterBy === "area"
//             ? "bg-blue-50 text-blue-600 font-medium"
//             : "text-gray-700"
//         }`}
//       >
//         Area
//       </button>

//       <button
//         onClick={() => {
//           setFilterBy("pincode");
//           setFilterOpen(false);
//         }}
//         className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 ${
//           filterBy === "pincode"
//             ? "bg-blue-50 text-blue-600 font-medium"
//             : "text-gray-700"
//         }`}
//       >
//         Pincode
//       </button>
//     </div>
//   )}
// </div>
//         </div>

//         {/* Active filter pill */}
//         {searchText && (
//           <div className="mt-3 flex items-center gap-2">
//             <span className="text-xs text-gray-500">Filtering by</span>
//             <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
//               <SlidersHorizontal className="w-3 h-3" />
//               {currentFilterLabel}: &ldquo;{searchText}&rdquo;
//             </span>
//           </div>
//         )}
//       </div>

//       {/* Global search results */}
//       {showSearchResults && (
//         <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
//           <div className="p-5 border-b border-gray-100 flex items-center justify-between">
//             <h2 className="text-base font-semibold text-gray-900">
//               Search Results
//             </h2>
//             <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
//               {searchResults.length} found
//             </span>
//           </div>
//           <div className="overflow-x-auto">
//             {searchLoading ? (
//               <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
//                 <Activity className="w-4 h-4 mr-2 animate-spin" /> Searching...
//               </div>
//             ) : searchResults.length === 0 ? (
//               <div className="py-16 flex flex-col items-center text-gray-400">
//                 <Search className="w-10 h-10 mb-2 opacity-30" />
//                 <p className="text-sm">
//                   No results found for &ldquo;{searchText}&rdquo;
//                 </p>
//               </div>
//             ) : (
//               <HospitalsTable
//                 hospitals={searchResults}
//                 onRowClick={(id) => router.push(`/dashboard/clinics/${id}`)}
//               />
//             )}
//           </div>
//         </div>
//       )}

//       {/* Browse by Body Part */}
//       {!showSearchResults && (
//         <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
//           {/* <h2 className="text-base font-semibold text-gray-900 mb-4">Browse by Body Part</h2> */}
//           <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
//             {BODY_PARTS.map((bp) => {
//               const isActive = selectedBodyPart === bp.label;
//               return (
//                 <button
//                   key={bp.label}
//                   onClick={() => handleBodyPartClick(bp.label)}
//                   className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all
//                     ${isActive ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm" : "border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50/50"}`}
//                 >
//                   <span className="text-2xl">{bp.emoji}</span>
//                   <span className="text-center leading-tight">{bp.label}</span>
//                 </button>
//               );
//             })}
//           </div>
//         </div>
//       )}

//       {/* Body-part hospitals table */}
//       {selectedBodyPart && !showSearchResults && (
//         <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
//           <div className="p-5 border-b border-gray-100">
//             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
//               <div className="flex items-center gap-2">
//                 <span className="text-base font-semibold text-gray-900">
//                   Hospitals — {selectedBodyPart}
//                 </span>
//                 <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
//                   {hospitals.length} found
//                 </span>
//                 <button
//                   onClick={clearSelection}
//                   className="text-gray-400 hover:text-gray-600 transition-colors"
//                 >
//                   <X className="w-4 h-4" />
//                 </button>
//               </div>

//               {/* Body-part search with its own filter-by dropdown */}
//               <div className="flex items-center gap-2">
//                 <div className="flex items-center gap-0 border border-gray-200 rounded-lg overflow-hidden focus-within:border-blue-400 transition-colors">
//                   <div className="flex items-center px-3 gap-2">
//                     <Search className="w-4 h-4 text-gray-400" />
//                     <input
//                       type="text"
//                       placeholder={
//                         bpFilterBy === "name"
//                           ? "Search..."
//                           : bpFilterBy === "area"
//                             ? "Search area..."
//                             : "Search pincode..."
//                       }
//                       value={bpSearch}
//                       onChange={(e) => setBpSearch(e.target.value)}
//                       className="w-44 py-2 text-sm bg-transparent focus:outline-none placeholder-gray-400"
//                     />
//                     {bpSearch && (
//                       <button
//                         onClick={() => setBpSearch("")}
//                         className="text-gray-400 hover:text-gray-600"
//                       >
//                         <X className="w-3.5 h-3.5" />
//                       </button>
//                     )}
//                   </div>
//                   <div className="w-px h-6 bg-gray-200" />
//                   <div className="relative" ref={bpFilterRef}>
//                     <button
//                       onClick={() => setBpFilterOpen((v) => !v)}
//                       className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap"
//                     >
//                       <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
//                       <span>{bpCurrentFilterLabel}</span>
//                       <ChevronDown
//                         className={`w-3 h-3 text-gray-400 transition-transform ${bpFilterOpen ? "rotate-180" : ""}`}
//                       />
//                     </button>
//                     {bpFilterOpen && (
//                       <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-40 py-1">
//                         <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
//                           Filter by
//                         </p>
//                         {FILTER_OPTIONS.map((opt) => (
//                           <button
//                             key={opt.value}
//                             onClick={() => {
//                               setBpFilterBy(opt.value);
//                               setBpFilterOpen(false);
//                               setBpSearch("");
//                             }}
//                             className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors
//                               ${bpFilterBy === opt.value ? "text-blue-600 bg-blue-50 font-medium" : "text-gray-700 hover:bg-gray-50"}`}
//                           >
//                             {opt.label}
//                             {bpFilterBy === opt.value && (
//                               <Check className="w-3.5 h-3.5 text-blue-500" />
//                             )}
//                           </button>
//                         ))}
//                       </div>
//                     )}
//                   </div>
//                 </div>

//                 <select
//                   value={statusFilter}
//                   onChange={(e) => setStatusFilter(e.target.value)}
//                   className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 bg-white"
//                 >
//                   <option value="">All Status</option>
//                   <option value="ACTIVE">Active</option>
//                   <option value="INACTIVE">Inactive</option>
//                 </select>
//               </div>
//             </div>
//           </div>

//           <div className="overflow-x-auto">
//             {loading ? (
//               <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
//                 <Activity className="w-4 h-4 mr-2 animate-spin" /> Loading...
//               </div>
//             ) : hospitals.length === 0 ? (
//               <div className="flex flex-col items-center justify-center py-16 text-gray-400">
//                 <Building2 className="w-10 h-10 mb-2 opacity-30" />
//                 <p className="text-sm">
//                   No hospitals found for{" "}
//                   <span className="font-medium">{selectedBodyPart}</span>
//                 </p>
//               </div>
//             ) : (
//               <HospitalsTable
//                 hospitals={hospitals}
//                 onRowClick={(id) => router.push(`/dashboard/clinics/${id}`)}
//               />
//             )}
//           </div>
//         </div>
//       )}

//       {/* Directory Cards */}
//       {!selectedBodyPart && !showSearchResults && (
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
//           <div
//             className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group"
//             onClick={() => router.push("/dashboard/clinics/hospitals")}
//           >
//             <div className="flex items-start justify-between mb-4">
//               <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
//                 <Building2 className="w-6 h-6 text-blue-600" />
//               </div>
//               <span className="bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full font-semibold">
//                 {stats?.totalHospitals ?? "—"} Hospitals
//               </span>
//             </div>
//             <h3 className="text-lg font-bold text-gray-900 mb-1">
//               Hospitals Directory
//             </h3>
//             <p className="text-sm text-gray-500 mb-5">
//               Browse comprehensive list of hospitals with detailed information
//             </p>
//             <div className="flex items-center gap-1 text-blue-600 text-sm font-semibold group-hover:gap-2 transition-all">
//               View Directory <ArrowRight className="w-4 h-4" />
//             </div>
//             <div className="mt-4 flex justify-end opacity-20">
//               <Building2 className="w-20 h-20 text-blue-400" />
//             </div>
//           </div>

//           <div
//             className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 cursor-pointer hover:shadow-md hover:border-green-200 transition-all group"
//             onClick={() =>
//               router.push("/dashboard/clinics/hospitals?type=clinic")
//             }
//           >
//             <div className="flex items-start justify-between mb-4">
//               <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
//                 <Stethoscope className="w-6 h-6 text-green-600" />
//               </div>
//               <span className="bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-semibold">
//                 {stats?.totalBranches ?? "—"} Clinics
//               </span>
//             </div>
//             <h3 className="text-lg font-bold text-gray-900 mb-1">
//               Clinics Directory
//             </h3>
//             <p className="text-sm text-gray-500 mb-5">
//               Explore specialized clinics and outpatient facilities
//             </p>
//             <div className="flex items-center gap-1 text-green-600 text-sm font-semibold group-hover:gap-2 transition-all">
//               View Directory <ArrowRight className="w-4 h-4" />
//             </div>
//             <div className="mt-4 flex justify-end opacity-20">
//               <Stethoscope className="w-20 h-20 text-green-400" />
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// // ── Shared HospitalsTable ──────────────────────────────────────────────────────
// function HospitalsTable({
//   hospitals,
//   onRowClick,
// }: {
//   hospitals: Hospital[];
//   onRowClick: (id: number) => void;
// }) {
//   const [mapTarget, setMapTarget] = useState<Hospital | null>(null);

//   return (
//     <>
//       <table className="w-full text-sm">
//         <thead>
//           <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
//             <th className="px-4 py-3 text-left font-medium">S.No</th>
//             <th className="px-4 py-3 text-left font-medium">Hospital Name</th>
//             <th className="px-4 py-3 text-left font-medium">Area</th>
//             <th className="px-4 py-3 text-left font-medium">City</th>
//             <th className="px-4 py-3 text-left font-medium">Pincode</th>
//             <th className="px-4 py-3 text-left font-medium">Address</th>
//             <th className="px-4 py-3 text-left font-medium">Specialization</th>
//             <th className="px-4 py-3 text-left font-medium">Contact Name</th>
//             <th className="px-4 py-3 text-left font-medium">Contact Number</th>
//             <th className="px-4 py-3 text-left font-medium">Email</th>
//             <th className="px-4 py-3 text-left font-medium">Status</th>
//             <th className="px-4 py-3 text-left font-medium">Map</th>
//             <th className="px-4 py-3 text-left font-medium"></th>
//           </tr>
//         </thead>
//         <tbody className="divide-y divide-gray-50">
//           {hospitals.map((h, i) => (
//             <tr
//               key={h.id}
//               className="hover:bg-blue-50/40 cursor-pointer transition-colors"
//               onClick={() => onRowClick(h.id)}
//             >
//               <td className="px-4 py-3.5 text-gray-400 text-xs font-mono">
//                 {i + 1}
//               </td>
//               <td className="px-4 py-3.5">
//                 <div className="font-semibold text-gray-900 whitespace-nowrap">
//                   {h.name}
//                 </div>
//                 <div className="text-xs text-gray-400">{h.bodyPart}</div>
//               </td>
//               <td className="px-4 py-3.5 text-gray-600 text-xs whitespace-nowrap">
//                 {h.area}
//               </td>
//               <td className="px-4 py-3.5 text-gray-600 text-xs whitespace-nowrap">
//                 {h.city}, {h.state}
//               </td>
//               <td className="px-4 py-3.5 text-gray-600 text-xs whitespace-nowrap">
//                 {h.pincode}
//               </td>
//               <td
//                 className="px-4 py-3.5 text-gray-500 text-xs max-w-[160px] truncate"
//                 title={h.address}
//               >
//                 {h.address}
//               </td>
//               <td className="px-4 py-3.5">
//                 <span className="bg-purple-50 text-purple-700 text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
//                   {h.specialization}
//                 </span>
//               </td>
//               <td className="px-4 py-3.5 text-gray-700 text-xs whitespace-nowrap">
//                 {h.contactName}
//               </td>
//               <td className="px-4 py-3.5 text-gray-600 text-xs whitespace-nowrap">
//                 {h.contactNumber}
//               </td>
//               <td className="px-4 py-3.5 text-gray-500 text-xs">{h.email}</td>
//               <td className="px-4 py-3.5">
//                 <span
//                   className={`text-xs px-2 py-0.5 rounded-full font-medium ${h.status === "ACTIVE" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}
//                 >
//                   {h.status}
//                 </span>
//               </td>
//               <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
//                 {h.latitude && h.longitude ? (
//                   <button
//                     onClick={() => setMapTarget(h)}
//                     className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium px-2.5 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors whitespace-nowrap"
//                   >
//                     <MapPin className="w-3.5 h-3.5" /> View Map
//                   </button>
//                 ) : (
//                   <span className="text-xs text-gray-300">—</span>
//                 )}
//               </td>
//               <td className="px-4 py-3.5">
//                 <ChevronRight className="w-4 h-4 text-gray-400" />
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>

//       {mapTarget && mapTarget.latitude && mapTarget.longitude && (
//         <MapModal
//           open={!!mapTarget}
//           onClose={() => setMapTarget(null)}
//           latitude={mapTarget.latitude}
//           longitude={mapTarget.longitude}
//           label={mapTarget.name}
//           address={`${mapTarget.address}, ${mapTarget.city}`}
//         />
//       )}
//     </>
//   );
// }

// function StatCard({
//   icon,
//   value,
//   label,
//   color,
// }: {
//   icon: React.ReactNode;
//   value: string | number;
//   label: string;
//   color: string;
// }) {
//   const colors: Record<string, string> = {
//     blue: "border-l-blue-500",
//     green: "border-l-green-500",
//     purple: "border-l-purple-500",
//     orange: "border-l-orange-500",
//   };
//   return (
//     <div
//       className={`bg-white rounded-xl border border-gray-100 border-l-4 ${colors[color]} shadow-sm p-4`}
//     >
//       <div className="flex items-center gap-3">
//         <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
//           {icon}
//         </div>
//         <div>
//           <p className="text-xl font-bold text-gray-900">{value}</p>
//           <p className="text-xs text-gray-500">{label}</p>
//         </div>
//       </div>
//     </div>
//   );
// }


"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Building2, Users, Stethoscope, ChevronRight,
  X, LayoutGrid, Activity, ArrowRight, SlidersHorizontal,
  MapPin, ChevronDown, Check,
} from "lucide-react";
import { clinicsApi } from "@/lib/clinicsApi";
import type { Hospital, Branch, ClinicStats, BodyPartCount } from "@/types/clinics";
import MapModal from "@/components/MapModal";

const BODY_PARTS: { label: string; emoji: string }[] = [
  { label: "Shoulder", emoji: "💪" },
  { label: "Neck",     emoji: "🫀" },
  { label: "Back",     emoji: "🧍" },
  { label: "Ankle",    emoji: "🦶" },
  { label: "Knee",     emoji: "🦵" },
  { label: "Wrist",    emoji: "✋" },
  { label: "Toes",     emoji: "🦶" },
  { label: "Elbows",   emoji: "💪" },
  { label: "Finger",   emoji: "☝️" },
  { label: "Thumb",    emoji: "👍" },
  { label: "Torso",    emoji: "🫁" },
  { label: "Stroke",   emoji: "🧠" },
];

/**
 * filterBy = "" → universal search (sends ?search=text, matches name/area/city/pincode/etc.)
 * filterBy = "name" | "area" | "pincode" → field-specific search
 */
type FilterBy = "" | "name" | "area" | "pincode";

const FILTER_OPTIONS = [
  { value: "" as FilterBy,        label: "All Fields",    placeholder: "Search hospitals, area, city, pincode..." },
  { value: "name" as FilterBy,    label: "Hospital Name", placeholder: "Search by hospital name..."              },
  { value: "area" as FilterBy,    label: "Area",          placeholder: "Search by area..."                       },
  { value: "pincode" as FilterBy, label: "Pincode",       placeholder: "Search by pincode..."                    },
];

/** Converts (text, filterBy) → the correct API params object */
function buildFilterParams(text: string, by: FilterBy) {
  const t = text.trim();
  if (!t) return {};
  switch (by) {
    case "":       return { search: t };        // universal — backend searches all fields
    case "name":   return { hospitalName: t };
    case "area":   return { area: t };
    case "pincode": return { pincode: t };
  }
}

/** Universal search bar + separate filter dropdown */
function SearchFilterBar({
  searchText, onSearchChange,
  filterBy, onFilterChange,
  size = "md",
}: {
  searchText: string;
  onSearchChange: (v: string) => void;
  filterBy: FilterBy;
  onFilterChange: (v: FilterBy) => void;
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const activeFilter = FILTER_OPTIONS.find((o) => o.value === filterBy) ?? FILTER_OPTIONS[0];
  const hasFieldFilter = filterBy !== "";   // a specific field is selected
  const showPill       = searchText.trim() !== "";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const py   = size === "sm" ? "py-2" : "py-3";
  const icon = size === "sm" ? "w-4 h-4" : "w-5 h-5";

  return (
    <div className="space-y-2">
      <div className="flex items-center border border-gray-200 rounded-xl overflow-visible focus-within:border-blue-400 transition-colors bg-white">
        {/* Search input */}
        <div className="flex items-center flex-1 px-4 gap-3 min-w-0">
          <Search className={`${icon} text-gray-400 flex-shrink-0`} />
          <input
            type="text"
            placeholder={activeFilter.placeholder}
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`flex-1 ${py} text-sm bg-transparent focus:outline-none text-gray-900 placeholder-gray-400 min-w-0`}
          />
          {searchText && (
            <button onClick={() => onSearchChange("")} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-gray-200 flex-shrink-0" />

        {/* Filter trigger */}
        <div className="relative flex-shrink-0" ref={ref}>
          <button
            onClick={() => setOpen((v) => !v)}
            className={`flex items-center gap-1.5 px-4 ${py} text-sm text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap`}
          >
            <SlidersHorizontal className={`${icon} ${hasFieldFilter ? "text-blue-500" : "text-gray-400"}`} />
            {/* Show label only when a specific field is selected */}
            {hasFieldFilter && (
              <span className="text-blue-600 font-medium text-xs">{activeFilter.label}</span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Search by field</p>
              </div>
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onFilterChange(opt.value);
                    onSearchChange(""); // clear text when switching filter
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-gray-50
                    ${filterBy === opt.value ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700"}`}
                >
                  <span>{opt.label}</span>
                  {filterBy === opt.value && <Check className="w-4 h-4 text-blue-500" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active filter pill — shown whenever text is typed */}
      {showPill && (
        <div className="flex items-center gap-2 pl-1">
          <span className="text-xs text-gray-400">Searching</span>
          <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
            <SlidersHorizontal className="w-3 h-3" />
            {activeFilter.label}{searchText.trim() ? `: "${searchText.trim()}"` : ""}
            <button
              onClick={() => { onFilterChange(""); onSearchChange(""); }}
              className="ml-0.5 hover:text-blue-900"
              title="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
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

  // Global search bar state — defaults to universal search (filterBy = "")
  const [searchText, setSearchText] = useState("");
  const [filterBy, setFilterBy]     = useState<FilterBy>("");

  // Body-part panel search bar state — also defaults to universal
  const [bpSearch, setBpSearch]     = useState("");
  const [bpFilterBy, setBpFilterBy] = useState<FilterBy>("");

  useEffect(() => {
    clinicsApi.getStats().then(setStats).catch(() => {});
    clinicsApi.getBodyPartCounts().then(setBodyPartCounts).catch(() => {});
  }, []);

  // Build a lookup map: bodyPart (lowercase) → counts
  const bpCountMap = bodyPartCounts.reduce<Record<string, BodyPartCount>>((acc, c) => {
    acc[c.bodyPart.toLowerCase()] = c;
    return acc;
  }, {});

  // Global search (debounced) — fetches hospitals AND branches in parallel
  useEffect(() => {
    if (!searchText.trim()) { setSearchResults([]); setBranchResults([]); return; }
    setSearchLoading(true);
    const t = setTimeout(async () => {
      try {
        const filterParams = buildFilterParams(searchText, filterBy);
        const [hospitals, branches] = await Promise.all([
          clinicsApi.getHospitals(filterParams),
          // branches only support a generic search param; skip for pincode-only filter
          filterBy === "pincode"
            ? Promise.resolve([])
            : clinicsApi.getAllBranches({ search: searchText.trim() }),
        ]);
        setSearchResults(hospitals);
        setBranchResults(branches as Branch[]);
      } catch { setSearchResults([]); setBranchResults([]); }
      finally { setSearchLoading(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [searchText, filterBy]);

  const fetchByBodyPart = useCallback(
    async (bp: string, text: string, by: FilterBy) => {
      setLoading(true);
      try {
        const data = await clinicsApi.getHospitals({
          bodyPart: bp,
          ...buildFilterParams(text, by),
        });
        setHospitals(data);
      } catch { setHospitals([]); }
      finally { setLoading(false); }
    }, []
  );

  const handleBodyPartClick = (bp: string) => {
    const next = selectedBodyPart === bp ? null : bp;
    setSelectedBodyPart(next);
    setBpSearch(""); setBpFilterBy("");
    if (next) fetchByBodyPart(next, "", "");
    else setHospitals([]);
  };

  const clearSelection = () => {
    setSelectedBodyPart(null); setHospitals([]);
    setBpSearch(""); setBpFilterBy("");
  };

  useEffect(() => {
    if (!selectedBodyPart) return;
    const t = setTimeout(() => fetchByBodyPart(selectedBodyPart, bpSearch, bpFilterBy), 400);
    return () => clearTimeout(t);
  }, [bpSearch, bpFilterBy, selectedBodyPart, fetchByBodyPart]);

  const showSearchResults = searchText.trim() !== "";

  return (
    <div className="flex h-full flex-col overflow-hidden bg-gray-50 p-4 sm:p-5 lg:p-6 gap-4">

      {/* Header */}
      <div className="flex-none">
        <h1 className="text-2xl font-bold text-gray-900">Find Healthcare Facilities</h1>
        {/* <p className="text-gray-500 text-sm mt-1">Search through our comprehensive database of hospitals and clinics</p> */}
      </div>

      {/* Stats */}
      {stats && (
        <div className="flex-none grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<Building2 className="w-5 h-5 text-blue-600" />}    value={stats.totalHospitals}        label="Hospitals" color="blue"   />
          <StatCard icon={<LayoutGrid className="w-5 h-5 text-green-600" />}  value={stats.totalBranches}         label="Branches"  color="green"  />
          <StatCard icon={<Stethoscope className="w-5 h-5 text-purple-600" />} value={`${stats.totalDoctors}`}  label="Doctors"   color="purple" />
          <StatCard icon={<Users className="w-5 h-5 text-orange-600" />}      value={stats.totalPatients}         label="Patients"  color="orange" />
        </div>
      )}

      {/* Universal search bar */}
      <div className="flex-none bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <SearchFilterBar
          searchText={searchText} onSearchChange={setSearchText}
          filterBy={filterBy}     onFilterChange={setFilterBy}
        />
      </div>

      {/* Page content */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pb-2">

        {/* Global search results */}
        {showSearchResults && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Search Results</h2>
              {!searchLoading && (
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                  {searchResults.length + branchResults.length} found
                </span>
              )}
            </div>
            {searchLoading ? (
              <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
                <Activity className="w-4 h-4 mr-2 animate-spin" /> Searching...
              </div>
            ) : (searchResults.length === 0 && branchResults.length === 0) ? (
              <div className="py-16 flex flex-col items-center text-gray-400">
                <Search className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">No results found for &ldquo;{searchText}&rdquo;</p>
              </div>
            ) : (
              <UnifiedResultsList
                hospitals={searchResults}
                branches={branchResults}
                onHospitalClick={(id) => router.push(`/dashboard/clinics/${id}/doctors`)}
                onBranchClick={(hospitalId) => router.push(`/dashboard/clinics/${hospitalId}/doctors`)}
              />
            )}
          </div>
        )}

        {/* Body parts grid */}
        {!showSearchResults && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
            {/* <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Browse by Body Part</p> */}
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
              {BODY_PARTS.map((bp) => {
                const isActive = selectedBodyPart === bp.label;
                const cnt = bpCountMap[bp.label.toLowerCase()];
                return (
                  <button
                    key={bp.label}
                    onClick={() => handleBodyPartClick(bp.label)}
                    className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg border font-medium transition-all
                      ${isActive
                        ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                        : "border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50/50"
                      }`}
                  >
                    <span className="text-xl">{bp.emoji}</span>
                    <span className="text-center leading-tight font-semibold text-xs">{bp.label}</span>
                    {cnt ? (
                      <span className={`text-[10px] font-normal leading-tight ${isActive ? "text-blue-500" : "text-gray-400"}`}>
                        {cnt.hospitalCount + cnt.branchCount} clinics
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-300">—</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Body-part hospitals table */}
        {selectedBodyPart && !showSearchResults && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="p-5 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-base font-semibold text-gray-900">Hospitals — {selectedBodyPart}</span>
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">{hospitals.length} found</span>
                  <button onClick={clearSelection} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="w-4 h-4" /></button>
                </div>
                <div className="flex flex-col gap-2 sm:items-end">
                  <div className="w-72">
                    <SearchFilterBar
                      searchText={bpSearch}    onSearchChange={setBpSearch}
                      filterBy={bpFilterBy}    onFilterChange={setBpFilterBy}
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="overflow-auto max-h-[520px]">
              {loading ? (
                <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
                  <Activity className="w-4 h-4 mr-2 animate-spin" /> Loading...
                </div>
              ) : hospitals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Building2 className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm">No hospitals found for <span className="font-medium">{selectedBodyPart}</span></p>
                </div>
              ) : (
                <HospitalsTable hospitals={hospitals} onRowClick={(id) => router.push(`/dashboard/clinics/${id}`)} />
              )}
            </div>
          </div>
        )}

        {/* Directory Cards */}
        {!selectedBodyPart && !showSearchResults && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-2">
            {/* Hospitals */}
            <div
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group overflow-hidden relative"
              onClick={() => router.push("/dashboard/clinics/hospitals")}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <span className="bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full font-semibold">
                  {stats?.totalHospitals ?? "—"} Hospitals
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Hospitals Directory</h3>
              <p className="text-sm text-gray-500 mb-4">Browse comprehensive list of hospitals with detailed information</p>
              <div className="flex items-center gap-1 text-blue-600 text-sm font-semibold group-hover:gap-2 transition-all">
                View Directory <ArrowRight className="w-4 h-4" />
              </div>
              <Building2 className="absolute bottom-3 right-3 w-16 h-16 text-blue-200 opacity-40 pointer-events-none" />
            </div>

            {/* Clinics */}
            <div
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 cursor-pointer hover:shadow-md hover:border-green-200 transition-all group overflow-hidden relative"
              onClick={() => router.push("/dashboard/clinics/hospitals?type=clinic")}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-green-600" />
                </div>
                <span className="bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-semibold">
                  {stats?.totalBranches ?? "—"} Clinics
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Clinics Directory</h3>
              <p className="text-sm text-gray-500 mb-4">Explore specialized clinics and outpatient facilities</p>
              <div className="flex items-center gap-1 text-green-600 text-sm font-semibold group-hover:gap-2 transition-all">
                View Directory <ArrowRight className="w-4 h-4" />
              </div>
              <Stethoscope className="absolute bottom-3 right-3 w-16 h-16 text-green-200 opacity-40 pointer-events-none" />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ── Unified search results list (hospitals + branches in one list) ─────────────
function UnifiedResultsList({
  hospitals, branches, onHospitalClick, onBranchClick,
}: {
  hospitals: Hospital[];
  branches: Branch[];
  onHospitalClick: (id: number) => void;
  onBranchClick: (hospitalId: number) => void;
}) {
  const [mapTarget, setMapTarget] = useState<{ lat: number; lng: number; label: string; address: string } | null>(null);

  return (
    <>
      <div className="divide-y divide-gray-50">
        {hospitals.map((h) => (
          <div
            key={`h-${h.id}`}
            className="flex items-center gap-4 px-5 py-3.5 hover:bg-blue-50/40 cursor-pointer transition-colors"
            onClick={() => onHospitalClick(h.id)}
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-900 text-sm">{h.name}</span>
                <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">Hospital</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${h.status === "ACTIVE" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>{h.status}</span>
              </div>
              <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2 flex-wrap">
                <span>{h.area}{h.city ? `, ${h.city}` : ""}</span>
                {h.pincode && <span>· {h.pincode}</span>}
                {h.specialization && <span>· {h.specialization}</span>}
                {h.bodyPart && <span>· {h.bodyPart}</span>}
              </div>
            </div>
            {h.latitude && h.longitude && (
              <button
                onClick={(e) => { e.stopPropagation(); setMapTarget({ lat: h.latitude!, lng: h.longitude!, label: h.name, address: `${h.address}, ${h.city}` }); }}
                className="flex items-center gap-1 text-xs text-blue-600 px-2 py-1 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors whitespace-nowrap flex-shrink-0"
              >
                <MapPin className="w-3 h-3" /> Map
              </button>
            )}
            <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
          </div>
        ))}

        {branches.map((b) => (
          <div
            key={`b-${b.id}`}
            className="flex items-center gap-4 px-5 py-3.5 hover:bg-green-50/40 cursor-pointer transition-colors"
            onClick={() => onBranchClick(b.hospitalId)}
          >
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
              <LayoutGrid className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-900 text-sm">{b.branchName}</span>
                <span className="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium">Branch</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${b.status === "ACTIVE" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>{b.status}</span>
              </div>
              <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2 flex-wrap">
                <span>{b.hospitalName}</span>
                {b.city && <span>· {b.city}</span>}
                {b.managerName && <span>· {b.managerName}</span>}
              </div>
            </div>
            {b.latitude && b.longitude && (
              <button
                onClick={(e) => { e.stopPropagation(); setMapTarget({ lat: b.latitude!, lng: b.longitude!, label: b.branchName, address: `${b.address}, ${b.city}` }); }}
                className="flex items-center gap-1 text-xs text-blue-600 px-2 py-1 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors whitespace-nowrap flex-shrink-0"
              >
                <MapPin className="w-3 h-3" /> Map
              </button>
            )}
            <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
          </div>
        ))}
      </div>

      {mapTarget && (
        <MapModal open={!!mapTarget} onClose={() => setMapTarget(null)}
          latitude={mapTarget.lat} longitude={mapTarget.lng}
          label={mapTarget.label} address={mapTarget.address} />
      )}
    </>
  );
}

// ── Shared HospitalsTable ──────────────────────────────────────────────────────
function HospitalsTable({ hospitals, onRowClick }: { hospitals: Hospital[]; onRowClick: (id: number) => void }) {
  const [mapTarget, setMapTarget] = useState<Hospital | null>(null);
  return (
    <>
      <table className="w-max min-w-full text-sm">
        <thead className="sticky top-0 z-10 bg-gray-50">
          <tr className="text-xs text-gray-500 uppercase tracking-wide">
            <th className="px-4 py-3 text-left font-medium">S.No</th>
            <th className="px-4 py-3 text-left font-medium">Hospital Name</th>
            <th className="px-4 py-3 text-left font-medium">Area</th>
            <th className="px-4 py-3 text-left font-medium">City</th>
            <th className="px-4 py-3 text-left font-medium">Pincode</th>
            <th className="px-4 py-3 text-left font-medium">Address</th>
            <th className="px-4 py-3 text-left font-medium">Specialization</th>
            <th className="px-4 py-3 text-left font-medium">Contact Name</th>
            <th className="px-4 py-3 text-left font-medium">Contact Number</th>
            <th className="px-4 py-3 text-left font-medium">Email</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-left font-medium">Map</th>
            <th className="px-4 py-3 text-left font-medium"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {hospitals.map((h, i) => (
            <tr key={h.id} className="hover:bg-blue-50/40 cursor-pointer transition-colors" onClick={() => onRowClick(h.id)}>
              <td className="px-4 py-3.5 text-gray-400 text-xs font-mono">{i + 1}</td>
              <td className="px-4 py-3.5">
                <div className="font-semibold text-gray-900 whitespace-nowrap">{h.name}</div>
                <div className="text-xs text-gray-400">{h.bodyPart}</div>
              </td>
              <td className="px-4 py-3.5 text-gray-600 text-xs whitespace-nowrap">{h.area}</td>
              <td className="px-4 py-3.5 text-gray-600 text-xs whitespace-nowrap">{h.city}, {h.state}</td>
              <td className="px-4 py-3.5 text-gray-600 text-xs whitespace-nowrap">{h.pincode}</td>
              <td className="px-4 py-3.5 text-gray-500 text-xs max-w-[160px] truncate" title={h.address}>{h.address}</td>
              <td className="px-4 py-3.5"><span className="bg-purple-50 text-purple-700 text-xs px-2 py-0.5 rounded-full whitespace-nowrap">{h.specialization}</span></td>
              <td className="px-4 py-3.5 text-gray-700 text-xs whitespace-nowrap">{h.contactName}</td>
              <td className="px-4 py-3.5 text-gray-600 text-xs whitespace-nowrap">{h.contactNumber}</td>
              <td className="px-4 py-3.5 text-gray-500 text-xs">{h.email}</td>
              <td className="px-4 py-3.5">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${h.status === "ACTIVE" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>{h.status}</span>
              </td>
              <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                {h.latitude && h.longitude ? (
                  <button onClick={() => setMapTarget(h)}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium px-2.5 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors whitespace-nowrap">
                    <MapPin className="w-3.5 h-3.5" /> View Map
                  </button>
                ) : <span className="text-xs text-gray-300">—</span>}
              </td>
              <td className="px-4 py-3.5"><ChevronRight className="w-4 h-4 text-gray-400" /></td>
            </tr>
          ))}
        </tbody>
      </table>
      {mapTarget && mapTarget.latitude && mapTarget.longitude && (
        <MapModal open={!!mapTarget} onClose={() => setMapTarget(null)}
          latitude={mapTarget.latitude} longitude={mapTarget.longitude}
          label={mapTarget.name} address={`${mapTarget.address}, ${mapTarget.city}`} />
      )}
    </>
  );
}

function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: string | number; label: string; color: string }) {
  const colors: Record<string, string> = { blue: "border-l-blue-500", green: "border-l-green-500", purple: "border-l-purple-500", orange: "border-l-orange-500" };
  return (
    <div className={`bg-white rounded-xl border border-gray-100 border-l-4 ${colors[color]} shadow-sm p-4`}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">{icon}</div>
        <div><p className="text-xl font-bold text-gray-900">{value}</p><p className="text-xs text-gray-500">{label}</p></div>
      </div>
    </div>
  );
}