require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Review = require('../models/Review');
const Availability = require('../models/Availability');

const SLOTS = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
];

const dateInDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

const specialties = [
  { specialty: 'Cardiologist', count: 24, fee: [800, 900, 1000, 1100, 1200, 1300, 1400, 1500], qual: ['MBBS, MD', 'MBBS, FCPS', 'MBBS, MD, PhD'] },
  { specialty: 'Neurologist', count: 18, fee: [1000, 1100, 1200, 1300, 1400], qual: ['MBBS, FCPS', 'MBBS, MD (Neuro)', 'MBBS, PhD'] },
  { specialty: 'Dentist', count: 32, fee: [500, 600, 700, 800], qual: ['BDS', 'BDS, MS', 'BDS, MDS'] },
  { specialty: 'Eye Care', count: 15, fee: [700, 800, 900, 1000], qual: ['MBBS, DO', 'MBBS, MS (Ophth)', 'MBBS, FCPS'] },
  { specialty: 'Pediatrician', count: 20, fee: [600, 700, 750, 800], qual: ['MBBS, DCH', 'MBBS, FCPS (Paeds)', 'MBBS, MD'] },
  { specialty: 'Orthopedic', count: 12, fee: [900, 1000, 1100, 1200], qual: ['MBBS, MS (Ortho)', 'MBBS, FCPS', 'MBBS, MD'] },
  { specialty: 'Dermatologist', count: 22, fee: [700, 800, 900, 1000], qual: ['MBBS, DDV', 'MBBS, MD (Derm)', 'MBBS, FCPS'] },
  { specialty: 'General', count: 45, fee: [400, 500, 600], qual: ['MBBS', 'MBBS, MPH'] },
];

const firstNames = ['Farhan', 'Nadia', 'Karim', 'Sara', 'Rahim', 'Mitu', 'Tahmina', 'Rafiq', 'Sumaiya', 'Nasrin', 'Rezaul', 'Farzana', 'Aminul', 'Shahida', 'Tanvir', 'Roksana', 'Mahbub', 'Sabrina', 'Imran', 'Layla', 'Hasan', 'Fatema', 'Arif', 'Dilruba', 'Kabir', 'Nasima', 'Shafiq', 'Meher', 'Zahid', 'Parvin', 'Anwar', 'Shirina', 'Mamun', 'Rahela', 'Sohel', 'Razia', 'Farid', 'Monira', 'Belal', 'Sultana', 'Tariq', 'Salma', 'Jamal', 'Hasna', 'Liton'];
const lastNames = ['Ahmed', 'Islam', 'Hossain', 'Begum', 'Uddin', 'Akter', 'Khan', 'Rahman', 'Haque', 'Parvin', 'Chowdhury', 'Miah', 'Bhuiyan', 'Sarker', 'Mondal', 'Ali', 'Khatun', 'Biswas', 'Das', 'Roy'];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const patientData = [
  { firebaseUid: 'seed-patient-1', email: 'patient1@docping.dev', name: 'Rahim Hossain', phone: '01711111111', age: 28 },
  { firebaseUid: 'seed-patient-2', email: 'patient2@docping.dev', name: 'Nusrat Jahan', phone: '01722222222', age: 34 },
];

const run = async () => {
  await connectDB();

  await Promise.all([
    User.deleteMany({}),
    Doctor.deleteMany({}),
    Appointment.deleteMany({}),
    Review.deleteMany({}),
    Availability.deleteMany({}),
  ]);
  console.log('Cleared existing collections.');

  const patients = await User.create(patientData);
  console.log(`Created ${patients.length} sample patients.`);

  let totalDoctors = 0;
  const usedNames = new Set();

  for (const spec of specialties) {
    for (let i = 0; i < spec.count; i++) {
      let name;
      do {
        name = `Dr. ${rand(firstNames)} ${rand(lastNames)}`;
      } while (usedNames.has(name));
      usedNames.add(name);

      const email = `${name.replace('Dr. ', '').replace(' ', '.').toLowerCase()}${i}@docping.dev`;
      const exp = randInt(3, 20);
      const fee = rand(spec.fee);
      const qual = rand(spec.qual);
      const reviews = Array.from({ length: randInt(2, 5) }, () => randInt(3, 5));
      const avg = Math.round((reviews.reduce((a, b) => a + b, 0) / reviews.length) * 10) / 10;

      const user = await User.create({
        firebaseUid: `seed-doctor-${email}`,
        email,
        role: 'doctor',
        name,
        phone: `017${randInt(10000000, 99999999)}`,
        age: randInt(30, 60),
      });

      const doctor = await Doctor.create({
        user: user._id,
        name,
        specialty: spec.specialty,
        qualifications: qual,
        experienceYears: exp,
        fee,
        bio: `${spec.specialty} with ${exp} years of experience.`,
        avgRating: avg,
        reviewCount: reviews.length,
      });

      const usedPatients = new Set();
for (let r = 0; r < reviews.length; r++) {
  const patientIndex = r % patients.length;
  if (usedPatients.has(patientIndex)) continue;
  usedPatients.add(patientIndex);
  await Review.create({
    doctor: doctor._id,
    patient: patients[patientIndex]._id,
    rating: reviews[r],
    comment: `Great experience with ${name}.`,
  });
}

      for (let d = 1; d <= 7; d++) {
        await Availability.create({
          doctor: doctor._id,
          date: dateInDays(d),
          timeSlots: SLOTS,
        });
      }

      totalDoctors++;
    }
    console.log(`Created ${spec.count} ${spec.specialty} doctors.`);
  }

  console.log(`\nSeed complete. Total doctors: ${totalDoctors}`);
  console.log('Sample patients:');
  patients.forEach((p) => console.log(`  - ${p.email}`));

  await mongoose.connection.close();
  console.log('Database connection closed.');
};

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});