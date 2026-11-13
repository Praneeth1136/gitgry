import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Github, Key, LogOut, Lock } from 'lucide-react';

export function Settings() {
  const { user, logout } = useAuth();

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="pb-4 border-b border-[#30363d]">
        <h1 className="text-2xl font-bold text-white tracking-tight">Account & Security</h1>
        <p className="text-sm text-[#8b949e] mt-1">
          Manage your connected GitHub session and view encryption standards.
        </p>
      </div>

      {/* GitHub Account Card */}
      <div className="p-6 rounded-2xl bg-[#161b22] border border-[#30363d]">
        <h2 className="text-base font-semibold text-white mb-4">Connected Profile</h2>
        <div className="flex items-center gap-4">
          <img
            src={user?.avatarUrl || 'https://github.com/ghost.png'}
            alt={user?.username}
            className="w-16 h-16 rounded-full border-2 border-[#30363d]"
          />
          <div>
            <h3 className="text-base font-bold text-white">{user?.displayName || user?.username}</h3>
            <p className="text-xs text-[#8b949e]">@{user?.username}</p>
            <p className="text-xs text-[#58a6ff] mt-1">{user?.email || 'Email not publicized'}</p>
          </div>
        </div>
      </div>

      {/* Security & Cryptography Info */}
      <div className="p-6 rounded-2xl bg-[#161b22] border border-[#30363d] space-y-4">
        <div className="flex items-center gap-2 text-white font-semibold text-base">
          <ShieldCheck className="w-5 h-5 text-[#2ea043]" />
          <span>Security & Token Protection</span>
        </div>

        <div className="space-y-3 text-xs text-[#8b949e] leading-relaxed">
          <div className="p-3.5 bg-[#0d1117] border border-[#30363d] rounded-xl flex items-start gap-3">
            <Lock className="w-4 h-4 text-[#2ea043] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">AES-256-GCM Encryption at Rest</p>
              <p className="mt-0.5">
                Your GitHub OAuth access token is encrypted in MongoDB using an authenticated 256-bit AES key.
                Raw tokens are never transmitted to the browser or stored in plaintext.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-[#0d1117] border border-[#30363d] rounded-xl flex items-start gap-3">
            <Key className="w-4 h-4 text-[#58a6ff] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">HTTP-Only Signed Session Cookies</p>
              <p className="mt-0.5">
                Authentication state is managed via secure, HttpOnly, SameSite cookies. Client JavaScript cannot
                inspect session tokens, eliminating XSS token theft risks.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Session Management */}
      <div className="p-6 rounded-2xl bg-[#161b22] border border-[#30363d] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Active Session</h3>
          <p className="text-xs text-[#8b949e] mt-0.5">Terminate your current session and clear local cookies.</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f85149]/10 hover:bg-[#f85149]/20 text-[#f85149] border border-[#f85149]/30 text-xs font-semibold transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
}

