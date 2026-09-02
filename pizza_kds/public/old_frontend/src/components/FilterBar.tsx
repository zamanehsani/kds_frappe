import React, { useState } from "react";

interface FilterBarProps {
  activeFilter: string;
  counts: Record<string, number>;
  onFilterChange: (filter: string) => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  isDateFilterActive: boolean;
  onDateClear: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  activeFilter,
  counts = {},
  onFilterChange,
  selectedDate,
  onDateChange,
  isDateFilterActive,
  onDateClear,
}) => {
  const filters = ["All", "New", "Cooking", "Ready", "Completed", "Cancelled"];
  const [showCalendar, setShowCalendar] = useState(false);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDateChange(new Date(e.target.value + "T00:00:00")); // local midnight, avoids UTC shift
    setShowCalendar(false);
  };

  const getDateLabel = () => {
    if (!isDateFilterActive) return "Today";
    return selectedDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="mb-8 sm:mb-10">
      {/* All Buttons - Single Row on Desktop, Wrapped on Mobile */}
      <div className="flex flex-wrap gap-2 sm:gap-3 items-center justify-center">
        {/* Filter Buttons */}
        {filters.map((f) => {
          const isActive = activeFilter === f;
          return (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              className={`px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-3.5 !rounded-2xl border-1 text-xs sm:text-sm md:text-base flex items-center gap-2 transition-all duration-200 font-semibold whitespace-nowrap active:scale-95 ${
                isActive
                  ? "bg-brand-green border-brand-green text-white shadow-md hover:shadow-lg"
                  : "bg-white border-olive-200 text-olive-700 hover:border-olive-400 hover:bg-olive-50"
              }`}
            >
              <span>{f}</span>
              <span
                className={`text-xs px-2 py-1 rounded-full font-bold transition-colors ${
                  isActive
                    ? "bg-white/25 text-white"
                    : "bg-emerald-200 text-emerald-900"
                }`}
              >
                {counts[f.toLowerCase()] || 0}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FilterBar;
