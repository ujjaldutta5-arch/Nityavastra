"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Phone, ShieldCheck, ArrowRight, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const { signIn, signUp, loginWithOTP, sendOTP } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [demoCode, setDemoCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSendOTP = async (e: FormEvent) => {
    e.preventDefault();
    if (phone.replace(/\D/g, "").length < 10) {
      toast.error("Enter a valid 10-digit phone number");
      return;
    }
    setLoading(true);
    try {
      const res = (await sendOTP(phone)) as { demoCode?: string; demo_code?: string };
      setDemoCode(res.demoCode || res.demo_code || "");
      setStep("otp");
      toast.success("OTP sent to your phone");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not send OTP. Try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setLoading(true);
    try {
      await loginWithOTP(phone, code);
      toast.success("Welcome to Nityavastra!");
      router.push("/");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid OTP. Try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Enter email and password");
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password, { name });
        toast.success("Account created! Welcome.");
      } else {
        await signIn(email, password);
        toast.success("Welcome back!");
      }
      router.push("/");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#7C1F30] mb-4">
            <Lock className="h-7 w-7 text-white" />
          </div>
          <p className="uppercase text-xs tracking-[0.3em] text-[#7C1F30] mb-3">Welcome</p>
          <h1 className="font-serif text-4xl text-[#1C1917]">Sign in to Nityavastra</h1>
          <p className="text-sm text-[#78716C] mt-3">Email & password or phone OTP</p>
        </div>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="w-full bg-[#FAF3E7] border border-[#E7E5E4] rounded-full p-1 h-auto mb-6">
            <TabsTrigger
              value="email"
              data-testid="tab-email-auth"
              className="flex-1 rounded-full data-[state=active]:bg-[#7C1F30] data-[state=active]:text-white"
            >
              <Mail className="h-3.5 w-3.5 mr-1.5" /> Email
            </TabsTrigger>
            <TabsTrigger
              value="otp"
              data-testid="tab-otp-auth"
              className="flex-1 rounded-full data-[state=active]:bg-[#7C1F30] data-[state=active]:text-white"
            >
              <Phone className="h-3.5 w-3.5 mr-1.5" /> Phone OTP
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email">
            <form
              onSubmit={handleEmailAuth}
              className="space-y-5 bg-white border border-[#E7E5E4] rounded-lg p-8"
            >
              {isSignUp && (
                <div>
                  <Label>Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    data-testid="login-name"
                    className="bg-white"
                  />
                </div>
              )}
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  data-testid="login-email"
                  className="bg-white"
                />
              </div>
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  data-testid="login-password"
                  className="bg-white"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                data-testid="login-email-submit"
                className="w-full bg-[#7C1F30] hover:bg-[#8D2A3D] text-white rounded-full py-6 uppercase text-xs tracking-[0.2em]"
              >
                {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
              </Button>
              <button
                type="button"
                onClick={() => setIsSignUp((v) => !v)}
                className="w-full text-sm text-[#78716C] hover:text-[#7C1F30]"
                data-testid="toggle-signup"
              >
                {isSignUp ? "Already have an account? Sign in" : "New here? Create an account"}
              </button>
            </form>
          </TabsContent>

          <TabsContent value="otp">
            {step === "phone" ? (
              <form
                onSubmit={handleSendOTP}
                className="space-y-5 bg-white border border-[#E7E5E4] rounded-lg p-8"
              >
                <div>
                  <Label>Phone Number</Label>
                  <Input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98765 43210"
                    data-testid="login-phone"
                    className="bg-white text-lg tracking-wide"
                  />
                  <p className="text-xs text-[#78716C] mt-2">
                    We&apos;ll send a 6-digit verification code
                  </p>
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  data-testid="login-send-otp"
                  className="w-full bg-[#7C1F30] hover:bg-[#8D2A3D] text-white rounded-full py-6 uppercase text-xs tracking-[0.2em]"
                >
                  {loading ? "Sending..." : "Send OTP"} <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </form>
            ) : (
              <form
                onSubmit={handleVerifyOTP}
                className="space-y-5 bg-white border border-[#E7E5E4] rounded-lg p-8"
              >
                <div>
                  <Label>Enter OTP Code</Label>
                  <Input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    data-testid="login-otp-input"
                    className="bg-white text-2xl tracking-[0.5em] text-center font-mono"
                  />
                  {demoCode && (
                    <div className="mt-3 p-3 bg-[#FAF3E7] border border-[#E7E5E4] rounded-md text-sm text-[#78716C] text-center">
                      <ShieldCheck className="h-4 w-4 inline mr-1 text-[#7C1F30]" />
                      Demo mode: your code is{" "}
                      <span className="font-mono font-bold text-[#7C1F30]">{demoCode}</span>
                    </div>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  data-testid="login-verify-otp"
                  className="w-full bg-[#7C1F30] hover:bg-[#8D2A3D] text-white rounded-full py-6 uppercase text-xs tracking-[0.2em]"
                >
                  {loading ? "Verifying..." : "Verify & Sign In"}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setCode("");
                    setDemoCode("");
                  }}
                  className="w-full text-sm text-[#78716C] hover:text-[#7C1F30] text-center"
                >
                  Change phone number
                </button>
              </form>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[#78716C]">
          <ShieldCheck className="h-4 w-4" />
          <span>Secure login. Your data is protected.</span>
        </div>
        <p className="mt-4 text-center text-sm">
          <Link href="/" className="text-[#7C1F30] hover:underline">
            ← Back to shop
          </Link>
        </p>
      </div>
    </div>
  );
}
