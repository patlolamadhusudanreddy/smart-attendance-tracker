import React, { useState, useEffect } from 'react';
import {
  FileBarChart,
  Download,
  Calendar,
  Filter,
  FileText,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  Clock,
  ShieldAlert,
  ShieldCheck,
  MapPin,
  Laptop,
} from 'lucide-react';
import Loader from '../../components/common/Loader';
import api from '../../services/api';

const SystemReports = () => {
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance' | 'security'
  const [subjects, setSubjects] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Attendance Filters
  const [subjectId, setSubjectId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('');
  const [downloading, setDownloading] = useState(false);

  // Security Audit Trail State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditStatusFilter, setAuditStatusFilter] = useState('');
  const [auditReasonFilter, setAuditReasonFilter] = useState('');

  useEffect(() => {
    fetchSubjects();
    if (activeTab === 'attendance') {
      fetchReports();
    } else {
      fetchAuditLogs();
    }
  }, [activeTab, subjectId, status, auditStatusFilter, auditReasonFilter]);

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/subjects');
      if (res.data.success) {
        setSubjects(res.data.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = {
        subjectId: subjectId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status: status || undefined,
        limit: 100,
      };
      const res = await api.get('/attendance', { params });
      if (res.data.success) {
        setRecords(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const params = {
        status: auditStatusFilter || undefined,
        failureReason: auditReasonFilter || undefined,
        limit: 100,
      };
      const res = await api.get('/attendance/audit-logs', { params });
      if (res.data.success) {
        setAuditLogs(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setAuditLoading(false);
    }
  };

  const handleApplyFilter = (e) => {
    e.preventDefault();
    fetchReports();
  };

  const downloadFile = async (format) => {
    setDownloading(true);
    try {
      const params = new URLSearchParams();
      if (subjectId) params.append('subjectId', subjectId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const url = `/reports/export/${format}?${params.toString()}`;
      const res = await api.get(url, { responseType: 'blob' });

      const blob = new Blob([res.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;

      const extension = format === 'pdf' ? 'pdf' : format === 'csv' ? 'csv' : 'xlsx';
      link.setAttribute('download', `Attendance_Report_${Date.now()}.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloading(false);
    }
  };

  const total = records.length;
  const presentCount = records.filter((r) => r.status === 'Present').length;
  const absentCount = records.filter((r) => r.status === 'Absent').length;
  const lateCount = records.filter((r) => r.status === 'Late').length;
  const rate = total > 0 ? ((presentCount / total) * 100).toFixed(1) : '0';

  const getReasonBadge = (reason) => {
    switch (reason) {
      case 'Outside Geofence':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300';
      case 'Replay Attack':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300';
      case 'Expired QR':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300';
      case 'Already Marked':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileBarChart className="w-6 h-6 text-indigo-600" /> Attendance Audits & Compliance
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Institutional compliance reports, dynamic QR telemetry, and anti-fraud forensic audit logs.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
              activeTab === 'attendance'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Attendance Logs & Exports
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
              activeTab === 'security'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Security & Fraud Audit Trail
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: ATTENDANCE RECORDS & REPORTS                      */}
      {/* ======================================================== */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* Export Toolbar */}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => downloadFile('pdf')}
              disabled={downloading || total === 0}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition flex items-center gap-1.5 shadow-sm disabled:opacity-40"
            >
              <FileText className="w-3.5 h-3.5" /> Export PDF
            </button>
            <button
              onClick={() => downloadFile('excel')}
              disabled={downloading || total === 0}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-sm disabled:opacity-40"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
            </button>
            <button
              onClick={() => downloadFile('csv')}
              disabled={downloading || total === 0}
              className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5 shadow-sm disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>

          {/* Filter Form */}
          <form
            onSubmit={handleApplyFilter}
            className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/60 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
          >
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                Course Subject
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              >
                <option value="">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              >
                <option value="">All Statuses</option>
                <option value="Present">Present Only</option>
                <option value="Absent">Absent Only</option>
                <option value="Late">Late Only</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm"
              >
                Apply Filters
              </button>
            </div>
          </form>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/60 shadow-sm">
              <p className="text-[11px] font-bold text-slate-400 uppercase">Total Marked Logs</p>
              <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{total}</h4>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/60 shadow-sm">
              <p className="text-[11px] font-bold text-slate-400 uppercase">Attendance Rate</p>
              <h4 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{rate}%</h4>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/60 shadow-sm">
              <p className="text-[11px] font-bold text-slate-400 uppercase">Present Count</p>
              <h4 className="text-2xl font-black text-emerald-600 mt-1">{presentCount}</h4>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/60 shadow-sm">
              <p className="text-[11px] font-bold text-slate-400 uppercase">Absent Count</p>
              <h4 className="text-2xl font-black text-rose-600 mt-1">{absentCount}</h4>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
            {loading ? (
              <Loader text="Generating filtered report records..." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/60 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                      <th className="py-3 px-4">DATE</th>
                      <th className="py-3 px-4">ROLL NUMBER</th>
                      <th className="py-3 px-4">STUDENT NAME</th>
                      <th className="py-3 px-4">COURSE SUBJECT</th>
                      <th className="py-3 px-4 text-center">STATUS</th>
                      <th className="py-3 px-4">METHOD</th>
                      <th className="py-3 px-4">LOCATION / GPS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {records.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-10 text-slate-400">
                          No attendance records match the selected criteria.
                        </td>
                      </tr>
                    ) : (
                      records.map((r) => (
                        <tr
                          key={r._id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition"
                        >
                          <td className="py-3 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                            {new Date(r.date).toISOString().split('T')[0]}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {r.student?.rollNumber || '-'}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-100">
                            {r.student?.user?.name || 'Student'}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                            {r.subject?.name} ({r.subject?.code})
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                r.status === 'Present'
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                  : r.status === 'Absent'
                                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-[11px] font-medium">
                            <span className="font-semibold">{r.method || 'Manual'}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-[11px]">
                            {r.location?.distanceMeters !== undefined ? (
                              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                {r.location.distanceMeters}m from room
                              </span>
                            ) : (
                              <span>-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: SECURITY & FRAUD AUDIT TRAIL                      */}
      {/* ======================================================== */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          {/* Security Filters */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                  Attempt Status
                </label>
                <select
                  value={auditStatusFilter}
                  onChange={(e) => setAuditStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                >
                  <option value="">All Statuses</option>
                  <option value="FAILED">Failed / Blocked Only</option>
                  <option value="SUCCESS">Verified Success Only</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                  Rejection Reason
                </label>
                <select
                  value={auditReasonFilter}
                  onChange={(e) => setAuditReasonFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                >
                  <option value="">All Reasons</option>
                  <option value="Outside Geofence">Outside Geofence</option>
                  <option value="Replay Attack">Replay Attack</option>
                  <option value="Expired QR">Expired QR</option>
                  <option value="Already Marked">Already Marked</option>
                  <option value="Session Closed">Session Closed</option>
                </select>
              </div>
            </div>

            <div className="text-xs font-bold text-slate-500 self-end sm:self-center">
              Total Audit Entries: {auditLogs.length}
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
            {auditLoading ? (
              <Loader text="Loading forensic security audit logs..." />
            ) : auditLogs.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400">
                <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                No security violation logs match the current filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/60 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                      <th className="py-3 px-4">TIMESTAMP</th>
                      <th className="py-3 px-4">STUDENT</th>
                      <th className="py-3 px-4">SUBJECT</th>
                      <th className="py-3 px-4 text-center">OUTCOME</th>
                      <th className="py-3 px-4">REASON / MESSAGE</th>
                      <th className="py-3 px-4">DISTANCE</th>
                      <th className="py-3 px-4">DEVICE & IP TELEMETRY</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {auditLogs.map((log) => (
                      <tr
                        key={log._id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition"
                      >
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800 dark:text-slate-100">
                            {log.student?.user?.name || log.user?.name || 'Unknown'}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {log.student?.rollNumber || log.user?.email || '-'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {log.subject ? `${log.subject.name} (${log.subject.code})` : '-'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              log.status === 'SUCCESS'
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {log.failureReason ? (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block ${getReasonBadge(
                                log.failureReason
                              )}`}
                            >
                              {log.failureReason}
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                              ✓ Verified Within Geofence
                            </span>
                          )}
                          <p className="text-[10px] text-slate-400 mt-0.5 max-w-xs truncate">
                            {log.message}
                          </p>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          {log.distanceMeters !== undefined && log.distanceMeters !== null ? (
                            <span
                              className={
                                log.distanceMeters > (log.allowedRadiusMeters || 30)
                                  ? 'text-rose-600 font-bold'
                                  : 'text-emerald-600 font-bold'
                              }
                            >
                              {log.distanceMeters}m (Max: {log.allowedRadiusMeters || 30}m)
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-[10px] text-slate-500">
                          <div>
                            {log.browser} • {log.os}
                          </div>
                          <div className="text-slate-400">IP: {log.ipAddress}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemReports;
