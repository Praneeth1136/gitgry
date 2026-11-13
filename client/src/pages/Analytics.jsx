import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import { BarChart3, TrendingUp, CheckCircle2, ShieldCheck } from 'lucide-react';

export function Analytics() {
  const { data: activityData, isLoading: loadingActivity } = useQuery({
    queryKey: ['analytics-activity'],
    queryFn: () => api.get('/analytics/activity'),
  });

  const { data: repoStatsData, isLoading: loadingRepoStats } = useQuery({
    queryKey: ['analytics-repositories'],
    queryFn: () => api.get('/analytics/repositories'),
  });

  const activity = activityData?.data || [];
  const repoStats = repoStatsData?.data || [];

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-[#30363d]">
        <h1 className="text-2xl font-bold text-white tracking-tight">Maintenance Analytics</h1>
        <p className="text-sm text-[#8b949e] mt-1">
          Detailed metrics and repository hygiene velocity over time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Over Time */}
        <div className="p-6 rounded-2xl bg-[#161b22] border border-[#30363d]">
          <h2 className="text-base font-semibold text-white mb-1">Activity Velocity</h2>
          <p className="text-xs text-[#8b949e] mb-4">Daily completed vs proposed maintenance tasks</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                <XAxis dataKey="date" stroke="#8b949e" fontSize={11} />
                <YAxis stroke="#8b949e" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1c2128', borderColor: '#30363d', borderRadius: 8 }}
                  itemStyle={{ color: '#c9d1d9', fontSize: 12 }}
                />
                <Area type="monotone" dataKey="completed" stroke="#238636" fill="#238636" fillOpacity={0.3} />
                <Area type="monotone" dataKey="planned" stroke="#58a6ff" fill="#58a6ff" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Repository-wise Tasks */}
        <div className="p-6 rounded-2xl bg-[#161b22] border border-[#30363d]">
          <h2 className="text-base font-semibold text-white mb-1">Tasks by Repository</h2>
          <p className="text-xs text-[#8b949e] mb-4">Legitimate maintenance tasks executed per repository</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={repoStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                <XAxis dataKey="name" stroke="#8b949e" fontSize={11} />
                <YAxis stroke="#8b949e" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1c2128', borderColor: '#30363d', borderRadius: 8 }}
                  itemStyle={{ color: '#c9d1d9', fontSize: 12 }}
                />
                <Bar dataKey="completedTasks" fill="#238636" radius={[4, 4, 0, 0]} />
                <Bar dataKey="totalTasks" fill="#30363d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

