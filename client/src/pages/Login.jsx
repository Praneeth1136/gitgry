import React from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Github, ShieldCheck, GitCommit, CheckCircle2, AlertCircle } from 'lucide-react';

export function Login() {
  const { user, loginWithGitHub, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const errorParam = searchParams.get('error');

  if (user && !isLoading) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#238636]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#58a6ff]/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#238636] to-[#2ea043] text-white shadow-lg shadow-[#238636]/20 mb-4">
            <GitCommit className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">GitGry</h1>
          <p className="text-sm text-[#8b949e] mt-1.5">
            Automated Repository Maintenance & Activity Manager
          </p>
        </div>

        {errorParam && (
          <div className="mb-6 p-4 rounded-xl bg-[#f85149]/10 border border-[#f85149]/30 text-[#f85149] text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Authentication Error</p>
              <p className="mt-0.5 text-[#ff7b72]">{errorParam}</p>
            </div>
          </div>
        )}

        <div className="space-y-4 mb-8">
          <button
            onClick={loginWithGitHub}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-[#238636] hover:bg-[#2ea043] text-white font-medium shadow-md transition duration-200 active:scale-[0.99]"
          >
            <Github className="w-5 h-5" />
            <span>Continue with GitHub</span>
          </button>
        </div>

        <div className="pt-6 border-t border-[#30363d] space-y-3">
          <p className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
            Built for Legitimate Development
          </p>
          <div className="space-y-2 text-xs text-[#8b949e]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2ea043]" />
              <span>Real code hygiene, documentation & test improvements</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2ea043]" />
              <span>Zero artificial, empty, or meaningless commits</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2ea043]" />
              <span>Isolated execution via GitHub Actions cloud runners</span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-[#484f58] mt-8 text-center">
        GitGry &bull; AES-256-GCM Secure Token Storage &bull; OAuth 2.0
      </p>
    </div>
  );
}

