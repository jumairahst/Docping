const mongoose = require('mongoose');

const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Review = require('../models/Review');
const Availability = require('../models/Availability');

let cachedConnection = null;

const connectDB = async () => {
  if (cachedConnection) {
    return cachedConnection;
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not set.');
  }

  mongoose.set('strictQuery', true);

  const conn = await mongoose.connect(uri);

  console.log(`MongoDB connected: ${conn.connection.host}`);

  await Promise.all([
    User.init(),
    Doctor.init(),
    Appointment.init(),
    Review.init(),
    Availability.init(),
  ]);

  console.log('Database indexes ensured.');

  cachedConnection = conn;

  return conn;
};

module.exports = connectDB;