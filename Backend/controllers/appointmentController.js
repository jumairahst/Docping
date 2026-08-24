const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Availability = require('../models/Availability');
const asyncHandler = require('../middleware/asyncHandler');
const { getDoctorForUser } = require('../utils/doctorProfile');

const isValidDate = (dateStr) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const d = new Date(`${dateStr}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === dateStr;
};

const createAppointment = asyncHandler(async (req, res) => {
  const { doctorId, date, timeSlot, notes } = req.body;

  if (!doctorId || !date || !timeSlot) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'doctorId, date (YYYY-MM-DD) and timeSlot are required.',
    });
    return;
  }
  if (!isValidDate(date)) {
    res.status(400).json({ error: 'Bad Request', message: 'date must be a valid YYYY-MM-DD date.' });
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  if (date < today) {
    res.status(400).json({ error: 'Bad Request', message: 'Cannot book an appointment in the past.' });
    return;
  }

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    res.status(404).json({ error: 'Not Found', message: 'Doctor not found.' });
    return;
  }

  const availability = await Availability.findOne({ doctor: doctorId, date });
  if (!availability || !availability.timeSlots.includes(timeSlot)) {
    res.status(400).json({
      error: 'Bad Request',
      message: `Time slot "${timeSlot}" is not available for this doctor on ${date}.`,
    });
    return;
  }

  try {
    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor: doctorId,
      date,
      timeSlot,
      notes: notes || '',
    });
    res.status(201).json({ message: 'Appointment booked.', appointment });
  } catch (err) {
    if (err.code === 11000) {
      res.status(409).json({
        error: 'Conflict',
        message: 'This time slot has already been booked. Please pick another.',
      });
      return;
    }
    throw err;
  }
});

const getMyAppointments = asyncHandler(async (req, res) => {
  const appointments = await Appointment.find({ patient: req.user._id })
    .populate('doctor', 'name specialty fee avgRating')
    .sort({ date: -1, timeSlot: 1 });
  res.json({ count: appointments.length, appointments });
});

const getDoctorAppointments = asyncHandler(async (req, res) => {
  const doctor = await getDoctorForUser(req.user);
  if (!doctor) {
    res.status(404).json({
      error: 'Not Found',
      message: 'No doctor profile linked to this account.',
    });
    return;
  }

  const { status } = req.query;
  const filter = { doctor: doctor._id };
  if (status) filter.status = status;

  const appointments = await Appointment.find(filter)
    .populate('patient', 'name phone age')
    .sort({ date: -1, timeSlot: 1 });

  res.json({ count: appointments.length, appointments });
});

const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const doctor = await getDoctorForUser(req.user);
  if (!doctor) {
    res.status(404).json({
      error: 'Not Found',
      message: 'No doctor profile linked to this account.',
    });
    return;
  }

  const appointment = await Appointment.findById(req.params.id);
  if (!appointment || String(appointment.doctor) !== String(doctor._id)) {
    res.status(404).json({ error: 'Not Found', message: 'Appointment not found for this doctor.' });
    return;
  }

  const { status } = req.body;
  if (!['confirmed', 'completed', 'cancelled'].includes(status)) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'status must be "confirmed", "completed" or "cancelled".',
    });
    return;
  }

  appointment.status = status;
  appointment.active = status !== 'cancelled';
  await appointment.save();
  res.json({ message: `Appointment marked as ${status}.`, appointment });
});

const cancelMyAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment || String(appointment.patient) !== String(req.user._id)) {
    res.status(404).json({ error: 'Not Found', message: 'Appointment not found for this patient.' });
    return;
  }

  appointment.status = 'cancelled';
  appointment.active = false;
  await appointment.save();
  res.json({ message: 'Appointment cancelled.', appointment });
});

module.exports = {
  createAppointment,
  getMyAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  cancelMyAppointment,
};
