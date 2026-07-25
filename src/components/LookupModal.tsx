import React, { useState } from 'react';
import { Appointment } from '../types';
import { lookupAppointment, updateAppointmentStatus } from '../utils/api';
import { Search, Calendar, Clock, User, Mail, AlertCircle, CheckCircle2, XCircle, ArrowLeft, Ban } from 'lucide-react';

interface LookupModalProps {
  onClose: () => void;
}

export const LookupModal: React.FC<LookupModalProps> = ({ onClose }) => {
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter your booking reference code.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setActionSuccess(null);

    try {
      const res = await lookupAppointment(code.trim(), email.trim() || undefined);
      setAppointment(res);
    } catch (err: any) {
      setAppointment(null);
      setError(err.message || 'No appointment found matching that code and email.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!appointment) return;
    if (!confirm('Are you sure you want to cancel this appointment? This action frees up the slot for others.')) {
      return;
    }

    try {
      const updated = await updateAppointmentStatus(appointment.id, 'CANCELLED');
      setAppointment(updated);
      setActionSuccess('Your appointment has been cancelled successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to cancel appointment.');
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-lg space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Search className="w-5 h-5 text-indigo-600" />
          <span>Find Existing Appointment</span>
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Enter your 6-character reference code (e.g., BK-7890) to view or manage your schedule.
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Reference Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. BK-7890"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-colors uppercase tracking-wider font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Email Address <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. sarah@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Searching...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>Lookup Appointment</span>
            </>
          )}
        </button>
      </form>

      {/* Error State */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-800 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Notification */}
      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-800 flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Appointment Result Card */}
      {appointment && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Meeting Type
              </span>
              <h4 className="font-bold text-slate-900 text-base">{appointment.bookingTypeName}</h4>
            </div>

            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                appointment.status === 'CONFIRMED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : appointment.status === 'CANCELLED'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-indigo-100 text-indigo-800'
              }`}
            >
              {appointment.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 font-medium block">Date</span>
              <span className="font-bold text-slate-800">{appointment.date}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Time</span>
              <span className="font-bold text-slate-800">
                {appointment.startTime} - {appointment.endTime}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Client</span>
              <span className="font-semibold text-slate-800">{appointment.clientName}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Phone</span>
              <span className="font-semibold text-slate-800">{appointment.clientPhone}</span>
            </div>
          </div>

          {appointment.status === 'CONFIRMED' && (
            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={handleCancelBooking}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-semibold text-xs transition-colors"
              >
                <Ban className="w-4 h-4" />
                <span>Cancel Appointment</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
