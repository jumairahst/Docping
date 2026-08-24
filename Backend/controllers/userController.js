const asyncHandler = require('../middleware/asyncHandler');
const { getDoctorForUser } = require('../utils/doctorProfile');

const getMe = asyncHandler(async (req, res) => {
  const profile = await getDoctorForUser(req.user);
  res.json({ user: req.user, doctor: profile });
});

const updateMe = asyncHandler(async (req, res) => {
  const { name, phone, age } = req.body;

  if (name !== undefined) req.user.name = name.trim();
  if (phone !== undefined) req.user.phone = phone;
  if (age !== undefined) req.user.age = age;

  await req.user.save();

  let doctor = null;
  if (req.user.role === 'doctor') {
    doctor = await getDoctorForUser(req.user);
    if (doctor && name !== undefined && doctor.name !== req.user.name) {
      doctor.name = req.user.name;
      await doctor.save();
    }
  }

  res.json({ message: 'Profile updated.', user: req.user, doctor });
});

module.exports = { getMe, updateMe };
