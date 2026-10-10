import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarCheck, QrCode, FileText, CheckCircle2, AlertCircle, Users } from 'lucide-react';
import AttendanceSheet from '../../components/attendance/AttendanceSheet';
import QrAttendanceScanner from '../../components/attendance/QrAttendanceScanner';
import Loader from '../../components/common/Loader';
import NotificationToast from '../../components/common/NotificationToast';
import api from '../../services/api';

const MarkAttendance = () => {
  const [searchParams] = useSearchParams();
  const initialSubjectId = searchParams.get('subjectId') || '';
  const initialTab = searchParams.get('tab') || 'sheet';

  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(initialSubjectId);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [mode, setMode] = useState(initialTab === 'qr' ? 'qr' : 'sheet');

  const [students, setStudents] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  useEffect(() => {
    fetchAssignedSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubjectId) {
      fetchClassStudents();
    }
  }, [selectedSubjectId]);

  const fetchAssignedSubjects = async () => {
    try {
      const res = await api.get('/teachers/my-subjects');
      if (res.data.success) {
        const list = res.data.data || [];
        setSubjects(list);
        if (!selectedSubjectId && list.length > 0) {
          setSelectedSubjectId(list[0]._id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const fetchClassStudents = async () => {
    const currentSubject = subjects.find((s) => s._id === selectedSubjectId);
    setLoadingStudents(true);
    try {
      // Find students in matching department & semester
      const params = { limit: 100 };
      if (currentSubject) {
        params.department = currentSubject.department;
        params.semester = currentSubject.semester;
      }
      const res = await api.get('/students', { params });
      if (res.data.success) {
        setStudents(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleBatchSubmit = async (records) => {
    setIsSubmitting(true);
    try {
      const res = await api.post('/attendance/batch', {
        subjectId: selectedSubjectId,
        date: selectedDate,
        records,
      });

      if (res.data.success) {
        setToast({ message: res.data.message || 'Attendance submitted successfully!', type: 'success' });
      }
    } catch (err) {
      setToast({
        message: err.response?.data?.message || 'Failed to submit attendance',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedSubject = subjects.find((s) => s._id === selectedSubjectId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-indigo-600" /> Mark Class Attendance
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Record lecture participation via manual sheet or smart classroom QR token
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setMode('sheet')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
              mode === 'sheet'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Manual Sheet
          </button>
          <button
            onClick={() => setMode('qr')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
              mode === 'qr'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" /> Live QR Code
          </button>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="w-full sm:w-auto">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Course Subject
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
            >
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.code}) - Sem {s.semester}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-auto">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Lecture Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto"
            />
          </div>
        </div>

        {selectedSubject && (
          <div className="flex items-center gap-2 self-start sm:self-center text-xs text-slate-500">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 font-bold text-indigo-700 dark:text-indigo-300">
              {selectedSubject.department}
            </span>
            <span className="font-semibold">Semester {selectedSubject.semester}</span>
          </div>
        )}
      </div>

      {/* Main View Area */}
      {loadingSubjects ? (
        <Loader text="Loading subjects..." />
      ) : mode === 'qr' ? (
        <QrAttendanceScanner mode="generate" subjectId={selectedSubjectId} />
      ) : loadingStudents ? (
        <Loader text="Loading student roll list for this course..." />
      ) : (
        <AttendanceSheet
          students={students}
          onSubmit={handleBatchSubmit}
          isSubmitting={isSubmitting}
        />
      )}

      <NotificationToast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </div>
  );
};

export default MarkAttendance;
