const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2, ShieldCheck } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { safeReturnTo } from "@/lib/authReturnTo";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("password");
  const [sendFailed, setSendFailed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const returnTo = safeReturnTo();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await db.auth.loginViaEmailPassword(email, password);
      try {
        const res = await db.functions.invoke("authCode", { action: "send" });
        if (res.data?.error) throw new Error(res.data.error);
        setSendFailed(false);
      } catch (err) {
        setSendFailed(true);
        setError(err.message || "We could not email your code");
      }
      setStep("code");
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await db.functions.invoke("authCode", { action: "verify", code });
      if (res.data?.error) {
        setError(res.data.error);
      } else {
        window.location.href = returnTo;
      }
    } catch (err) {
      setError(err.message || "That code is not right");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      const res = await db.functions.invoke("authCode", { action: "send" });
      if (res.data?.error) setError(res.data.error);
    } catch (err) {
      setError(err.message || "Could not send another code");
    }
  };

  const handleGoogle = () => {
    db.auth.loginWithProvider("google", returnTo);
  };

  if (step === "code") {
    return (
      <AuthLayout
        icon={ShieldCheck}
        title="One more step"
        subtitle={`We emailed a six-digit code to ${email}`}
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-center mb-6">
          <InputOTP maxLength={6} value={code} onChange={setCode} autoFocus autoComplete="one-time-code">
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button className="w-full h-12 font-medium" onClick={handleVerify} disabled={loading || code.length < 6}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            "Enter Nook"
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Didn't get it?{" "}
          <button onClick={handleResend} className="text-primary font-medium hover:underline">
            Send a new code
          </button>
        </p>

        {sendFailed && (
          <p className="text-center text-xs text-muted-foreground mt-3">
            Email trouble?{" "}
            <button
              onClick={() => {
                window.location.href = returnTo;
              }}
              className="font-medium hover:underline"
            >
              Continue without a code
            </button>
          </p>
        )}

        <p className="text-center text-xs text-muted-foreground mt-6">
          <button
            onClick={async () => {
              await db.auth.logout();
              window.location.href = "/login";
            }}
            className="hover:underline"
          >
            Use a different account
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
      <Button variant="outline" className="w-full h-12 text-sm font-medium mb-6" onClick={handleGoogle}>
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

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
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
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending your code...
            </>
          ) : (
            "Log in"
          )}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5" />
        We email a six-digit code to finish signing in
      </p>
    </AuthLayout>
  );
}