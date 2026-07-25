export type AppointmentStatus = 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface BookingType {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  category: 'parent_teacher' | 'consultation' | 'demo_class' | 'coaching';
  badge?: string;
  color: string; // Tailwind color accent key e.g. "blue", "emerald", "indigo", "amber"
  icon: string; // Lucide icon name
}

export interface Appointment {
  id: string;
  bookingCode: string;
  bookingTypeId: string;
  bookingTypeName: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  studentName?: string;
  notes?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: AppointmentStatus;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface TimeSlot {
  startTime: string; // HH:mm format, e.g., "09:00"
  endTime: string;   // HH:mm format, e.g., "09:30"
  status: 'available' | 'booked' | 'blocked' | 'past';
  formattedTime: string; // e.g., "9:00 AM - 9:30 AM"
  bookingId?: string;
}

export interface HostSettings {
  workDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  startHour: number; // e.g., 9
  endHour: number;   // e.g., 17
  breakStartHour: number; // e.g., 12
  breakEndHour: number;   // e.g., 13
  slotBufferMinutes: number;
  blockedDates: string[]; // YYYY-MM-DD
  maxBookingsPerSlot: number;
  autoApprove: boolean;
}

export interface BookingFormData {
  bookingTypeId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  studentName?: string;
  notes?: string;
  agreeToTerms: boolean;
}

export interface SlotAvailabilityResponse {
  date: string;
  bookingTypeId: string;
  bookingTypeName: string;
  durationMinutes: number;
  slots: TimeSlot[];
  totalAvailable: number;
  totalBooked: number;
}
