import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, Lock } from "lucide-react";
import {
  AuthErrorBanner,
  AuthField,
  AuthPrimaryButton,
  AuthShell,
} from "@/components/auth/AuthShell";
import AILogo from "@/components/layout/AILogo";
import { authApi } from "@/api/auth";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({ token, password });
      setComplete(true);
    } catch (requestError) {
      setError(requestError.message || "Unable to reset your password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      headline={
        <>
          Invoicing,
          <br />
          <em style={{ fontStyle: "italic" }}>on autopilot.</em>
        </>
      }
      subhead="Create polished invoices, track every payment, and let AI handle receipts, reminders, and revenue summaries."
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mb-12">
          <AILogo size={48} />
        </div>

        <h1 className="font-display text-[34px] font-semibold tracking-tight text-[var(--ink)] leading-[1.05]">
          {complete ? "Password updated" : "Choose a new password"}
        </h1>

        {complete ? (
          <>
            <p role="status" className="text-[var(--ink-muted)] mt-3 text-[15px]">
              Your password has been changed. Sign in with your new password.
            </p>
            <Link
              to="/login"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-strong)] hover:underline"
            >
              <ArrowLeft size={16} />
              Back to sign in
            </Link>
          </>
        ) : !token ? (
          <>
            <p role="alert" className="text-[var(--ink-muted)] mt-3 text-[15px]">
              This reset link is missing or invalid. Request a new one to
              continue.
            </p>
            <Link
              to="/forgot-password"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-strong)] hover:underline"
            >
              Request a new link <ArrowRight size={15} />
            </Link>
          </>
        ) : (
          <>
            <p className="text-[var(--ink-muted)] mt-2 text-[15px]">
              Choose a new password with at least 8 characters.
            </p>

            <form onSubmit={onSubmit} className="mt-9 space-y-4">
              <AuthField
                label="New password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={setPassword}
                placeholder="At least 8 characters"
                minLength={8}
                icon={Lock}
              />
              <AuthField
                label="Confirm new password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Enter your new password again"
                minLength={8}
                icon={Lock}
              />
              <AuthErrorBanner>{error}</AuthErrorBanner>
              <AuthPrimaryButton type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Updating password...
                  </>
                ) : (
                  <>
                    Update password <ArrowRight size={15} />
                  </>
                )}
              </AuthPrimaryButton>
            </form>
          </>
        )}
      </motion.div>
    </AuthShell>
  );
}
