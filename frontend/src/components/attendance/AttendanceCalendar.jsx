import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';

const AttendanceCalendar = ({ calendarData = [], onSelectDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Convert array to fast lookup map by YYYY-MM-DD
  const dataMap = {};
  calendarData.forEach((item) => {
    dataMap[item.date] = item;
  });

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-5 shadow-sm">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {monthNames[month]} {year}
          </h3>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
          >
            Today
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {daysOfWeek.map((d, index) => (
          <div
            key={d}
            className={`text-[11px] font-bold uppercase tracking-wider py-1 ${
              index === 0 ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Leading empty cells */}
        {Array.from({ length: firstDayIndex }).map((_, i) => (
          <div key={`empty-${i}`} className="h-14 sm:h-16 rounded-xl bg-slate-50/50 dark:bg-slate-900/30" />
        ))}

        {/* Days of current month */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
          const dayInfo = dataMap[formattedDate];
          const isToday =
            new Date().toDateString() === new Date(year, month, dayNum).toDateString();

          return (
            <div
              key={dayNum}
              onClick={() => onSelectDate && onSelectDate(formattedDate, dayInfo)}
              className={`h-14 sm:h-16 p-1.5 rounded-xl border flex flex-col justify-between transition cursor-pointer select-none ${
                isToday
                  ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20'
                  : 'border-slate-100 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold leading-none ${
                    isToday
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {dayNum}
                </span>

                {dayInfo && dayInfo.total > 0 && (
                  <span className="text-[10px] font-medium text-slate-400">
                    {dayInfo.total} logs
                  </span>
                )}
              </div>

              {/* Status indicators */}
              <div className="mt-auto flex flex-wrap gap-1">
                {dayInfo && dayInfo.present > 0 && (
                  <span
                    className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                    title={`${dayInfo.present} Present`}
                  >
                    P:{dayInfo.present}
                  </span>
                )}
                {dayInfo && dayInfo.absent > 0 && (
                  <span
                    className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                    title={`${dayInfo.absent} Absent`}
                  >
                    A:{dayInfo.absent}
                  </span>
                )}
                {dayInfo && dayInfo.late > 0 && (
                  <span
                    className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                    title={`${dayInfo.late} Late`}
                  >
                    L:{dayInfo.late}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Present
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Absent
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Late
        </span>
      </div>
    </div>
  );
};

export default AttendanceCalendar;
