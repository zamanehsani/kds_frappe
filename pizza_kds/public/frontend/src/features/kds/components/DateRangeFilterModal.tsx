import React, { useState } from "react";
import { CalendarRange, X } from "lucide-react";

export interface DateRange {
  start: Date;
  end: Date;
}

interface DateRangeFilterModalProps {
  initialRange: DateRange;
  isActive: boolean;
  onApply: (range: DateRange) => void;
  onClear: () => void;
  onClose: () => void;
}

// <input type="datetime-local"> needs "YYYY-MM-DDTHH:mm" in local time (no timezone conversion).
const toInputValue = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
};

const DateRangeFilterModal: React.FC<DateRangeFilterModalProps> = ({
  initialRange,
  isActive,
  onApply,
  onClear,
  onClose,
}) => {
  const [startValue, setStartValue] = useState(toInputValue(initialRange.start));
  const [endValue, setEndValue] = useState(toInputValue(initialRange.end));
  const [error, setError] = useState<string | null>(null);

  const handleApply = () => {
    const start = new Date(startValue);
    const end = new Date(endValue);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setError("Please select a valid start and end date/time.");
      return;
    }
    if (start >= end) {
      setError("Start must be before end.");
      return;
    }

    onApply({ start, end });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Filter orders by date"
    >
      <button
        type="button"
        aria-label="Close date filter"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px] "
      />

      <div className="relative w-full max-w-sm rounded-4xl border border-olive-200 bg-white p-5 sm:p-6 shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2  ">
            <CalendarRange className="w-5 h-5" strokeWidth={1} />
            Filter by Date
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-3 !rounded-full border border-red-600 hover:bg-red-600 text-olive-600 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="kds-date-filter-start" className="" >
              Start
            </label>
            <input
              id="kds-date-filter-start"
              type="datetime-local"
              value={startValue}
              onChange={(e) => setStartValue(e.target.value)}
              className="w-full px-3 py-2.5 !rounded-full border border-olive-200 bg-white text-olive-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="kds-date-filter-end">
              End
            </label>
            <input
              id="kds-date-filter-end"
              type="datetime-local"
              value={endValue}
              onChange={(e) => setEndValue(e.target.value)}
              className="w-full px-3 py-2.5 !rounded-full border border-olive-200 bg-white text-olive-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent"
            />
          </div>

          {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}
        </div>

        <div className="flex items-center gap-2 mt-6">
          {isActive && (
            <button
              onClick={onClear}
              className="flex-1 !rounded-full border border-olive-200 px-4 py-2.5 hover:bg-olive-50 transition-colors"
            >
              Clear filter
            </button>
          )}
          <button
            onClick={handleApply}
            className="flex-1 !rounded-full bg-brand-green px-4 py-2.5 text-white hover:opacity-90 transition-opacity"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default DateRangeFilterModal;
