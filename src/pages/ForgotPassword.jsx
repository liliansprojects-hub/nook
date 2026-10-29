import { base44 } from '@/api/base44Client';
import React, { useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { errMessage, errStatus, isNetworkError } from "@/lib/errors";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.resetPasswordRequest(email.trim());
      setSent(true);
    } catch (err) {
      const status = errStatus(err);
      if (status && status < 500 && status !== 429) {
        // unknown address and similar: look the same as success so accounts cannot be probed
        setSent(true);
      } else if (isNetworkError(err)) {
        setError("You look to be offline. Reconnect and try again.");
      } else if (status === 429) {
        setError(errMessage(err, "Too many requests. Wait a minute and try again."));
      } else {
        setError(errMessage(err, "We could not send the email. Try again in a moment."));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={Mail}
      title="Reset password"
      subtitle="We'll email you a link to reset it"
      footer={
        <Link to="/login" className="text-primary font-medium hover:underline">
          <ArrowLeft className="w-3 h-3 inline mr-1" />Back to log in
        </Link>
      }
    >
      {sent ? (
        <div className="space-y-4 text-center">
          <p className="text-sm text-foreground">
            If an account exists for {email.trim()}, a reset email is on its way. It can take a minute, and it may land in spam.
          </p>
          <p className="text-xs text-muted-foreground">
            Open the link in the email. If it opens somewhere else, copy what comes after <span className="font-mono">token=</span> and{" "}
            <Link to="/reset-password" className="text-primary font-medium hover:underline">
              paste it here
            </Link>
            .
          </p>
          <button type="button" onClick={() => setSent(false)} className="text-xs text-primary hover:underline">
            Use a different email
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12"
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              "Send reset link"
            )}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
