const Doctor = require('../models/Doctor');

const getDoctorForUser = async (user) => {
  if (user.role !== 'doctor') return null;
  return Doctor.findOne({ user: user._id });
};

module.exports = { getDoctorForUser };
