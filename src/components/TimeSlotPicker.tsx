import React from 'react';
import { TimeSlot } from '../types';
import { Clock, AlertCircle, CheckCircle2, Lock, Sun, Sunset, Moon } from 'lucide-react';

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot) => void;
  isLoading?: boolean;
  dateStr: string;
}

export const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  slots,
  selectedSlot,
  onSelectSlot,
  isLoading,
  dateStr
}) => {
  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center min-h-[280px]">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium text-slate-600">Checking slot availability in real time...</p>
        <p className="text-xs text-slate-400 mt-1">Checking double-booking conflicts on server</p>
      </div>
    );
  }

  if (!slots || slots.length === 0) {
    return (
      <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-6 shadow-sm text-center">
        <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-5 h-5" />
        </div>
        <h4 className="font-semibold text-slate-800 text-sm">No Time Slots Available</h4>
        <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
          The selected date ({dateStr}) is outside regular working hours, fully booked, or marked as closed by the host.
        </p>
        <p className="text-xs text-indigo-600 font-medium mt-3">
          Please select another date on the calendar above.
        </p>
      </div>
    );
  }

  // Filter slots into morning (before 12:00), afternoon (12:00 - 17:00), evening (after 17:00)
  const getHour24 = (time24: string) => parseInt(time24.split(':')[0], 10);

  const morningSlots = slots.filter((s) => getHour24(s.startTime) < 12);
  const afternoonSlots = slots.filter((s) => {
    const h = getHour24(s.startTime);
    return h >= 12 && h < 17;
  });
  const eveningSlots = slots.filter((s) => getHour24(s.startTime) >= 17);

  const availableCount = slots.filter((s) => s.status === 'available').length;

  const renderSlotGroup = (title: string, icon: React.ReactNode, groupSlots: TimeSlot[]) => {
    if (groupSlots.length === 0) return null;

    return (
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {icon}
          <span>{title}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {groupSlots.map((slot, idx) => {
            const isSelected =
              selectedSlot?.startTime === slot.startTime &&
              selectedSlot?.endTime === slot.endTime;

            const isAvailable = slot.status === 'available';
            const isBooked = slot.status === 'booked';
            const isBlocked = slot.status === 'blocked';
            const isPast = slot.status === 'past';

            return (
              <button
                key={`${slot.startTime}-${idx}`}
                type="button"
                disabled={!isAvailable}
                onClick={() => isAvailable && onSelectSlot(slot)}
                className={`p-3 rounded-xl border text-left text-sm transition-all flex items-center justify-between group ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold ring-2 ring-indigo-600/30'
                    : isAvailable
                    ? 'bg-white border-slate-200 text-slate-800 hover:border-indigo-500 hover:bg-indigo-50/50'
                    : isBooked
                    ? 'bg-slate-50 border-slate-200/80 text-slate-400 cursor-not-allowed opacity-75'
                    : isBlocked
                    ? 'bg-amber-50/40 border-amber-200/50 text-amber-700/60 cursor-not-allowed'
                    : 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className={`w-4 h-4 ${isSelected ? 'text-white' : isAvailable ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span className="font-medium text-xs sm:text-sm">{slot.formattedTime}</span>
                </div>

                <div>
                  {isSelected ? (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  ) : isBooked ? (
                    <span className="text-[10px] font-semibold bg-slate-200/70 text-slate-500 px-2 py-0.5 rounded-md">
                      Reserved
                    </span>
                  ) : isBlocked ? (
                    <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Lunch Break
                    </span>
                  ) : isPast ? (
                    <span className="text-[10px] text-slate-400">Past</span>
                  ) : (
                    <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100/80">
                      Open
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h4 className="font-semibold text-slate-900 text-base">Select Time Slot</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Times shown in local standard timezone
          </p>
        </div>

        <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
          {availableCount} {availableCount === 1 ? 'Slot' : 'Slots'} Open
        </span>
      </div>

      <div className="space-y-5">
        {renderSlotGroup('Morning', <Sun className="w-4 h-4 text-amber-500" />, morningSlots)}
        {renderSlotGroup('Afternoon', <Sunset className="w-4 h-4 text-orange-500" />, afternoonSlots)}
        {renderSlotGroup('Evening', <Moon className="w-4 h-4 text-indigo-400" />, eveningSlots)}
      </div>
    </div>
  );
};
