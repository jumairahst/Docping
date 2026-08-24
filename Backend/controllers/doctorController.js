const Doctor = require('../models/Doctor');
const Availability = require('../models/Availability');
const Appointment = require('../models/Appointment');
const Review = require('../models/Review');
const asyncHandler = require('../middleware/asyncHandler');
const { getDoctorForUser } = require('../utils/doctorProfile');

const listDoctors = asyncHandler(async (req, res) => {
  const {
    specialty,
    search,
    minRating,
    sort,
    limit = 20,
    skip = 0
  } = req.query;

  const filter = {};

  if (specialty) {
    filter.specialty = specialty;
  }

  if (minRating) {
    filter.avgRating = {
      $gte: Number(minRating)
    };
  }

  if (search) {
    const rx = new RegExp(search.trim(), 'i');

    filter.$or = [
      { name: rx },
      { specialty: rx }
    ];
  }

  const sortMap = {
    rating: { avgRating: -1 },
    '-rating': { avgRating: 1 },
    fee: { fee: 1 },
    '-fee': { fee: -1 },
    newest: { createdAt: -1 }
  };

  const sortBy = sortMap[sort] || {
    createdAt: -1
  };

  const [doctors, total] = await Promise.all([
    Doctor.find(filter)
      .sort(sortBy)
      .skip(Number(skip))
      .limit(Math.min(Number(limit), 500)),

    Doctor.countDocuments(filter)
  ]);

  res.json({
    total,
    count: doctors.length,
    doctors
  });
});
const getDoctorById = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) {
    res.status(404).json({ error: 'Not Found', message: 'Doctor not found.' });
    return;
  }
  res.json({ doctor });
});

const updateMyDoctor = asyncHandler(async (req, res) => {
  const doctor = await getDoctorForUser(req.user);
  if (!doctor) {
    res.status(404).json({
      error: 'Not Found',
      message: 'No doctor profile linked to this account.',
    });
    return;
  }

  const { name, specialty, qualifications, experienceYears, fee, bio } = req.body;

  if (name !== undefined) {
    doctor.name = name.trim();
    req.user.name = name.trim();
    await req.user.save();
  }
  if (specialty !== undefined) doctor.specialty = specialty.trim();
  if (qualifications !== undefined) doctor.qualifications = qualifications;
  if (experienceYears !== undefined) doctor.experienceYears = experienceYears;
  if (fee !== undefined) doctor.fee = fee;
  if (bio !== undefined) doctor.bio = bio;

  await doctor.save();
  res.json({ message: 'Doctor profile updated.', doctor });
});

const deleteMyDoctor = asyncHandler(async (req, res) => {
  const doctor = await getDoctorForUser(req.user);
  if (!doctor) {
    res.status(404).json({
      error: 'Not Found',
      message: 'No doctor profile linked to this account.',
    });
    return;
  }

  await Promise.all([
    Availability.deleteMany({ doctor: doctor._id }),
    Review.deleteMany({ doctor: doctor._id }),
    Appointment.deleteMany({ doctor: doctor._id }),
  ]);
  await doctor.deleteOne();

  res.json({ message: 'Doctor profile and related data deleted.' });
});

module.exports = { listDoctors, getDoctorById, updateMyDoctor, deleteMyDoctor };
