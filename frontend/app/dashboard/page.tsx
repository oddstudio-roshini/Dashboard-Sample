'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Stethoscope,
  Users,
  Building2,
  Dumbbell,
  ArrowRight,
  TrendingUp,
  Clock,
  Bell,
  Zap,
  Shield,
  BarChart2,
} from 'lucide-react';
import { getAdmin } from '@/lib/auth';

const quickLinks = [
  {
    href: '/dashboard/doctors',
    icon: Stethoscope,
    label: 'Doctors',
    description: 'Manage doctor accounts and access',
    color: 'purple',
    bg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    borderHover: 'hover:border-purple-300',
    badge: null,
  },
  {
    href: '/dashboard/patients',
    icon: Users,
    label: 'Patients',
    description: 'View and manage patient records',
    color: 'blue',
    bg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    borderHover: 'hover:border-blue-300',
    badge: null,
  },
  {
    href: '/dashboard/clinics',
    icon: Building2,
    label: 'Clinics',
    description: 'Manage clinic and hospital profiles',
    color: 'emerald',
    bg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    borderHover: 'hover:border-emerald-300',
    badge: null,
  },
  {
    href: '/dashboard/exercises',
    icon: Dumbbell,
    label: 'Exercise Library',
    description: 'Manage exercises and treatment plans',
    color: 'orange',
    bg: 'bg-orange-50',
    iconColor: 'text-orange-600',
    borderHover: 'hover:border-orange-300',
    badge: null,
  },
];

const features = [
  { icon: Zap, label: 'Real-time updates', desc: 'Live patient activity monitoring' },
  { icon: Shield, label: 'Secure access', desc: 'Role-based permissions enforced' },
  { icon: BarChart2, label: 'Analytics', desc: 'Track recovery progress trends' },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function DashboardPage() {
  const admin = getAdmin();
  const [date, setDate] = useState('');

  useEffect(() => {
    setDate(formatDate());
  }, []);

  return (
    <div className="min-h-full bg-gray-50">
      {/* Hero header */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">{date}</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {getGreeting()}, {admin?.name?.split(' ')[0] || 'Admin'} 👋
            </h1>
            <p className="text-gray-500 mt-1.5 text-sm">
              Here's an overview of the ARthoMove admin portal.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1.5 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              System Online
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Feature highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick links grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">Quick Access</h2>
            <span className="text-xs text-gray-400">{quickLinks.length} sections</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickLinks.map(({ href, icon: Icon, label, description, bg, iconColor, borderHover }) => (
              <Link key={href} href={href}>
                <div className={`group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md ${borderHover} transition-all duration-200 p-6 h-full flex flex-col cursor-pointer`}>
                  <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className={`w-6 h-6 ${iconColor}`} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{label}</h3>
                  <p className="text-sm text-gray-500 mb-4 flex-1">{description}</p>
                  <div className={`flex items-center gap-1 text-sm font-medium ${iconColor} group-hover:gap-2 transition-all duration-200`}>
                    Open <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>


      </div>
    </div>
  );
}
