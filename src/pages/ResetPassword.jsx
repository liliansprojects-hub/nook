import { base44 } from '@/api/base44Client';
import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { toast } from "@/components/ui/use-toast";
import { errMessage } from "@/lib/errors";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  // the emailed link carries the token; if the link was opened somewhere else the code can be pasted instead
  const linkToken = searchParams.get("token") || searchParams.get("reset_token") || searchParams.get("code") || "";
  const [pastedToken, setPastedToken] = useState("");
  const resetToken = (linkToken || pastedToken).trim();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!resetToken) {
      setError("Paste the reset token from your email link");
      return;
    }
    if (newPassword.length < 8) {
      setError("Use at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.resetPassword({ resetToken, newPassword });
      toast({ title: "Password changed", description: "Log in with your new password." });
      window.location.href = "/login";
    } catch (err) {
      setError(errMessage(err, "That reset link is invalid or has expired. Request a new one."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={Lock}
      title="New password"
      subtitle="Enter your new password below"
      footer={
        <Link to="/forgot-password" className="text-primary font-medium hover:underline">
          Request a new reset email
        </Link>
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        {!linkToken && (
          <div className="space-y-2">
            <Label htmlFor="token">Reset token</Label>
            <Input
              id="token"
              autoComplete="one-time-code"
              autoFocus
              placeholder="paste the token from your email link"
              value={pastedToken}
              onChange={(e) => setPastedToken(e.target.value)}
              className="h-12"
              required
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              autoFocus={!!linkToken}
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Resetting...
            </>
          ) : (
            "Reset password"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
