import React, { useState, useEffect } from 'react';
import { History, Search, Filter, Edit, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import Loader from '../../components/common/Loader';
import NotificationToast from '../../components/common/NotificationToast';
import api from '../../services/api';

const AttendanceHistory = () => {
  const [records, setRecords] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Edit Modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [editStatus, setEditStatus] = useState('Present');
  const [editRemarks, setEditRemarks] = useState('');

  // Toast
  const [toast, setToast] = useState({ message: '', type: 'success' });

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [page, selectedSubject, selectedDate]);

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/teachers/my-subjects');
      if (res.data.success) {
        setSubjects(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        subjectId: selectedSubject || undefined,
        date: selectedDate || undefined,
      };
      const res = await api.get('/attendance', { params });
      if (res.data.success) {
        setRecords(res.data.data);
        setTotalPages(res.data.meta?.pages || 1);
        setTotalRecords(res.data.meta?.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (record) => {
    setCurrentRecord(record);
    setEditStatus(record.status);
    setEditRemarks(record.remarks || '');
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/attendance/${currentRecord._id}`, {
        status: editStatus,
        remarks: editRemarks,
      });
      if (res.data.success) {
        setToast({ message: 'Attendance status updated successfully!', type: 'success' });
        setIsEditOpen(false);
        fetchHistory();
      }
    } catch (err) {
      setToast({ message: 'Failed to update record', type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this attendance record?')) return;
    try {
      const res = await api.delete(`/attendance/${id}`);
      if (res.data.success) {
        setToast({ message: 'Record deleted successfully!', type: 'success' });
        fetchHistory();
      }
    } catch (err) {
      setToast({ message: 'Failed to delete record', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-600" /> Attendance Logs & History
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audit past attendance logs, correct erroneous entries, and review timestamps
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <select
          value={selectedSubject}
          onChange={(e) => {
            setSelectedSubject(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
        >
          <option value="">All My Subjects</option>
          {subjects.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name} ({s.code})
            </option>
          ))}
        </select>

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => {
            setSelectedDate(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto"
        />

        {(selectedSubject || selectedDate) && (
          <button
            onClick={() => {
              setSelectedSubject('');
              setSelectedDate('');
              setPage(1);
            }}
            className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* History Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
        {loading ? (
          <Loader text="Loading past attendance records..." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/60 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-4">DATE</th>
                    <th className="py-3 px-4">ROLL NO</th>
                    <th className="py-3 px-4">STUDENT NAME</th>
                    <th className="py-3 px-4">SUBJECT</th>
                    <th className="py-3 px-4 text-center">STATUS</th>
                    <th className="py-3 px-4">METHOD</th>
                    <th className="py-3 px-4 text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-10 text-slate-400">
                        No attendance logs found matching these filters.
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
                          {r.subject?.code} - {r.subject?.name}
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
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          {r.method}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => openEdit(r)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                              title="Edit Record"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(r._id)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              page={page}
              pages={totalPages}
              total={totalRecords}
              limit={10}
              onPageChange={(p) => setPage(p)}
            />
          </>
        )}
      </div>

      {/* Edit Record Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Attendance Status">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Student:{' '}
            <strong className="text-slate-900 dark:text-white">
              {currentRecord?.student?.user?.name} ({currentRecord?.student?.rollNumber})
            </strong>
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Status
            </label>
            <div className="flex items-center gap-2">
              {['Present', 'Absent', 'Late', 'Excused'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setEditStatus(st)}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                    editStatus === st
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Remarks
            </label>
            <input
              type="text"
              value={editRemarks}
              onChange={(e) => setEditRemarks(e.target.value)}
              placeholder="e.g. Medical leave verified"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Update Status
            </button>
          </div>
        </form>
      </Modal>

      <NotificationToast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </div>
  );
};

export default AttendanceHistory;
