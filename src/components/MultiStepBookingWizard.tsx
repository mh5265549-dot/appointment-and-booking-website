import React, { useState, useEffect } from 'react';
import { Appointment, BookingFormData, BookingType, TimeSlot, SlotAvailabilityResponse } from '../types';
import { BookingTypeSelector } from './BookingTypeSelector';
import { DatePickerCalendar } from './DatePickerCalendar';
import { TimeSlotPicker } from './TimeSlotPicker';
import { createAppointment, fetchSlotAvailability } from '../utils/api';
import { Calendar, Clock, User, Mail, Phone, FileText, CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft, ShieldCheck, UserCheck } from 'lucide-react';

interface MultiStepBookingWizardProps {
  bookingTypes: BookingType[];
  onBookingSuccess: (appointment: Appointment) => void;
}

export const MultiStepBookingWizard: React.FC<MultiStepBookingWizardProps> = ({
  bookingTypes,
  onBookingSuccess
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1 State
  const [selectedType, setSelectedType] = useState<BookingType>(
    bookingTypes[0] || {
      id: 'pt-meeting',
      title: 'Parent-Teacher Conference',
      description: 'Discuss student progress',
      durationMinutes: 30,
      category: 'parent_teacher',
      color: 'indigo',
      icon: 'GraduationCap'
    }
  );

  // Default to tomorrow's date
  const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    // If weekend, skip to Monday
    if (d.getDay() === 0) d.setDate(d.getDate() + 1); // Sun -> Mon
    if (d.getDay() === 6) d.setDate(d.getDate() + 2); // Sat -> Mon
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTomorrowStr());
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Slot availability state
  const [availability, setAvailability] = useState<SlotAvailabilityResponse | null>(null);
  const [isSlotLoading, setIsSlotLoading] = useState<boolean>(false);

  // Step 2 Form State & Field Errors
  const [formData, setFormData] = useState<{
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    studentName: string;
    notes: string;
    agreeToTerms: boolean;
  }>({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    studentName: '',
    notes: '',
    agreeToTerms: false
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [conflictError, setConflictError] = useState<string | null>(null);

  // Load slot availability whenever selectedDate or selectedType changes
  useEffect(() => {
    if (!selectedDate || !selectedType?.id) return;

    let isMounted = true;
    setIsSlotLoading(true);
    setConflictError(null);

    fetchSlotAvailability(selectedDate, selectedType.id)
      .then((data) => {
        if (isMounted) {
          setAvailability(data);
          // Reset selected slot if not valid for new date
          if (selectedSlot) {
            const stillValid = data.slots.find(
              (s) => s.startTime === selectedSlot.startTime && s.status === 'available'
            );
            if (!stillValid) setSelectedSlot(null);
          }
        }
      })
      .catch((err) => {
        console.error('Availability fetch error:', err);
      })
      .finally(() => {
        if (isMounted) setIsSlotLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDate, selectedType]);

  // Client-side validation for Step 2
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.clientName.trim() || formData.clientName.trim().length < 2) {
      errors.clientName = 'Please enter your full name (at least 2 characters).';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.clientEmail.trim() || !emailRegex.test(formData.clientEmail.trim())) {
      errors.clientEmail = 'Please enter a valid email address (e.g., name@example.com).';
    }

    const cleanPhone = formData.clientPhone.replace(/\D/g, '');
    if (!formData.clientPhone.trim() || cleanPhone.length < 7) {
      errors.clientPhone = 'Please enter a valid contact phone number.';
    }

    if (!formData.agreeToTerms) {
      errors.agreeToTerms = 'You must confirm the appointment agreement before proceeding.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleStep1Next = () => {
    if (!selectedSlot) return;
    setConflictError(null);
    setCurrentStep(2);
  };

  const handleStep2Next = () => {
    if (validateForm()) {
      setCurrentStep(3);
    }
  };

  const handleFinalSubmit = async () => {
    if (!selectedSlot || !selectedType) return;

    setIsSubmitting(true);
    setConflictError(null);

    const payload: BookingFormData = {
      bookingTypeId: selectedType.id,
      date: selectedDate,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      clientName: formData.clientName,
      clientEmail: formData.clientEmail,
      clientPhone: formData.clientPhone,
      studentName: formData.studentName || undefined,
      notes: formData.notes || undefined,
      agreeToTerms: formData.agreeToTerms
    };

    try {
      const createdApt = await createAppointment(payload);
      onBookingSuccess(createdApt);
    } catch (err: any) {
      console.error('Booking submission failed:', err);
      if (err.isConflict) {
        setConflictError(
          err.message || 'Double-booking conflict: This time slot was just taken by another client. Please select a different slot.'
        );
        // Refresh availability
        fetchSlotAvailability(selectedDate, selectedType.id).then(setAvailability);
        setCurrentStep(1); // Return to step 1 to select new time slot
      } else {
        setConflictError(err.message || 'Failed to complete booking. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Step Progress Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {/* Step 1 Indicator */}
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                currentStep >= 1
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              1
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Step 1</p>
              <p className="text-sm font-bold text-slate-900">Date & Slot</p>
            </div>
          </div>

          <div className={`flex-1 h-0.5 mx-3 ${currentStep >= 2 ? 'bg-indigo-600' : 'bg-slate-200'}`} />

          {/* Step 2 Indicator */}
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                currentStep >= 2
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              2
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Step 2</p>
              <p className="text-sm font-bold text-slate-900">Your Details</p>
            </div>
          </div>

          <div className={`flex-1 h-0.5 mx-3 ${currentStep >= 3 ? 'bg-indigo-600' : 'bg-slate-200'}`} />

          {/* Step 3 Indicator */}
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                currentStep === 3
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              3
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Step 3</p>
              <p className="text-sm font-bold text-slate-900">Confirm</p>
            </div>
          </div>
        </div>
      </div>

      {/* Double Booking Conflict Alert Banner */}
      {conflictError && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-rose-800 shadow-sm animate-shake">
          <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <h5 className="font-bold text-rose-900">Double-Booking Conflict Detected</h5>
            <p className="mt-1 leading-relaxed">{conflictError}</p>
          </div>
        </div>
      )}

      {/* STEP 1: Select Type, Date & Time Slot */}
      {currentStep === 1 && (
        <div className="space-y-8">
          {/* Meeting Type Selection */}
          <BookingTypeSelector
            types={bookingTypes}
            selectedTypeId={selectedType.id}
            onSelectType={(t) => {
              setSelectedType(t);
              setSelectedSlot(null);
            }}
          />

          {/* Grid Layout: Calendar & Slot Picker */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-6 space-y-2">
              <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>Select Appointment Date</span>
              </h4>
              <DatePickerCalendar
                selectedDate={selectedDate}
                onSelectDate={(d) => {
                  setSelectedDate(d);
                  setSelectedSlot(null);
                }}
              />
            </div>

            <div className="lg:col-span-6 space-y-2">
              <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Available Time Slots</span>
              </h4>
              <TimeSlotPicker
                slots={availability?.slots || []}
                selectedSlot={selectedSlot}
                onSelectSlot={setSelectedSlot}
                isLoading={isSlotLoading}
                dateStr={selectedDate}
              />
            </div>
          </div>

          {/* Step 1 Footer Action Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-sm">
            <div>
              {selectedSlot ? (
                <div className="flex items-center gap-2 text-sm text-slate-800 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>
                    Selected: <strong className="text-indigo-600">{selectedSlot.formattedTime}</strong> on{' '}
                    <strong className="text-slate-900">{selectedDate}</strong>
                  </span>
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">
                  Select a date and an open time slot above to continue.
                </p>
              )}
            </div>

            <button
              type="button"
              disabled={!selectedSlot}
              onClick={handleStep1Next}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                selectedSlot
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>Continue to Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Client Details Form */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-600" />
                <span>Your Contact & Appointment Details</span>
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Please enter your information to confirm the booking for{' '}
                <span className="font-semibold text-slate-800">{selectedType.title}</span> on{' '}
                <span className="font-semibold text-slate-800">{selectedDate} ({selectedSlot?.formattedTime})</span>.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => {
                      setFormData({ ...formData, clientName: e.target.value });
                      if (fieldErrors.clientName) {
                        setFieldErrors({ ...fieldErrors, clientName: '' });
                      }
                    }}
                    placeholder="e.g. Eleanor Vance"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 ${
                      fieldErrors.clientName
                        ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20'
                        : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-100'
                    }`}
                  />
                </div>
                {fieldErrors.clientName && (
                  <p className="text-xs text-rose-600 font-medium">{fieldErrors.clientName}</p>
                )}
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => {
                      setFormData({ ...formData, clientEmail: e.target.value });
                      if (fieldErrors.clientEmail) {
                        setFieldErrors({ ...fieldErrors, clientEmail: '' });
                      }
                    }}
                    placeholder="e.g. eleanor@example.com"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 ${
                      fieldErrors.clientEmail
                        ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20'
                        : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-100'
                    }`}
                  />
                </div>
                {fieldErrors.clientEmail && (
                  <p className="text-xs text-rose-600 font-medium">{fieldErrors.clientEmail}</p>
                )}
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    value={formData.clientPhone}
                    onChange={(e) => {
                      setFormData({ ...formData, clientPhone: e.target.value });
                      if (fieldErrors.clientPhone) {
                        setFieldErrors({ ...fieldErrors, clientPhone: '' });
                      }
                    }}
                    placeholder="e.g. (555) 234-5678"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 ${
                      fieldErrors.clientPhone
                        ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20'
                        : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-100'
                    }`}
                  />
                </div>
                {fieldErrors.clientPhone && (
                  <p className="text-xs text-rose-600 font-medium">{fieldErrors.clientPhone}</p>
                )}
              </div>

              {/* Student Name / Topic */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Student Name / Subject</span>
                  <span className="text-[11px] text-slate-400 font-normal">Optional</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    placeholder="e.g. Lucas Vance (Grade 6)"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-colors focus:outline-none"
                  />
                </div>
              </div>

              {/* Special Notes / Agenda */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Appointment Agenda / Special Notes</span>
                  <span className="text-[11px] text-slate-400 font-normal">Optional</span>
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Briefly describe what you'd like to discuss or focus on during this session..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-colors focus:outline-none"
                  />
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="sm:col-span-2 pt-2">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.agreeToTerms}
                    onChange={(e) => {
                      setFormData({ ...formData, agreeToTerms: e.target.checked });
                      if (fieldErrors.agreeToTerms) {
                        setFieldErrors({ ...fieldErrors, agreeToTerms: '' });
                      }
                    }}
                    className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-xs text-slate-600 leading-relaxed">
                    I confirm that the details provided are correct and agree to receive email notifications and calendar invites for this appointment.
                  </span>
                </label>
                {fieldErrors.agreeToTerms && (
                  <p className="text-xs text-rose-600 font-medium mt-1">{fieldErrors.agreeToTerms}</p>
                )}
              </div>
            </div>
          </div>

          {/* Step 2 Actions */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-sm">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-slate-700 hover:bg-slate-100 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Slot Picker</span>
            </button>

            <button
              type="button"
              onClick={handleStep2Next}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30 transition-all"
            >
              <span>Review & Confirm</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Final Review & Confirmation */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <span>Review Appointment Summary</span>
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Please double-check your appointment information before locking in your reservation.
                </p>
              </div>

              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                Conflict Checking Ready
              </span>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 border border-slate-200/80 rounded-xl p-5">
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Meeting Type
                  </p>
                  <p className="text-base font-bold text-slate-900 mt-0.5">{selectedType.title}</p>
                  <p className="text-xs text-slate-500">{selectedType.durationMinutes} Minutes Session</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Date & Time
                  </p>
                  <p className="text-base font-bold text-indigo-700 mt-0.5">
                    {selectedDate}
                  </p>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedSlot?.formattedTime}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Client Contact
                  </p>
                  <p className="text-base font-bold text-slate-900 mt-0.5">{formData.clientName}</p>
                  <p className="text-xs text-slate-600">{formData.clientEmail} • {formData.clientPhone}</p>
                </div>

                {formData.studentName && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Student / Attendee
                    </p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">{formData.studentName}</p>
                  </div>
                )}

                {formData.notes && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Notes
                    </p>
                    <p className="text-xs text-slate-600 italic mt-0.5">"{formData.notes}"</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Step 3 Actions */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-sm">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-slate-700 hover:bg-slate-100 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Edit Details</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinalSubmit}
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.01]"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Confirming & Checking Slot...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Confirm Booking Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
