import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileDown,
  QrCode,
  ArrowRight,
  TrendingUp,
  BookOpen,
} from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import Loader from '../../components/common/Loader';
import api from '../../services/api';

const StudentDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentSummary();
  }, []);

  const fetchStudentSummary = async () => {
    try {
      const res = await api.get('/attendance/my-summary');
      if (res.data.success) {
        setSummary(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader text="Loading your personal academic telemetry..." />;
  }

  const overall = summary?.overall || {
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    percentage: 100,
  };
  const subjects = summary?.subjectBreakdown || [];
  const student = summary?.student;

  const isLowAttendance = overall.percentage < 75;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-700 via-teal-600 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-teal-700/20">
        <div>
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/20 backdrop-blur-md uppercase tracking-wider">
            Student Academic Workspace
          </span>
          <h2 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
            Hi, {student?.user?.name || 'Student'}! 👋
          </h2>
          <p className="text-xs sm:text-sm text-teal-100/90 mt-1 max-w-xl">
            Roll Number: <strong className="font-mono text-white">{student?.rollNumber}</strong> • Semester {student?.semester} • {student?.department}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/student/qr-scan"
            className="px-4 py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-xs transition shadow-sm flex items-center gap-1.5"
          >
            <QrCode className="w-4 h-4" /> Scan Attendance QR
          </Link>
          <Link
            to="/student/attendance"
            className="px-4 py-2.5 rounded-xl bg-emerald-500/40 hover:bg-emerald-500/60 backdrop-blur-md text-white font-bold text-xs border border-white/20 transition flex items-center gap-1.5"
          >
            <CalendarCheck className="w-4 h-4" /> View Calendar
          </Link>
        </div>
      </div>

      {/* Low attendance warning badge if applicable */}
      {isLowAttendance && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-rose-800 dark:text-rose-200">
              Low Attendance Warning ({overall.percentage}%)
            </h4>
            <p className="text-rose-700 dark:text-rose-300 mt-0.5">
              Your overall attendance is below the institutional threshold of 75%. Please ensure regular attendance to maintain examination eligibility.
            </p>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="Overall Attendance"
          value={`${overall.percentage}%`}
          subtitle={overall.percentage >= 75 ? 'Satisfies 75% Criteria' : 'Below Target Criterion'}
          icon={TrendingUp}
          color={overall.percentage >= 75 ? 'emerald' : 'rose'}
        />
        <StatCard
          title="Lectures Attended"
          value={overall.present}
          subtitle={`Out of ${overall.total} total sessions`}
          icon={CheckCircle2}
          color="indigo"
        />
        <StatCard
          title="Lectures Missed"
          value={overall.absent}
          subtitle="Unexcused absences"
          icon={XCircle}
          color="rose"
        />
        <StatCard
          title="Late Arrivals"
          value={overall.late}
          subtitle="Recorded late arrivals"
          icon={CalendarCheck}
          color="amber"
        />
      </div>

      {/* Subject-Wise Performance Breakdown */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" /> Subject-Wise Attendance Breakdown
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Attendance tracking across your Semester {student?.semester} curriculum courses
            </p>
          </div>
          <Link
            to="/student/attendance"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            Audit Log <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-4">
          {subjects.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              No subjects registered for your current semester yet.
            </p>
          ) : (
            subjects.map((sub) => {
              const isSubLow = sub.percentage < 75;
              return (
                <div
                  key={sub.subjectId}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 mr-2">
                        {sub.subjectCode}
                      </span>
                      <strong className="text-slate-800 dark:text-slate-200">
                        {sub.subjectName}
                      </strong>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-slate-500">
                        {sub.attendedLectures} / {sub.totalLectures} Classes
                      </span>
                      <span
                        className={`font-black text-sm ${
                          isSubLow
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {sub.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isSubLow ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, sub.percentage)}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
