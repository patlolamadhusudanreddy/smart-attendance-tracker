import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  History,
  FileBarChart,
  QrCode,
  UserCheck,
  Settings,
  LogOut,
  X,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen, closeSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminNav = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Manage Students', path: '/admin/students', icon: GraduationCap },
    { name: 'Manage Teachers', path: '/admin/teachers', icon: Users },
    { name: 'Manage Subjects', path: '/admin/subjects', icon: BookOpen },
    { name: 'Classroom Geofences', path: '/admin/classrooms', icon: MapPin },
    { name: 'System Reports', path: '/admin/reports', icon: FileBarChart },
  ];

  const teacherNav = [
    { name: 'Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
    { name: 'Mark Attendance', path: '/teacher/attendance', icon: CalendarCheck },
    { name: 'Attendance History', path: '/teacher/history', icon: History },
    { name: 'Subject Reports', path: '/teacher/reports', icon: FileBarChart },
  ];

  const studentNav = [
    { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { name: 'My Attendance', path: '/student/attendance', icon: UserCheck },
    { name: 'Scan QR Attendance', path: '/student/qr-scan', icon: QrCode },
  ];

  const navItems =
    user?.role === 'admin'
      ? adminNav
      : user?.role === 'teacher'
      ? teacherNav
      : studentNav;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={closeSidebar}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar aside */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo Header in Sidebar */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
                <span className="text-base font-bold">🎓</span>
              </div>
              <span className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">
                Smart Attend
              </span>
            </div>
            <button
              onClick={closeSidebar}
              aria-label="Close Sidebar"
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User info banner inside sidebar */}
          <div className="p-4 mx-4 my-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
              alt={user?.name || 'User'}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/20"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{user?.role} Portal</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-4 space-y-1.5">
            <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Menu Navigation
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeSidebar}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
          <NavLink
            to="/profile"
            onClick={closeSidebar}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`
            }
          >
            <Settings className="w-4 h-4" />
            <span>Profile & Account</span>
          </NavLink>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
