import { Appointment, BookingFormData, BookingType, HostSettings, SlotAvailabilityResponse } from '../types';

export async function fetchBookingTypes(): Promise<BookingType[]> {
  const res = await fetch('/api/booking-types');
  if (!res.ok) throw new Error('Failed to load booking types');
  return res.json();
}

export async function fetchSlotAvailability(date: string, typeId: string): Promise<SlotAvailabilityResponse> {
  const res = await fetch(`/api/availability?date=${encodeURIComponent(date)}&typeId=${encodeURIComponent(typeId)}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to check slot availability');
  }
  return res.json();
}

export async function createAppointment(data: BookingFormData): Promise<Appointment> {
  const res = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  const body = await res.json();
  if (!res.ok) {
    const errorObj = new Error(body.error || 'Failed to schedule appointment') as any;
    errorObj.isConflict = res.status === 409 || body.isConflict;
    throw errorObj;
  }
  return body.appointment;
}

export async function fetchAppointments(filters?: { date?: string; status?: string; search?: string }): Promise<Appointment[]> {
  const query = new URLSearchParams();
  if (filters?.date) query.set('date', filters.date);
  if (filters?.status) query.set('status', filters.status);
  if (filters?.search) query.set('search', filters.search);

  const res = await fetch(`/api/bookings?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch appointments');
  return res.json();
}

export async function lookupAppointment(code: string, email?: string): Promise<Appointment> {
  const query = new URLSearchParams({ code });
  if (email) query.set('email', email);

  const res = await fetch(`/api/bookings/lookup?${query.toString()}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Appointment reference not found');
  }
  return res.json();
}

export async function updateAppointmentStatus(id: string, status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'): Promise<Appointment> {
  const res = await fetch(`/api/bookings/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update appointment status');
  }
  return (await res.json()).appointment;
}

export async function fetchHostSettings(): Promise<HostSettings> {
  const res = await fetch('/api/settings');
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

export async function updateHostSettings(settings: Partial<HostSettings>): Promise<HostSettings> {
  const res = await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });

  if (!res.ok) throw new Error('Failed to save settings');
  return (await res.json()).settings;
}

export function buildGoogleCalendarUrl(apt: Appointment): string {
  const formatTime = (dateStr: string, time24: string) => {
    const cleanDate = dateStr.replace(/-/g, '');
    const cleanTime = time24.replace(':', '') + '00';
    return `${cleanDate}T${cleanTime}`;
  };

  const start = formatTime(apt.date, apt.startTime);
  const end = formatTime(apt.date, apt.endTime);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${apt.bookingTypeName} - ${apt.clientName}`,
    dates: `${start}/${end}`,
    details: `Booking Reference: ${apt.bookingCode}\nClient: ${apt.clientName} (${apt.clientEmail})\nNotes: ${apt.notes || 'None'}`,
    location: 'Online Portal / Classroom'
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
