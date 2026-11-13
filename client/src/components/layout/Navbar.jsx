import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Github, LogOut, ShieldCheck, Activity } from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-[#30363d] bg-[#161b22] px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#238636] to-[#2ea043] flex items-center justify-center text-white shadow-md">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-lg text-white tracking-tight">GitGry</span>
          <span className="text-xs ml-2 px-2 py-0.5 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d]">
            Activity Manager
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 text-xs text-[#8b949e] bg-[#0d1117] px-3 py-1.5 rounded-full border border-[#30363d]">
          <ShieldCheck className="w-4 h-4 text-[#2ea043]" />
          <span>Legitimate Maintenance Active</span>
        </div>

        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-[#30363d]">
            <img
              src={user.avatarUrl || 'https://github.com/ghost.png'}
              alt={user.username}
              className="w-8 h-8 rounded-full border border-[#30363d]"
            />
            <div className="hidden md:block text-left text-xs">
              <p className="font-semibold text-white leading-tight">{user.displayName || user.username}</p>
              <p className="text-[#8b949e]">@{user.username}</p>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-2 text-[#8b949e] hover:text-[#f85149] hover:bg-[#21262d] rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

