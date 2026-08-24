const User = require('../models/User');
const Doctor = require('../models/Doctor');
const asyncHandler = require('../middleware/asyncHandler');

const register = asyncHandler(async (req, res) => {
  const {
    role,
    name,
    phone,
    age,
    specialty,
    qualifications,
    experienceYears,
    fee,
    bio,
  } = req.body;

  const email = req.firebaseEmail || '';

  if (!role || !['patient', 'doctor'].includes(role)) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'role must be "patient" or "doctor".',
    });
    return;
  }

  if (!name || !name.trim()) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'name is required.',
    });
    return;
  }

  // Check whether this Firebase account already has a DocPing account
  const existing = await User.findOne({
    firebaseUid: req.firebaseUid,
  });

  if (existing) {
    res.status(200).json({
      message: 'Account already registered.',
      user: existing,
      doctor:
        existing.role === 'doctor'
          ? await Doctor.findOne({
              user: existing._id,
            })
          : null,
    });

    return;
  }

  // Doctor must provide specialty
  if (role === 'doctor' && (!specialty || !specialty.trim())) {
    res.status(400).json({
      error: 'Bad Request',
      message:
        'specialty is required when registering as a doctor.',
    });

    return;
  }

  // Create MongoDB user
  const user = await User.create({
    firebaseUid: req.firebaseUid,
    email,
    role,
    name: name.trim(),
    phone: phone || '',
    age: age ? Number(age) : null,
  });

  let doctorProfile = null;

  // Create doctor profile if role is doctor
  if (role === 'doctor') {
    doctorProfile = await Doctor.create({
      user: user._id,
      name: user.name,
      specialty: specialty.trim(),
      qualifications: qualifications || '',
      experienceYears: experienceYears
        ? Number(experienceYears)
        : 0,
      fee: fee ? Number(fee) : 0,
      bio: bio || '',
    });
  }

  res.status(201).json({
    message: 'Registration successful.',
    user,
    doctor: doctorProfile,
  });
});

module.exports = {
  register,
};