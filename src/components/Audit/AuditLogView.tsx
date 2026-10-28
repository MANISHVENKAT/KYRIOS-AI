import React, { useState } from 'react';
import { AuditLogEntry } from '../../types';
import { StorageService } from '../../services/storage';
import {
  History,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Trash2,
  Terminal
} from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>(StorageService.getAuditLogs());
  const [filter, setFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const filteredLogs = logs.filter(l => {
    if (filter === 'all') return true;
    return l.status === filter;
  });

  const handleClearLogs = () => {
    if (confirm('Clear audit activity log?')) {
      localStorage.removeItem('kyrios_audit_logs');
      setLogs([]);
      setSelectedLog(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#111827]/80 border border-white/5 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Transparency & Verification</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Action Audit Trail</h1>
          <p className="text-xs md:text-sm text-slate-400 max-w-xl">
            KYRIOS never runs consequential actions invisibly. Every proposed tool execution, task creation, or memory commitment is logged here.
          </p>
        </div>

        <button
          onClick={handleClearLogs}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-rose-300 text-xs font-semibold transition-all self-start md:self-auto"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear Logs</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-2 bg-[#111827]/60 rounded-2xl border border-white/5">
        {['all', 'approved', 'executed', 'rejected'].map((st) => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase font-mono transition-all ${
              filter === st ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Log Feed */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-[#111827]/40 border border-white/5 text-slate-400 text-xs">
            No audit records found matching this filter.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
              className="p-4 rounded-2xl bg-[#111827]/70 border border-white/5 hover:border-white/15 transition-all cursor-pointer space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg ${
                    log.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                    log.status === 'executed' ? 'bg-indigo-500/20 text-indigo-400' :
                    'bg-rose-500/20 text-rose-400'
                  }`}>
                    {log.status === 'approved' || log.status === 'executed' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-white uppercase">{log.actionType}</span>
                    <p className="text-xs text-slate-300 mt-0.5">{log.summary}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                  <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                    log.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300' :
                    log.status === 'executed' ? 'bg-indigo-500/20 text-indigo-300' :
                    'bg-rose-500/20 text-rose-300'
                  }`}>
                    {log.status}
                  </span>
                </div>
              </div>

              {/* Expanded details */}
              {selectedLog?.id === log.id && log.details && (
                <div className="mt-3 p-3 rounded-xl bg-black/40 border border-white/5 font-mono text-xs text-slate-300 overflow-x-auto">
                  <pre>{JSON.stringify(log.details, null, 2)}</pre>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
