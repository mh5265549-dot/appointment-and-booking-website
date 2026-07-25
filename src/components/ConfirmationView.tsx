import React, { useState } from 'react';
import { Appointment } from '../types';
import { buildGoogleCalendarUrl } from '../utils/api';
import { CheckCircle2, Copy, Check, Calendar, Download, ExternalLink, Printer, PlusCircle, Clock, Mail, User, ShieldCheck } from 'lucide-react';

interface ConfirmationViewProps {
  appointment: Appointment;
  onBookAnother: () => void;
}

export const ConfirmationView: React.FC<ConfirmationViewProps> = ({
  appointment,
  onBookAnother
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(appointment.bookingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const googleCalendarUrl = buildGoogleCalendarUrl(appointment);
  const icsDownloadUrl = `/api/export/ics/${appointment.id}`;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Main Success Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-lg text-center space-y-6 relative overflow-hidden">
        {/* Top Decorative Banner */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600" />

        {/* Success Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner ring-8 ring-emerald-50 animate-bounce">
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
            Appointment Confirmed
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
            You're All Set!
          </h2>
          <p className="text-sm text-slate-600 mt-1.5 max-w-md mx-auto">
            A confirmation email has been dispatched to{' '}
            <strong className="text-slate-900">{appointment.clientEmail}</strong> with meeting instructions.
          </p>
        </div>

        {/* Reference Code Box */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-md mx-auto">
          <div className="text-left">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Booking Reference Code
            </p>
            <p className="text-2xl font-black text-indigo-600 tracking-wider font-mono">
              {appointment.bookingCode}
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-600 text-xs font-semibold transition-all shadow-sm active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        {/* Appointment Breakdown Table */}
        <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 text-left text-sm">
          <div className="p-4 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
            <span className="text-xs font-semibold text-slate-500 uppercase">Meeting Type</span>
            <span className="font-bold text-slate-900">{appointment.bookingTypeName}</span>
          </div>

          <div className="p-4 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Date & Time</span>
            <div className="text-right">
              <span className="font-bold text-indigo-600 block">{appointment.date}</span>
              <span className="text-xs font-semibold text-slate-700">
                {appointment.startTime} - {appointment.endTime}
              </span>
            </div>
          </div>

          <div className="p-4 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Client Name</span>
            <span className="font-semibold text-slate-800">{appointment.clientName}</span>
          </div>

          {appointment.studentName && (
            <div className="p-4 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">Student / Subject</span>
              <span className="font-semibold text-slate-800">{appointment.studentName}</span>
            </div>
          )}

          {appointment.notes && (
            <div className="p-4 flex items-start justify-between gap-4">
              <span className="text-xs font-semibold text-slate-500 uppercase shrink-0">Notes</span>
              <span className="text-xs text-slate-600 italic text-right max-w-xs">{appointment.notes}</span>
            </div>
          )}
        </div>

        {/* Calendar Sync Actions */}
        <div className="space-y-3 pt-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Add to your Personal Calendar
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href={googleCalendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-50 border border-indigo-200/80 text-indigo-700 hover:bg-indigo-100 font-semibold text-xs transition-colors shadow-sm"
            >
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Google Calendar</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </a>

            <a
              href={icsDownloadUrl}
              download
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 font-semibold text-xs transition-colors shadow-sm"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Download iCal (.ics)</span>
            </a>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Confirmation</span>
          </button>

          <button
            type="button"
            onClick={onBookAnother}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Book Another Appointment</span>
          </button>
        </div>
      </div>
    </div>
  );
};
