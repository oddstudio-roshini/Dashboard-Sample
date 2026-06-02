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
import {
  Search, SlidersHorizontal, MapPin, Users, Globe, Calendar, Zap,
  MessageCircle, Phone, FileText, Star, BarChart2,
  LayoutGrid, Activity, X, Map, Trophy, Settings2, Bell, ChevronRight,
} from 'lucide-react';
import { salesApi } from '@/lib/salesApi';
import type { SalesProvider, SalesStats, SalesFilters, SalesTask, SalesStatus } from '@/types/sales';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const STATUS_OPTIONS: SalesStatus[] = ['Lead', 'Contacted', 'Demo Booked', 'Converted', 'Not Interested'];
const KANBAN_COLS: SalesStatus[]    = ['Lead', 'Contacted', 'Demo Booked', 'Converted'];

const STATUS_STYLES: Record<SalesStatus, { pill: string; dot: string }> = {
  'Lead':           { pill: 'bg-slate-100 text-slate-600 border-slate-200',      dot: 'bg-slate-400'  },
  'Contacted':      { pill: 'bg-sky-50 text-sky-700 border-sky-200',             dot: 'bg-sky-500'    },
  'Demo Booked':    { pill: 'bg-violet-50 text-violet-700 border-violet-200',     dot: 'bg-violet-500' },
  'Converted':      { pill: 'bg-emerald-50 text-emerald-700 border-emerald-200',  dot: 'bg-emerald-500'},
  'Not Interested': { pill: 'bg-red-50 text-red-600 border-red-200',             dot: 'bg-red-400'    },
};

const DOUGHNUT_COLORS = ['#6366f1','#10b981','#f59e0b','#3b82f6','#ef4444','#06b6d4','#84cc16','#ec4899'];
const ROWS_PER_PAGE = 15;
type Tab = 'dashboard' | 'database' | 'pipeline' | 'tasks' | 'map' | 'leaderboard' | 'teamAccess';

const MOCK_LEADERBOARD = [
  { username: 'Rep_Rahul', closed_deals: 4, demos: 12, total_score: 320 },
  { username: 'Rep_Arjun', closed_deals: 1, demos: 5,  total_score: 100 },
];

const MOCK_REPS = [
  { id: 2, username: 'Rep_Arjun', categories: ['Orthopedics_Hospital', 'Physiotherapy'], territories: ['500072', '500018'] },
  { id: 3, username: 'Rep_Priya', categories: ['Orthopedic_Clinic'],                    territories: ['500034'] },
];

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

  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('All');
  const [area, setArea]         = useState('All');
  const [pincode, setPincode]   = useState('');
  const [whaleOnly, setWhaleOnly] = useState(false);
  const [page, setPage]         = useState(1);
  const [battleOpen, setBattleOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    setApiError(null);
    salesApi.getProviders()
      .then(prov => { setAll(prov); setFiltered(prov); setLoading(false); })
      .catch(err => {
        console.error('Sales providers fetch failed:', err);
        setApiError('Could not connect to backend.');
        setLoading(false);
      });
    salesApi.getStats().then(setStats).catch(() => {});
    salesApi.getFilters().then(setFiltersMeta).catch(() => {});
    salesApi.getTasks().then(setTasks).catch(() => {});
  }, []);

  useEffect(() => {
    let data = [...allProviders];
    const q = search.trim().toLowerCase();
    if (q)                  data = data.filter(p => p.name.toLowerCase().includes(q) || (p.address || '').toLowerCase().includes(q));
    if (category !== 'All') data = data.filter(p => p.sheetCategory === category);
    if (area !== 'All')     data = data.filter(p => p.searchArea === area);
    if (pincode.trim())     data = data.filter(p => p.pincode === pincode.trim());
    if (whaleOnly)          data = data.filter(p => p.isWhale);
    setFiltered(data);
    setPage(1);
  }, [search, category, area, pincode, whaleOnly, allProviders]);

  const updateCrm = useCallback(async (id: number, field: string, value: unknown) => {
    const patch = (list: SalesProvider[]) => list.map(p => p.id === id ? { ...p, [field]: value } : p);
    setAll(prev => patch(prev));
    setFiltered(prev => patch(prev));
    try {
      const updated = await salesApi.updateCrm(id, { [field]: value });
      setAll(prev => prev.map(p => p.id === id ? updated : p));
      setFiltered(prev => prev.map(p => p.id === id ? updated : p));
      salesApi.getStats().then(setStats).catch(() => {});
      salesApi.getTasks().then(setTasks).catch(() => {});
    } catch {}
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

  const findNearMe = () => {
    if (nearMePin) { setNearMePin(null); setPincode(''); return; }
    if (!navigator.geolocation) { alert('Geolocation not supported.'); return; }
    setNearMeLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const postcode = data.address?.postcode;
          if (postcode) { const c = postcode.trim(); setNearMePin(c); setArea('All'); setPincode(c); }
          else alert('Could not determine pincode.');
        } catch { alert('Error fetching location.'); }
        finally { setNearMeLoading(false); }
      },
      (err) => {
        setNearMeLoading(false);
        alert(err.code === err.PERMISSION_DENIED ? 'Location access denied.' : 'Unable to get location.');
      },
      { timeout: 10000, maximumAge: 0, enableHighAccuracy: false }
    );
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId as SalesStatus;
    const id = Number(result.draggableId);
    if (allProviders.find(p => p.id === id)?.status !== newStatus) updateCrm(id, 'status', newStatus);
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const pageData   = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  const today       = new Date().toISOString().split('T')[0];
  const urgentTasks = tasks.filter(t => t.followUpDate <= today);
  const futTasks    = tasks.filter(t => t.followUpDate > today);

  const demosBooked = filtered.filter(p => p.status === 'Demo Booked').length;
  const converted   = filtered.filter(p => p.status === 'Converted').length;

  const catCounts: Record<string, number> = {};
  filtered.forEach(p => { const c = p.sheetCategory || p.searchCategory || 'Other'; catCounts[c] = (catCounts[c] || 0) + 1; });

  const areaCounts: Record<string, number> = {};
  filtered.forEach(p => { const a = p.searchArea || 'Other'; areaCounts[a] = (areaCounts[a] || 0) + 1; });
  const topAreas = Object.entries(areaCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

  const totalCat = Object.values(catCounts).reduce((s, v) => s + v, 0);

  const doughnutData = {
    labels: Object.keys(catCounts),
    datasets: [{
      data: Object.values(catCounts),
      backgroundColor: DOUGHNUT_COLORS,
      borderWidth: 0,
      hoverOffset: 6,
    }],
  };

  const barData = {
    labels: topAreas.map(i => i[0].length > 12 ? i[0].slice(0, 12) + '…' : i[0]),
    datasets: [{
      label: 'Providers',
      data: topAreas.map(i => i[1]),
      backgroundColor: '#818cf8',
      hoverBackgroundColor: '#6366f1',
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  const mapQuery = area !== 'All'
    ? `${category !== 'All' ? category : 'Hospitals'} in ${area}, Hyderabad`
    : 'Hyderabad Telangana';

  const TABS: { id: Tab; label: string; icon: React.ReactNode; admin?: boolean }[] = [
    { id: 'dashboard',   label: 'Dashboard',   icon: <LayoutGrid className="w-3.5 h-3.5" /> },
    { id: 'database',    label: 'Sales CRM',   icon: <BarChart2  className="w-3.5 h-3.5" /> },
    { id: 'pipeline',    label: 'Pipeline',    icon: <Zap        className="w-3.5 h-3.5" /> },
    { id: 'tasks',       label: 'Tasks',       icon: <Calendar   className="w-3.5 h-3.5" /> },
    { id: 'map',         label: 'Live Map',    icon: <Map        className="w-3.5 h-3.5" /> },
    { id: 'leaderboard', label: 'Leaderboard', icon: <Trophy     className="w-3.5 h-3.5" />, admin: true },
    { id: 'teamAccess',  label: 'Team Access', icon: <Settings2  className="w-3.5 h-3.5" />, admin: true },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#f5f6fa] text-gray-800">

      {/* ── Battlecards Modal ──────────────────────────────────────────────── */}
      {battleOpen && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
            <div className="bg-gray-900 p-4 flex justify-between items-center">
              <h3 className="font-bold text-base text-white">Sales Battlecards</h3>
              <button onClick={() => setBattleOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 overflow-y-auto space-y-3 bg-gray-50">
              {[
                { q: '"It\'s too expensive / We use WhatsApp."', a: 'WhatsApp doesn\'t calculate measurable flexion angles. Clinics using our automated motion tracking increase patient retention by 30% because patients can see real-time progress.' },
                { q: '"My patients won\'t understand an app."',  a: 'The UI is designed specifically for clinical ease. They don\'t need to learn complex tech; they just open it, and pose estimation does the heavy lifting.' },
                { q: '"We already have a system."',              a: 'Most existing systems track appointments, not recovery. ARthoMove tracks ROM improvement over time — your patients see their progress and stay engaged.' },
              ].map((bc, i) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <h4 className="font-semibold text-red-600 text-sm mb-2">{bc.q}</h4>
                  <p className="text-sm text-gray-600 border-l-2 border-indigo-400 pl-3 leading-relaxed">{bc.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Top header ─────────────────────────────────────────────────────── */}
      <header className="flex-none bg-white border-b border-gray-100 px-5 py-3 flex items-center gap-4 shadow-sm z-30">
        <h1 className="text-lg font-bold text-gray-900 flex-shrink-0">Sales</h1>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search provider or address..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition-all"
          />
        </div>

        <div className="flex-1" />

        <div className="relative flex-shrink-0">
          <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="appearance-none pl-9 pr-7 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:ring-2 focus:ring-indigo-300 outline-none cursor-pointer"
          >
            <option value="All">All Categories</option>
            {filtersMeta?.categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="relative flex-shrink-0">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <select
            value={area}
            onChange={e => setArea(e.target.value)}
            className="appearance-none pl-9 pr-7 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:ring-2 focus:ring-indigo-300 outline-none cursor-pointer"
          >
            <option value="All">All Territories</option>
            {filtersMeta?.areas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <button
          onClick={() => setWhaleOnly(v => !v)}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium border transition-all flex-shrink-0 ${
            whaleOnly
              ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
              : 'bg-white border-gray-200 text-gray-600 hover:border-amber-300 hover:text-amber-600'
          }`}
        >
          <Star className="w-3.5 h-3.5" /> Whale
        </button>

        <button
          onClick={findNearMe}
          disabled={nearMeLoading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium border bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 shadow-sm transition-all flex-shrink-0 disabled:opacity-60"
        >
          {nearMeLoading
            ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <MapPin className="w-3.5 h-3.5" />}
          {nearMeLoading ? 'Locating…' : nearMePin ? `Near ${nearMePin}` : 'Near Me'}
          {nearMePin && <X className="w-3 h-3 ml-0.5 opacity-80" />}
        </button>
      </header>

      {/* ── Tab navigation ──────────────────────────────────────────────────── */}
      <div className="flex-none bg-white border-b border-gray-100 px-5 flex items-center gap-0.5 overflow-x-auto">
        {TABS.map(({ id, label, icon, admin }, idx) => (
          <div key={id} className="flex items-center">
            {admin && idx > 0 && TABS[idx - 1] && !TABS[idx - 1].admin && (
              <div className="w-px h-5 bg-gray-200 mx-2 flex-shrink-0" />
            )}
            <button
              onClick={() => setTab(id)}
              className={`relative flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all ${
                tab === id
                  ? 'text-indigo-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {icon}
              {label}
              {id === 'tasks' && tasks.length > 0 && (
                <span className="ml-0.5 bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {tasks.length}
                </span>
              )}
              {admin && (
                <span className="ml-1 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Admin</span>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* ── Error banner ────────────────────────────────────────────────────── */}
      {apiError && (
        <div className="flex-none bg-red-50 border-b border-red-200 px-5 py-2.5 flex items-center justify-between">
          <p className="text-sm text-red-700"><span className="font-semibold">Backend unreachable:</span> {apiError}</p>
          <button
            onClick={() => {
              setApiError(null); setLoading(true);
              salesApi.getProviders().then(prov => { setAll(prov); setFiltered(prov); setLoading(false); }).catch(() => setLoading(false));
              salesApi.getStats().then(setStats).catch(() => {});
              salesApi.getFilters().then(setFiltersMeta).catch(() => {});
              salesApi.getTasks().then(setTasks).catch(() => {});
            }}
            className="text-xs font-semibold bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors"
          >Retry</button>
        </div>
      )}

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <main className="flex-1 min-h-0 overflow-hidden bg-[#f5f6fa]">

        {/* ══════════════ DASHBOARD ══════════════ */}
        {tab === 'dashboard' && (
          <div className="h-full overflow-y-auto">
            <div className="max-w-[1400px] mx-auto p-5 flex flex-col gap-5">

              {loading && (
                <div className="flex items-center justify-center py-6 text-gray-400 text-sm gap-2">
                  <span className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  Loading providers…
                </div>
              )}

              {/* KPI Cards — compact horizontal strip */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard label="My Providers"  value={loading ? '…' : filtered.length.toLocaleString()} icon={<Users    className="w-5 h-5 text-indigo-500" />} iconBg="bg-indigo-50"  accent="border-l-indigo-500" />
                <KpiCard label="Territories"   value={loading ? '…' : new Set(filtered.map(p => p.searchArea)).size} icon={<Globe    className="w-5 h-5 text-teal-500"   />} iconBg="bg-teal-50"    accent="border-l-teal-500"   />
                <KpiCard label="Demos Booked"  value={loading ? '…' : demosBooked}  icon={<Calendar  className="w-5 h-5 text-amber-500"  />} iconBg="bg-amber-50"   accent="border-l-amber-500"  />
                <KpiCard label="Converted"     value={loading ? '…' : converted}    icon={<Zap       className="w-5 h-5 text-violet-500" />} iconBg="bg-violet-50"  accent="border-l-violet-500" />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* Clinic Distribution */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="mb-5">
                    <h2 className="text-sm font-bold text-gray-900">Clinic Distribution</h2>
                    <p className="text-xs text-gray-400 mt-0.5">By provider type</p>
                  </div>
                  {filtered.length > 0 ? (
                    <div className="flex items-center gap-8">
                      {/* Fixed-size donut — never distorts */}
                      <div className="flex-shrink-0" style={{ width: 180, height: 180 }}>
                        <Doughnut
                          data={doughnutData}
                          options={{
                            responsive: true, maintainAspectRatio: false,
                            plugins: { legend: { display: false }, tooltip: { callbacks: {
                              label: (ctx) => ` ${ctx.label}: ${ctx.parsed} (${totalCat > 0 ? Math.round(ctx.parsed / totalCat * 100) : 0}%)`
                            }}},
                            cutout: '70%',
                          }}
                        />
                      </div>
                      {/* Legend */}
                      <div className="flex-1 min-w-0 space-y-2.5">
                        {Object.entries(catCounts).map(([label, count], i) => (
                          <div key={label} className="flex items-center gap-2.5">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: DOUGHNUT_COLORS[i % DOUGHNUT_COLORS.length] }} />
                            <span className="text-xs text-gray-600 flex-1 truncate">{label.replace(/_/g, ' ')}</span>
                            <span className="text-xs font-bold text-gray-800 tabular-nums flex-shrink-0">
                              {totalCat > 0 ? Math.round(count / totalCat * 100) : 0}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-[180px] flex items-center justify-center text-gray-300 text-sm">No data yet</div>
                  )}
                </div>

                {/* Providers by Area */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="mb-5">
                    <h2 className="text-sm font-bold text-gray-900">Providers by Area</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Top territories by provider count</p>
                  </div>
                  {topAreas.length > 0 ? (
                    <div style={{ height: 210 }}>
                      <Bar
                        data={barData}
                        options={{
                          responsive: true, maintainAspectRatio: false,
                          plugins: { legend: { display: false }, tooltip: { callbacks: { title: (i) => i[0].label } } },
                          scales: {
                            x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#9ca3af', maxRotation: 40, minRotation: 40 }, border: { display: false } },
                            y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 }, color: '#9ca3af' }, border: { display: false } },
                          },
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-[210px] flex items-center justify-center text-gray-300 text-sm">No data yet</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ SALES CRM ══════════════ */}
        {tab === 'database' && (
          <div className="h-full flex flex-col p-5">
          <div className="flex-1 min-h-0 flex flex-col max-w-[1400px] w-full mx-auto">
            <div className="flex-1 min-h-0 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-20 text-gray-400 text-sm gap-2">
                  <span className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  Loading…
                </div>
              ) : (
                <>
                  <div className="flex-1 min-h-0 hidden md:block overflow-auto">
                    <table className="w-full text-left">
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-xs font-semibold uppercase tracking-wide">
                          <th className="px-4 py-3.5 w-10 text-center">★</th>
                          <th className="px-4 py-3.5">Provider Details</th>
                          <th className="px-4 py-3.5">Status &amp; Scheduling</th>
                          <th className="px-4 py-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {pageData.length === 0 ? (
                          <tr><td colSpan={4} className="p-10 text-center text-gray-400 text-sm">No results found.</td></tr>
                        ) : pageData.map(item => (
                          <CrmRow key={item.id} item={item} onUpdateCrm={updateCrm} onLogContact={() => logContact(item)} onSetReminder={(d) => setReminder(item.id, d)} />
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex-1 min-h-0 md:hidden overflow-auto">
                    {pageData.length === 0
                      ? <div className="p-8 text-center text-gray-400">No results found.</div>
                      : pageData.map(item => (
                        <MobileCard key={item.id} item={item} onUpdateCrm={updateCrm} onLogContact={() => logContact(item)} onSetReminder={(d) => setReminder(item.id, d)} />
                      ))
                    }
                  </div>

                  <div className="flex-none px-5 py-3 border-t border-gray-100 bg-white flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Showing <span className="font-semibold text-gray-700">{Math.min((page - 1) * ROWS_PER_PAGE + 1, filtered.length)}–{Math.min(page * ROWS_PER_PAGE, filtered.length)}</span> of <span className="font-semibold text-gray-700">{filtered.length}</span> providers
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors">
                        Prev
                      </button>
                      <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || filtered.length === 0}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors">
                        Next
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          </div>
        )}

        {/* ══════════════ PIPELINE ══════════════ */}
        {tab === 'pipeline' && (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex flex-nowrap overflow-x-auto h-full gap-4 p-5 pb-4 items-start">
              {KANBAN_COLS.map(status => {
                const cards = filtered.filter(p => p.status === status);
                const style = STATUS_STYLES[status];
                return (
                  <Droppable droppableId={status} key={status}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="min-w-[290px] max-w-[320px] bg-gray-50 rounded-2xl border border-gray-200 p-3 flex flex-col flex-shrink-0"
                        style={{ minHeight: 300 }}
                      >
                        <div className="flex justify-between items-center mb-3 px-1">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                            <h3 className="font-semibold text-sm text-gray-800">{status}</h3>
                          </div>
                          <span className="bg-white border border-gray-200 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">{cards.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2.5 pb-2" style={{ maxHeight: 'calc(100vh - 270px)' }}>
                          {cards.slice(0, 100).map((item, index) => (
                            <Draggable key={item.id} draggableId={String(item.id)} index={index}>
                              {(prov, snapshot) => (
                                <div
                                  ref={prov.innerRef}
                                  {...prov.draggableProps}
                                  {...prov.dragHandleProps}
                                  className={`bg-white p-3.5 rounded-xl border border-gray-100 cursor-grab transition-shadow ${snapshot.isDragging ? 'shadow-xl opacity-90' : 'shadow-sm hover:shadow-md'}`}
                                >
                                  <div className="flex justify-between items-start mb-1.5">
                                    <h4 className="font-semibold text-xs text-gray-900 leading-snug flex-1 pr-2">{item.name}</h4>
                                    {item.isWhale && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />}
                                  </div>
                                  <p className="text-[10px] text-gray-400 truncate">{item.address}</p>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          {cards.length === 0 && (
                            <p className="text-xs text-gray-400 text-center py-8 italic">No providers</p>
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

        {/* ══════════════ TASKS ══════════════ */}
        {tab === 'tasks' && (
          <div className="h-full overflow-y-auto p-5">
          <div className="max-w-3xl mx-auto space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <h2 className="text-sm font-bold text-gray-900">Due Today</h2>
                <span className="bg-red-50 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full border border-red-100">{urgentTasks.length}</span>
              </div>
              <div className="divide-y divide-gray-50">
                {urgentTasks.length === 0
                  ? <p className="text-sm text-gray-400 text-center py-8">No urgent tasks today!</p>
                  : urgentTasks.map(t => (
                    <TaskCard key={t.providerId} task={t} urgent
                      onView={() => { setSearch(t.providerName); setTab('database'); }} />
                  ))
                }
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <h2 className="text-sm font-bold text-gray-900">Upcoming Reminders</h2>
                <span className="bg-sky-50 text-sky-600 text-xs font-bold px-2.5 py-1 rounded-full border border-sky-100">{futTasks.length}</span>
              </div>
              <div className="divide-y divide-gray-50">
                {futTasks.length === 0
                  ? <p className="text-sm text-gray-400 text-center py-8">No upcoming reminders.</p>
                  : futTasks.map(t => (
                    <TaskCard key={t.providerId} task={t} urgent={false}
                      onView={() => { setSearch(t.providerName); setTab('database'); }} />
                  ))
                }
              </div>
            </div>
          </div>
          </div>
        )}

        {/* ══════════════ LIVE MAP ══════════════ */}
        {tab === 'map' && (
          <div className="h-full p-5">
            <div className="h-full bg-gray-200 rounded-2xl overflow-hidden relative">
              <iframe
                className="w-full h-full border-0 absolute inset-0"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
                allowFullScreen loading="lazy"
              />
            </div>
          </div>
        )}

        {/* ══════════════ LEADERBOARD ══════════════ */}
        {tab === 'leaderboard' && (
          <div className="h-full overflow-y-auto p-5">
            <div className="max-w-3xl mx-auto space-y-5">
              <div className="bg-gradient-to-r from-amber-500 to-orange-400 rounded-2xl p-6 text-white shadow-lg flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Sales Leaderboard</h2>
                  <p className="text-sm opacity-90 mt-0.5">Real-time team performance</p>
                </div>
                <Trophy className="w-12 h-12 opacity-80" />
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wide">
                      <th className="px-5 py-4">Rank &amp; Rep</th>
                      <th className="px-5 py-4 text-center">Demos</th>
                      <th className="px-5 py-4 text-center">Deals Won</th>
                      <th className="px-5 py-4 text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {MOCK_LEADERBOARD.map((rep, idx) => {
                      const medals = ['🥇', '🥈', '🥉'];
                      return (
                        <tr key={rep.username} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{medals[idx] || `#${idx + 1}`}</span>
                              <span className="font-bold text-gray-900">{rep.username.replace('Rep_', '')}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-center font-bold text-violet-600">{rep.demos}</td>
                          <td className="px-5 py-4 text-center font-bold text-emerald-600">{rep.closed_deals}</td>
                          <td className="px-5 py-4 text-right">
                            <span className="text-2xl font-black text-gray-900">{rep.total_score}</span>
                            <span className="text-xs text-gray-400 ml-1">pts</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ TEAM ACCESS ══════════════ */}
        {tab === 'teamAccess' && (
          <div className="h-full overflow-y-auto p-5">
            <div className="max-w-[1400px] mx-auto">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="mb-5 pb-4 border-b border-gray-100">
                  <h2 className="text-base font-bold text-gray-900">Team Access Management</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Assign categories, territories, and manage credentials.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
          </div>
        )}

      </main>

      {/* ── Cheat Sheet FAB ─────────────────────────────────────────────────── */}
      <button
        onClick={() => setBattleOpen(true)}
        className="fixed bottom-6 right-6 bg-gray-900 text-white rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-2 z-40 hover:bg-gray-800 transition-all"
      >
        <Bell className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-semibold hidden sm:inline">Cheat Sheet</span>
      </button>
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, icon, iconBg, accent }: {
  label: string; value: string | number;
  icon: React.ReactNode; iconBg: string; accent: string;
}) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 border-l-4 ${accent} shadow-sm p-5 flex items-center gap-4`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-xs text-gray-500 mt-1.5 font-medium">{label}</p>
      </div>
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

  useEffect(() => { setNoteText(item.notes || ''); }, [item.notes]);

  const handleNote = (val: string) => {
    setNoteText(val);
    clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => onUpdateCrm(item.id, 'notes', val), 800);
  };

  const style = STATUS_STYLES[item.status] ?? STATUS_STYLES['Lead'];

  return (
    <>
      <tr className="hover:bg-indigo-50/30 transition-colors">
        <td className="px-4 py-3.5 text-center cursor-pointer" onClick={() => onUpdateCrm(item.id, 'isWhale', !item.isWhale)}>
          <Star className={`w-4 h-4 mx-auto ${item.isWhale ? 'text-amber-400 fill-amber-400' : 'text-gray-200 hover:text-amber-300'}`} />
        </td>
        <td className="px-4 py-3.5">
          <p className="text-sm font-semibold text-gray-900">{item.name}</p>
          <p className="text-xs text-gray-400 truncate max-w-xs mt-0.5">{item.address}</p>
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{item.searchCategory}</span>
        </td>
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={item.status}
              onChange={e => onUpdateCrm(item.id, 'status', e.target.value)}
              className={`text-xs font-semibold rounded-lg px-2.5 py-1.5 border cursor-pointer outline-none ${style.pill}`}
            >
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div className="text-[10px] text-gray-400">
              Last: <span className="font-semibold text-gray-600">{item.lastContacted || 'Never'}</span>
            </div>
            <select
              onChange={e => { if (e.target.value) { onSetReminder(Number(e.target.value)); (e.target as HTMLSelectElement).value = ''; } }}
              className="text-[11px] font-medium border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 outline-none bg-white cursor-pointer"
            >
              <option value="">Snooze</option>
              <option value="1">1 Day</option>
              <option value="7">1 Week</option>
              <option value="14">2 Weeks</option>
              <option value="30">1 Month</option>
            </select>
          </div>
        </td>
        <td className="px-4 py-3.5">
          <div className="flex items-center justify-end gap-1.5">
            <button onClick={() => { window.open(`https://wa.me/${item.phoneNumber?.replace(/[^0-9]/g, '')}`, '_blank'); }}
              className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors" title="WhatsApp">
              <MessageCircle className="w-4 h-4" />
            </button>
            <button onClick={onLogContact}
              className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center hover:bg-sky-100 transition-colors" title="Log Contact">
              <Phone className="w-4 h-4" />
            </button>
            <button onClick={() => setNotesOpen(v => !v)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${notesOpen ? 'bg-amber-100 text-amber-700' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`} title="Notes">
              <FileText className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
      {notesOpen && (
        <tr className="bg-gray-50 border-b border-gray-100">
          <td />
          <td colSpan={3} className="px-4 py-3">
            <textarea
              value={noteText}
              onChange={e => handleNote(e.target.value)}
              placeholder="Type sales notes…"
              rows={2}
              className="w-full text-sm p-2.5 border border-gray-200 rounded-xl outline-none resize-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 bg-white"
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
  const style = STATUS_STYLES[item.status] ?? STATUS_STYLES['Lead'];

  const handleNote = (val: string) => {
    setNoteText(val);
    clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => onUpdateCrm(item.id, 'notes', val), 800);
  };

  return (
    <div className="p-4 bg-white border-b border-gray-50">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 pr-2">
          <p className="text-sm font-bold text-gray-900">{item.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{item.address}</p>
        </div>
        <button onClick={() => onUpdateCrm(item.id, 'isWhale', !item.isWhale)}>
          <Star className={`w-4 h-4 ${item.isWhale ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
        </button>
      </div>
      <div className="flex gap-2 mb-3">
        <select
          value={item.status}
          onChange={e => onUpdateCrm(item.id, 'status', e.target.value)}
          className={`flex-1 text-xs font-semibold rounded-lg px-2 py-2 border outline-none cursor-pointer ${style.pill}`}
        >
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          onChange={e => { if (e.target.value) { onSetReminder(Number(e.target.value)); (e.target as HTMLSelectElement).value = ''; } }}
          className="w-24 text-xs border border-gray-200 rounded-lg px-2 py-2 outline-none bg-white"
        >
          <option value="">Snooze</option>
          <option value="1">1 Day</option>
          <option value="7">1 Wk</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button onClick={onLogContact} className="flex-1 py-2 bg-sky-50 text-sky-700 rounded-xl text-xs font-semibold flex justify-center items-center gap-1.5">
          <Phone className="w-3.5 h-3.5" /> Call
        </button>
        <button onClick={() => { window.open(`https://wa.me/${item.phoneNumber?.replace(/[^0-9]/g, '')}`, '_blank'); }} className="flex-1 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold flex justify-center items-center gap-1.5">
          <MessageCircle className="w-3.5 h-3.5" /> Pitch
        </button>
        <button onClick={() => setNotesOpen(v => !v)} className="flex-1 py-2 bg-amber-50 text-amber-700 rounded-xl text-xs font-semibold flex justify-center items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" /> Notes
        </button>
      </div>
      {notesOpen && (
        <textarea
          value={noteText}
          onChange={e => handleNote(e.target.value)}
          placeholder="Add notes…"
          rows={2}
          className="mt-3 w-full text-sm p-2.5 border border-gray-200 rounded-xl outline-none resize-none bg-gray-50"
        />
      )}
    </div>
  );
}

// ── Task Card ─────────────────────────────────────────────────────────────────
function TaskCard({ task, urgent, onView }: { task: SalesTask; urgent: boolean; onView: () => void }) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div>
        <p className="text-sm font-semibold text-gray-900">{task.providerName}</p>
        <p className="text-xs text-gray-400 mt-0.5">Status: {task.status}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
          urgent ? 'bg-red-50 text-red-600 border-red-200' : 'bg-sky-50 text-sky-600 border-sky-200'
        }`}>
          Due {task.followUpDate}
        </span>
        <button
          onClick={onView}
          className="flex items-center gap-1 text-xs font-semibold bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          View
        </button>
      </div>
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

  const toggleCat  = (c: string) => setSelCats(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  const toggleTerr = (t: string) => setSelTerrs(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const handleResetPass = () => {
    if (!newPass || newPass.length < 6) return alert('Password must be at least 6 characters.');
    setPassReset(true); setNewPass('');
    setTimeout(() => setPassReset(false), 2000);
  };

  const territoryOptions = allPincodes.length > 0 ? allPincodes : allAreas;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      <div className="px-4 py-3.5 border-b border-gray-50 flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Users className="w-4 h-4 text-indigo-600" />
        </div>
        <p className="font-bold text-gray-900 text-sm">{rep.username.replace('Rep_', '')}</p>
      </div>
      <div className="p-4 flex-1 flex flex-col gap-4">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Categories</p>
          <div className="h-32 overflow-y-auto border border-gray-100 rounded-xl p-1.5 space-y-0.5">
            {(allCategories.length > 0 ? allCategories : rep.categories).map(c => (
              <label key={c} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                <input type="checkbox" checked={selCats.includes(c)} onChange={() => toggleCat(c)}
                  className="w-3.5 h-3.5 text-indigo-600 rounded border-gray-300" />
                <span className="text-xs text-gray-700">{c.replace(/_/g, ' ')}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Territories</p>
          <div className="h-32 overflow-y-auto border border-gray-100 rounded-xl p-1.5 space-y-0.5">
            {(territoryOptions.length > 0 ? territoryOptions : rep.territories).map(t => (
              <label key={t} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                <input type="checkbox" checked={selTerrs.includes(t)} onChange={() => toggleTerr(t)}
                  className="w-3.5 h-3.5 text-indigo-600 rounded border-gray-300" />
                <span className="text-xs text-gray-700">{t}</span>
              </label>
            ))}
          </div>
        </div>
        <button onClick={handleSave}
          className={`w-full py-2 rounded-xl text-sm font-semibold transition-colors ${
            saved ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}>
          {saved ? '✓ Saved!' : 'Save Assignments'}
        </button>
      </div>
      <div className="p-4 bg-gray-50 border-t border-gray-100">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Security</p>
        <div className="flex gap-2">
          <input type="password" placeholder="New password" value={newPass} onChange={e => setNewPass(e.target.value)}
            className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-200 bg-white" />
          <button onClick={handleResetPass}
            className={`font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors ${
              passReset ? 'bg-emerald-600 text-white' : 'bg-gray-900 hover:bg-gray-800 text-white'
            }`}>
            {passReset ? '✓' : 'Reset'}
          </button>
        </div>
      </div>
    </div>
  );
}
