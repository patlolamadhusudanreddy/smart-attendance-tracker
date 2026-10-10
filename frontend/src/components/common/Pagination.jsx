import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ page, pages, onPageChange, total, limit }) => {
  if (pages <= 1) return null;

  const startRecord = (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700/60 rounded-b-2xl text-xs text-slate-600 dark:text-slate-400">
      <div>
        Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{startRecord}</span> to{' '}
        <span className="font-semibold text-slate-800 dark:text-slate-200">{endRecord}</span> of{' '}
        <span className="font-semibold text-slate-800 dark:text-slate-200">{total}</span> results
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 transition"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {Array.from({ length: Math.min(5, pages) }, (_, i) => {
          let pageNum = page <= 3 ? i + 1 : page + i - 2;
          if (pageNum > pages) pageNum = pages - (4 - i);
          if (pageNum <= 0) pageNum = i + 1;

          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`w-8 h-8 rounded-lg font-semibold text-xs transition ${
                page === pageNum
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 transition"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
