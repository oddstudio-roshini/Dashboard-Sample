"use client";

/**
 * components/PasskeyButton.tsx
 * ─────────────────────────────
 * Reusable button that drives the WebAuthn credential.get() (login) flow.
 *
 * Props:
 *   email       – admin email; required so the server can look up allowed credentials
 *   onSuccess   – called with the LoginResponse when auth succeeds
 *   onError     – called with an error message string
 *   className   – optional extra classes
 *   label       – button label (default: "Sign in with Passkey")
 *
 * Usage in the login page:
 *   <PasskeyButton
 *     email={email}
 *     onSuccess={(data) => { saveAuth(data); router.push('/dashboard'); }}
 *     onError={(msg) => toast.error(msg)}
 *   />
 *
 * Also exported: PasskeyRegisterButton – runs the registration flow.
 * Show this button inside the dashboard (after the admin is already
 * authenticated) so they can register a passkey for future logins.
 */

import { useState } from "react";
import { Fingerprint, Loader2 } from "lucide-react";
import { passkeyAPI, bufferToBase64url, base64urlToBuffer } from "@/lib/api";
import type { LoginResponse } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN BUTTON
// ─────────────────────────────────────────────────────────────────────────────

interface PasskeyButtonProps {
  email: string;
  onSuccess: (data: LoginResponse) => void;
  onError: (message: string) => void;
  className?: string;
  label?: string;
}

export function PasskeyButton({
  email,
  onSuccess,
  onError,
  className = "",
  label = "Sign in with Passkey",
}: PasskeyButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePasskeyLogin = async () => {
    if (!email) {
      onError("Please enter your email address first");
      return;
    }

    if (!window.PublicKeyCredential) {
      onError("Passkeys are not supported in this browser");
      return;
    }

    setLoading(true);
    try {
      // ── Step 1: Get options from server ──────────────────────────────────
      const startRes = await passkeyAPI.authStart(email);
      if (!startRes.success)
        throw new Error(startRes.message || "Failed to start passkey auth");

      const options = startRes.data;

      // ── Step 2: Call the browser WebAuthn API ─────────────────────────────
      const credential = (await navigator.credentials.get({
        publicKey: {
          challenge: base64urlToBuffer(options.challenge) as BufferSource,
          rpId: options.rpId,
          timeout: parseInt(options.timeout, 10),
          userVerification:
            options.userVerification as UserVerificationRequirement,
          allowCredentials: options.allowCredentials.map((c: any) => ({
            type: "public-key" as const,
            id: base64urlToBuffer(c.id),
          })),
        },
      })) as PublicKeyCredential | null;

      if (!credential) throw new Error("Passkey authentication cancelled");

      const response = credential.response as AuthenticatorAssertionResponse;

      // ── Step 3: Send assertion to server ──────────────────────────────────
      const finishRes = await passkeyAPI.authFinish({
        email,
        credentialId: bufferToBase64url(credential.rawId),
        clientDataJSON: bufferToBase64url(response.clientDataJSON),
        authenticatorData: bufferToBase64url(response.authenticatorData),
        signature: bufferToBase64url(response.signature),
        userHandle: response.userHandle
          ? bufferToBase64url(response.userHandle)
          : null,
      });

      if (!finishRes.success)
        throw new Error(finishRes.message || "Passkey authentication failed");

      onSuccess(finishRes.data);
    } catch (err: any) {
      // DOMException name = "NotAllowedError" means the user cancelled
      if (err?.name === "NotAllowedError") {
        onError("Passkey authentication was cancelled");
      } else {
        onError(err?.message || "Passkey authentication failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handlePasskeyLogin}
      disabled={loading}
      className={`w-full flex items-center justify-center gap-2 py-3 border-2 border-purple-200 
        hover:border-purple-400 hover:bg-purple-50 disabled:opacity-60 
        text-purple-700 font-semibold rounded-xl text-sm transition-all ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Verifying passkey…
        </>
      ) : (
        <>
          <Fingerprint className="w-4 h-4" />
          {label}
        </>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER BUTTON (use inside the dashboard after password login)
// ─────────────────────────────────────────────────────────────────────────────

interface PasskeyRegisterButtonProps {
  email: string;
  onSuccess: () => void;
  onError: (message: string) => void;
  className?: string;
}

export function PasskeyRegisterButton({
  email,
  onSuccess,
  onError,
  className = "",
}: PasskeyRegisterButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!window.PublicKeyCredential) {
      onError("Passkeys are not supported in this browser");
      return;
    }

    setLoading(true);
    try {
      // ── Step 1: Get creation options from server ──────────────────────────
      const startRes = await passkeyAPI.registrationStart(email);
      if (!startRes.success)
        throw new Error(startRes.message || "Failed to start registration");

      const options = startRes.data;

      // ── Step 2: Call the browser WebAuthn API ─────────────────────────────
      const credential = (await navigator.credentials.create({
        publicKey: {
          challenge: base64urlToBuffer(options.challenge) as BufferSource,
          rp: { id: options.rp.id, name: options.rp.name },
          user: {
            id: base64urlToBuffer(options.user.id) as BufferSource,
            name: options.user.name,
            displayName: options.user.displayName,
          },
          pubKeyCredParams: [
            { type: "public-key", alg: -7 }, // ES256 (primary)
            { type: "public-key", alg: -257 }, // RS256 (fallback)
          ],
          timeout: parseInt(options.timeout, 10),
          attestation: options.attestation as AttestationConveyancePreference,
          authenticatorSelection: {
            // Prefer platform authenticator (Touch ID, Face ID, Windows Hello)
            authenticatorAttachment: "platform",
            userVerification: "required",
            residentKey: "required", // enables "discoverable credentials"
          },
        },
      })) as PublicKeyCredential | null;

      if (!credential) throw new Error("Passkey registration cancelled");

      const response = credential.response as AuthenticatorAttestationResponse;

      // ── Step 3: Send attestation to server ────────────────────────────────
      const finishRes = await passkeyAPI.registrationFinish({
        email,
        credentialId: bufferToBase64url(credential.rawId),
        clientDataJSON: bufferToBase64url(response.clientDataJSON),
        attestationObject: bufferToBase64url(response.attestationObject),
      });

      if (!finishRes.success)
        throw new Error(finishRes.message || "Registration failed");

      onSuccess();
    } catch (err: any) {
      if (err?.name === "NotAllowedError") {
        onError("Passkey registration was cancelled");
      } else if (err?.name === "InvalidStateError") {
        onError("A passkey for this account already exists on this device");
      } else {
        onError(err?.message || "Passkey registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    // <button
    //   type="button"
    //   onClick={handleRegister}
    //   disabled={loading}
    //   className={`flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700
    //     disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors ${className}`}
    // >
    //   {loading ? (
    //     <>
    //       <Loader2 className="w-4 h-4 animate-spin" />
    //       Registering…
    //     </>
    //   ) : (
    //     <>
    //       <Fingerprint className="w-4 h-4" />
    //       Register Passkey
    //     </>
    //   )}
    // </button>

    <div className="flex justify-center">
      <button
        type="button"
        onClick={handleRegister}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 
      disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors ${className}`}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Registering…
          </>
        ) : (
          <>
            <Fingerprint className="w-4 h-4" />
            Register Passkey
          </>
        )}
      </button>
    </div>
  );
}
