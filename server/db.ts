import fs from 'fs';
import path from 'path';
import { Appointment, BookingType, HostSettings, TimeSlot } from '../src/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface DatabaseSchema {
  bookingTypes: BookingType[];
  appointments: Appointment[];
  settings: HostSettings;
}

const DEFAULT_BOOKING_TYPES: BookingType[] = [
  {
    id: 'pt-meeting',
    title: 'Parent-Teacher Conference',
    description: '1-on-1 discussion on student academic progress, classroom behavior, and learning goals.',
    durationMinutes: 30,
    category: 'parent_teacher',
    badge: 'Popular',
    color: 'indigo',
    icon: 'GraduationCap'
  },
  {
    id: 'consultation',
    title: 'Expert Consultation',
    description: 'Professional guidance session on curriculum planning, career pathing, or specialized support.',
    durationMinutes: 45,
    category: 'consultation',
    badge: '45 mins',
    color: 'emerald',
    icon: 'Briefcase'
  },
  {
    id: 'demo-class',
    title: 'Interactive Demo Class',
    description: 'Trial class session featuring real-time interactive coursework and course walkthrough.',
    durationMinutes: 60,
    category: 'demo_class',
    badge: 'Free Trial',
    color: 'amber',
    icon: 'Presentation'
  },
  {
    id: 'quick-checkin',
    title: 'Quick Academic Check-in',
    description: 'Short follow-up call to review recent assignment feedback or brief questions.',
    durationMinutes: 15,
    category: 'coaching',
    badge: '15 mins',
    color: 'sky',
    icon: 'MessageSquareText'
  }
];

const DEFAULT_SETTINGS: HostSettings = {
  workDays: [1, 2, 3, 4, 5], // Mon-Fri
  startHour: 9,              // 09:00 AM
  endHour: 17,             // 05:00 PM
  breakStartHour: 12,      // 12:00 PM
  breakEndHour: 13,        // 01:00 PM
  slotBufferMinutes: 5,
  blockedDates: [],
  maxBookingsPerSlot: 1,
  autoApprove: true
};

// Generate initial sample appointments relative to current date
function generateSeedAppointments(): Appointment[] {
  const today = new Date();
  const formatDateStr = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const day1 = new Date(today);
  day1.setDate(today.getDate() + 1);
  const day2 = new Date(today);
  day2.setDate(today.getDate() + 2);

  return [
    {
      id: 'apt_seed_1',
      bookingCode: 'BK-7890',
      bookingTypeId: 'pt-meeting',
      bookingTypeName: 'Parent-Teacher Conference',
      clientName: 'Sarah Jenkins',
      clientEmail: 'sarah.j@example.com',
      clientPhone: '(555) 234-5678',
      studentName: 'Leo Jenkins (Grade 5)',
      notes: 'Would like to discuss reading comprehension and math project timeline.',
      date: formatDateStr(day1),
      startTime: '10:00',
      endTime: '10:30',
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'apt_seed_2',
      bookingCode: 'BK-4512',
      bookingTypeId: 'consultation',
      bookingTypeName: 'Expert Consultation',
      clientName: 'David Miller',
      clientEmail: 'd.miller@example.com',
      clientPhone: '(555) 987-6543',
      studentName: 'Emma Miller (Grade 8)',
      notes: 'Consultation regarding advanced science module placement.',
      date: formatDateStr(day1),
      startTime: '14:00',
      endTime: '14:45',
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'apt_seed_3',
      bookingCode: 'BK-9931',
      bookingTypeId: 'demo-class',
      bookingTypeName: 'Interactive Demo Class',
      clientName: 'Elena Rostova',
      clientEmail: 'elena.r@example.com',
      clientPhone: '(555) 345-6789',
      studentName: 'Nikolai Rostova',
      notes: 'Interested in STEM robotics track demo session.',
      date: formatDateStr(day2),
      startTime: '11:00',
      endTime: '12:00',
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

class Database {
  private memoryData: DatabaseSchema;

  constructor() {
    this.memoryData = {
      bookingTypes: DEFAULT_BOOKING_TYPES,
      appointments: generateSeedAppointments(),
      settings: DEFAULT_SETTINGS
    };
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.memoryData = {
          bookingTypes: parsed.bookingTypes || DEFAULT_BOOKING_TYPES,
          appointments: parsed.appointments || generateSeedAppointments(),
          settings: parsed.settings || DEFAULT_SETTINGS
        };
      } else {
        this.save();
      }
    } catch (err) {
      console.warn('Database storage fallback to in-memory:', err);
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.memoryData, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  public getBookingTypes(): BookingType[] {
    return this.memoryData.bookingTypes;
  }

  public getBookingTypeById(id: string): BookingType | undefined {
    return this.memoryData.bookingTypes.find(t => t.id === id);
  }

  public getHostSettings(): HostSettings {
    return { ...this.memoryData.settings };
  }

  public updateHostSettings(newSettings: Partial<HostSettings>): HostSettings {
    this.memoryData.settings = { ...this.memoryData.settings, ...newSettings };
    this.save();
    return this.getHostSettings();
  }

  public getAppointments(filters?: { date?: string; status?: string; search?: string }): Appointment[] {
    let list = [...this.memoryData.appointments];

    if (filters?.date) {
      list = list.filter(a => a.date === filters.date);
    }
    if (filters?.status && filters.status !== 'ALL') {
      list = list.filter(a => a.status === filters.status);
    }
    if (filters?.search) {
      const query = filters.search.toLowerCase().trim();
      list = list.filter(a =>
        a.clientName.toLowerCase().includes(query) ||
        a.clientEmail.toLowerCase().includes(query) ||
        a.bookingCode.toLowerCase().includes(query) ||
        (a.studentName && a.studentName.toLowerCase().includes(query))
      );
    }

    // Sort by date then startTime ascending
    return list.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });
  }

  public getBookingById(id: string): Appointment | undefined {
    return this.memoryData.appointments.find(a => a.id === id);
  }

  public getBookingByCode(code: string, email?: string): Appointment | undefined {
    const formattedCode = code.trim().toUpperCase();
    return this.memoryData.appointments.find(a => {
      const matchCode = a.bookingCode.toUpperCase() === formattedCode;
      if (!matchCode) return false;
      if (email) {
        return a.clientEmail.toLowerCase().trim() === email.toLowerCase().trim();
      }
      return true;
    });
  }

  // Calculate slot availability for a specific date & booking type
  public getAvailableSlots(dateStr: string, bookingTypeId: string): TimeSlot[] {
    const bookingType = this.getBookingTypeById(bookingTypeId);
    if (!bookingType) return [];

    const settings = this.getHostSettings();
    const duration = bookingType.durationMinutes;

    // Check if day is working day
    const [year, month, day] = dateStr.split('-').map(Number);
    const targetDate = new Date(year, month - 1, day);
    const dayOfWeek = targetDate.getDay();

    if (!settings.workDays.includes(dayOfWeek) || settings.blockedDates.includes(dateStr)) {
      return []; // No slots on non-working or blocked days
    }

    // Existing active bookings for this date
    const existingBookings = this.memoryData.appointments.filter(
      a => a.date === dateStr && a.status === 'CONFIRMED'
    );

    const slots: TimeSlot[] = [];

    // Helper to format minutes into HH:mm
    const formatTime = (totalMin: number) => {
      const h = Math.floor(totalMin / 60);
      const m = totalMin % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    // Helper to format HH:mm into readable 12-hour AM/PM
    const format12H = (time24: string) => {
      const [hStr, mStr] = time24.split(':');
      let h = parseInt(hStr, 10);
      const period = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return `${h}:${mStr} ${period}`;
    };

    // Helper to convert HH:mm to total minutes from midnight
    const toMinutes = (time24: string) => {
      const [h, m] = time24.split(':').map(Number);
      return h * 60 + m;
    };

    const startMin = settings.startHour * 60;
    const endMin = settings.endHour * 60;
    const breakStartMin = settings.breakStartHour * 60;
    const breakEndMin = settings.breakEndHour * 60;

    const now = new Date();
    const isToday =
      targetDate.getFullYear() === now.getFullYear() &&
      targetDate.getMonth() === now.getMonth() &&
      targetDate.getDate() === now.getDate();
    const currentMinToday = now.getHours() * 60 + now.getMinutes();

    let curr = startMin;
    while (curr + duration <= endMin) {
      const slotStartMin = curr;
      const slotEndMin = curr + duration;

      const slotStartTime = formatTime(slotStartMin);
      const slotEndTime = formatTime(slotEndMin);

      let status: 'available' | 'booked' | 'blocked' | 'past' = 'available';

      // 1. Check if overlaps with lunch break
      if (
        (slotStartMin >= breakStartMin && slotStartMin < breakEndMin) ||
        (slotEndMin > breakStartMin && slotEndMin <= breakEndMin) ||
        (slotStartMin < breakStartMin && slotEndMin > breakEndMin)
      ) {
        status = 'blocked';
      }

      // 2. Check if in the past today
      if (isToday && slotStartMin <= currentMinToday + 15) { // 15-min cutoff for past slots
        status = 'past';
      }

      // 3. Check for conflict with existing confirmed bookings
      let matchedBookingId: string | undefined;
      if (status === 'available') {
        const hasOverlap = existingBookings.some(b => {
          const bStart = toMinutes(b.startTime);
          const bEnd = toMinutes(b.endTime);
          // Overlap check: slotStart < bEnd AND slotEnd > bStart
          const overlaps = slotStartMin < bEnd && slotEndMin > bStart;
          if (overlaps) {
            matchedBookingId = b.id;
          }
          return overlaps;
        });

        if (hasOverlap) {
          status = 'booked';
        }
      }

      slots.push({
        startTime: slotStartTime,
        endTime: slotEndTime,
        formattedTime: `${format12H(slotStartTime)} - ${format12H(slotEndTime)}`,
        status,
        bookingId: matchedBookingId
      });

      // Increment by duration + buffer or 30-min step
      curr += duration;
    }

    return slots;
  }

  // Atomic Create Booking with Conflict Prevention
  public createBooking(data: {
    bookingTypeId: string;
    date: string;
    startTime: string;
    endTime: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    studentName?: string;
    notes?: string;
  }): { success: true; appointment: Appointment } | { success: false; error: string; isConflict: boolean } {
    const type = this.getBookingTypeById(data.bookingTypeId);
    if (!type) {
      return { success: false, error: 'Invalid booking type selected.', isConflict: false };
    }

    // Convert times to minutes for overlap check
    const toMinutes = (time24: string) => {
      const [h, m] = time24.split(':').map(Number);
      return h * 60 + m;
    };

    const newStart = toMinutes(data.startTime);
    const newEnd = toMinutes(data.endTime);

    // Conflict Check against existing CONFIRMED bookings for this date
    const conflicts = this.memoryData.appointments.filter(a => {
      if (a.date !== data.date || a.status !== 'CONFIRMED') return false;
      const existStart = toMinutes(a.startTime);
      const existEnd = toMinutes(a.endTime);
      return newStart < existEnd && newEnd > existStart;
    });

    if (conflicts.length > 0) {
      return {
        success: false,
        error: `The time slot ${data.startTime} - ${data.endTime} on ${data.date} has already been reserved by another client. Please pick another available time slot.`,
        isConflict: true
      };
    }

    // Generate unique 6-character uppercase booking code, e.g., BK-92X7
    const randomCode = 'BK-' + Math.random().toString(36).substring(2, 6).toUpperCase();

    const newAppointment: Appointment = {
      id: `apt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      bookingCode: randomCode,
      bookingTypeId: data.bookingTypeId,
      bookingTypeName: type.title,
      clientName: data.clientName.trim(),
      clientEmail: data.clientEmail.trim().toLowerCase(),
      clientPhone: data.clientPhone.trim(),
      studentName: data.studentName ? data.studentName.trim() : undefined,
      notes: data.notes ? data.notes.trim() : undefined,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.memoryData.appointments.push(newAppointment);
    this.save();

    return { success: true, appointment: newAppointment };
  }

  public updateBookingStatus(id: string, status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'): Appointment | null {
    const apt = this.memoryData.appointments.find(a => a.id === id);
    if (!apt) return null;

    apt.status = status;
    apt.updatedAt = new Date().toISOString();
    this.save();
    return apt;
  }
}

export const db = new Database();
