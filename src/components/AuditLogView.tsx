import React, { useState, useEffect } from 'react';
import {
  History,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  RefreshCw,
  Clock,
  Terminal,
} from 'lucide-react';
import { AuditLog } from '../types/student.ts';
import { fetchAuditLogs } from '../utils/api.ts';

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filterAction, setFilterAction] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await fetchAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleCopyQuery = (id: string, query: string) => {
    navigator.clipboard.writeText(query);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredLogs = logs.filter((log) => {
    if (filterAction === 'All') return true;
    return log.action === filterAction;
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E6EAF1] gap-2">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#808495]">
            <span>Security & Data Compliance</span>
            <span>•</span>
            <span className="text-[#7C4DFF] font-semibold">{filteredLogs.length} audit entries</span>
          </div>
          <h2 className="text-2xl font-bold text-[#31333F] flex items-center gap-2">
            <History className="w-6 h-6 text-[#7C4DFF]" />
            <span>Database SQL Audit Log</span>
          </h2>
          <p className="text-xs text-[#808495] mt-1">
            Tamper-evident record of all Student record creations, secret-key authorized updates, deletions, and raw SQL queries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="py-1.5 px-2.5 text-xs bg-white border border-[#D6DADE] rounded"
          >
            <option value="All">All Operations</option>
            <option value="UPDATE">UPDATE (Secret Key)</option>
            <option value="DELETE">DELETE (Secret Key)</option>
            <option value="BULK_DELETE">BULK DELETE</option>
            <option value="INSERT">INSERT</option>
            <option value="SQL_EXECUTE">RAW SQL</option>
          </select>

          <button
            onClick={loadLogs}
            disabled={loading}
            className="p-1.5 rounded border border-[#D6DADE] bg-white text-[#555] hover:bg-[#F0F2F6]"
            title="Refresh Logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-[#E6EAF1] rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F8F9FB] border-b border-[#E6EAF1] text-[#555] font-semibold">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Target</th>
                <th className="py-2.5 px-3">Details</th>
                <th className="py-2.5 px-3">Secret Key Gate</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Executed SQL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6EAF1]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#808495]">
                    No audit records matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F8F9FB]">
                    <td className="py-2 px-3 font-mono text-[#808495] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2 px-3">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="py-2 px-3 font-mono font-medium text-[#00618A] whitespace-nowrap">
                      {log.target}
                    </td>
                    <td className="py-2 px-3 text-[#31333F] max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {log.secretKeyUsed ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>Authorized</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#808495] bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                          <span>Standard</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          log.success
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {log.success ? 'SUCCESS' : 'FAILED'}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5">
                        <code className="text-[11px] font-mono text-[#555] bg-[#F8F9FB] px-1.5 py-0.5 rounded max-w-[200px] truncate block border border-[#E6EAF1]">
                          {log.sqlQuery}
                        </code>
                        <button
                          onClick={() => handleCopyQuery(log.id, log.sqlQuery)}
                          title="Copy Full SQL"
                          className="p-1 rounded text-[#808495] hover:text-[#31333F]"
                        >
                          {copiedId === log.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ActionBadge: React.FC<{ action: string }> = ({ action }) => {
  switch (action) {
    case 'INSERT':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 font-mono">
          INSERT
        </span>
      );
    case 'UPDATE':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 font-mono">
          UPDATE
        </span>
      );
    case 'DELETE':
    case 'BULK_DELETE':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 font-mono">
          {action}
        </span>
      );
    case 'SQL_EXECUTE':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 font-mono">
          SQL EXEC
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-800 font-mono">
          {action}
        </span>
      );
  }
};
