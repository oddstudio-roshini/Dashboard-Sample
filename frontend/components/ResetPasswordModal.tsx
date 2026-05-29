// 'use client';

// /**
//  * components/ResetPasswordModal.tsx
//  * ───────────────────────────────────
//  * Confirms password reset for a doctor, then displays the
//  * generated temporary password (shown ONCE — admin must copy it).
//  *
//  * Flow:
//  *   1. Admin clicks "Reset Password" in actions menu
//  *   2. Modal shows confirmation with doctor name
//  *   3. Admin clicks "Confirm Reset"
//  *   4. API call → backend generates new temp password, sets requirePasswordChange=true
//  *   5. Modal transitions to show the generated password with a copy button
//  */

// import { useState } from 'react';
// import { X, Copy, Check, KeyRound, ShieldAlert } from 'lucide-react';
// import toast from 'react-hot-toast';
// import { doctorsAPI } from '@/lib/api';
// import { Doctor, ResetPasswordResponse } from '@/types';

// interface Props {
//   isOpen: boolean;
//   doctor: Doctor | null;
//   onClose: () => void;
//   onSuccess: () => void;
// }

// export default function ResetPasswordModal({ isOpen, doctor, onClose, onSuccess }: Props) {
//   const [loading, setLoading] = useState(false);
//   const [result, setResult] = useState<ResetPasswordResponse | null>(null);
//   const [copied, setCopied] = useState(false);

//   if (!isOpen || !doctor) return null;

//   const handleReset = async () => {
//     setLoading(true);
//     try {
//       const res = await doctorsAPI.resetPassword(doctor.id);
//       if (res.success) {
//         setResult(res.data);
//         onSuccess();
//       } else {
//         toast.error(res.message);
//       }
//     } catch {
//       toast.error('Failed to reset password');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCopy = () => {
//     if (result) {
//       navigator.clipboard.writeText(result.newTemporaryPassword);
//       setCopied(true);
//       toast.success('Password copied!');
//       setTimeout(() => setCopied(false), 2000);
//     }
//   };

//   const handleClose = () => {
//     setResult(null);
//     setCopied(false);
//     onClose();
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
//       <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
//       <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">

//         {/* Header */}
//         <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
//           <div className="flex items-center gap-3">
//             <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
//               <KeyRound className="w-5 h-5 text-amber-600" />
//             </div>
//             <div>
//               <h2 className="text-lg font-bold text-gray-900">Reset Password</h2>
//               <p className="text-xs text-gray-500">Generate new temporary credentials</p>
//             </div>
//           </div>
//           <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
//             <X className="w-5 h-5" />
//           </button>
//         </div>

//         <div className="px-6 py-5">
//           {!result ? (
//             /* Confirmation state */
//             <>
//               <p className="text-sm text-gray-600 mb-4 leading-relaxed">
//                 A new temporary password will be issued for{' '}
//                 <span className="font-semibold text-gray-900">
//                   {doctor.firstName} {doctor.lastName}
//                 </span>.{' '}
//                 Password change will be required on next login.
//               </p>

//               <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 mb-5">
//                 <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
//                 <p className="text-xs text-amber-700">
//                   The current password will be immediately invalidated. The doctor will not be able to log in until they use the new temporary password.
//                 </p>
//               </div>

//               {/* Preview box */}
//               <div className="p-4 bg-gray-50 border border-dashed border-gray-200 rounded-xl mb-6">
//                 <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
//                   Generated Temporary Password
//                 </p>
//                 <p className="text-lg font-bold text-gray-400 font-mono tracking-widest">
//                   Doctor#•••••••
//                 </p>
//               </div>

//               <div className="flex gap-3">
//                 <button onClick={handleClose}
//                   className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
//                   Cancel
//                 </button>
//                 <button onClick={handleReset} disabled={loading}
//                   className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2">
//                   {loading
//                     ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Resetting...</>
//                     : 'Confirm Reset'}
//                 </button>
//               </div>
//             </>
//           ) : (
//             /* Success state — show generated password */
//             <>
//               <div className="flex items-center gap-2 mb-4">
//                 <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
//                   <Check className="w-4 h-4 text-green-600" />
//                 </div>
//                 <p className="text-sm font-semibold text-green-700">Password reset successfully!</p>
//               </div>

//               <p className="text-xs text-gray-500 mb-4">
//                 Share this temporary password with <strong>{result.doctorName}</strong> securely.
//                 This password is shown <strong>only once</strong>.
//               </p>

//               {/* Generated password display */}
//               <div className="p-4 bg-gray-900 rounded-xl mb-3">
//                 <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
//                   Generated Temporary Password
//                 </p>
//                 <div className="flex items-center justify-between">
//                   <p className="text-xl font-bold text-white font-mono tracking-wider">
//                     {result.newTemporaryPassword}
//                   </p>
//                   <button onClick={handleCopy}
//                     className={`p-2 rounded-lg transition-colors ${copied ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>
//                     {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
//                   </button>
//                 </div>
//               </div>

//               <div className="grid grid-cols-2 gap-2 text-xs mb-5">
//                 <div className="p-2.5 bg-gray-50 rounded-lg">
//                   <p className="text-gray-400 mb-0.5">Username</p>
//                   <p className="font-mono font-semibold text-gray-700">{result.username}</p>
//                 </div>
//                 <div className="p-2.5 bg-gray-50 rounded-lg">
//                   <p className="text-gray-400 mb-0.5">Must Change On</p>
//                   <p className="font-semibold text-gray-700">First Login</p>
//                 </div>
//               </div>

//               <button onClick={handleClose}
//                 className="w-full py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold">
//                 Done
//               </button>
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

'use client';

import { useState } from 'react';
import { X, KeyRound, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { doctorsAPI } from '@/lib/api';
import { Doctor } from '@/types';

interface Props {
  isOpen: boolean;
  doctor: Doctor | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ResetPasswordModal({
  isOpen,
  doctor,
  onClose,
  onSuccess,
}: Props) {

  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');

  if (!isOpen || !doctor) return null;

  const handleReset = async () => {

    if (!password.trim()) {
      toast.error('Please enter a password');
      return;
    }

    setLoading(true);

    try {

      const res = await doctorsAPI.resetPassword(
        doctor.id,
        password
      );

      if (res.success) {

        toast.success('Password updated successfully');

        setPassword('');

        onSuccess();
        onClose();

      } else {
        toast.error(res.message);
      }

    } catch {
      toast.error('Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-amber-600" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Reset Password
              </h2>

              <p className="text-xs text-gray-500">
                Set a new password manually
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">

          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            Enter a new password for{' '}
            <span className="font-semibold text-gray-900">
              {doctor.firstName} {doctor.lastName}
            </span>
          </p>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 mb-5">

            <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />

            <p className="text-xs text-amber-700">
              The old password will stop working immediately after reset.
            </p>
          </div>

          {/* Password Input */}
          <div className="mb-6">

            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3">

            <button
              onClick={handleClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              onClick={handleReset}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2"
            >
              {loading ? 'Saving...' : 'Save Password'}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}