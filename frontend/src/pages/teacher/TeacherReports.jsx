import React, { useState, useEffect } from 'react';
import { FileBarChart, Download, FileText, FileSpreadsheet, BookOpen } from 'lucide-react';
import Loader from '../../components/common/Loader';
import api from '../../services/api';

const TeacherReports = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      fetchSubjectReport();
    }
  }, [selectedSubject]);

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/teachers/my-subjects');
      if (res.data.success) {
        const list = res.data.data || [];
        setSubjects(list);
        if (list.length > 0) {
          setSelectedSubject(list[0]._id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjectReport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/attendance', {
        params: { subjectId: selectedSubject, limit: 100 },
      });
      if (res.data.success) {
        setReportData(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (format) => {
    if (!selectedSubject) return;
    setDownloading(true);
    try {
      const url = `/reports/export/${format}?subjectId=${selectedSubject}`;
      const res = await api.get(url, { responseType: 'blob' });

      const blob = new Blob([res.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const extension = format === 'pdf' ? 'pdf' : format === 'csv' ? 'csv' : 'xlsx';
      link.setAttribute('download', `Class_Attendance_${selectedSubject}_${Date.now()}.${extension}`);
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

  const currentSubjectObj = subjects.find((s) => s._id === selectedSubject);
  const records = reportData || [];
  const total = records.length;
  const present = records.filter((r) => r.status === 'Present').length;
  const absent = records.filter((r) => r.status === 'Absent').length;
  const rate = total > 0 ? ((present / total) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileBarChart className="w-6 h-6 text-indigo-600" /> Subject Attendance Audits
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Evaluate subject attendance percentages and download official logs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadReport('pdf')}
            disabled={downloading || total === 0}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition flex items-center gap-1.5 shadow-sm disabled:opacity-40"
          >
            <FileText className="w-3.5 h-3.5" /> Subject PDF
          </button>
          <button
            onClick={() => downloadReport('excel')}
            disabled={downloading || total === 0}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-sm disabled:opacity-40"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Subject Excel
          </button>
        </div>
      </div>

      {/* Select Subject bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/60 shadow-sm flex items-center gap-3">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
          Select Subject Course:
        </label>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:w-80"
        >
          {subjects.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name} ({s.code}) - Sem {s.semester}
            </option>
          ))}
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/60 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Recorded Logs</p>
          <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{total}</h4>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/60 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Class Attendance</p>
          <h4 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{rate}%</h4>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/60 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Present Tally</p>
          <h4 className="text-2xl font-black text-emerald-600 mt-1">{present}</h4>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/60 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Absent Tally</p>
          <h4 className="text-2xl font-black text-rose-600 mt-1">{absent}</h4>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
        {loading ? (
          <Loader text="Generating subject report data..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/60 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-4">DATE</th>
                  <th className="py-3 px-4">ROLL NO</th>
                  <th className="py-3 px-4">STUDENT NAME</th>
                  <th className="py-3 px-4 text-center">STATUS</th>
                  <th className="py-3 px-4">METHOD</th>
                  <th className="py-3 px-4">REMARKS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-slate-400">
                      No logs recorded for this subject yet.
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
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            r.status === 'Present'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                              : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {r.method}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {r.remarks || '-'}
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
  );
};

export default TeacherReports;
