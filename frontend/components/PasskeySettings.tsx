'use client';

/**
 * components/PasskeySettings.tsx
 * ───────────────────────────────
 * A small settings panel to add to the admin dashboard so the admin can
 * register a passkey (they must be logged in with a password first).
 *
 * Drop this anywhere in the dashboard layout, for example at the bottom
 * of app/dashboard/page.tsx:
 *
 *   import { PasskeySettings } from '@/components/PasskeySettings';
 *   ...
 *   <PasskeySettings />
 */

import toast from 'react-hot-toast';
import { Fingerprint, ShieldCheck } from 'lucide-react';
import { PasskeyRegisterButton } from '@/components/PasskeyButton';

export function PasskeySettings() {
  // Read the currently logged-in admin's email from localStorage
  const adminRaw = typeof window !== 'undefined' ? localStorage.getItem('medicare_admin') : null;
  const admin = adminRaw ? JSON.parse(adminRaw) : null;
  const email: string = admin?.adminEmail ?? '';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <Fingerprint className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Passkey Login</h3>
          <p className="text-xs text-gray-500">Sign in without a password using biometrics</p>
        </div>
      </div>

      <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl border border-green-100 mb-5">
        <ShieldCheck className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-green-700">
          Passkeys use your device's biometrics (Touch ID, Face ID, Windows Hello) to
          authenticate you — no password needed and phishing-resistant by design.
        </p>
      </div>

      <PasskeyRegisterButton
        email={email}
        onSuccess={() => toast.success('Passkey registered! You can now log in without a password.')}
        onError={(msg) => toast.error(msg)}
      />

      <p className="text-xs text-gray-400 mt-3">
        You can register multiple passkeys (e.g. laptop + phone). Each device you register can
        be used to log in independently.
      </p>
    </div>
  );
}
