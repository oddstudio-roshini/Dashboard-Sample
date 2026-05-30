'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  DragDropContext, Droppable, Draggable, DropResult,
} from '@hello-pangea/dnd';
import {
  Chart as ChartJS,
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { salesApi } from '@/lib/salesApi';
import type { SalesProvider, SalesStats, SalesFilters, SalesTask, SalesStatus } from '@/types/sales';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// ── Constants ──────────────────────────────────────────────────────────────────
const STATUS_OPTIONS: SalesStatus[] = ['Lead', 'Contacted', 'Demo Booked', 'Converted', 'Not Interested'];
const KANBAN_COLS: SalesStatus[]    = ['Lead', 'Contacted', 'Demo Booked', 'Converted'];

const STATUS_COLORS: Record<SalesStatus, string> = {
  'Lead':           'bg-slate-100 text-slate-700',
  'Contacted':      'bg-sky-100 text-sky-700',
  'Demo Booked':    'bg-purple-100 text-purple-700',
  'Converted':      'bg-green-100 text-green-700',
  'Not Interested': 'bg-red-100 text-red-700',
};

const ROWS_PER_PAGE = 15;
type Tab = 'dashboard' | 'database' | 'pipeline' | 'tasks' | 'map' | 'leaderboard' | 'teamAccess';

// ── Mock leaderboard data (matches HTML) ───────────────────────────────────────
const MOCK_LEADERBOARD = [
  { username: 'Rep_Rahul', closed_deals: 4, demos: 12, total_score: 320 },
  { username: 'Rep_Arjun', closed_deals: 1, demos: 5,  total_score: 100 },
];

// ── Mock reps for Team Access ──────────────────────────────────────────────────
const MOCK_REPS = [
  { id: 2, username: 'Rep_Arjun', categories: ['Orthopedics_Hospital', 'Physiotherapy'], territories: ['500072', '500018'] },
  { id: 3, username: 'Rep_Priya', categories: ['Orthopedic_Clinic'],                    territories: ['500034'] },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function sendWhatsApp(phone: string, name: string) {
  if (!phone || phone === 'N/A') return;
  const clean = phone.replace(/[^0-9]/g, '');
  const msg = encodeURIComponent(
    `Hi ${name} Team, I'm reaching out to share a quick 60-second demo of a new digital rehab platform. Do you have a moment?`
  );
  window.open(`https://wa.me/${clean}?text=${msg}`, '_blank');
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function SalesPage() {
  const [tab, setTab]               = useState<Tab>('dashboard');
  const [allProviders, setAll]      = useState<SalesProvider[]>([]);
  const [filtered, setFiltered]     = useState<SalesProvider[]>([]);
  const [stats, setStats]           = useState<SalesStats | null>(null);
  const [filtersMeta, setFiltersMeta] = useState<SalesFilters | null>(null);
  const [tasks, setTasks]           = useState<SalesTask[]>([]);
  const [loading, setLoading]       = useState(true);
  const [apiError, setApiError]     = useState<string | null>(null);
  const [nearMeLoading, setNearMeLoading] = useState(false);
  const [nearMePin, setNearMePin]   = useState<string | null>(null);

  // filter state
  const [search, setSearch]         = useState('');
  const [category, setCategory]     = useState('All');
  const [subCat, setSubCat]         = useState('All');
  const [area, setArea]             = useState('All');
  const [pincode, setPincode]       = useState('');
  const [whaleOnly, setWhaleOnly]   = useState(false);

  // battlecards modal
  const [battleOpen, setBattleOpen] = useState(false);

  // pagination
  const [page, setPage]             = useState(1);

  // sub-category (not used since placeType IS the category now)
  const subCatOptions: string[] = [];

  // ── Initial load — independent calls so one failure doesn't block others ────
  useEffect(() => {
    setLoading(true);
    setApiError(null);

    salesApi.getProviders()
      .then(prov => { setAll(prov); setFiltered(prov); setLoading(false); })
      .catch(err => {
        console.error('Sales providers fetch failed:', err);
        setApiError('Could not connect to backend. Make sure the Spring Boot server is running on port 8081.');
        setLoading(false);
      });

    salesApi.getStats().then(setStats).catch(() => {});
    salesApi.getFilters().then(setFiltersMeta).catch(() => {});
    salesApi.getTasks().then(setTasks).catch(() => {});
  }, []);

  // ── Client-side filtering ────────────────────────────────────────────────────
  useEffect(() => {
    let data = [...allProviders];
    const q = search.trim().toLowerCase();
    if (q)                  data = data.filter(p => p.name.toLowerCase().includes(q) || (p.address || '').toLowerCase().includes(q));
    if (category !== 'All') data = data.filter(p => p.sheetCategory === category);
    if (subCat !== 'All')   data = data.filter(p => p.placeType === subCat);
    if (area !== 'All')     data = data.filter(p => p.searchArea === area);
    if (pincode.trim())     data = data.filter(p => p.pincode === pincode.trim());
    if (whaleOnly)          data = data.filter(p => p.isWhale);
    setFiltered(data);
    setPage(1);
  }, [search, category, subCat, area, pincode, whaleOnly, allProviders]);

  // ── CRM update (optimistic) ─────────────────────────────────────────────────
  const updateCrm = useCallback(async (id: number, field: string, value: unknown) => {
    // optimistic
    const patch = (list: SalesProvider[]) =>
      list.map(p => p.id === id ? { ...p, [field]: value } : p);
    setAll(prev => patch(prev));
    setFiltered(prev => patch(prev));

    try {
      const updated = await salesApi.updateCrm(id, { [field]: value });
      setAll(prev => prev.map(p => p.id === id ? updated : p));
      setFiltered(prev => prev.map(p => p.id === id ? updated : p));
      salesApi.getStats().then(setStats).catch(() => {});
      salesApi.getTasks().then(setTasks).catch(() => {});
    } catch { /* revert on error if needed */ }
  }, []);

  const logContact = (item: SalesProvider) => {
    const today = new Date().toLocaleDateString('en-GB');
    updateCrm(item.id, 'lastContacted', today);
    if (item.status === 'Lead') updateCrm(item.id, 'status', 'Contacted');
  };

  const setReminder = (id: number, days: number) => {
    const d = new Date(); d.setDate(d.getDate() + days);
    updateCrm(id, 'followUpDate', d.toISOString().split('T')[0]);
  };

  // ── Near Me ─────────────────────────────────────────────────────────────────
  const findNearMe = () => {
    // If already active → clear it
    if (nearMePin) {
      setNearMePin(null);
      setPincode('');
      return;
    }

    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setNearMeLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();

          // Nominatim returns postcode under address.postcode
          const postcode =
            data.address?.postcode ||
            data.address?.postal_code ||
            data.address?.['postcode'];

          if (postcode) {
            const clean = postcode.trim();
            setNearMePin(clean);
            setArea('All');   // reset area filter (matches HTML behaviour)
            setPincode(clean); // drives the existing filter useEffect
          } else {
            alert('Could not determine your pincode from location.');
          }
        } catch {
          alert('Error fetching location data. Please try again.');
        } finally {
          setNearMeLoading(false);
        }
      },
      (err) => {
        setNearMeLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          alert('Location access denied. Please allow location in your browser settings.');
        } else {
          alert('Unable to get your location. Please try again.');
        }
      },
      { timeout: 10000, maximumAge: 0, enableHighAccuracy: false }
    );
  };

  // ── Kanban drag end ─────────────────────────────────────────────────────────
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId as SalesStatus;
    const id = Number(result.draggableId);
    if (allProviders.find(p => p.id === id)?.status !== newStatus) {
      updateCrm(id, 'status', newStatus);
    }
  };

  // ── Pagination ──────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const pageData   = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  const today        = new Date().toISOString().split('T')[0];
  const urgentTasks  = tasks.filter(t => t.followUpDate <= today);
  const futTasks     = tasks.filter(t => t.followUpDate > today);

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const demosBooked = filtered.filter(p => p.status === 'Demo Booked').length;
  const converted   = filtered.filter(p => p.status === 'Converted').length;

  // ── Chart data ──────────────────────────────────────────────────────────────
  const catCounts: Record<string, number> = {};
  filtered.forEach(p => { const c = p.sheetCategory || p.searchCategory || 'Other'; catCounts[c] = (catCounts[c] || 0) + 1; });

  const areaCounts: Record<string, number> = {};
  filtered.forEach(p => { const a = p.searchArea || 'Other'; areaCounts[a] = (areaCounts[a] || 0) + 1; });
  const topAreas = Object.entries(areaCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

  const doughnutData = {
    labels: Object.keys(catCounts),
    datasets: [{ data: Object.values(catCounts), backgroundColor: ['#0ea5e9','#10b981','#8b5cf6','#f59e0b','#ef4444','#06b6d4','#84cc16'] }],
  };
  const barData = {
    labels: topAreas.map(i => i[0]),
    datasets: [{ label: 'Providers', data: topAreas.map(i => i[1]), backgroundColor: '#0ea5e9', borderRadius: 4 }],
  };

  // ── Map query ───────────────────────────────────────────────────────────────
  const mapQuery = area !== 'All'
    ? `${category !== 'All' ? category : 'Hospitals'} in ${area}, Hyderabad`
    : 'Hyderabad Telangana';

  const tabTitles: Record<Tab, string> = {
    dashboard: 'Dashboard', database: 'Sales CRM',
    pipeline: 'Visual Pipeline', tasks: 'Tasks', map: 'Live Map',
    leaderboard: 'Team Leaderboard', teamAccess: 'Team Access',
  };

  return (
    <div className="flex flex-col h-full overflow-hidden text-slate-800 bg-slate-50 relative">

      {/* ── Battlecards Modal ────────────────────────────────────────────────── */}
      {battleOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
            <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-lg flex items-center gap-2">
                🛡️ Sales Battlecards
              </h3>
              <button onClick={() => setBattleOpen(false)} className="text-slate-400 hover:text-white text-xl font-bold">✕</button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 bg-slate-50">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="font-bold text-red-600 text-sm mb-1">Objection: "It's too expensive / We use WhatsApp."</h4>
                <p className="text-sm text-slate-700 italic border-l-2 border-sky-500 pl-3">
                  "WhatsApp is free, but it doesn't calculate measurable flexion angles. Clinics using our automated motion tracking increase patient retention by 30% because patients can see real-time progress. It pays for itself in the first month."
                </p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="font-bold text-red-600 text-sm mb-1">Objection: "My patients won't understand an app."</h4>
                <p className="text-sm text-slate-700 italic border-l-2 border-sky-500 pl-3">
                  "The UI is designed specifically for clinical ease. They don't need to learn complex tech; they just open it, and the pose estimation does the heavy lifting."
                </p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="font-bold text-red-600 text-sm mb-1">Objection: "We already have a system."</h4>
                <p className="text-sm text-slate-700 italic border-l-2 border-sky-500 pl-3">
                  "Most existing systems track appointments, not recovery. ARthoMove tracks ROM improvement over time — your patients will see their progress, and that keeps them engaged."
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="h-16 bg-white/95 backdrop-blur-sm border-b border-slate-200 flex items-center justify-between px-4 md:px-6 flex-shrink-0 z-30 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-800">{tabTitles[tab]}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWhaleOnly(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border shadow-sm transition-all ${
              whaleOnly
                ? 'bg-amber-50 border-amber-300 text-amber-700'
                : 'bg-white border-amber-200 text-amber-600 hover:bg-amber-50'
            }`}
          >
            ⭐ Whales
          </button>
          <button
            onClick={findNearMe}
            disabled={nearMeLoading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border shadow-sm transition-all disabled:opacity-60 ${
              nearMePin
                ? 'bg-sky-600 text-white border-sky-600 hover:bg-sky-700'
                : 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100'
            }`}
          >
            {nearMeLoading ? (
              <span className="animate-spin text-sm">⟳</span>
            ) : (
              <span>📍</span>
            )}
            {nearMeLoading
              ? 'Locating...'
              : nearMePin
              ? `Near ${nearMePin} ✕`
              : 'Near Me'}
          </button>
        </div>
      </header>

      {/* ── Filter bar ──────────────────────────────────────────────────────── */}
      <div className="bg-white px-4 md:px-6 py-3 border-b border-slate-200 shadow-sm flex-shrink-0 z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 max-w-7xl">
          <div className="md:col-span-2 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search provider or address..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-sm focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none transition-all"
            />
          </div>
          <select
            value={category}
            onChange={e => { setCategory(e.target.value); setSubCat('All'); }}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-sm focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none transition-all"
          >
            <option value="All">All Categories</option>
            {filtersMeta?.categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={area}
            onChange={e => setArea(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-sm focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none transition-all"
          >
            <option value="All">All Territories</option>
            {filtersMeta?.areas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          {subCatOptions.length > 0 && (
            <select
              value={subCat}
              onChange={e => setSubCat(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-sm focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none transition-all"
            >
              <option value="All">All Sub-Categories</option>
              {subCatOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* ── Tab nav ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 px-4 md:px-6 flex items-center gap-1 flex-shrink-0 overflow-x-auto">
        {([
          { id: 'dashboard', label: '⊞ Dashboard' },
          { id: 'database',  label: '≡ Sales CRM' },
          { id: 'pipeline',  label: '⊟ Pipeline'  },
          { id: 'tasks',     label: '📅 Tasks'     },
          { id: 'map',       label: '📍 Live Map'  },
        ] as { id: Tab; label: string }[]).map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
              tab === id ? 'border-sky-600 text-sky-700 font-semibold' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            {label}
            {id === 'tasks' && tasks.length > 0 && (
              <span className="ml-1.5 bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{tasks.length}</span>
            )}
          </button>
        ))}

        {/* Divider + Admin Tools */}
        <div className="w-px h-6 bg-slate-200 mx-2 flex-shrink-0" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap mr-1">Admin</span>
        {([
          { id: 'leaderboard', label: '🏆 Leaderboard' },
          { id: 'teamAccess',  label: '⚙️ Team Access'  },
        ] as { id: Tab; label: string }[]).map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
              tab === id
                ? id === 'leaderboard' ? 'border-amber-500 text-amber-600 font-semibold' : 'border-slate-500 text-slate-700 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Error banner ────────────────────────────────────────────────────── */}
      {apiError && (
        <div className="flex-none bg-red-50 border-b border-red-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <span className="text-lg">⚠️</span>
            <span><strong>Backend unreachable:</strong> {apiError}</span>
          </div>
          <button
            onClick={() => {
              setApiError(null); setLoading(true);
              salesApi.getProviders().then(prov => { setAll(prov); setFiltered(prov); setLoading(false); }).catch(() => setLoading(false));
              salesApi.getStats().then(setStats).catch(() => {});
              salesApi.getFilters().then(setFiltersMeta).catch(() => {});
              salesApi.getTasks().then(setTasks).catch(() => {});
            }}
            className="text-xs font-semibold bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Main scrollable content ──────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50">

        {/* ═══════════ DASHBOARD ═══════════ */}
        {tab === 'dashboard' && (
          <div className="max-w-7xl mx-auto space-y-6">
            {loading && (
              <div className="flex items-center justify-center py-10 text-slate-400 text-sm gap-2">
                <span className="animate-spin text-xl">⟳</span> Loading providers from server...
              </div>
            )}
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KpiCard label="My Providers"  value={loading ? '…' : filtered.length} />
              <KpiCard label="Territories"   value={loading ? '…' : new Set(filtered.map(p => p.searchArea)).size} />
              <KpiCard label="Demos Booked"  value={loading ? '…' : demosBooked} accent="purple" />
              <KpiCard label="Converted"     value={loading ? '…' : converted}   accent="green"  />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-[1.25rem] border border-slate-200 shadow-sm p-5 h-64">
                {filtered.length > 0 && (
                  <Doughnut
                    data={doughnutData}
                    options={{
                      responsive: true, maintainAspectRatio: false,
                      plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 } } } },
                      cutout: '65%',
                    }}
                  />
                )}
              </div>
              <div className="bg-white rounded-[1.25rem] border border-slate-200 shadow-sm p-5 h-64">
                {topAreas.length > 0 && (
                  <Bar
                    data={barData}
                    options={{
                      responsive: true, maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 45, minRotation: 45 } },
                      },
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ SALES CRM TABLE ═══════════ */}
        {tab === 'database' && (
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-[1.25rem] border border-slate-200 shadow-sm overflow-hidden mb-20">
              {loading ? (
                <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
                  <span className="animate-spin mr-2">⟳</span> Loading...
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 w-10 text-center text-slate-400 text-sm">★</th>
                          <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Provider Details</th>
                          <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status &amp; Scheduling</th>
                          <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pageData.length === 0 ? (
                          <tr><td colSpan={4} className="p-8 text-center text-slate-500">No results found.</td></tr>
                        ) : pageData.map(item => (
                          <CrmRow key={item.id} item={item} onUpdateCrm={updateCrm} onLogContact={() => logContact(item)} onSetReminder={(d) => setReminder(item.id, d)} />
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="md:hidden bg-slate-50 pb-4">
                    {pageData.length === 0
                      ? <div className="p-8 text-center text-slate-500">No results found.</div>
                      : pageData.map(item => (
                        <MobileCard key={item.id} item={item} onUpdateCrm={updateCrm} onLogContact={() => logContact(item)} onSetReminder={(d) => setReminder(item.id, d)} />
                      ))
                    }
                  </div>

                  {/* Pagination */}
                  <div className="px-4 py-3 border-t border-slate-200 bg-white flex items-center justify-between rounded-b-[1.25rem]">
                    <span className="text-xs md:text-sm font-medium text-slate-700">
                      Page {page} of {totalPages} &nbsp;·&nbsp; {filtered.length} providers
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1 border border-slate-300 rounded text-sm disabled:opacity-50 hover:bg-slate-50"
                      >Prev</button>
                      <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages || filtered.length === 0}
                        className="px-3 py-1 border border-slate-300 rounded text-sm disabled:opacity-50 hover:bg-slate-50"
                      >Next</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ═══════════ KANBAN PIPELINE ═══════════ */}
        {tab === 'pipeline' && (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex flex-nowrap overflow-x-auto h-full gap-4 pb-4 px-2 items-start">
              {KANBAN_COLS.map(status => {
                const cards = filtered.filter(p => p.status === status);
                return (
                  <Droppable droppableId={status} key={status}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="min-w-[300px] max-w-[350px] bg-slate-100/80 rounded-2xl p-3 flex flex-col border border-slate-200 flex-shrink-0"
                        style={{ minHeight: 300 }}
                      >
                        <div className="flex justify-between items-center mb-3 px-1">
                          <h3 className="font-bold text-sm text-slate-800">{status}</h3>
                          <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">{cards.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3 pb-4" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                          {cards.slice(0, 100).map((item, index) => (
                            <Draggable key={item.id} draggableId={String(item.id)} index={index}>
                              {(prov, snapshot) => (
                                <div
                                  ref={prov.innerRef}
                                  {...prov.draggableProps}
                                  {...prov.dragHandleProps}
                                  className={`bg-white p-3 rounded-xl shadow-sm border border-slate-200 cursor-grab hover:shadow-md transition-shadow ${snapshot.isDragging ? 'opacity-80 shadow-lg' : ''}`}
                                >
                                  <div className="flex justify-between mb-1">
                                    <h4 className="font-bold text-xs text-slate-900 leading-tight">{item.name}</h4>
                                    {item.isWhale && <span className="text-amber-500 text-xs">★</span>}
                                  </div>
                                  <p className="text-[10px] text-slate-500 truncate">{item.address}</p>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          {cards.length === 0 && !provided.placeholder && (
                            <p className="text-xs text-slate-400 text-center py-6 italic">No providers</p>
                          )}
                        </div>
                      </div>
                    )}
                  </Droppable>
                );
              })}
            </div>
          </DragDropContext>
        )}

        {/* ═══════════ TASKS ═══════════ */}
        {tab === 'tasks' && (
          <div className="max-w-7xl mx-auto space-y-6 pb-20">
            <div className="bg-white rounded-[1.25rem] p-4 md:p-6 border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2 flex justify-between">
                <span>🚨 Due Today</span>
                <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-sm">{urgentTasks.length}</span>
              </h2>
              <div className="space-y-3">
                {urgentTasks.length === 0
                  ? <p className="text-sm text-slate-500 italic px-2">No urgent tasks today! 🎉</p>
                  : urgentTasks.map(t => (
                    <TaskCard key={t.providerId} task={t} urgent
                      onView={() => { setSearch(t.providerName); setTab('database'); }} />
                  ))
                }
              </div>

              <h2 className="text-lg font-bold text-slate-900 mt-8 mb-4 border-b border-slate-100 pb-2 flex justify-between">
                <span>🗓️ Upcoming Reminders</span>
                <span className="bg-sky-50 text-sky-700 px-2 py-0.5 rounded text-sm">{futTasks.length}</span>
              </h2>
              <div className="space-y-3">
                {futTasks.length === 0
                  ? <p className="text-sm text-slate-500 italic px-2">No upcoming reminders.</p>
                  : futTasks.map(t => (
                    <TaskCard key={t.providerId} task={t} urgent={false}
                      onView={() => { setSearch(t.providerName); setTab('database'); }} />
                  ))
                }
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ LIVE MAP ═══════════ */}
        {tab === 'map' && (
          <div className="h-full max-w-7xl mx-auto flex flex-col" style={{ minHeight: '60vh' }}>
            <div className="flex-1 bg-slate-200 rounded-[1.25rem] overflow-hidden relative" style={{ minHeight: '60vh' }}>
              <iframe
                className="w-full h-full border-0 absolute inset-0"
                style={{ minHeight: '60vh' }}
                src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>
        )}

        {/* ═══════════ LEADERBOARD ═══════════ */}
        {tab === 'leaderboard' && (
          <div className="max-w-5xl mx-auto space-y-6 pb-20">
            {/* Banner */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-400 rounded-3xl p-8 text-white shadow-lg flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold">Sales Leaderboard</h2>
                <p className="opacity-90 mt-1">Real-time team performance &amp; gamification.</p>
              </div>
              <span className="text-6xl opacity-80">🏆</span>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[1.25rem] border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Rank &amp; Rep</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Demos</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Deals Won</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Total Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {MOCK_LEADERBOARD.map((rep, idx) => {
                    const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉';
                    return (
                      <tr key={rep.username} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-bold text-slate-900 text-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{medal}</span>
                            {rep.username.replace('Rep_', '')}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-purple-600">{rep.demos}</td>
                        <td className="px-6 py-4 text-center font-bold text-green-600">{rep.closed_deals}</td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-black text-2xl text-slate-900">{rep.total_score}</span>
                          <span className="text-xs text-slate-400 font-medium ml-1">pts</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══════════ TEAM ACCESS ═══════════ */}
        {tab === 'teamAccess' && (
          <div className="max-w-7xl mx-auto space-y-6 pb-20">
            <div className="bg-white rounded-[1.25rem] p-6 border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Team Access Management</h2>
                  <p className="text-sm text-slate-500">Dynamically assign categories, territories, and reset passwords.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MOCK_REPS.map(rep => (
                  <RepAccessCard
                    key={rep.id}
                    rep={rep}
                    allCategories={filtersMeta?.categories ?? []}
                    allAreas={filtersMeta?.areas ?? []}
                    allPincodes={filtersMeta?.pincodes ?? []}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ── Battlecards FAB ─────────────────────────────────────────────────── */}
      <button
        onClick={() => setBattleOpen(true)}
        className="absolute bottom-6 right-4 md:right-6 bg-slate-900 text-white rounded-full shadow-2xl p-4 flex flex-col md:flex-row items-center gap-2 z-40 border border-slate-700 hover:bg-slate-800 transition-all"
      >
        <span className="text-amber-400 text-xl">💡</span>
        <span className="text-sm font-bold hidden md:inline">Cheat Sheet</span>
      </button>
    </div>
  );
}

// ── Desktop CRM Row ────────────────────────────────────────────────────────────
function CrmRow({ item, onUpdateCrm, onLogContact, onSetReminder }: {
  item: SalesProvider;
  onUpdateCrm: (id: number, field: string, value: unknown) => void;
  onLogContact: () => void;
  onSetReminder: (days: number) => void;
}) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [noteText, setNoteText]   = useState(item.notes || '');
  const noteTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const catStr = item.searchCategory || '';

  useEffect(() => { setNoteText(item.notes || ''); }, [item.notes]);

  const handleNote = (val: string) => {
    setNoteText(val);
    clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => onUpdateCrm(item.id, 'notes', val), 800);
  };

  const statusOpts = STATUS_OPTIONS.map(s =>
    `<option value="${s}"${item.status === s ? ' selected' : ''}>${s}</option>`
  ).join('');

  return (
    <>
      <tr className="hover:bg-sky-50/40 transition-colors">
        {/* Whale */}
        <td className="px-4 py-3 text-center cursor-pointer" onClick={() => onUpdateCrm(item.id, 'isWhale', !item.isWhale)}>
          <span className={`text-lg ${item.isWhale ? 'text-amber-500' : 'text-slate-300 hover:text-amber-400'}`}>★</span>
        </td>

        {/* Provider details */}
        <td className="px-4 py-3">
          <h4 className="text-sm font-bold text-slate-900">{item.name}</h4>
          <p className="text-xs text-slate-500 truncate max-w-xs">{item.address}</p>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{catStr}</span>
        </td>

        {/* Status & scheduling */}
        <td className="px-4 py-3">
          <div className="flex gap-2 items-center">
            <div>
              <select
                value={item.status}
                onChange={e => onUpdateCrm(item.id, 'status', e.target.value)}
                className={`text-xs font-semibold rounded-md px-2 py-1.5 border-0 cursor-pointer outline-none mb-1 shadow-sm ${STATUS_COLORS[item.status]}`}
              >
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="text-[10px] text-slate-500">
                Contacted: <span className="font-semibold text-slate-700">{item.lastContacted || 'Never'}</span>
              </div>
            </div>
            <select
              onChange={e => { if (e.target.value) { onSetReminder(Number(e.target.value)); (e.target as HTMLSelectElement).value = ''; } }}
              className="text-[11px] font-medium border border-slate-200 rounded-md px-1 py-1.5 text-slate-600 outline-none w-20 shadow-sm bg-white cursor-pointer"
            >
              <option value="">⏰ Snooze</option>
              <option value="1">1 Day</option>
              <option value="7">1 Wk</option>
              <option value="14">2 Wks</option>
              <option value="30">1 Mo</option>
            </select>
          </div>
        </td>

        {/* Actions */}
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={() => sendWhatsApp(item.phoneNumber, item.name)}
              className="w-8 h-8 rounded-full bg-[#ecfdf5] text-[#059669] flex justify-center items-center shadow-sm hover:bg-green-100 transition-colors"
              title="WhatsApp"
            >💬</button>
            <button
              onClick={onLogContact}
              className="w-8 h-8 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center shadow-sm hover:bg-sky-100 transition-colors"
              title="Log Contact"
            >📞</button>
            <button
              onClick={() => setNotesOpen(v => !v)}
              className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm hover:bg-amber-100 transition-colors"
              title="Notes"
            >📝</button>
          </div>
        </td>
      </tr>

      {/* Notes expansion row */}
      {notesOpen && (
        <tr className="bg-slate-50 border-b border-slate-100">
          <td></td>
          <td colSpan={3} className="px-4 py-3">
            <textarea
              value={noteText}
              onChange={e => handleNote(e.target.value)}
              placeholder="Type sales notes..."
              rows={2}
              className="w-full text-sm p-2 border border-slate-300 rounded-lg outline-none shadow-inner resize-none focus:border-sky-400"
            />
          </td>
        </tr>
      )}
    </>
  );
}

// ── Mobile Card ────────────────────────────────────────────────────────────────
function MobileCard({ item, onUpdateCrm, onLogContact, onSetReminder }: {
  item: SalesProvider;
  onUpdateCrm: (id: number, field: string, value: unknown) => void;
  onLogContact: () => void;
  onSetReminder: (days: number) => void;
}) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [noteText, setNoteText]   = useState(item.notes || '');
  const noteTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const catStr = item.searchCategory || '';

  const handleNote = (val: string) => {
    setNoteText(val);
    clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => onUpdateCrm(item.id, 'notes', val), 800);
  };

  return (
    <div className="p-5 bg-white mb-3 rounded-[1.25rem] mx-2 mt-3 border border-slate-200 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase tracking-wider mb-2">{catStr}</span>
          <h4 className="text-base font-bold text-slate-900 leading-tight">{item.name}</h4>
        </div>
        <button onClick={() => onUpdateCrm(item.id, 'isWhale', !item.isWhale)}>
          <span className={`text-lg ${item.isWhale ? 'text-amber-500' : 'text-slate-300'}`}>★</span>
        </button>
      </div>
      <p className="text-xs text-slate-500 mb-3">📍 {item.address}</p>

      <div className="flex gap-2 mb-3">
        <select
          value={item.status}
          onChange={e => onUpdateCrm(item.id, 'status', e.target.value)}
          className={`flex-1 text-xs font-semibold rounded-lg px-2 py-2 border-0 text-center outline-none shadow-sm cursor-pointer ${STATUS_COLORS[item.status]}`}
        >
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          onChange={e => { if (e.target.value) { onSetReminder(Number(e.target.value)); (e.target as HTMLSelectElement).value = ''; } }}
          className="w-24 text-[11px] font-medium border border-slate-200 rounded-lg px-1 py-2 outline-none bg-white shadow-sm cursor-pointer"
        >
          <option value="">⏰ Snooze</option>
          <option value="1">1 Day</option>
          <option value="7">1 Wk</option>
        </select>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={onLogContact}
          className="flex-1 px-3 py-2 bg-sky-50 text-sky-700 rounded-xl text-xs font-semibold flex justify-center gap-1.5 hover:bg-sky-100"
        >📞 Call</button>
        <button
          onClick={() => sendWhatsApp(item.phoneNumber, item.name)}
          className="flex-1 px-3 py-2 bg-[#ecfdf5] text-[#059669] rounded-xl text-xs font-semibold flex justify-center gap-1.5 hover:bg-green-100"
        >💬 Pitch</button>
      </div>

      <div className="flex justify-between mt-3 pt-3 border-t border-slate-100">
        <span className="text-[10px] text-slate-500">
          Last: <span className="font-bold text-slate-700">{item.lastContacted || 'Never'}</span>
        </span>
        <button
          onClick={() => setNotesOpen(v => !v)}
          className="text-xs font-medium text-amber-600 px-3 py-1 bg-amber-50 rounded-lg hover:bg-amber-100"
        >Notes</button>
      </div>
      {notesOpen && (
        <div className="mt-3">
          <textarea
            value={noteText}
            onChange={e => handleNote(e.target.value)}
            placeholder="Add notes..."
            rows={2}
            className="w-full text-sm p-2 border border-slate-300 rounded-lg bg-slate-50 shadow-inner outline-none resize-none"
          />
        </div>
      )}
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  const accentClass = accent === 'purple'
    ? 'border border-purple-100'
    : accent === 'green'
    ? 'border border-green-100'
    : '';
  const valueClass = accent === 'purple'
    ? 'text-purple-700'
    : accent === 'green'
    ? 'text-green-700'
    : 'text-slate-900';
  const labelClass = accent === 'purple'
    ? 'text-purple-600 font-semibold'
    : accent === 'green'
    ? 'text-green-600 font-semibold'
    : 'text-slate-500';

  return (
    <div className={`bg-white rounded-[1.25rem] p-5 shadow-sm ${accentClass || 'border border-slate-100'}`}>
      <p className={`text-xs mb-1 font-medium ${labelClass}`}>{label}</p>
      <h3 className={`text-3xl font-bold ${valueClass}`}>{value}</h3>
    </div>
  );
}

// ── Rep Access Card ───────────────────────────────────────────────────────────
function RepAccessCard({ rep, allCategories, allAreas, allPincodes }: {
  rep: { id: number; username: string; categories: string[]; territories: string[] };
  allCategories: string[];
  allAreas: string[];
  allPincodes: string[];
}) {
  const [selCats, setSelCats]     = useState<string[]>(rep.categories);
  const [selTerrs, setSelTerrs]   = useState<string[]>(rep.territories);
  const [newPass, setNewPass]     = useState('');
  const [saved, setSaved]         = useState(false);
  const [passReset, setPassReset] = useState(false);

  const toggleCat = (c: string) =>
    setSelCats(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  const toggleTerr = (t: string) =>
    setSelTerrs(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleResetPass = () => {
    if (!newPass || newPass.length < 6) return alert('Password must be at least 6 characters.');
    setPassReset(true);
    setNewPass('');
    setTimeout(() => setPassReset(false), 2000);
  };

  // Use allPincodes if territories are pincodes, else use areas
  const territoryOptions = allPincodes.length > 0 ? allPincodes : allAreas;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <span className="text-sky-500 text-xl">👤</span>
          {rep.username.replace('Rep_', '')}
        </h3>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-4">
        {/* Categories */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Categories</p>
          <div className="h-32 overflow-y-auto border border-slate-100 rounded-lg p-1 space-y-0.5">
            {(allCategories.length > 0 ? allCategories : rep.categories).map(c => (
              <label key={c} className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={selCats.includes(c)}
                  onChange={() => toggleCat(c)}
                  className="w-3.5 h-3.5 text-sky-600 rounded border-slate-300"
                />
                <span className="text-xs font-medium text-slate-700">{c.replace(/_/g, ' ')}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Territories */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Territories</p>
          <div className="h-32 overflow-y-auto border border-slate-100 rounded-lg p-1 space-y-0.5">
            {(territoryOptions.length > 0 ? territoryOptions : rep.territories).map(t => (
              <label key={t} className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={selTerrs.includes(t)}
                  onChange={() => toggleTerr(t)}
                  className="w-3.5 h-3.5 text-sky-600 rounded border-slate-300"
                />
                <span className="text-xs font-medium text-slate-700">{t}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          className={`w-full py-2 rounded-lg text-sm font-bold transition-colors border ${
            saved
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200'
          }`}
        >
          {saved ? '✓ Saved!' : 'Save Assignments'}
        </button>
      </div>

      {/* Password reset */}
      <div className="p-4 bg-slate-50 border-t border-slate-100">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Security</p>
        <div className="flex gap-2">
          <input
            type="password"
            placeholder="New Password"
            value={newPass}
            onChange={e => setNewPass(e.target.value)}
            className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-amber-500"
          />
          <button
            onClick={handleResetPass}
            className={`font-bold px-3 py-1.5 rounded-lg text-xs transition-colors ${
              passReset ? 'bg-green-600 text-white' : 'bg-slate-800 hover:bg-slate-900 text-white'
            }`}
          >
            {passReset ? '✓' : 'Reset'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Task Card ─────────────────────────────────────────────────────────────────
function TaskCard({ task, urgent, onView }: { task: SalesTask; urgent: boolean; onView: () => void }) {
  return (
    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center shadow-sm">
      <div>
        <h4 className="font-bold text-sm text-slate-900">{task.providerName}</h4>
        <p className="text-xs text-slate-500 mt-1">Status: {task.status}</p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <span className={`text-xs font-semibold px-2 py-1 rounded border ${
          urgent ? 'text-red-600 border-red-200 bg-white' : 'text-sky-600 border-sky-200 bg-white'
        }`}>
          Due: {task.followUpDate}
        </span>
        <button
          onClick={onView}
          className="text-xs font-medium bg-sky-600 text-white px-3 py-1.5 rounded-lg shadow-sm hover:bg-sky-700 transition-colors"
        >
          View Clinic
        </button>
      </div>
    </div>
  );
}
