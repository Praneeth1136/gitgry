import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  CheckSquare,
  Bot,
  Calendar,
  History,
  BarChart3,
  Settings as SettingsIcon,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Repositories', path: '/repositories', icon: FolderGit2 },
  { label: 'Approvals', path: '/automation/approvals', icon: CheckSquare },
  { label: 'Automation', path: '/automation', icon: Bot },
  { label: 'Schedules', path: '/schedules', icon: Calendar },
  { label: 'Executions', path: '/executions', icon: History },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Settings', path: '/settings', icon: SettingsIcon },
];

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-[#30363d] bg-[#161b22] min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#21262d] text-white border-l-4 border-[#238636]'
                    : 'text-[#8b949e] hover:bg-[#21262d]/50 hover:text-[#c9d1d9]'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-[#8b949e] space-y-1">
        <p className="font-medium text-white flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#2ea043] animate-pulse"></span>
          Cloud Engine
        </p>
        <p className="leading-relaxed">GitHub Actions cloud workflow automation ready.</p>
      </div>
    </aside>
  );
}

