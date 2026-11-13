import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import {
  Bot,
  Sliders,
  CheckSquare,
  Play,
  Pause,
  Sparkles,
  Check,
  X,
  FileCode,
  AlertCircle,
  Eye,
  ShieldAlert,
} from 'lucide-react';

export function Automation() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('config'); // 'config' | 'approvals'
  const [diffModalTask, setDiffModalTask] = useState(null);

  // Automation config query
  const { data: configData, isLoading: loadingConfig } = useQuery({
    queryKey: ['automation-config'],
    queryFn: () => api.get('/automation/config'),
  });

  // Pending tasks query for approvals
  const { data: tasksData, isLoading: loadingTasks } = useQuery({
    queryKey: ['tasks-pending'],
    queryFn: () => api.get('/tasks', { params: { approvalStatus: 'pending' } }),
  });

  // Save config mutation
  const saveConfigMutation = useMutation({
    mutationFn: (newConfig) => api.put('/automation/config', newConfig),
    onSuccess: () => {
      alert('Automation settings updated successfully!');
      queryClient.invalidateQueries(['automation-config']);
    },
    onError: (err) => alert(err.message),
  });

  // Task Approve mutation
  const approveMutation = useMutation({
    mutationFn: (taskId) => api.post(`/tasks/${taskId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks-pending']);
      queryClient.invalidateQueries(['analytics-overview']);
    },
  });

  // Task Reject mutation
  const rejectMutation = useMutation({
    mutationFn: (taskId) => api.post(`/tasks/${taskId}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks-pending']);
      queryClient.invalidateQueries(['analytics-overview']);
    },
  });

  // Execute single task mutation
  const executeTaskMutation = useMutation({
    mutationFn: (taskId) => api.post(`/tasks/${taskId}/execute`),
    onSuccess: () => {
      alert('Execution dispatched to GitHub Actions runner!');
      queryClient.invalidateQueries(['tasks-pending']);
      queryClient.invalidateQueries(['executions']);
      queryClient.invalidateQueries(['analytics-overview']);
    },
    onError: (err) => alert(`Execution failed: ${err.message}`),
  });

  const config = configData?.data || {};
  const pendingTasks = tasksData?.data?.tasks || [];

  const handleConfigSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const min = parseInt(formData.get('minimumTasks'), 10);
    const max = parseInt(formData.get('maximumTasks'), 10);

    if (min > max) {
      alert('Minimum tasks cannot be greater than Maximum tasks');
      return;
    }

    saveConfigMutation.mutate({
      enabled: formData.get('enabled') === 'on',
      minimumTasks: min,
      maximumTasks: max,
      preferredExecutionTime: formData.get('preferredExecutionTime'),
      timezone: formData.get('timezone'),
      requireApproval: formData.get('requireApproval') === 'on',
      allowedMaintenanceTypes: formData.getAll('maintenanceTypes'),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#30363d]">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Automation & Approvals</h1>
          <p className="text-sm text-[#8b949e] mt-1">
            Configure daily targets, safety thresholds, and review proposed code changes.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 bg-[#161b22] p-1 rounded-xl border border-[#30363d]">
          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'config'
                ? 'bg-[#21262d] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
          <button
            onClick={() => setActiveTab('approvals')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'approvals'
                ? 'bg-[#21262d] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-white'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Pending Approvals ({pendingTasks.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'config' ? (
        /* Configuration Form */
        <div className="max-w-2xl bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleConfigSubmit} className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#30363d]">
              <div>
                <p className="font-semibold text-white text-sm">Enable Automation Engine</p>
                <p className="text-xs text-[#8b949e]">Allow scheduled analysis and maintenance planning</p>
              </div>
              <input
                type="checkbox"
                name="enabled"
                defaultChecked={config.enabled}
                className="w-5 h-5 accent-[#238636] rounded"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#8b949e] uppercase mb-1.5">
                  Daily Min Tasks
                </label>
                <input
                  type="number"
                  name="minimumTasks"
                  min="1"
                  max="20"
                  defaultValue={config.minimumTasks || 2}
                  className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-white focus:outline-none focus:border-[#58a6ff]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8b949e] uppercase mb-1.5">
                  Daily Max Tasks
                </label>
                <input
                  type="number"
                  name="maximumTasks"
                  min="1"
                  max="30"
                  defaultValue={config.maximumTasks || 6}
                  className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-white focus:outline-none focus:border-[#58a6ff]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#8b949e] uppercase mb-1.5">
                  Preferred Run Time
                </label>
                <input
                  type="time"
                  name="preferredExecutionTime"
                  defaultValue={config.preferredExecutionTime || '09:00'}
                  className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-white focus:outline-none focus:border-[#58a6ff]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8b949e] uppercase mb-1.5">
                  Timezone
                </label>
                <input
                  type="text"
                  name="timezone"
                  defaultValue={config.timezone || 'IST'}
                  list="timezone-options"
                  placeholder="IST (Asia/Kolkata)"
                  className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-white focus:outline-none focus:border-[#58a6ff]"
                />
                <datalist id="timezone-options">
                  <option value="IST">IST (Indian Standard Time)</option>
                  <option value="Asia/Kolkata">Asia/Kolkata</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">EST (New York)</option>
                  <option value="America/Los_Angeles">PST (Los Angeles)</option>
                </datalist>
              </div>
            </div>

            <div className="flex items-center justify-between py-4 border-y border-[#30363d]">
              <div>
                <p className="font-semibold text-white text-sm">Require Approval Before Commits</p>
                <p className="text-xs text-[#8b949e]">
                  Enforces human review. Tasks will not push until you approve their diff.
                </p>
              </div>
              <input
                type="checkbox"
                name="requireApproval"
                defaultChecked={config.requireApproval ?? true}
                className="w-5 h-5 accent-[#238636] rounded"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8b949e] uppercase mb-3">
                Allowed Maintenance Types
              </label>
              <div className="space-y-2">
                {[
                  { id: 'documentation', label: 'Documentation Improvements (README, Guides)' },
                  { id: 'lint_format', label: 'Code Formatting & Whitespace Normalization' },
                  { id: 'config_maintenance', label: 'Config Hygiene (.editorconfig, .gitignore)' },
                  { id: 'testing', label: 'Test Coverage & Quality Scripts' },
                ].map((type) => (
                  <label key={type.id} className="flex items-center gap-3 text-xs text-[#c9d1d9] cursor-pointer">
                    <input
                      type="checkbox"
                      name="maintenanceTypes"
                      value={type.id}
                      defaultChecked={config.allowedMaintenanceTypes?.includes(type.id)}
                      className="w-4 h-4 accent-[#238636] rounded"
                    />
                    <span>{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saveConfigMutation.isPending}
                className="px-5 py-2.5 rounded-xl bg-[#238636] hover:bg-[#2ea043] text-white text-sm font-semibold shadow transition"
              >
                {saveConfigMutation.isPending ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Approvals Center View */
        <div className="space-y-4">
          {pendingTasks.length === 0 ? (
            <div className="p-12 text-center bg-[#161b22] border border-[#30363d] rounded-2xl">
              <CheckSquare className="w-10 h-10 text-[#2ea043] mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white">All Clear!</h3>
              <p className="text-xs text-[#8b949e] mt-1">No proposed maintenance tasks awaiting approval.</p>
            </div>
          ) : (
            pendingTasks.map((task) => (
              <div
                key={task._id}
                className="p-5 rounded-xl bg-[#161b22] border border-[#30363d] flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">{task.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-semibold uppercase bg-[#238636]/10 text-[#2ea043] border border-[#238636]/30">
                      {task.riskLevel} risk
                    </span>
                  </div>
                  <p className="text-xs text-[#8b949e] mt-1">{task.description}</p>
                  <p className="text-[11px] text-[#58a6ff] mt-1">
                    Repository: {task.repositoryId?.fullName || 'Target Repo'} &bull; Files:{' '}
                    {task.affectedFiles?.join(', ') || 'None'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setDiffModalTask(task)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-white text-xs border border-[#30363d] transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Diff</span>
                  </button>

                  <button
                    onClick={() => approveMutation.mutate(task._id)}
                    disabled={approveMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-medium transition"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>

                  <button
                    onClick={() => rejectMutation.mutate(task._id)}
                    disabled={rejectMutation.isPending}
                    className="p-1.5 rounded-lg bg-[#21262d] hover:bg-[#f85149]/20 text-[#8b949e] hover:text-[#f85149] transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Diff Preview Modal */}
      {diffModalTask && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-4 border-b border-[#30363d]">
              <div>
                <h3 className="text-base font-bold text-white">{diffModalTask.title}</h3>
                <p className="text-xs text-[#8b949e] mt-0.5">
                  File: {diffModalTask.proposedChanges?.file || 'Target File'}
                </p>
              </div>
              <button
                onClick={() => setDiffModalTask(null)}
                className="text-[#8b949e] hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="my-4 overflow-y-auto flex-1 font-mono text-xs bg-[#0d1117] p-4 rounded-xl border border-[#30363d] text-[#c9d1d9] whitespace-pre-wrap">
              {diffModalTask.proposedChanges?.diff || 'No textual diff available.'}
            </div>

            <div className="pt-3 border-t border-[#30363d] flex items-center justify-between">
              <span className="text-xs text-[#2ea043] flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Verified Non-Breaking Modification
              </span>
              <button
                onClick={() => {
                  approveMutation.mutate(diffModalTask._id);
                  setDiffModalTask(null);
                }}
                className="px-4 py-2 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold rounded-lg"
              >
                Approve Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

