/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Appointment, BookingType } from './types';
import { fetchBookingTypes } from './utils/api';
import { Header } from './components/Header';
import { MultiStepBookingWizard } from './components/MultiStepBookingWizard';
import { ConfirmationView } from './components/ConfirmationView';
import { LookupModal } from './components/LookupModal';
import { HostDashboard } from './components/HostDashboard';
import { Calendar, CheckCircle, Shield, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'book' | 'lookup' | 'dashboard'>('book');
  const [bookingTypes, setBookingTypes] = useState<BookingType[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    fetchBookingTypes()
      .then((data) => setBookingTypes(data))
      .catch((err) => console.error('Failed to load booking types:', err))
      .finally(() => setIsLoadingTypes(false));
  }, []);

  const handleResetFlow = () => {
    setConfirmedAppointment(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
      {/* Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        resetBookingFlow={handleResetFlow}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {isLoadingTypes ? (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-semibold text-slate-700">Initializing Booking Portal...</p>
            <p className="text-xs text-slate-400 mt-1">Connecting to Express API & double-booking engine</p>
          </div>
        ) : (
          <>
            {/* BOOKING FLOW */}
            {activeTab === 'book' && (
              <>
                {confirmedAppointment ? (
                  <ConfirmationView
                    appointment={confirmedAppointment}
                    onBookAnother={() => setConfirmedAppointment(null)}
                  />
                ) : (
                  <MultiStepBookingWizard
                    bookingTypes={bookingTypes}
                    onBookingSuccess={(apt) => setConfirmedAppointment(apt)}
                  />
                )}
              </>
            )}

            {/* LOOKUP MODAL */}
            {activeTab === 'lookup' && (
              <LookupModal onClose={() => setActiveTab('book')} />
            )}

            {/* HOST ADMIN DASHBOARD */}
            {activeTab === 'dashboard' && <HostDashboard />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 space-y-2">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-medium">
            <Shield className="w-4 h-4 text-indigo-600" />
            <span>AppointDesk Booking Engine • Real-time Conflict Resolution</span>
          </div>
          <p>© {new Date().getFullYear()} AppointDesk. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
