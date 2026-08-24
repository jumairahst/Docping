const Availability = require('../models/Availability');
const Appointment = require('../models/Appointment');
const asyncHandler = require('../middleware/asyncHandler');
const { getDoctorForUser } = require('../utils/doctorProfile');

const getByDoctor = asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const { date } = req.query;

  const filter = { doctor: doctorId };
  if (date) filter.date = date;

  const availabilityList = await Availability.find(filter).sort({ date: 1 });

  const result = [];
  for (const entry of availabilityList) {
    const booked = await Appointment.find({
      doctor: doctorId,
      date: entry.date,
      status: { $ne: 'cancelled' },
    }).select('timeSlot');

    const bookedSlots = booked.map((a) => a.timeSlot);
    result.push({
      _id: entry._id,
      date: entry.date,
      timeSlots: entry.timeSlots,
      bookedSlots,
    });
  }

  res.json({ count: result.length, availability: result });
});

const upsertAvailability = asyncHandler(async (req, res) => {
  const doctor = await getDoctorForUser(req.user);
  if (!doctor) {
    res.status(404).json({
      error: 'Not Found',
      message: 'No doctor profile linked to this account.',
    });
    return;
  }

  const { date, timeSlots } = req.body;
  if (!date || !Array.isArray(timeSlots) || timeSlots.length === 0) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'date (YYYY-MM-DD) and a non-empty timeSlots array are required.',
    });
    return;
  }

  let entry = await Availability.findOne({ doctor: doctor._id, date });
  if (entry) {
    entry.timeSlots = timeSlots;
    await entry.save();
    res.json({ message: 'Availability updated.', availability: entry });
    return;
  }

  entry = await Availability.create({ doctor: doctor._id, date, timeSlots });
  res.status(201).json({ message: 'Availability created.', availability: entry });
});

const updateAvailability = asyncHandler(async (req, res) => {
  const doctor = await getDoctorForUser(req.user);
  if (!doctor) {
    res.status(404).json({
      error: 'Not Found',
      message: 'No doctor profile linked to this account.',
    });
    return;
  }

  const entry = await Availability.findById(req.params.id);
  if (!entry || String(entry.doctor) !== String(doctor._id)) {
    res.status(404).json({ error: 'Not Found', message: 'Availability entry not found for this doctor.' });
    return;
  }

  const { timeSlots } = req.body;
  if (!Array.isArray(timeSlots) || timeSlots.length === 0) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'A non-empty timeSlots array is required.',
    });
    return;
  }

  entry.timeSlots = timeSlots;
  await entry.save();
  res.json({ message: 'Availability updated.', availability: entry });
});

const deleteAvailability = asyncHandler(async (req, res) => {
  const doctor = await getDoctorForUser(req.user);
  if (!doctor) {
    res.status(404).json({
      error: 'Not Found',
      message: 'No doctor profile linked to this account.',
    });
    return;
  }

  const entry = await Availability.findById(req.params.id);
  if (!entry || String(entry.doctor) !== String(doctor._id)) {
    res.status(404).json({ error: 'Not Found', message: 'Availability entry not found for this doctor.' });
    return;
  }

  await entry.deleteOne();
  res.json({ message: 'Availability entry deleted.' });
});

module.exports = {
  getByDoctor,
  upsertAvailability,
  updateAvailability,
  deleteAvailability,
};
