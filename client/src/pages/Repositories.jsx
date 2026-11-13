import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  FolderGit2,
  Plus,
  Search,
  ExternalLink,
  Trash2,
  Check,
  RefreshCw,
  GitBranch,
  Lock,
  Globe,
  SlidersHorizontal,
} from 'lucide-react';

export function Repositories() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterVisibility, setFilterVisibility] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Managed repos query
  const { data: managedData, isLoading: loadingManaged } = useQuery({
    queryKey: ['repositories', search, filterVisibility],
    queryFn: () =>
      api.get('/repositories', {
        params: {
          search: search || undefined,
          visibility: filterVisibility || undefined,
        },
      }),
  });

  // Available repos on user's GitHub query
  const { data: availableData, isLoading: loadingAvailable, refetch: refetchAvailable } = useQuery({
    queryKey: ['repositories-available'],
    queryFn: () => api.get('/repositories/available'),
    enabled: isAddModalOpen,
  });

  // Add repo mutation
  const addRepoMutation = useMutation({
    mutationFn: (repo) => api.post('/repositories', repo),
    onSuccess: () => {
      queryClient.invalidateQueries(['repositories']);
      queryClient.invalidateQueries(['repositories-available']);
      queryClient.invalidateQueries(['analytics-overview']);
    },
    onError: (err) => alert(`Failed to add repository: ${err.message}`),
  });

  // Toggle enable mutation
  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }) => api.patch(`/repositories/${id}`, { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries(['repositories']);
      queryClient.invalidateQueries(['analytics-overview']);
    },
  });

  // Delete repo mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/repositories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['repositories']);
      queryClient.invalidateQueries(['analytics-overview']);
    },
  });

  // Analyze repo mutation
  const analyzeMutation = useMutation({
    mutationFn: (id) => api.post(`/repositories/${id}/analyze`),
    onSuccess: (data) => {
      alert(`Analysis complete! Identified ${data.data.count} legitimate maintenance tasks.`);
      queryClient.invalidateQueries(['tasks']);
      queryClient.invalidateQueries(['analytics-overview']);
    },
    onError: (err) => alert(`Analysis failed: ${err.message}`),
  });

  const repositories = managedData?.data?.repositories || [];
  const availableRepos = availableData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#30363d]">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Connected Repositories</h1>
          <p className="text-sm text-[#8b949e] mt-1">
            Manage repositories scheduled for automated analysis and cloud maintenance.
          </p>
        </div>

        <button
          onClick={() => {
            setIsAddModalOpen(true);
            refetchAvailable();
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white text-sm font-medium shadow transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Repository</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#8b949e] absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search repositories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#161b22] border border-[#30363d] rounded-lg text-sm text-white placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff]"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={filterVisibility}
            onChange={(e) => setFilterVisibility(e.target.value)}
            className="px-3 py-2 bg-[#161b22] border border-[#30363d] rounded-lg text-xs text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]"
          >
            <option value="">All Visibilities</option>
            <option value="public">Public Only</option>
            <option value="private">Private Only</option>
          </select>
        </div>
      </div>

      {/* Repositories Grid */}
      {loadingManaged ? (
        <div className="py-20 text-center text-[#8b949e]">Loading managed repositories...</div>
      ) : repositories.length === 0 ? (
        <div className="p-12 text-center bg-[#161b22] border border-[#30363d] rounded-xl">
          <FolderGit2 className="w-12 h-12 text-[#8b949e] mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No Repositories Connected</h3>
          <p className="text-sm text-[#8b949e] max-w-sm mx-auto mt-1 mb-6">
            Add repositories from your GitHub account to enable daily health checks and automated maintenance.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-[#238636] hover:bg-[#2ea043] text-white text-sm font-medium rounded-lg"
          >
            Connect First Repository
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {repositories.map((repo) => (
            <div
              key={repo._id}
              className="p-5 rounded-xl bg-[#161b22] border border-[#30363d] flex flex-col justify-between hover:border-[#8b949e]/50 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Link
                    to={`/repositories/${repo._id}`}
                    className="font-semibold text-white text-base hover:text-[#58a6ff] truncate"
                  >
                    {repo.fullName}
                  </Link>
                  <span
                    className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold border ${
                      repo.visibility === 'private'
                        ? 'bg-[#bc8cff]/10 text-[#bc8cff] border-[#bc8cff]/30'
                        : 'bg-[#238636]/10 text-[#2ea043] border-[#238636]/30'
                    }`}
                  >
                    {repo.visibility}
                  </span>
                </div>

                <p className="text-xs text-[#8b949e] line-clamp-2 min-h-[32px] mb-4">
                  {repo.description || 'No description provided.'}
                </p>

                <div className="flex items-center gap-4 text-xs text-[#8b949e] mb-4">
                  <div className="flex items-center gap-1">
                    <GitBranch className="w-3.5 h-3.5" />
                    <span>{repo.defaultBranch}</span>
                  </div>
                  <span>&bull;</span>
                  <span>{repo.language || 'Code'}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#30363d] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleMutation.mutate({ id: repo._id, enabled: !repo.enabled })}
                    className={`text-xs px-2.5 py-1 rounded-md font-medium border transition ${
                      repo.enabled
                        ? 'bg-[#238636]/20 text-[#2ea043] border-[#238636]/40'
                        : 'bg-[#21262d] text-[#8b949e] border-[#30363d]'
                    }`}
                  >
                    {repo.enabled ? 'Active' : 'Paused'}
                  </button>

                  <button
                    onClick={() => analyzeMutation.mutate(repo._id)}
                    title="Analyze for legitimate tasks"
                    disabled={analyzeMutation.isPending}
                    className="p-1.5 text-[#8b949e] hover:text-[#58a6ff] hover:bg-[#21262d] rounded-md transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${analyzeMutation.isPending ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <a
                    href={repo.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-[#8b949e] hover:text-white hover:bg-[#21262d] rounded-md transition"
                    title="Open on GitHub"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => {
                      if (confirm(`Remove ${repo.fullName} from GitGry?`)) {
                        deleteMutation.mutate(repo._id);
                      }
                    }}
                    className="p-1.5 text-[#8b949e] hover:text-[#f85149] hover:bg-[#21262d] rounded-md transition"
                    title="Remove Repository"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Repository Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-[#30363d]">
              <div>
                <h3 className="text-lg font-bold text-white">Add Repositories from GitHub</h3>
                <p className="text-xs text-[#8b949e] mt-0.5">Select repositories to manage with GitGry</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#8b949e] hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="overflow-y-auto flex-1 my-4 divide-y divide-[#30363d]">
              {loadingAvailable ? (
                <div className="py-12 text-center text-[#8b949e]">Fetching repositories from GitHub...</div>
              ) : availableRepos.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#8b949e]">No additional repositories available.</div>
              ) : (
                availableRepos.map((repo) => (
                  <div key={repo.githubRepoId} className="py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{repo.fullName}</p>
                      <p className="text-xs text-[#8b949e] truncate">{repo.description || 'No description'}</p>
                    </div>

                    <button
                      onClick={() => addRepoMutation.mutate(repo)}
                      disabled={repo.isManaged || addRepoMutation.isPending}
                      className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        repo.isManaged
                          ? 'bg-[#21262d] text-[#8b949e] border border-[#30363d] cursor-not-allowed'
                          : 'bg-[#238636] hover:bg-[#2ea043] text-white'
                      }`}
                    >
                      {repo.isManaged ? 'Connected' : 'Connect'}
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-[#30363d] flex justify-end">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-white text-xs font-medium rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

