import React, { useState, useEffect } from 'react';
import { CalendarCheck, Download, FileText, Filter, CheckCircle, XCircle } from 'lucide-react';
import AttendanceCalendar from '../../components/attendance/AttendanceCalendar';
import Loader from '../../components/common/Loader';
import api from '../../services/api';

const StudentAttendance = () => {
  const [calendarData, setCalendarData] = useState([]);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState('');

  useEffect(() => {
    fetchCalendarData();
    fetchHistoryRecords();
  }, []);

  const fetchCalendarData = async () => {
    try {
      const res = await api.get('/attendance/calendar');
      if (res.data.success) {
        setCalendarData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistoryRecords = async () => {
    setLoading(true);
    try {
      const res = await api.get('/attendance', { params: { limit: 100 } });
      if (res.data.success) {
        setHistoryRecords(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadPersonalPdf = async () => {
    setDownloading(true);
    try {
      const res = await api.get('/reports/export/pdf', { responseType: 'blob' });
      const blob = new Blob([res.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `My_Attendance_Report_${Date.now()}.pdf`);
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

  const handleDateSelect = (dateStr) => {
    setSelectedDateFilter(dateStr);
  };

  const filteredRecords = selectedDateFilter
    ? historyRecords.filter(
        (r) => new Date(r.date).toISOString().split('T')[0] === selectedDateFilter
      )
    : historyRecords;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-indigo-600" /> My Attendance Log & Calendar
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Interactive attendance calendar and official semester attendance download
          </p>
        </div>

        <button
          onClick={downloadPersonalPdf}
          disabled={downloading || historyRecords.length === 0}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition flex items-center gap-2 disabled:opacity-40"
        >
          <FileText className="w-4 h-4" /> Download Official PDF Report
        </button>
      </div>

      {/* Calendar View */}
      <AttendanceCalendar calendarData={calendarData} onSelectDate={handleDateSelect} />

      {/* Detailed History Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Attendance Log Details
            {selectedDateFilter && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-[11px] font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                Filtered: {selectedDateFilter}
              </span>
            )}
          </h3>

          {selectedDateFilter && (
            <button
              onClick={() => setSelectedDateFilter('')}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              Show All Dates
            </button>
          )}
        </div>

        {loading ? (
          <Loader text="Loading your history logs..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/60 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-4">DATE</th>
                  <th className="py-3 px-4">COURSE SUBJECT</th>
                  <th className="py-3 px-4 text-center">STATUS</th>
                  <th className="py-3 px-4">METHOD</th>
                  <th className="py-3 px-4">RECORDED BY</th>
                  <th className="py-3 px-4">REMARKS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-400">
                      No attendance logs recorded for this period.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r) => (
                    <tr
                      key={r._id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition"
                    >
                      <td className="py-3 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                        {new Date(r.date).toISOString().split('T')[0]}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-100">
                        {r.subject?.name} ({r.subject?.code})
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
                        {r.method || 'Manual'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {r.markedBy?.name || 'Faculty'}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
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

export default StudentAttendance;
