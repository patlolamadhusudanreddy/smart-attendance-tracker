import React, { useState } from 'react';
import { Check, X, Clock, AlertCircle, Save, CheckCircle2 } from 'lucide-react';

const AttendanceSheet = ({ students = [], onSubmit, isSubmitting = false }) => {
  const [records, setRecords] = useState(() => {
    return students.reduce((acc, s) => {
      acc[s._id] = { status: 'Present', remarks: '' };
      return acc;
    }, {});
  });

  const [searchTerm, setSearchTerm] = useState('');

  const handleStatusChange = (studentId, status) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
  };

  const handleRemarksChange = (studentId, remarks) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], remarks },
    }));
  };

  const setAllStatus = (status) => {
    const updated = {};
    students.forEach((s) => {
      updated[s._id] = { ...records[s._id], status };
    });
    setRecords(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = students.map((s) => ({
      studentId: s._id,
      status: records[s._id]?.status || 'Present',
      remarks: records[s._id]?.remarks || '',
    }));
    onSubmit(payload);
  };

  const filteredStudents = students.filter((s) => {
    const name = s.user?.name || '';
    const roll = s.rollNumber || '';
    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      roll.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const presentCount = Object.values(records).filter((r) => r.status === 'Present').length;
  const absentCount = Object.values(records).filter((r) => r.status === 'Absent').length;
  const lateCount = Object.values(records).filter((r) => r.status === 'Late').length;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
      {/* Top action toolbar */}
      <div className="p-4 bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Real-time counters */}
        <div className="flex items-center gap-3 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-300">
            Total: {students.length}
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Present: {presentCount}
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 font-bold text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            Absent: {absentCount}
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 font-bold text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Late: {lateCount}
          </div>
        </div>

        {/* Quick bulk action buttons & search */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search student..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-44"
          />

          <button
            type="button"
            onClick={() => setAllStatus('Present')}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1 shadow-sm whitespace-nowrap"
          >
            <Check className="w-3.5 h-3.5" /> All Present
          </button>
          <button
            type="button"
            onClick={() => setAllStatus('Absent')}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition flex items-center gap-1 shadow-sm whitespace-nowrap"
          >
            <X className="w-3.5 h-3.5" /> All Absent
          </button>
        </div>
      </div>

      {/* Student List Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/60 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
              <th className="py-3 px-4">ROLL NUMBER</th>
              <th className="py-3 px-4">STUDENT NAME</th>
              <th className="py-3 px-4 text-center">ATTENDANCE STATUS</th>
              <th className="py-3 px-4">REMARKS (OPTIONAL)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-8 text-slate-400">
                  No students found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => {
                const currentStatus = records[student._id]?.status || 'Present';
                const currentRemarks = records[student._id]?.remarks || '';

                return (
                  <tr
                    key={student._id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {student.rollNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={
                            student.user?.avatar ||
                            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'
                          }
                          alt={student.user?.name}
                          className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200"
                        />
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {student.user?.name || 'Unnamed Student'}
                          </p>
                          <p className="text-[10px] text-slate-400">{student.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student._id, 'Present')}
                          className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ${
                            currentStatus === 'Present'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" /> Present
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(student._id, 'Absent')}
                          className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ${
                            currentStatus === 'Absent'
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                          }`}
                        >
                          <X className="w-3.5 h-3.5" /> Absent
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(student._id, 'Late')}
                          className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ${
                            currentStatus === 'Late'
                              ? 'bg-amber-600 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" /> Late
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        placeholder="Optional note..."
                        value={currentRemarks}
                        onChange={(e) => handleRemarksChange(student._id, e.target.value)}
                        className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Submit */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Ready to commit <span className="font-bold text-slate-800 dark:text-slate-200">{students.length}</span> attendance entries.
        </p>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || students.length === 0}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
        >
          {isSubmitting ? (
            'Saving records...'
          ) : (
            <>
              <Save className="w-4 h-4" /> Save & Submit Attendance
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AttendanceSheet;
