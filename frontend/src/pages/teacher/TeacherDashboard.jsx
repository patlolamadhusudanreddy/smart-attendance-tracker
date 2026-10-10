import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  CalendarCheck,
  QrCode,
  TrendingUp,
  FileBarChart,
  Users,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import Loader from '../../components/common/Loader';
import api from '../../services/api';

const TeacherDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeacherStats();
  }, []);

  const fetchTeacherStats = async () => {
    try {
      const res = await api.get('/dashboard/teacher');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader text="Loading faculty workspace..." />;
  }

  const assignedSubjects = stats?.assignedSubjects || [];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-700 via-indigo-600 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-indigo-600/20">
        <div>
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/20 backdrop-blur-md uppercase tracking-wider">
            Faculty Teaching Portal
          </span>
          <h2 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
            Academic Schedule & Lectures
          </h2>
          <p className="text-xs sm:text-sm text-indigo-100/90 mt-1 max-w-xl">
            Quickly mark attendance for today's lectures, display classroom QR codes, and review students' presence.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/teacher/attendance"
            className="px-4 py-2 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-xs transition shadow-sm flex items-center gap-1.5"
          >
            <CalendarCheck className="w-4 h-4" /> Mark Attendance
          </Link>
          <Link
            to="/teacher/reports"
            className="px-4 py-2 rounded-xl bg-indigo-500/40 hover:bg-indigo-500/60 backdrop-blur-md text-white font-bold text-xs border border-white/20 transition flex items-center gap-1.5"
          >
            <FileBarChart className="w-4 h-4" /> Class Audits
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Assigned Subjects"
          value={stats?.totalSubjects || 0}
          subtitle="Curriculum lecture courses"
          icon={BookOpen}
          color="indigo"
        />
        <StatCard
          title="Classes Conducted"
          value={stats?.totalClassesConducted || 0}
          subtitle="Distinct lecture dates recorded"
          icon={CalendarCheck}
          color="emerald"
        />
        <StatCard
          title="Average Attendance"
          value={`${stats?.averageRate || 0}%`}
          subtitle="Overall student attendance rate"
          icon={TrendingUp}
          color="amber"
        />
      </div>

      {/* Assigned Subjects Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" /> Your Assigned Subjects
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            {assignedSubjects.length} Courses Assigned
          </span>
        </div>

        {assignedSubjects.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 text-xs text-slate-400">
            You do not have any curriculum subjects assigned currently. Contact the Administrator.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedSubjects.map((sub) => {
              const subStat = stats?.subjectStats?.find((s) => s.id === sub._id);
              const rate = subStat ? subStat.rate : 0;

              return (
                <div
                  key={sub._id}
                  className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700/60 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {sub.code}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        Sem {sub.semester} • {sub.credits} Credits
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                      {sub.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Department of {sub.department}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Attendance Rate:</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {rate}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Link
                      to={`/teacher/attendance?subjectId=${sub._id}`}
                      className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs text-center transition shadow-sm"
                    >
                      Mark Sheet
                    </Link>
                    <Link
                      to={`/teacher/attendance?subjectId=${sub._id}&tab=qr`}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                      title="Launch QR Session"
                    >
                      <QrCode className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
