import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, Mail } from "lucide-react";
import {
  AuthErrorBanner,
  AuthField,
  AuthPrimaryButton,
  AuthShell,
} from "@/components/auth/AuthShell";
import AILogo from "@/components/layout/AILogo";
import { authApi } from "@/api/auth";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.requestPasswordReset({ email });
      setSent(true);
    } catch (requestError) {
      setError(requestError.message || "Unable to request a password reset.");
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
          Forgot password?
        </h1>
        {sent ? (
          <p
            role="status"
            className="text-[var(--ink-muted)] mt-3 text-[15px] leading-relaxed"
          >
            If an account exists for that email, a password reset link will be
            sent shortly. Check your inbox.
          </p>
        ) : (
          <>
            <p className="text-[var(--ink-muted)] mt-2 text-[15px]">
              Enter the email address you use to sign in and we&apos;ll send a
              reset link.
            </p>

            <form onSubmit={onSubmit} className="mt-9 space-y-4">
              <AuthField
                label="Email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                icon={Mail}
              />
              <AuthErrorBanner>{error}</AuthErrorBanner>
              <AuthPrimaryButton type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Sending link...
                  </>
                ) : (
                  <>
                    Send reset link <ArrowRight size={15} />
                  </>
                )}
              </AuthPrimaryButton>
            </form>
          </>
        )}

        <Link
          to="/login"
          className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-strong)] hover:underline"
        >
          <ArrowLeft size={16} />
          Back to sign in
        </Link>
      </motion.div>
    </AuthShell>
  );
}
