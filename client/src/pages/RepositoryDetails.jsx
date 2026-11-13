import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import {
  FolderGit2,
  GitBranch,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  Clock,
  Shield,
  ArrowLeft,
} from 'lucide-react';

export function RepositoryDetails() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data: repoData, isLoading: loadingRepo } = useQuery({
    queryKey: ['repository', id],
    queryFn: () => api.get(`/repositories/${id}`),
  });

  const { data: tasksData, isLoading: loadingTasks } = useQuery({
    queryKey: ['tasks', id],
    queryFn: () => api.get('/tasks', { params: { repositoryId: id } }),
  });

  const analyzeMutation = useMutation({
    mutationFn: () => api.post(`/repositories/${id}/analyze`),
    onSuccess: (res) => {
      alert(`Identified ${res.data.count} legitimate maintenance tasks!`);
      queryClient.invalidateQueries(['tasks', id]);
      queryClient.invalidateQueries(['repository', id]);
    },
    onError: (err) => alert(err.message),
  });

  const repo = repoData?.data;
  const tasks = tasksData?.data?.tasks || [];

  if (loadingRepo) {
    return <div className="py-20 text-center text-[#8b949e]">Loading repository details...</div>;
  }

  if (!repo) {
    return (
      <div className="py-20 text-center">
        <p className="text-white font-semibold">Repository not found.</p>
        <Link to="/repositories" className="text-xs text-[#58a6ff] hover:underline mt-2 inline-block">
          Return to Repositories
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between pb-4 border-b border-[#30363d]">
        <div className="flex items-center gap-3">
          <Link
            to="/repositories"
            className="p-2 bg-[#21262d] hover:bg-[#30363d] rounded-lg text-[#8b949e] hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">{repo.name}</h1>
              <span className="text-xs px-2 py-0.5 rounded bg-[#21262d] border border-[#30363d] text-[#8b949e]">
                {repo.visibility}
              </span>
            </div>
            <p className="text-xs text-[#8b949e] mt-0.5">{repo.fullName}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={repo.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-white text-xs font-medium border border-[#30363d] transition"
          >
            <span>GitHub</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={() => analyzeMutation.mutate()}
            disabled={analyzeMutation.isPending}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-medium transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${analyzeMutation.isPending ? 'animate-spin' : ''}`} />
            <span>Analyze Codebase</span>
          </button>
        </div>
      </div>

      {/* Meta Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d]">
          <p className="text-xs text-[#8b949e]">Default Branch</p>
          <div className="flex items-center gap-1.5 mt-1 text-sm font-semibold text-white">
            <GitBranch className="w-4 h-4 text-[#58a6ff]" />
            <span>{repo.defaultBranch}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d]">
          <p className="text-xs text-[#8b949e]">Language</p>
          <p className="mt-1 text-sm font-semibold text-white">{repo.language || 'Standard'}</p>
        </div>

        <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d]">
          <p className="text-xs text-[#8b949e]">Last Analyzed</p>
          <p className="mt-1 text-sm font-semibold text-white">
            {repo.lastAnalyzedAt ? new Date(repo.lastAnalyzedAt).toLocaleString() : 'Never'}
          </p>
        </div>
      </div>

      {/* Proposed & Pending Tasks Section */}
      <div className="p-6 rounded-xl bg-[#161b22] border border-[#30363d]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">Maintenance Tasks</h2>
          <span className="text-xs text-[#8b949e]">{tasks.length} total tasks</span>
        </div>

        {tasks.length === 0 ? (
          <p className="text-xs text-[#8b949e] py-8 text-center">
            No maintenance tasks recorded for this repository yet. Click "Analyze Codebase" to run health checks.
          </p>
        ) : (
          <div className="divide-y divide-[#30363d]">
            {tasks.map((task) => (
              <div key={task._id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-white">{task.title}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                        task.riskLevel === 'low'
                          ? 'bg-[#238636]/10 text-[#2ea043] border border-[#238636]/30'
                          : 'bg-[#e3b341]/10 text-[#e3b341] border border-[#e3b341]/30'
                      }`}
                    >
                      {task.riskLevel} risk
                    </span>
                  </div>
                  <p className="text-xs text-[#8b949e] mt-1">{task.description}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      task.status === 'completed'
                        ? 'bg-[#238636]/20 text-[#2ea043]'
                        : task.approvalStatus === 'approved'
                        ? 'bg-[#58a6ff]/20 text-[#58a6ff]'
                        : 'bg-[#e3b341]/20 text-[#e3b341]'
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

