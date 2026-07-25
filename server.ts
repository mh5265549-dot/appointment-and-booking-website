import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 1. Booking Types
  app.get('/api/booking-types', (req, res) => {
    try {
      const types = db.getBookingTypes();
      res.json(types);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch booking types' });
    }
  });

  // 2. Slot Availability Check (Date & Booking Type)
  app.get('/api/availability', (req, res) => {
    try {
      const { date, typeId } = req.query;
      if (!date || typeof date !== 'string' || !typeId || typeof typeId !== 'string') {
        res.status(400).json({ error: 'Missing required query params: date (YYYY-MM-DD) and typeId' });
        return;
      }

      const bookingType = db.getBookingTypeById(typeId);
      if (!bookingType) {
        res.status(404).json({ error: 'Booking type not found' });
        return;
      }

      const slots = db.getAvailableSlots(date, typeId);
      const availableCount = slots.filter(s => s.status === 'available').length;
      const bookedCount = slots.filter(s => s.status === 'booked').length;

      res.json({
        date,
        bookingTypeId: typeId,
        bookingTypeName: bookingType.title,
        durationMinutes: bookingType.durationMinutes,
        slots,
        totalAvailable: availableCount,
        totalBooked: bookedCount
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error checking availability' });
    }
  });

  // 3. Create Appointment (Conflict Prevention API)
  app.post('/api/bookings', (req, res) => {
    try {
      const {
        bookingTypeId,
        date,
        startTime,
        endTime,
        clientName,
        clientEmail,
        clientPhone,
        studentName,
        notes
      } = req.body;

      // Basic field validation
      if (!bookingTypeId || !date || !startTime || !endTime || !clientName || !clientEmail || !clientPhone) {
        res.status(400).json({ error: 'Please provide all required fields: bookingTypeId, date, startTime, endTime, clientName, clientEmail, clientPhone.' });
        return;
      }

      // Email format check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(clientEmail)) {
        res.status(400).json({ error: 'Please enter a valid email address.' });
        return;
      }

      const result = db.createBooking({
        bookingTypeId,
        date,
        startTime,
        endTime,
        clientName,
        clientEmail,
        clientPhone,
        studentName,
        notes
      });

      if ('error' in result) {
        if (result.isConflict) {
          res.status(409).json({ error: result.error, isConflict: true });
          return;
        }
        res.status(400).json({ error: result.error });
        return;
      }

      res.status(201).json({
        message: 'Appointment successfully scheduled!',
        appointment: result.appointment
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Internal server error while creating booking' });
    }
  });

  // 4. List Bookings (Host Dashboard)
  app.get('/api/bookings', (req, res) => {
    try {
      const { date, status, search } = req.query;
      const appointments = db.getAppointments({
        date: typeof date === 'string' ? date : undefined,
        status: typeof status === 'string' ? status : undefined,
        search: typeof search === 'string' ? search : undefined
      });
      res.json(appointments);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch appointments' });
    }
  });

  // 5. Lookup Booking by Code or ID
  app.get('/api/bookings/lookup', (req, res) => {
    try {
      const { code, email } = req.query;
      if (!code || typeof code !== 'string') {
        res.status(400).json({ error: 'Missing code parameter' });
        return;
      }

      const appointment = db.getBookingByCode(code, typeof email === 'string' ? email : undefined);
      if (!appointment) {
        res.status(404).json({ error: 'Booking reference code not found or email mismatch.' });
        return;
      }

      res.json(appointment);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Lookup failed' });
    }
  });

  // 6. Update Booking Status (Cancel, Complete, Confirm)
  app.patch('/api/bookings/:id/status', (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(status)) {
        res.status(400).json({ error: 'Invalid status value. Must be CONFIRMED, CANCELLED, or COMPLETED.' });
        return;
      }

      const updated = db.updateBookingStatus(id, status);
      if (!updated) {
        res.status(404).json({ error: 'Appointment not found' });
        return;
      }

      res.json({ message: `Appointment status updated to ${status}`, appointment: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update appointment' });
    }
  });

  // 7. Host Availability Settings
  app.get('/api/settings', (req, res) => {
    try {
      res.json(db.getHostSettings());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/settings', (req, res) => {
    try {
      const updated = db.updateHostSettings(req.body);
      res.json({ message: 'Settings saved successfully', settings: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 8. iCalendar (.ics) File Export
  app.get('/api/export/ics/:id', (req, res) => {
    try {
      const { id } = req.params;
      const apt = db.getBookingById(id);
      if (!apt) {
        res.status(404).json({ error: 'Appointment not found' });
        return;
      }

      // Construct ISO date strings for iCal: YYYYMMDDTHHMMSSZ
      const cleanDate = apt.date.replace(/-/g, '');
      const cleanStart = apt.startTime.replace(':', '') + '00';
      const cleanEnd = apt.endTime.replace(':', '') + '00';

      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Appointment Booking Portal//EN',
        'METHOD:REQUEST',
        'BEGIN:VEVENT',
        `UID:${apt.id}@portal.app`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTSTART:${cleanDate}T${cleanStart}`,
        `DTEND:${cleanDate}T${cleanEnd}`,
        `SUMMARY:${apt.bookingTypeName} - ${apt.clientName}`,
        `DESCRIPTION:${apt.notes || 'No extra notes provided.'}\\nBooking Reference: ${apt.bookingCode}`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');

      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${apt.bookingCode}_appointment.ics"`);
      res.send(icsContent);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Export error' });
    }
  });

  // --- VITE MIDDLEWARE SETUP ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Booking portal server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
