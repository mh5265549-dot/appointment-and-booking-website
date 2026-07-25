import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Sparkles } from 'lucide-react';

interface DatePickerCalendarProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (dateStr: string) => void;
  workDays?: number[]; // [1,2,3,4,5] for Mon-Fri
  blockedDates?: string[];
}

export const DatePickerCalendar: React.FC<DatePickerCalendarProps> = ({
  selectedDate,
  onSelectDate,
  workDays = [1, 2, 3, 4, 5],
  blockedDates = []
}) => {
  // Current view year & month
  const initialDate = selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth()); // 0-indexed

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Days in current view month
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const formatYYYYMMDD = (year: number, monthZero: number, dayNum: number) => {
    const y = year;
    const m = String(monthZero + 1).padStart(2, '0');
    const d = String(dayNum).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Quick shortcuts helper
  const handleQuickSelect = (daysOffset: number) => {
    const target = new Date(today);
    target.setDate(today.getDate() + daysOffset);

    // If target day is non-working, find next working day
    while (!workDays.includes(target.getDay())) {
      target.setDate(target.getDate() + 1);
    }

    const y = target.getFullYear();
    const m = target.getMonth();
    const d = target.getDate();

    setViewYear(y);
    setViewMonth(m);
    onSelectDate(formatYYYYMMDD(y, m, d));
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-indigo-600" />
          <h4 className="font-semibold text-slate-900 text-base">
            {monthNames[viewMonth]} {viewYear}
          </h4>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Next Month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Quick Select Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-medium whitespace-nowrap">Quick Date:</span>
        <button
          type="button"
          onClick={() => handleQuickSelect(0)}
          className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-medium transition-colors whitespace-nowrap border border-slate-200"
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => handleQuickSelect(1)}
          className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-medium transition-colors whitespace-nowrap border border-slate-200"
        >
          Tomorrow
        </button>
        <button
          type="button"
          onClick={() => handleQuickSelect(2)}
          className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-medium transition-colors whitespace-nowrap border border-slate-200"
        >
          +2 Days
        </button>
      </div>

      {/* Day Names Grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
        {daysOfWeek.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {/* Blank cells before 1st day */}
        {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
          <div key={`blank-${idx}`} className="h-10" />
        ))}

        {/* Days of month */}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const dayNum = idx + 1;
          const dateStr = formatYYYYMMDD(viewYear, viewMonth, dayNum);
          const cellDate = new Date(viewYear, viewMonth, dayNum);

          const isPast = cellDate < today;
          const isSelected = selectedDate === dateStr;
          const isCurrentToday =
            cellDate.getFullYear() === today.getFullYear() &&
            cellDate.getMonth() === today.getMonth() &&
            cellDate.getDate() === today.getDate();

          const dayOfWeek = cellDate.getDay();
          const isWorkingDay = workDays.includes(dayOfWeek);
          const isBlocked = blockedDates.includes(dateStr);

          const isDisabled = isPast || !isWorkingDay || isBlocked;

          return (
            <button
              key={`day-${dayNum}`}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelectDate(dateStr)}
              className={`h-10 rounded-xl font-medium text-sm transition-all flex flex-col items-center justify-center relative ${
                isSelected
                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30 ring-2 ring-indigo-600 ring-offset-2'
                  : isDisabled
                  ? 'text-slate-300 bg-slate-50/50 cursor-not-allowed'
                  : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:font-semibold'
              }`}
            >
              <span>{dayNum}</span>

              {/* Indicator dots */}
              {isCurrentToday && !isSelected && (
                <span className="w-1 h-1 rounded-full bg-indigo-600 absolute bottom-1" />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer legend */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-600" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-slate-300" />
          <span>Unavailable / Closed</span>
        </div>
      </div>
    </div>
  );
};
