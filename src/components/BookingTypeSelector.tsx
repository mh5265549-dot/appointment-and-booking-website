import React from 'react';
import { BookingType } from '../types';
import { Briefcase, Clock, GraduationCap, MessageSquareText, Presentation, Sparkles, Check } from 'lucide-react';

interface BookingTypeSelectorProps {
  types: BookingType[];
  selectedTypeId: string;
  onSelectType: (type: BookingType) => void;
}

const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'GraduationCap':
      return GraduationCap;
    case 'Briefcase':
      return Briefcase;
    case 'Presentation':
      return Presentation;
    case 'MessageSquareText':
      return MessageSquareText;
    default:
      return GraduationCap;
  }
};

export const BookingTypeSelector: React.FC<BookingTypeSelectorProps> = ({
  types,
  selectedTypeId,
  onSelectType
}) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <span>Select Meeting Type</span>
          <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            Step 1 of 3
          </span>
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Choose the appointment type that fits your schedule and requirements.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {types.map((t) => {
          const IconComp = getIconComponent(t.icon);
          const isSelected = selectedTypeId === t.id;

          return (
            <div
              key={t.id}
              onClick={() => onSelectType(t)}
              className={`group relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-indigo-50/60 border-indigo-600 ring-2 ring-indigo-600/20 shadow-md'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200'
                      }`}
                    >
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 text-base leading-snug">
                        {t.title}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{t.durationMinutes} Minutes</span>
                      </div>
                    </div>
                  </div>

                  {t.badge && (
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                      }`}
                    >
                      {t.badge}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {t.description}
                </p>
              </div>

              {/* Bottom selection indicator */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium">
                <span className={isSelected ? 'text-indigo-700 font-semibold' : 'text-slate-400'}>
                  {isSelected ? 'Selected' : 'Click to select'}
                </span>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                    isSelected ? 'bg-indigo-600 text-white' : 'border border-slate-300 text-transparent'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
