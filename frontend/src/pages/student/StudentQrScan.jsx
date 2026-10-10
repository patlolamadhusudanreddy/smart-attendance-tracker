import React from 'react';
import { QrCode, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import QrAttendanceScanner from '../../components/attendance/QrAttendanceScanner';

const StudentQrScan = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <QrCode className="w-6 h-6 text-indigo-600" /> Digital QR Attendance Scanner
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Submit teacher's live classroom QR session key to mark your lecture presence
          </p>
        </div>

        <Link
          to="/student/dashboard"
          className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
        </Link>
      </div>

      <div className="pt-4">
        <QrAttendanceScanner mode="scan" />
      </div>
    </div>
  );
};

export default StudentQrScan;
