'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Stethoscope,
  Users,
  Building2,
  Dumbbell,
  ShoppingCart,
  BarChart2,
  Bell,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { getAdmin, logout } from '@/lib/auth';

const sections = [
  {
    label: 'Main',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    ],
  },
  {
    label: 'Management',
    items: [
      { icon: Stethoscope, label: 'Doctors',         href: '/dashboard/doctors' },
      { icon: Users,        label: 'Patients',        href: '/dashboard/patients' },
      { icon: Building2,    label: 'Clinics',         href: '/dashboard/clinics' },
      { icon: Dumbbell,     label: 'Exercise Library', href: '/dashboard/exercises' },
      { icon: ShoppingCart, label: 'Sales',            href: '/dashboard/sales' },
    ],
  },
  {
    label: 'System',
    items: [
      { icon: BarChart2, label: 'Analytics',     href: '/dashboard/analytics' },
      { icon: Bell,      label: 'Notifications', href: '/dashboard/notifications' },
      { icon: Settings,  label: 'Settings',      href: '/dashboard/settings' },
    ],
  },
];

type Props = { isOpen: boolean; onClose: () => void };

export default function Sidebar({ isOpen, onClose }: Props) {
  const pathname = usePathname();
  const [admin, setAdmin] = useState<{ name: string; email: string; role: string } | null>(null);

  useEffect(() => { setAdmin(getAdmin()); }, []);
  useEffect(() => { onClose(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [pathname]);

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  const navContent = (
    <>
      {/* Logo */}
      <div className="flex-shrink-0 px-4 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-900/30">
            <span className="text-white font-bold text-[11px]">AR+</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">ARthoMove</p>
            <p className="text-gray-500 text-[10px]">Admin Portal</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-500 hover:text-gray-300"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-5">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="px-3 mb-1.5 text-[9px] font-bold uppercase tracking-widest text-gray-600">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map(({ icon: Icon, label, href }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all relative group ${
                      active
                        ? 'bg-purple-600/20 text-purple-300'
                        : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                    }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-purple-400 rounded-r-full" />
                    )}
                    <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-purple-400' : ''}`} />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Admin info + Logout */}
      <div className="flex-shrink-0 p-3 border-t border-white/5">
        <div className="flex items-center gap-2.5 mb-3 px-2 py-2 rounded-xl bg-white/5">
          <div className="relative flex-shrink-0">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {admin?.name?.charAt(0) || 'A'}
              </span>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 border-2 border-[#1a1d2e] rounded-full" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-xs font-semibold truncate">{admin?.name || 'Admin'}</p>
            <p className="text-gray-500 text-[10px] truncate">{admin?.email || ''}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log out</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Desktop */}
      <aside
        className="hidden lg:flex lg:flex-col lg:w-[184px] lg:flex-shrink-0 h-screen"
        style={{ background: '#1a1d2e' }}
      >
        {navContent}
      </aside>

      {/* Mobile slide-in */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 flex flex-col w-[220px] lg:hidden transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: '#1a1d2e' }}
      >
        {navContent}
      </aside>
    </>
  );
}
