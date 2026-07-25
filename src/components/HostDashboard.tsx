import React, { useState, useEffect } from 'react';
import { Appointment, HostSettings } from '../types';
import { fetchAppointments, fetchHostSettings, updateAppointmentStatus, updateHostSettings } from '../utils/api';
import { Calendar, CheckCircle2, Clock, Filter, Search, Settings, ShieldCheck, XCircle, RefreshCw, User, Mail, Phone, Download, Save, Lock, AlertCircle } from 'lucide-react';

export const HostDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'settings'>('schedule');

  // Appointments state & filters
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Settings state
  const [settings, setSettings] = useState<HostSettings | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSavedMessage, setSettingsSavedMessage] = useState(false);

  const loadAppointments = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAppointments({
        date: filterDate || undefined,
        status: filterStatus,
        search: searchQuery || undefined
      });
      setAppointments(data);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await fetchHostSettings();
      setSettings(res);
    } catch (err) {
      console.error('Failed to load host settings:', err);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [filterDate, filterStatus, searchQuery]);

  useEffect(() => {
    loadSettings();
  }, []);

  const handleStatusChange = async (id: string, status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED') => {
    try {
      const updated = await updateAppointmentStatus(id, status);
      setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setIsSavingSettings(true);
    try {
      const updated = await updateHostSettings(settings);
      setSettings(updated);
      setSettingsSavedMessage(true);
      setTimeout(() => setSettingsSavedMessage(false), 3000);
    } catch (err) {
      console.error('Save settings failed:', err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // KPI Calculations
  const totalCount = appointments.length;
  const confirmedCount = appointments.filter((a) => a.status === 'CONFIRMED').length;
  const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length;
  const cancelledCount = appointments.filter((a) => a.status === 'CANCELLED').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Dashboard Subheader Navigation */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>Host Admin & Schedule Management</span>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-0.5 rounded-full border border-indigo-100">
              Host View
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Overview of upcoming bookings, client communications, and host availability rules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'schedule'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Appointments</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'settings'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Working Hours & Rules</span>
          </button>
        </div>
      </div>

      {activeTab === 'schedule' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Listed
              </p>
              <p className="text-2xl font-black text-slate-900 mt-1">{totalCount}</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                Confirmed
              </p>
              <p className="text-2xl font-black text-emerald-600 mt-1">{confirmedCount}</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                Completed
              </p>
              <p className="text-2xl font-black text-indigo-600 mt-1">{completedCount}</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <p className="text-xs font-semibold text-rose-500 uppercase tracking-wider">
                Cancelled
              </p>
              <p className="text-2xl font-black text-rose-500 mt-1">{cancelledCount}</p>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Search input */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, code, email..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:border-indigo-600 focus:outline-none"
                />
              </div>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-600"
              >
                <option value="ALL">All Statuses</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              {/* Date Filter */}
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-600"
              />

              {(filterDate || searchQuery || filterStatus !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterDate('');
                    setSearchQuery('');
                    setFilterStatus('ALL');
                  }}
                  className="text-xs text-indigo-600 font-semibold hover:underline"
                >
                  Reset Filters
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={loadAppointments}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh List</span>
            </button>
          </div>

          {/* Appointments Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center">
                <div className="w-7 h-7 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-xs text-slate-500">Loading appointments...</p>
              </div>
            ) : appointments.length === 0 ? (
              <div className="p-12 text-center">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No appointments found</p>
                <p className="text-xs text-slate-400 mt-0.5">Try clearing your filters or date picker.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Code / Type</th>
                      <th className="px-4 py-3">Date & Time</th>
                      <th className="px-4 py-3">Client Details</th>
                      <th className="px-4 py-3">Student / Notes</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {appointments.map((apt) => (
                      <tr key={apt.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3.5">
                          <span className="font-mono font-bold text-indigo-600 block">
                            {apt.bookingCode}
                          </span>
                          <span className="text-slate-900 font-semibold">{apt.bookingTypeName}</span>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="font-bold text-slate-900 block">{apt.date}</span>
                          <span className="text-slate-500 font-medium">
                            {apt.startTime} - {apt.endTime}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 space-y-0.5">
                          <span className="font-bold text-slate-900 block">{apt.clientName}</span>
                          <span className="text-slate-500 block">{apt.clientEmail}</span>
                          <span className="text-slate-400 font-mono">{apt.clientPhone}</span>
                        </td>

                        <td className="px-4 py-3.5 max-w-xs">
                          {apt.studentName && (
                            <span className="font-semibold text-slate-800 block">
                              {apt.studentName}
                            </span>
                          )}
                          {apt.notes ? (
                            <span className="text-slate-500 italic text-[11px] line-clamp-2">
                              "{apt.notes}"
                            </span>
                          ) : (
                            <span className="text-slate-300 italic">No extra notes</span>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              apt.status === 'CONFIRMED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : apt.status === 'COMPLETED'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {apt.status}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-right space-x-1">
                          {apt.status === 'CONFIRMED' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(apt.id, 'COMPLETED')}
                                className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-[11px] transition-colors"
                              >
                                Complete
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(apt.id, 'CANCELLED')}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[11px] transition-colors"
                              >
                                Cancel
                              </button>
                            </>
                          )}

                          {apt.status !== 'CONFIRMED' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(apt.id, 'CONFIRMED')}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors"
                            >
                              Restore
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Host Settings Tab */}
      {activeTab === 'settings' && settings && (
        <form onSubmit={handleSaveSettings} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 max-w-3xl">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-600" />
                <span>Host Availability & Schedule Configuration</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Configure standard working hours, lunch breaks, and automated booking rules.
              </p>
            </div>

            {settingsSavedMessage && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full animate-fade-in">
                Settings Saved!
              </span>
            )}
          </div>

          {/* Working Days Checkboxes */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Working Days
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { day: 1, label: 'Mon' },
                { day: 2, label: 'Tue' },
                { day: 3, label: 'Wed' },
                { day: 4, label: 'Thu' },
                { day: 5, label: 'Fri' },
                { day: 6, label: 'Sat' },
                { day: 0, label: 'Sun' }
              ].map(({ day, label }) => {
                const checked = settings.workDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      const newDays = checked
                        ? settings.workDays.filter((d) => d !== day)
                        : [...settings.workDays, day];
                      setSettings({ ...settings, workDays: newDays });
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                      checked
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hours Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Daily Start Hour (24H)
              </label>
              <input
                type="number"
                min={6}
                max={12}
                value={settings.startHour}
                onChange={(e) => setSettings({ ...settings, startHour: parseInt(e.target.value, 10) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Daily End Hour (24H)
              </label>
              <input
                type="number"
                min={13}
                max={22}
                value={settings.endHour}
                onChange={(e) => setSettings({ ...settings, endHour: parseInt(e.target.value, 10) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Lunch Break Start (24H)
              </label>
              <input
                type="number"
                min={11}
                max={14}
                value={settings.breakStartHour}
                onChange={(e) => setSettings({ ...settings, breakStartHour: parseInt(e.target.value, 10) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Lunch Break End (24H)
              </label>
              <input
                type="number"
                min={12}
                max={15}
                value={settings.breakEndHour}
                onChange={(e) => setSettings({ ...settings, breakEndHour: parseInt(e.target.value, 10) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isSavingSettings}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-600/20"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingSettings ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
