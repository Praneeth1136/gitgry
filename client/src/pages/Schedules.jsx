import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import {
  Calendar,
  Plus,
  Trash2,
  Clock,
  Globe,
  FolderGit2,
  Check,
} from 'lucide-react';

const DAYS = [
  { val: 1, label: 'Mon' },
  { val: 2, label: 'Tue' },
  { val: 3, label: 'Wed' },
  { val: 4, label: 'Thu' },
  { val: 5, label: 'Fri' },
  { val: 6, label: 'Sat' },
  { val: 0, label: 'Sun' },
];

export function Schedules() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5]);

  const { data: schedulesData, isLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => api.get('/schedules'),
  });

  const { data: reposData } = useQuery({
    queryKey: ['repositories-list'],
    queryFn: () => api.get('/repositories'),
  });

  const createScheduleMutation = useMutation({
    mutationFn: (newSchedule) => api.post('/schedules', newSchedule),
    onSuccess: () => {
      queryClient.invalidateQueries(['schedules']);
      setIsModalOpen(false);
    },
    onError: (err) => alert(err.message),
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: (id) => api.delete(`/schedules/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['schedules']),
  });

  const toggleScheduleMutation = useMutation({
    mutationFn: ({ id, enabled }) => api.patch(`/schedules/${id}`, { enabled }),
    onSuccess: () => queryClient.invalidateQueries(['schedules']),
  });

  const schedules = schedulesData?.data || [];
  const repos = reposData?.data?.repositories || [];

  const handleCreate = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const repoIds = formData.getAll('repoIds');

    if (repoIds.length === 0) {
      alert('Please select at least one repository');
      return;
    }
    if (selectedDays.length === 0) {
      alert('Please select at least one day of the week');
      return;
    }

    createScheduleMutation.mutate({
      repositoryIds: repoIds,
      executionTime: formData.get('executionTime'),
      timezone: formData.get('timezone') || 'UTC',
      daysOfWeek: selectedDays,
      enabled: true,
    });
  };

  const toggleDay = (dayVal) => {
    if (selectedDays.includes(dayVal)) {
      setSelectedDays(selectedDays.filter((d) => d !== dayVal));
    } else {
      setSelectedDays([...selectedDays, dayVal]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#30363d]">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Maintenance Schedules</h1>
          <p className="text-sm text-[#8b949e] mt-1">
            Automate daily execution routines synchronized with GitHub Actions cloud cron runners.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white text-sm font-medium shadow transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Schedule</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-[#8b949e]">Loading schedules...</div>
      ) : schedules.length === 0 ? (
        <div className="p-12 text-center bg-[#161b22] border border-[#30363d] rounded-2xl">
          <Calendar className="w-12 h-12 text-[#8b949e] mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No Schedules Configured</h3>
          <p className="text-xs text-[#8b949e] mt-1 max-w-sm mx-auto mb-6">
            Create a recurring schedule to automatically plan and inspect your repositories on regular days.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-[#238636] hover:bg-[#2ea043] text-white text-sm font-medium rounded-lg"
          >
            Create Schedule
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schedules.map((schedule) => (
            <div
              key={schedule._id}
              className="p-5 rounded-xl bg-[#161b22] border border-[#30363d] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#58a6ff]" />
                    <span className="text-lg font-bold text-white">{schedule.executionTime}</span>
                    <span className="text-xs text-[#8b949e]">({schedule.timezone})</span>
                  </div>
                  <button
                    onClick={() =>
                      toggleScheduleMutation.mutate({ id: schedule._id, enabled: !schedule.enabled })
                    }
                    className={`text-xs px-2.5 py-1 rounded-md font-medium border ${
                      schedule.enabled
                        ? 'bg-[#238636]/20 text-[#2ea043] border-[#238636]/40'
                        : 'bg-[#21262d] text-[#8b949e] border-[#30363d]'
                    }`}
                  >
                    {schedule.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                {/* Days of week pill list */}
                <div className="flex items-center gap-1.5 mb-4">
                  {DAYS.map((d) => {
                    const isActive = schedule.daysOfWeek?.includes(d.val);
                    return (
                      <span
                        key={d.val}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          isActive
                            ? 'bg-[#58a6ff]/20 text-[#58a6ff] border border-[#58a6ff]/30'
                            : 'bg-[#21262d] text-[#484f58]'
                        }`}
                      >
                        {d.label}
                      </span>
                    );
                  })}
                </div>

                <div className="text-xs text-[#8b949e]">
                  <p className="font-semibold text-[#c9d1d9] mb-1">Target Repositories:</p>
                  <p className="truncate">
                    {schedule.repositoryIds?.map((r) => r.name).join(', ') || 'None selected'}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#30363d] flex justify-end">
                <button
                  onClick={() => deleteScheduleMutation.mutate(schedule._id)}
                  className="p-1.5 text-[#8b949e] hover:text-[#f85149] hover:bg-[#21262d] rounded-md transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-[#30363d]">
              <h3 className="text-base font-bold text-white">Create New Schedule</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#8b949e] hover:text-white font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 my-4">
              <div>
                <label className="block text-xs font-semibold text-[#8b949e] uppercase mb-1">
                  Execution Time
                </label>
                <input
                  type="time"
                  name="executionTime"
                  defaultValue="09:00"
                  required
                  className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-white focus:outline-none focus:border-[#58a6ff]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8b949e] uppercase mb-1">
                  Timezone
                </label>
                <input
                  type="text"
                  name="timezone"
                  defaultValue="IST"
                  list="sched-timezone-options"
                  placeholder="IST (Asia/Kolkata)"
                  className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-white focus:outline-none focus:border-[#58a6ff]"
                />
                <datalist id="sched-timezone-options">
                  <option value="IST">IST (Indian Standard Time)</option>
                  <option value="Asia/Kolkata">Asia/Kolkata</option>
                  <option value="UTC">UTC</option>
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8b949e] uppercase mb-2">
                  Active Days
                </label>
                <div className="flex items-center gap-1.5">
                  {DAYS.map((d) => {
                    const isSelected = selectedDays.includes(d.val);
                    return (
                      <button
                        type="button"
                        key={d.val}
                        onClick={() => toggleDay(d.val)}
                        className={`text-xs px-2.5 py-1 rounded font-medium border transition ${
                          isSelected
                            ? 'bg-[#238636] text-white border-[#2ea043]'
                            : 'bg-[#21262d] text-[#8b949e] border-[#30363d]'
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8b949e] uppercase mb-2">
                  Target Repositories
                </label>
                <div className="max-h-36 overflow-y-auto space-y-1.5 bg-[#0d1117] p-3 rounded-lg border border-[#30363d]">
                  {repos.map((repo) => (
                    <label key={repo._id} className="flex items-center gap-2 text-xs text-[#c9d1d9] cursor-pointer">
                      <input
                        type="checkbox"
                        name="repoIds"
                        value={repo._id}
                        defaultChecked={true}
                        className="w-4 h-4 accent-[#238636] rounded"
                      />
                      <span>{repo.fullName}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#30363d] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-[#21262d] text-[#c9d1d9] hover:bg-[#30363d] text-xs font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createScheduleMutation.isPending}
                  className="px-4 py-2 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold rounded-lg"
                >
                  {createScheduleMutation.isPending ? 'Saving...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

