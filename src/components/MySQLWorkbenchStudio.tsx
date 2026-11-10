import React, { useState, useEffect } from 'react';
import {
  Database,
  Play,
  Download,
  Copy,
  Check,
  Server,
  Layers,
  Code,
  CheckCircle,
  AlertCircle,
  Clock,
  Table,
  FileCode,
  Terminal,
  ExternalLink,
} from 'lucide-react';
import { SQLQueryResult, MySQLConfig } from '../types/student.ts';
import { executeSQLApi, fetchMySQLConfig, testMySQLConnectionApi } from '../utils/api.ts';

const SAMPLE_QUERIES = [
  {
    label: 'All Students (GPA Desc)',
    query: 'SELECT * FROM students ORDER BY gpa DESC;',
  },
  {
    label: 'Department Aggregate Summary',
    query: 'SELECT department, count(*) FROM students GROUP BY department;',
  },
  {
    label: "Dean's Honor List (GPA >= 3.7)",
    query: "SELECT * FROM students WHERE gpa >= 3.7 AND status = 'Active';",
  },
  {
    label: 'Table Schema (DESCRIBE)',
    query: 'DESCRIBE students;',
  },
  {
    label: 'List Database Tables',
    query: 'SHOW TABLES;',
  },
];

export const MySQLWorkbenchStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'console' | 'schema' | 'export' | 'connect'>('console');
  const [sqlQuery, setSqlQuery] = useState<string>('SELECT * FROM students ORDER BY gpa DESC;');
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryResult, setQueryResult] = useState<SQLQueryResult | null>(null);
  const [copiedDump, setCopiedDump] = useState(false);
  const [sqlDumpContent, setSqlDumpContent] = useState<string>('');
  const [isLoadingDump, setIsLoadingDump] = useState(false);

  // Connection settings
  const [mysqlConfig, setMysqlConfig] = useState<MySQLConfig>({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'student_management_db',
    ssl: false,
    connected: false,
  });
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState<{ success: boolean; text: string } | null>(null);

  useEffect(() => {
    // Initial run default query
    handleRunQuery(sqlQuery);
    fetchMySQLConfig().then((cfg) => {
      if (cfg) setMysqlConfig((prev) => ({ ...prev, ...cfg }));
    });
  }, []);

  const handleRunQuery = async (queryToRun?: string) => {
    const q = queryToRun || sqlQuery;
    if (!q.trim()) return;

    setIsExecuting(true);
    try {
      const res = await executeSQLApi(q);
      setQueryResult(res);
    } catch (err: any) {
      setQueryResult({
        success: false,
        query: q,
        executionTimeMs: 0,
        error: err.message || 'SQL execution failed.',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleFetchDump = async () => {
    setIsLoadingDump(true);
    try {
      const res = await fetch('/api/mysql/export');
      const text = await res.text();
      setSqlDumpContent(text);
    } catch (err) {
      console.error('Failed to load dump', err);
    } finally {
      setIsLoadingDump(false);
    }
  };

  const handleCopyDump = () => {
    navigator.clipboard.writeText(sqlDumpContent);
    setCopiedDump(true);
    setTimeout(() => setCopiedDump(false), 2000);
  };

  const handleTestConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestingConnection(true);
    setConnectionMessage(null);

    try {
      const res = await testMySQLConnectionApi(mysqlConfig);
      setConnectionMessage({
        success: res.success,
        text: res.message,
      });
      if (res.success) {
        setMysqlConfig((prev) => ({ ...prev, connected: true }));
      }
    } catch (err: any) {
      setConnectionMessage({
        success: false,
        text: err.message || 'Connection test failed',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Title */}
      <div className="border-b border-[#E6EAF1] pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#808495]">
              <span>MySQL Workbench 8.0 Integration</span>
              <span>•</span>
              <span className="text-[#00618A] font-semibold">Schema: student_management_db</span>
            </div>
            <h2 className="text-2xl font-bold text-[#31333F] flex items-center gap-2">
              <Database className="w-6 h-6 text-[#00618A]" />
              <span>MySQL Workbench Database Studio</span>
            </h2>
            <p className="text-xs text-[#808495] mt-1">
              Live SQL query runner, MySQL Workbench DDL/DML schema inspector, and one-click database export.
            </p>
          </div>

          <a
            href="/api/mysql/export"
            download="student_management_workbench.sql"
            className="px-3 py-1.5 bg-[#00618A] hover:bg-[#004e70] text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .sql for MySQL Workbench</span>
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E6EAF1] text-xs font-medium gap-4">
        <button
          onClick={() => setActiveTab('console')}
          className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-colors ${
            activeTab === 'console'
              ? 'border-[#FF4B4B] text-[#FF4B4B] font-bold'
              : 'border-transparent text-[#808495] hover:text-[#31333F]'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Interactive SQL Query Console</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('export');
            if (!sqlDumpContent) handleFetchDump();
          }}
          className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-colors ${
            activeTab === 'export'
              ? 'border-[#FF4B4B] text-[#FF4B4B] font-bold'
              : 'border-transparent text-[#808495] hover:text-[#31333F]'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>MySQL Workbench Export (.sql)</span>
        </button>

        <button
          onClick={() => setActiveTab('schema')}
          className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-colors ${
            activeTab === 'schema'
              ? 'border-[#FF4B4B] text-[#FF4B4B] font-bold'
              : 'border-transparent text-[#808495] hover:text-[#31333F]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Table Schema & ERD</span>
        </button>

        <button
          onClick={() => setActiveTab('connect')}
          className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-colors ${
            activeTab === 'connect'
              ? 'border-[#FF4B4B] text-[#FF4B4B] font-bold'
              : 'border-transparent text-[#808495] hover:text-[#31333F]'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>MySQL Server Connection Bridge</span>
        </button>
      </div>

      {/* TAB 1: CONSOLE */}
      {activeTab === 'console' && (
        <div className="space-y-4">
          {/* Query Presets */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-[#808495] font-semibold">Presets:</span>
            {SAMPLE_QUERIES.map((sample) => (
              <button
                key={sample.label}
                onClick={() => {
                  setSqlQuery(sample.query);
                  handleRunQuery(sample.query);
                }}
                className="px-2.5 py-1 bg-[#F8F9FB] hover:bg-[#F0F2F6] text-[#31333F] rounded border border-[#E6EAF1] font-mono text-[11px] transition-colors"
              >
                {sample.label}
              </button>
            ))}
          </div>

          {/* SQL Editor Area */}
          <div className="bg-[#1E1E1E] rounded-lg p-3 border border-gray-800 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-400 pb-2 border-b border-gray-800">
              <span className="font-mono text-emerald-400 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-[#00618A]" />
                mysql&gt; Query Editor (student_management_db)
              </span>
              <span className="text-[11px]">Type any SQL command (SELECT, DESCRIBE, SHOW...)</span>
            </div>

            <textarea
              rows={4}
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              className="w-full bg-transparent text-emerald-300 font-mono text-xs focus:outline-none resize-y"
              placeholder="Enter standard MySQL query..."
            />

            <div className="flex items-center justify-between pt-2 border-t border-gray-800">
              <span className="text-[11px] text-gray-500 font-mono">
                Press Execute Query or select preset
              </span>

              <button
                onClick={() => handleRunQuery()}
                disabled={isExecuting}
                className="px-4 py-1.5 bg-[#FF4B4B] hover:bg-[#E03E3E] text-white text-xs font-bold rounded flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
              >
                {isExecuting ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                <span>Execute SQL Query (⚡)</span>
              </button>
            </div>
          </div>

          {/* Query Results */}
          {queryResult && (
            <div className="bg-white border border-[#E6EAF1] rounded-lg overflow-hidden shadow-xs space-y-2">
              {/* Results Header */}
              <div className="p-3 bg-[#F8F9FB] border-b border-[#E6EAF1] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-semibold flex items-center gap-1 ${
                      queryResult.success ? 'text-emerald-700' : 'text-red-700'
                    }`}
                  >
                    {queryResult.success ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span>{queryResult.success ? 'Query Succeeded' : 'Query Failed'}</span>
                  </span>

                  <span className="text-[#808495] font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {queryResult.executionTimeMs} ms
                  </span>

                  {queryResult.rowsAffected !== undefined && (
                    <span className="bg-[#E6EAF1] text-[#31333F] px-1.5 py-0.2 rounded font-mono text-[11px]">
                      {queryResult.rowsAffected} row(s)
                    </span>
                  )}
                </div>

                <span className="text-[11px] text-[#808495] font-mono truncate max-w-xs">
                  {queryResult.query}
                </span>
              </div>

              {/* Error Output */}
              {queryResult.error && (
                <div className="p-4 bg-red-50 text-red-800 text-xs font-mono">
                  ERROR: {queryResult.error}
                </div>
              )}

              {/* Table Grid Output */}
              {queryResult.rows && queryResult.columns && queryResult.rows.length > 0 && (
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-[#F0F2F6] border-b border-[#D6DADE]">
                      <tr>
                        {queryResult.columns.map((col) => (
                          <th key={col} className="py-2 px-3 font-semibold text-[#31333F] whitespace-nowrap font-mono">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6EAF1]">
                      {queryResult.rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-[#F8F9FB]">
                          {queryResult.columns!.map((col) => (
                            <td key={col} className="py-2 px-3 font-mono text-[#31333F] whitespace-nowrap">
                              {row[col] !== null && row[col] !== undefined ? String(row[col]) : 'NULL'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {queryResult.rows && queryResult.rows.length === 0 && (
                <div className="p-6 text-center text-xs text-[#808495]">
                  Empty set (0 records matching query).
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EXPORT FOR MYSQL WORKBENCH */}
      {activeTab === 'export' && (
        <div className="space-y-4">
          <div className="bg-[#F8F9FB] border border-[#E6EAF1] rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#31333F]">
                  MySQL Workbench Database Dump (.sql)
                </h3>
                <p className="text-xs text-[#808495] mt-0.5">
                  Standard SQL dump with complete table definitions, indexes, character sets, and current records.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyDump}
                  className="px-3 py-1.5 bg-white hover:bg-gray-100 text-[#31333F] text-xs font-medium rounded border border-[#D6DADE] flex items-center gap-1.5"
                >
                  {copiedDump ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedDump ? 'Copied Script!' : 'Copy Script'}</span>
                </button>

                <a
                  href="/api/mysql/export"
                  download="student_management_workbench.sql"
                  className="px-3.5 py-1.5 bg-[#00618A] hover:bg-[#004e70] text-white text-xs font-medium rounded flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .sql File</span>
                </a>
              </div>
            </div>

            {/* MySQL Workbench Instructions */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <Database className="w-4 h-4 text-[#00618A]" />
                <span>How to run this in MySQL Workbench:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-blue-800 pl-1 leading-relaxed">
                <li>Click <strong>Download .sql File</strong> above to save <code className="bg-white/80 px-1 py-0.5 rounded font-mono">student_management_workbench.sql</code>.</li>
                <li>Launch <strong>MySQL Workbench</strong> on your computer and connect to your local MySQL connection (port 3306).</li>
                <li>In MySQL Workbench, go to menu: <strong>File → Open SQL Script...</strong> and select the downloaded file.</li>
                <li>Click the <strong>Execute (⚡ lightning icon)</strong> button to create the database schema and populate all student records!</li>
              </ol>
            </div>
          </div>

          {/* SQL Dump Viewer */}
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-gray-800 text-xs font-mono max-h-[500px] overflow-y-auto">
            {isLoadingDump ? (
              <div className="text-gray-400 py-8 text-center">Generating MySQL Workbench Dump...</div>
            ) : (
              <pre className="text-emerald-400 whitespace-pre-wrap">{sqlDumpContent}</pre>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SCHEMA & ERD */}
      {activeTab === 'schema' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E6EAF1] rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6EAF1] pb-3">
              <div>
                <span className="text-xs font-mono text-[#00618A] font-semibold">TABLE: students</span>
                <h3 className="text-base font-bold text-[#31333F]">Relational Schema Definition</h3>
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-medium">
                Engine: InnoDB (utf8mb4)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F8F9FB] border-b border-[#E6EAF1] text-[#555] font-semibold">
                    <th className="py-2 px-3">Column Name</th>
                    <th className="py-2 px-3">Data Type</th>
                    <th className="py-2 px-3">Constraints</th>
                    <th className="py-2 px-3">Default</th>
                    <th className="py-2 px-3">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6EAF1] font-mono">
                  <tr>
                    <td className="py-2 px-3 font-bold text-[#00618A]">id</td>
                    <td className="py-2 px-3 text-[#555]">INT</td>
                    <td className="py-2 px-3 text-red-600 font-bold">PRIMARY KEY, AUTO_INCREMENT</td>
                    <td className="py-2 px-3 text-gray-400">NULL</td>
                    <td className="py-2 px-3 text-[#31333F] font-sans">Internal surrogate auto-increment identifier</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-[#00618A]">student_id</td>
                    <td className="py-2 px-3 text-[#555]">VARCHAR(20)</td>
                    <td className="py-2 px-3 text-amber-600 font-semibold">UNIQUE, NOT NULL</td>
                    <td className="py-2 px-3 text-gray-400">None</td>
                    <td className="py-2 px-3 text-[#31333F] font-sans">Official university Roll / Matriculation ID</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-[#00618A]">full_name</td>
                    <td className="py-2 px-3 text-[#555]">VARCHAR(100)</td>
                    <td className="py-2 px-3 text-gray-700">NOT NULL</td>
                    <td className="py-2 px-3 text-gray-400">None</td>
                    <td className="py-2 px-3 text-[#31333F] font-sans">Student's full legal name</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-[#00618A]">email</td>
                    <td className="py-2 px-3 text-[#555]">VARCHAR(100)</td>
                    <td className="py-2 px-3 text-amber-600 font-semibold">UNIQUE, NOT NULL</td>
                    <td className="py-2 px-3 text-gray-400">None</td>
                    <td className="py-2 px-3 text-[#31333F] font-sans">Institutional university email address</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-[#00618A]">department</td>
                    <td className="py-2 px-3 text-[#555]">VARCHAR(60)</td>
                    <td className="py-2 px-3 text-blue-600">INDEXED, NOT NULL</td>
                    <td className="py-2 px-3 text-gray-400">None</td>
                    <td className="py-2 px-3 text-[#31333F] font-sans">Academic department / major discipline</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-[#00618A]">semester</td>
                    <td className="py-2 px-3 text-[#555]">INT</td>
                    <td className="py-2 px-3 text-gray-700">NOT NULL</td>
                    <td className="py-2 px-3 text-gray-600">1</td>
                    <td className="py-2 px-3 text-[#31333F] font-sans">Current academic semester (1 through 8)</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-[#00618A]">gpa</td>
                    <td className="py-2 px-3 text-[#555]">DECIMAL(3,2)</td>
                    <td className="py-2 px-3 text-blue-600">INDEXED, NOT NULL</td>
                    <td className="py-2 px-3 text-gray-600">0.00</td>
                    <td className="py-2 px-3 text-[#31333F] font-sans">Cumulative Grade Point Average (0.00 - 4.00)</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-[#00618A]">status</td>
                    <td className="py-2 px-3 text-[#555]">ENUM</td>
                    <td className="py-2 px-3 text-blue-600">INDEXED, NOT NULL</td>
                    <td className="py-2 px-3 text-gray-600">'Active'</td>
                    <td className="py-2 px-3 text-[#31333F] font-sans">Active, On Leave, Graduated, or Suspended</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-[#00618A]">created_at</td>
                    <td className="py-2 px-3 text-[#555]">TIMESTAMP</td>
                    <td className="py-2 px-3 text-gray-700">DEFAULT CURRENT_TIMESTAMP</td>
                    <td className="py-2 px-3 text-gray-600">NOW()</td>
                    <td className="py-2 px-3 text-[#31333F] font-sans">Initial enrollment record creation timestamp</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-[#00618A]">updated_at</td>
                    <td className="py-2 px-3 text-[#555]">TIMESTAMP</td>
                    <td className="py-2 px-3 text-gray-700">ON UPDATE CURRENT_TIMESTAMP</td>
                    <td className="py-2 px-3 text-gray-600">NOW()</td>
                    <td className="py-2 px-3 text-[#31333F] font-sans">Last modified timestamp</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LIVE CONNECTION BRIDGE */}
      {activeTab === 'connect' && (
        <div className="space-y-4">
          <form onSubmit={handleTestConnection} className="bg-white border border-[#E6EAF1] rounded-lg p-5 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#31333F] flex items-center gap-2">
                <Server className="w-5 h-5 text-[#00618A]" />
                <span>MySQL Workbench Server Connection Configuration</span>
              </h3>
              <p className="text-xs text-[#808495] mt-0.5">
                Configure connection parameters if you have an active MySQL 8.0 server instance reachable from this application.
              </p>
            </div>

            {connectionMessage && (
              <div
                className={`p-3 rounded text-xs flex items-start gap-2 ${
                  connectionMessage.success
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-amber-50 text-amber-900 border border-amber-200'
                }`}
              >
                {connectionMessage.success ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <span>{connectionMessage.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#31333F] mb-1">
                  MySQL Host / IP
                </label>
                <input
                  type="text"
                  value={mysqlConfig.host}
                  onChange={(e) => setMysqlConfig({ ...mysqlConfig, host: e.target.value })}
                  placeholder="localhost or 127.0.0.1"
                  className="w-full text-xs px-3 py-2 border border-[#D6DADE] rounded font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#31333F] mb-1">
                  Port (Default 3306)
                </label>
                <input
                  type="number"
                  value={mysqlConfig.port}
                  onChange={(e) => setMysqlConfig({ ...mysqlConfig, port: parseInt(e.target.value, 10) || 3306 })}
                  className="w-full text-xs px-3 py-2 border border-[#D6DADE] rounded font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#31333F] mb-1">
                  MySQL Username
                </label>
                <input
                  type="text"
                  value={mysqlConfig.user}
                  onChange={(e) => setMysqlConfig({ ...mysqlConfig, user: e.target.value })}
                  placeholder="root"
                  className="w-full text-xs px-3 py-2 border border-[#D6DADE] rounded font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#31333F] mb-1">
                  MySQL Password
                </label>
                <input
                  type="password"
                  value={mysqlConfig.password || ''}
                  onChange={(e) => setMysqlConfig({ ...mysqlConfig, password: e.target.value })}
                  placeholder="MySQL User Password"
                  className="w-full text-xs px-3 py-2 border border-[#D6DADE] rounded font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#31333F] mb-1">
                  Target Database / Schema Name
                </label>
                <input
                  type="text"
                  value={mysqlConfig.database}
                  onChange={(e) => setMysqlConfig({ ...mysqlConfig, database: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-[#D6DADE] rounded font-mono"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#E6EAF1] flex items-center justify-between">
              <span className="text-[11px] text-[#808495]">
                Note: Standard export file is always available regardless of network access.
              </span>

              <button
                type="submit"
                disabled={testingConnection}
                className="px-4 py-2 bg-[#00618A] hover:bg-[#004e70] text-white text-xs font-bold rounded flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {testingConnection ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Testing Connection...</span>
                  </>
                ) : (
                  <>
                    <Server className="w-3.5 h-3.5" />
                    <span>Test MySQL Connection</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
