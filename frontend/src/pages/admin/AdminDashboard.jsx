import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  TrendingUp,
  FileDown,
  UserPlus,
  Activity,
  CheckCircle,
  ShieldAlert,
  Radio,
  MapPin,
  AlertTriangle,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import StatCard from '../../components/common/StatCard';
import Loader from '../../components/common/Loader';
import api from '../../services/api';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/dashboard/admin');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader text="Loading administrative dashboard analytics..." />;
  }

  const metrics = data?.metrics || {
    totalStudents: 0,
    totalTeachers: 0,
    totalSubjects: 0,
    activeSessionsCount: 0,
    failedAttendanceAttempts: 0,
    todayAttendanceRate: 0,
    overallAttendanceRate: 0,
    todayTotalLogs: 0,
  };

  const statusColors = {
    Present: '#10b981',
    Absent: '#f43f5e',
    Late: '#f59e0b',
    Excused: '#6366f1',
  };

  const statusPieData =
    data?.statusDistribution?.map((item) => ({
      name: item.status,
      value: item.count,
      color: statusColors[item.status] || '#8b5cf6',
    })) || [];

  const deptBarData =
    data?.departmentDistribution?.map((item) => ({
      name: item.department.replace('Engineering', 'Eng.').replace('Computer Science', 'CS'),
      count: item.count,
    })) || [];

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
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-indigo-600/20">
        <div>
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/20 backdrop-blur-md uppercase tracking-wider">
            Admin Management Hub
          </span>
          <h2 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
            Campus Attendance & Security
          </h2>
          <p className="text-xs sm:text-sm text-indigo-100/90 mt-1 max-w-xl">
            Real-time attendance telemetry, dynamic 20s QR rotation, GPS geofence auditing, and fraud prevention.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/admin/classrooms"
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold text-xs border border-white/20 transition flex items-center gap-1.5"
          >
            <MapPin className="w-4 h-4" /> Geofences
          </Link>
          <Link
            to="/admin/students"
            className="px-4 py-2 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-xs transition shadow-sm flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" /> Add Student
          </Link>
          <Link
            to="/admin/reports"
            className="px-4 py-2 rounded-xl bg-indigo-500/40 hover:bg-indigo-500/60 backdrop-blur-md text-white font-bold text-xs border border-white/20 transition flex items-center gap-1.5"
          >
            <FileDown className="w-4 h-4" /> Export Audits
          </Link>
        </div>
      </div>

      {/* Primary Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Students"
          value={metrics.totalStudents}
          subtitle="Enrolled across batches"
          icon={GraduationCap}
          color="emerald"
        />
        <StatCard
          title="Active QR Sessions"
          value={metrics.activeSessionsCount || 0}
          subtitle={metrics.activeSessionsCount > 0 ? 'Live in classrooms now' : 'No active sessions'}
          icon={Radio}
          color="indigo"
        />
        <StatCard
          title="Blocked Fraud Attempts"
          value={metrics.failedAttendanceAttempts || 0}
          subtitle="Geofence & replay rejections"
          icon={ShieldAlert}
          color="rose"
        />
        <StatCard
          title="Today's Attendance"
          value={`${metrics.todayAttendanceRate}%`}
          subtitle={`${metrics.todayTotalLogs} logged entries today`}
          icon={CalendarCheck}
          color="amber"
          trend={metrics.todayAttendanceRate >= 75 ? 4.2 : -2.1}
        />
      </div>

      {/* Security Alerts and Fraud Prevention Monitor */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700/60 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Security & Fraud Prevention Alerts
              </h3>
              <p className="text-[11px] text-slate-400">
                Real-time capture of out-of-bounds GPS attempts, expired QR scans, and replay attacks
              </p>
            </div>
          </div>
          <Link
            to="/admin/reports"
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            View Full Security Audit Log →
          </Link>
        </div>

        {(!data?.securityAlerts || data.securityAlerts.length === 0) ? (
          <div className="py-6 text-center text-xs text-slate-400 flex flex-col items-center">
            <ShieldCheck className="w-8 h-8 text-emerald-500 mb-2" />
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              No security anomalies detected recently.
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5">
              All student check-in submissions are compliant with GPS geofencing & 20s token validity.
            </span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {data.securityAlerts.map((alert) => (
              <div key={alert._id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${getReasonBadge(
                        alert.failureReason
                      )}`}
                    >
                      {alert.failureReason || 'Failed Check-in'}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {alert.student?.user?.name || alert.user?.name || 'Unknown User'}
                    </span>
                    {alert.subject && (
                      <span className="text-slate-400 text-[11px]">
                        • {alert.subject.name} ({alert.subject.code})
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {alert.message || 'Attempt rejected by anti-fraud filter'}
                    {alert.distanceMeters !== undefined && alert.distanceMeters !== null && (
                      <span className="font-semibold text-rose-500 ml-1">
                        (Distance: {alert.distanceMeters}m, Limit: {alert.allowedRadiusMeters || 30}m)
                      </span>
                    )}
                  </p>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Device: {alert.browser} on {alert.os} | IP: {alert.ipAddress}
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 whitespace-nowrap self-start sm:self-center flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(alert.createdAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution Bar Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700/60 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Department Student Enrollment
              </h3>
              <p className="text-xs text-slate-400">Total registered students by academic branch</p>
            </div>
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>

          <div className="h-64">
            {deptBarData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No department records available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptBarData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700/60 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Attendance Breakdown
              </h3>
              <p className="text-xs text-slate-400">Overall ratio of present, absent, and late logs</p>
            </div>
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </span>
          </div>

          <div className="h-64 flex items-center justify-center">
            {statusPieData.length === 0 ? (
              <div className="text-xs text-slate-400">No attendance logged yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activities Audit Feed */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700/60 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Recent System Activities & Audits
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">Live Audit Trail</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
          {(!data?.recentActivities || data.recentActivities.length === 0) ? (
            <p className="text-xs text-slate-400 py-6 text-center">No activity records found.</p>
          ) : (
            data.recentActivities.map((act) => (
              <div key={act._id} className="py-3 flex items-start justify-between gap-3 text-xs">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">
                      [{act.action}]
                    </span>{' '}
                    {act.details}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    User: {act.user?.name || 'Automated System'} ({act.user?.email || 'System'})
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                  {new Date(act.createdAt).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
