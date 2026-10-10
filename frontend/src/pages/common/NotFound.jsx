import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 text-center">
      <div className="max-w-md p-8 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl space-y-4">
        <span className="text-6xl font-black text-indigo-600 dark:text-indigo-400">404</span>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Page Not Found</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          The requested page route could not be located in this application.
        </p>

        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition"
          >
            <Home className="w-4 h-4" /> Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
