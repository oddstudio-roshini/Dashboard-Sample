'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Eye, EyeOff, CheckCircle, AlertCircle, Stethoscope, Lock } from 'lucide-react';
import { doctorSetupAPI } from '@/lib/api';

function SetupPasswordContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const token        = searchParams.get('token') || '';

  type State = 'validating' | 'ready' | 'success' | 'error';
  const [state, setState]       = useState<State>('validating');
  const [doctorInfo, setInfo]   = useState<{ fullName: string; username: string; clinicalId: string } | null>(null);
  const [tokenError, setTokenError] = useState('');

  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [submitting, setSubmit] = useState(false);
  const [formError, setFormError] = useState('');

  // Validate token on load
  useEffect(() => {
    if (!token) { setTokenError('No setup token found in the link.'); setState('error'); return; }
    doctorSetupAPI.validateToken(token)
      .then(res => {
        if (res.success) { setInfo(res.data); setState('ready'); }
        else { setTokenError(res.message || 'Invalid link.'); setState('error'); }
      })
      .catch(err => {
        setTokenError(err?.response?.data?.message || 'This link is invalid or has expired.');
        setState('error');
      });
  }, [token]);

  const strength = () => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  };

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColor = ['', 'bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-500'];

  const handleSubmit = async () => {
    setFormError('');
    if (password.length < 8)  { setFormError('Password must be at least 8 characters.'); return; }
    if (password !== confirm)  { setFormError('Passwords do not match.'); return; }
    if (strength() < 2)       { setFormError('Please choose a stronger password.'); return; }

    setSubmit(true);
    try {
      const res = await doctorSetupAPI.completeSetup(token, password);
      if (res.success) setState('success');
      else setFormError(res.message || 'Failed to set password.');
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setSubmit(false);
    }
  };

  // ── Validating ───────────────────────────────────────────────────────────
  if (state === 'validating') {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Validating your setup link…</p>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (state === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 max-w-sm mx-auto text-center">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Link Unavailable</h2>
        <p className="text-sm text-gray-500">{tokenError}</p>
        <p className="text-xs text-gray-400 mt-2">Contact your admin to get a new setup link.</p>
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────
  if (state === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 max-w-sm mx-auto text-center">
        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Password Set!</h2>
        <p className="text-sm text-gray-500">
          Your account is ready. Log in with your username{' '}
          <span className="font-mono font-bold text-gray-800">{doctorInfo?.username}</span>.
        </p>
        <button
          onClick={() => router.push('/doctor-login')}
          className="mt-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          Go to Login
        </button>
      </div>
    );
  }

  // ── Ready — show form ────────────────────────────────────────────────────
  const s = strength();

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Welcome */}
      <div className="mb-8 text-center">
        <p className="text-sm text-gray-500">Welcome,</p>
        <h2 className="text-2xl font-bold text-gray-900">Dr. {doctorInfo?.fullName}</h2>
        <p className="text-xs text-gray-400 mt-1">Username: <span className="font-mono font-semibold text-gray-700">{doctorInfo?.username}</span></p>
      </div>

      {formError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{formError}</p>
        </div>
      )}

      {/* Password */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          New Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type={showPass ? 'text' : 'password'}
            placeholder="Create a strong password"
            value={password}
            onChange={e => { setPassword(e.target.value); setFormError(''); }}
            className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
          />
          <button type="button" onClick={() => setShowPass(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {/* Strength bar */}
        {password && (
          <div className="mt-2">
            <div className="flex gap-1">
              {[1,2,3,4].map(i => (
                <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= s ? strengthColor[s] : 'bg-gray-200'}`} />
              ))}
            </div>
            <p className={`text-xs mt-1 font-medium ${s <= 1 ? 'text-red-500' : s === 2 ? 'text-yellow-600' : s === 3 ? 'text-blue-600' : 'text-green-600'}`}>
              {strengthLabel[s]}
            </p>
          </div>
        )}
      </div>

      {/* Confirm */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          Confirm Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type={showConf ? 'text' : 'password'}
            placeholder="Re-enter your password"
            value={confirm}
            onChange={e => { setConfirm(e.target.value); setFormError(''); }}
            className={`w-full pl-10 pr-10 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
              confirm && confirm !== password
                ? 'border-red-300 focus:ring-red-200 bg-red-50'
                : 'border-gray-200 focus:ring-purple-300 focus:border-purple-400'
            }`}
          />
          <button type="button" onClick={() => setShowConf(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showConf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {confirm && confirm !== password && (
          <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
        )}
      </div>

      {/* Requirements */}
      <ul className="text-xs text-gray-400 space-y-1 mb-6">
        {[
          ['At least 8 characters',        password.length >= 8],
          ['One uppercase letter',          /[A-Z]/.test(password)],
          ['One number',                    /[0-9]/.test(password)],
          ['One special character',         /[^A-Za-z0-9]/.test(password)],
        ].map(([label, ok]) => (
          <li key={label as string} className={`flex items-center gap-1.5 ${ok ? 'text-green-600' : ''}`}>
            <CheckCircle className={`w-3.5 h-3.5 ${ok ? 'text-green-500' : 'text-gray-300'}`} />
            {label as string}
          </li>
        ))}
      </ul>

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
      >
        {submitting
          ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Setting password…</>
          : 'Set My Password'
        }
      </button>
    </div>
  );
}

export default function SetupPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-3">
            <Stethoscope className="w-7 h-7 text-purple-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">ARthoMove</h1>
          <p className="text-sm text-gray-400 mt-0.5">Set Up Your Account Password</p>
        </div>

        <Suspense fallback={
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <SetupPasswordContent />
        </Suspense>
      </div>
    </div>
  );
}
