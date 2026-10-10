import React from 'react';

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'indigo', trend }) => {
  const colorMap = {
    indigo: 'from-indigo-500 to-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50',
    emerald: 'from-emerald-500 to-emerald-600 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50',
    amber: 'from-amber-500 to-amber-600 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50',
    rose: 'from-rose-500 to-rose-600 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50',
    purple: 'from-purple-500 to-purple-600 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50',
  };

  const selectedColor = colorMap[color] || colorMap.indigo;

  return (
    <div className="relative overflow-hidden bg-white dark:bg-slate-800/80 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {title}
          </p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${selectedColor.split(' ').slice(2).join(' ')} shadow-inner`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center gap-1.5 text-xs">
          <span className={`font-bold ${trend > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend > 0 ? `+${trend}%` : `${trend}%`}
          </span>
          <span className="text-slate-400">vs last month</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
