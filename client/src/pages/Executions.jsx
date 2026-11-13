import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import {
  History,
  ExternalLink,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Terminal,
} from 'lucide-react';

export function Executions() {
  const [selectedLogsExec, setSelectedLogsExec] = useState(null);

  const { data: executionsData, isLoading } = useQuery({
    queryKey: ['executions'],
    queryFn: () => api.get('/executions'),
  });

  const executions = executionsData?.data?.executions || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#30363d]">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Execution History</h1>
          <p className="text-sm text-[#8b949e] mt-1">
            Audit log of all dispatched maintenance tasks and GitHub Actions workflow executions.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-[#8b949e]">Loading executions...</div>
      ) : executions.length === 0 ? (
        <div className="p-12 text-center bg-[#161b22] border border-[#30363d] rounded-2xl">
          <History className="w-12 h-12 text-[#8b949e] mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No Executions Found</h3>
          <p className="text-xs text-[#8b949e] mt-1">
            Executions will appear here as soon as approved tasks are triggered.
          </p>
        </div>
      ) : (
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0d1117] text-[#8b949e] uppercase font-semibold border-b border-[#30363d]">
                <tr>
                  <th className="py-3 px-4">Repository</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Tasks</th>
                  <th className="py-3 px-4">Started</th>
                  <th className="py-3 px-4">Completed</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#30363d] text-[#c9d1d9]">
                {executions.map((exec) => (
                  <tr key={exec._id} className="hover:bg-[#21262d]/40 transition">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {exec.repositoryId?.fullName || 'Target Repo'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full font-medium ${
                          exec.status === 'completed'
                            ? 'bg-[#238636]/20 text-[#2ea043] border border-[#238636]/40'
                            : exec.status === 'running'
                            ? 'bg-[#58a6ff]/20 text-[#58a6ff] border border-[#58a6ff]/40 animate-pulse'
                            : 'bg-[#f85149]/20 text-[#f85149] border border-[#f85149]/40'
                        }`}
                      >
                        {exec.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {exec.successfulTasks} / {exec.totalTasks} passed
                    </td>
                    <td className="py-3.5 px-4 text-[#8b949e]">
                      {new Date(exec.startedAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-[#8b949e]">
                      {exec.completedAt ? new Date(exec.completedAt).toLocaleString() : 'In Progress'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedLogsExec(exec)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#21262d] hover:bg-[#30363d] text-white rounded text-xs transition"
                      >
                        <Terminal className="w-3.5 h-3.5" />
                        <span>Logs</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Execution Logs Modal */}
      {selectedLogsExec && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-4 border-b border-[#30363d]">
              <div>
                <h3 className="text-base font-bold text-white">Execution Logs</h3>
                <p className="text-xs text-[#8b949e] mt-0.5">
                  ID: {selectedLogsExec._id} &bull; Repo: {selectedLogsExec.repositoryId?.fullName}
                </p>
              </div>
              <button
                onClick={() => setSelectedLogsExec(null)}
                className="text-[#8b949e] hover:text-white font-bold"
              >
                &times;
              </button>
            </div>

            <div className="my-4 overflow-y-auto flex-1 font-mono text-xs bg-[#0d1117] p-4 rounded-xl border border-[#30363d] text-[#c9d1d9] space-y-1">
              {selectedLogsExec.logs && selectedLogsExec.logs.length > 0 ? (
                selectedLogsExec.logs.map((logLine, idx) => (
                  <p key={idx} className="leading-relaxed">
                    <span className="text-[#8b949e] mr-2">[{idx + 1}]</span>
                    {logLine}
                  </p>
                ))
              ) : (
                <p className="text-[#8b949e]">No log entries recorded.</p>
              )}
              {selectedLogsExec.errorMessage && (
                <p className="text-[#f85149] mt-2 font-semibold">
                  Error: {selectedLogsExec.errorMessage}
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-[#30363d] flex justify-end">
              <button
                onClick={() => setSelectedLogsExec(null)}
                className="px-4 py-2 bg-[#21262d] text-white hover:bg-[#30363d] text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

