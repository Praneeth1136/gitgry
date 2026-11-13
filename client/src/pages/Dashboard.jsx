import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  FolderGit2,
  CheckCircle2,
  Clock,
  Play,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export function Dashboard() {
  const queryClient = useQueryClient();

  const { data: overviewData, isLoading: loadingOverview } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: () => api.get('/analytics/overview'),
  });

  const { data: activityData, isLoading: loadingActivity } = useQuery({
    queryKey: ['analytics-activity'],
    queryFn: () => api.get('/analytics/activity'),
  });

  const planMutation = useMutation({
    mutationFn: () => api.post('/automation/plan'),
    onSuccess: () => {
      queryClient.invalidateQueries(['analytics-overview']);
      queryClient.invalidateQueries(['tasks']);
      alert('Maintenance plan generated successfully!');
    },
    onError: (err) => {
      alert(`Planning error: ${err.message}`);
    },
  });

  const runMutation = useMutation({
    mutationFn: () => api.post('/automation/run'),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['analytics-overview']);
      queryClient.invalidateQueries(['executions']);
      alert(data.message || 'Approved tasks dispatched successfully!');
    },
    onError: (err) => {
      alert(`Run error: ${err.message}`);
    },
  });

  const overview = overviewData?.data || {};
  const chartData = activityData?.data || [];

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#30363d]">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Activity Dashboard</h1>
          <p className="text-sm text-[#8b949e] mt-1">
            Real-time status of your connected repositories and maintenance schedules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => planMutation.mutate()}
            disabled={planMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-white text-sm font-medium border border-[#30363d] transition active:scale-95 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-[#bc8cff]" />
            <span>{planMutation.isPending ? 'Analyzing...' : 'Plan Daily Tasks'}</span>
          </button>

          <button
            onClick={() => runMutation.mutate()}
            disabled={runMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white text-sm font-medium shadow transition active:scale-95 disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{runMutation.isPending ? 'Executing...' : 'Run Approved Tasks'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-[#161b22] border border-[#30363d] shadow-sm">
          <div className="flex items-center justify-between text-[#8b949e] mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Managed Repos</span>
            <FolderGit2 className="w-4 h-4 text-[#58a6ff]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{overview.totalRepos || 0}</span>
            <span className="text-xs text-[#8b949e]">({overview.enabledRepos || 0} active)</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#161b22] border border-[#30363d] shadow-sm">
          <div className="flex items-center justify-between text-[#8b949e] mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Approvals</span>
            <Clock className="w-4 h-4 text-[#e3b341]" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-white">{overview.pendingApprovals || 0}</span>
            {overview.pendingApprovals > 0 && (
              <Link
                to="/automation/approvals"
                className="text-xs text-[#58a6ff] hover:underline flex items-center gap-1"
              >
                Review <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#161b22] border border-[#30363d] shadow-sm">
          <div className="flex items-center justify-between text-[#8b949e] mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed Tasks</span>
            <CheckCircle2 className="w-4 h-4 text-[#2ea043]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{overview.completedTasks || 0}</span>
            <span className="text-xs text-[#2ea043] font-medium">Legitimate</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#161b22] border border-[#30363d] shadow-sm">
          <div className="flex items-center justify-between text-[#8b949e] mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Next Run</span>
            <Activity className="w-4 h-4 text-[#bc8cff]" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-white">
              {overview.nextSchedule ? `${overview.nextSchedule.time} ${overview.nextSchedule.timezone}` : 'Manual'}
            </span>
          </div>
        </div>
      </div>

      {/* Activity Chart Card */}
      <div className="p-6 rounded-xl bg-[#161b22] border border-[#30363d]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-semibold text-white">Maintenance Activity (Past 7 Days)</h2>
            <p className="text-xs text-[#8b949e] mt-0.5">Real code quality commits and tasks performed</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#238636]"></span>
              <span className="text-[#8b949e]">Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#e3b341]"></span>
              <span className="text-[#8b949e]">Pending</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#238636" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#238636" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e3b341" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#e3b341" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
              <XAxis dataKey="date" stroke="#8b949e" fontSize={11} />
              <YAxis stroke="#8b949e" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1c2128', borderColor: '#30363d', borderRadius: 8 }}
                itemStyle={{ color: '#c9d1d9', fontSize: 12 }}
              />
              <Area type="monotone" dataKey="completed" stroke="#238636" fillOpacity={1} fill="url(#colorCompleted)" />
              <Area type="monotone" dataKey="pending" stroke="#e3b341" fillOpacity={1} fill="url(#colorPending)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Executions List */}
      <div className="p-6 rounded-xl bg-[#161b22] border border-[#30363d]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">Recent Automation Runs</h2>
          <Link to="/executions" className="text-xs text-[#58a6ff] hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {overview.recentExecutions && overview.recentExecutions.length > 0 ? (
          <div className="divide-y divide-[#30363d]">
            {overview.recentExecutions.map((exec) => (
              <div key={exec._id} className="py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">
                    {exec.repositoryId?.fullName || 'Target Repository'}
                  </p>
                  <p className="text-xs text-[#8b949e] mt-0.5">
                    {new Date(exec.startedAt).toLocaleString()} &bull; {exec.totalTasks} task(s)
                  </p>
                </div>
                <div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      exec.status === 'completed'
                        ? 'bg-[#238636]/20 text-[#2ea043] border border-[#238636]/40'
                        : exec.status === 'running'
                        ? 'bg-[#58a6ff]/20 text-[#58a6ff] border border-[#58a6ff]/40 animate-pulse'
                        : 'bg-[#f85149]/20 text-[#f85149] border border-[#f85149]/40'
                    }`}
                  >
                    {exec.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#8b949e] py-6 text-center">
            No executions recorded yet. Click "Plan Daily Tasks" or connect your repositories to start.
          </p>
        )}
      </div>
    </div>
  );
}

