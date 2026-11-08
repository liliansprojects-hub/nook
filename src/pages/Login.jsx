import { base44 } from '@/api/base44Client';
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, AtSign, Loader2, Mail } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import PasswordInput from "@/components/PasswordInput";
import { safeReturnTo } from "@/lib/authReturnTo";
import { toast } from "@/components/ui/use-toast";
import { errMessage, errStatus } from "@/lib/errors";
import { GOOGLE_ENABLED, startGoogleLogin } from "@/lib/googleLogin";
import { resolveEmail, rememberLogin } from "@/lib/identity";

const RESEND_SECONDS = 30;
const looksUnverified = (err) => /verif|confirm.*email|not.*activ/i.test(errMessage(err, ""));

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("password"); // "password" | "verify"
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const returnTo = safeReturnTo();

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const who = await resolveEmail(identifier);
    if (!who) {
      setError("We couldn't find that username on this device. Log in once with your email, then your username works here.");
      setLoading(false);
      return;
    }
    try {
      await base44.auth.loginViaEmailPassword(who, password);
    } catch (err) {
      if (looksUnverified(err)) {
        // account made but never verified: send the code again and let them finish here
        try {
          await base44.auth.resendOtp(who);
          setEmail(who);
          setCode("");
          setCooldown(RESEND_SECONDS);
          setStep("verify");
        } catch (sendErr) {
          setError(errMessage(sendErr, "We could not send your verification code. Try again in a moment."));
        }
      } else {
        const status = errStatus(err);
        setError(status === 400 || status === 401 || status === 403 || status === 404 ? "Wrong username or password" : errMessage(err, "Could not log in"));
      }
      setLoading(false);
      return;
    }
    rememberLogin(identifier, who);
    window.location.href = returnTo;
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode: code });
      if (result?.access_token) base44.auth.setToken(result.access_token);
      else await base44.auth.loginViaEmailPassword(email, password);
      rememberLogin(identifier, email);
      window.location.href = returnTo;
    } catch (err) {
      setError(errMessage(err, "That code is not right"));
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError("");
    try {
      await base44.auth.resendOtp(email);
      setCooldown(RESEND_SECONDS);
      toast({ title: "Code sent", description: `Check ${email} for a new code.` });
    } catch (err) {
      setError(errMessage(err, "We could not send a new code"));
    }
  };

  if (step === "verify") {
    return (
      <AuthLayout icon={Mail} title="Verify your email" subtitle={`We sent a code to ${email}`}>
        {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
        <div className="flex justify-center mb-6">
          <InputOTP maxLength={6} value={code} onChange={setCode} autoFocus autoComplete="one-time-code">
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button className="w-full h-12 font-medium" onClick={handleVerify} disabled={loading || code.length < 6}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify and log in"
          )}
        </Button>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Didn't get it?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0}
            className="text-primary font-medium hover:underline disabled:opacity-50 disabled:no-underline"
          >
            {cooldown > 0 ? `Send again (${cooldown}s)` : "Send again"}
          </button>
        </p>
        <p className="text-center text-xs text-muted-foreground mt-3">
          <button
            type="button"
            onClick={() => {
              setStep("password");
              setError("");
            }}
            className="font-medium hover:underline"
          >
            Back to log in
          </button>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={LogIn}
      title="Welcome back"
      subtitle="Log in to your nook"
      footer={
        <>
          Don't have an account?{" "}
          <Link
            to={"/register" + (returnTo !== "/" ? "?returnTo=" + encodeURIComponent(returnTo) : "")}
            className="text-primary font-medium hover:underline"
          >
            Create one
          </Link>
        </>
      }
    >
      {GOOGLE_ENABLED && (
        <>
          <Button variant="outline" className="w-full h-12 text-sm font-medium mb-6" onClick={() => startGoogleLogin(returnTo)}>
            <GoogleIcon className="w-5 h-5 mr-2" />
            Continue with Google
          </Button>
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-3 text-muted-foreground">or</span>
            </div>
          </div>
        </>
      )}

      {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="username"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              autoFocus
              placeholder="your username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Logging in...
            </>
          ) : (
            "Log in"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
