import React from 'react';
import { Loader2 } from 'lucide-react';

const Loader = ({ fullScreen = false, text = 'Loading data...' }) => {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm">
        <div className="p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl flex flex-col items-center space-y-4 border border-slate-200 dark:border-slate-700 animate-fadeIn">
          <div className="relative">
            <div className="w-14 h-14 rounded-full border-4 border-primary-200 dark:border-primary-900 border-t-primary-600 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl">🎓</span>
            </div>
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-3">
      <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      {text && <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{text}</p>}
    </div>
  );
};

export default Loader;
