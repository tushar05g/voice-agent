'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Bot, Sparkles, LogIn, ChevronRight, Fingerprint, Mail, ArrowRight, KeyRound } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'EMAIL' | 'OTP' | 'PASSWORD'>('EMAIL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (email.toLowerCase() === process.env.NEXT_PUBLIC_MASTER_EMAIL?.toLowerCase()) {
      setLoading(false);
      setStep('PASSWORD');
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    if (error) setError(error.message);
    else setStep('OTP');
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const adminEmails =
      process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map((e) => e.trim().toLowerCase()) || [];

    if (adminEmails.includes(email.toLowerCase())) {
      router.push('/owner');
    } else {
      router.push('/client');
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleMasterLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password === process.env.NEXT_PUBLIC_MASTER_PASSWORD) {
      router.push('/owner');
    } else {
      setError('Invalid master password');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#030303] text-zinc-100 selection:bg-indigo-500/30">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 h-[500px] w-[500px] translate-x-1/2 translate-y-1/2 rounded-full bg-violet-600/10 blur-[120px]" />
      
      <div className="relative z-10 w-full max-w-md px-6">
        
        {/* Header */}
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
            <Bot className="h-8 w-8 text-indigo-400" />
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">
            Agent<span className="text-indigo-400">Portal</span>
          </h1>
          <p className="mt-3 text-sm text-zinc-400 max-w-sm">
            Access your intelligent voice agents and monitor deployment analytics.
          </p>
        </div>

        {/* Card */}
        <div className="overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] p-8 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 transition-all">
          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-xl bg-red-500/10 p-4 text-sm text-red-400 border border-red-500/20">
              <div className="h-1.5 w-1.5 rounded-full bg-red-400" />
              {error}
            </div>
          )}

          {step === 'EMAIL' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <form onSubmit={handleSendCode} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-medium text-zinc-400 pl-1">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-zinc-500" />
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:border-indigo-500/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
                      placeholder="name@company.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition-all hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50"
                >
                  {loading ? 'Sending link...' : 'Continue with Email'}
                  {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
                </button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[#0c0c0e] px-2 text-zinc-500">Or</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            </div>
          )}

          {step === 'OTP' && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="text-center space-y-2">
                  <Fingerprint className="mx-auto h-8 w-8 text-indigo-400 mb-4" />
                  <h3 className="text-lg font-medium text-white">Check your email</h3>
                  <p className="text-sm text-zinc-400">We sent a 6-digit code to <br/><span className="text-zinc-200">{email}</span></p>
                </div>
                
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="block w-full rounded-xl border border-white/10 bg-white/5 py-4 text-center text-3xl tracking-[0.5em] text-white placeholder:text-zinc-700 focus:border-indigo-500/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono"
                  placeholder="------"
                />

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
              </form>
              
              <button
                onClick={() => setStep('EMAIL')}
                className="w-full text-center text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Use a different email
              </button>
            </div>
          )}

          {step === 'PASSWORD' && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <form onSubmit={handleMasterLogin} className="space-y-6">
                <div className="text-center space-y-2">
                  <KeyRound className="mx-auto h-8 w-8 text-indigo-400 mb-4" />
                  <h3 className="text-lg font-medium text-white">Master Access</h3>
                  <p className="text-sm text-zinc-400">Enter master password to continue</p>
                </div>
                
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-white/10 bg-white/5 py-3 px-4 text-center text-xl text-white placeholder:text-zinc-700 focus:border-indigo-500/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono"
                  placeholder="••••••••"
                />

                <button
                  type="submit"
                  disabled={loading || !password}
                  className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition-all hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50"
                >
                  {loading ? 'Authenticating...' : 'Unlock Portal'}
                </button>
              </form>
              
              <button
                onClick={() => setStep('EMAIL')}
                className="w-full text-center text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Back to email
              </button>
            </div>
          )}
        </div>

        {/* Contact Footer */}
        <div className="mt-8 text-center animate-in fade-in duration-1000">
          <p className="text-xs text-zinc-500">
            Interested in deploying custom Voice AI?
          </p>
          <a
            href="mailto:support@voiceagent.in"
            className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-indigo-400 transition-colors hover:text-indigo-300"
          >
            Contact Sales <ChevronRight className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
