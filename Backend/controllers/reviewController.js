const Review = require('../models/Review');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const asyncHandler = require('../middleware/asyncHandler');

const recomputeDoctorRating = async (doctorId) => {
  const agg = await Review.aggregate([
    { $match: { doctor: doctorId } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const data = agg[0];
  await Doctor.updateOne(
    { _id: doctorId },
    {
      $set: {
        avgRating: data ? Math.round(data.avg * 10) / 10 : 0,
        reviewCount: data ? data.count : 0,
      },
    }
  );
};

const listReviewsByDoctor = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ doctor: req.params.doctorId })
    .populate('patient', 'name')
    .sort({ createdAt: -1 });
  res.json({ count: reviews.length, reviews });
});

const createReview = asyncHandler(async (req, res) => {
  const { doctorId, rating, comment } = req.body;

  if (!doctorId || !rating) {
    res.status(400).json({ error: 'Bad Request', message: 'doctorId and rating (1-5) are required.' });
    return;
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    res.status(400).json({ error: 'Bad Request', message: 'rating must be an integer between 1 and 5.' });
    return;
  }

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    res.status(404).json({ error: 'Not Found', message: 'Doctor not found.' });
    return;
  }

  const completed = await Appointment.findOne({
    patient: req.user._id,
    doctor: doctorId,
    status: 'completed',
  });
  if (!completed) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'You can only review a doctor after a completed appointment.',
    });
    return;
  }

  try {
    const review = await Review.create({
      doctor: doctorId,
      patient: req.user._id,
      rating,
      comment: comment || '',
    });
    await recomputeDoctorRating(doctorId);
    res.status(201).json({ message: 'Review submitted.', review });
  } catch (err) {
    if (err.code === 11000) {
      res.status(409).json({
        error: 'Conflict',
        message: 'You have already reviewed this doctor. Update the existing review instead.',
      });
      return;
    }
    throw err;
  }
});

const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review || String(review.patient) !== String(req.user._id)) {
    res.status(404).json({ error: 'Not Found', message: 'Review not found for this patient.' });
    return;
  }

  const { rating, comment } = req.body;
  if (rating !== undefined) {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      res.status(400).json({ error: 'Bad Request', message: 'rating must be an integer between 1 and 5.' });
      return;
    }
    review.rating = rating;
  }
  if (comment !== undefined) review.comment = comment;

  await review.save();
  await recomputeDoctorRating(review.doctor);
  res.json({ message: 'Review updated.', review });
});

const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review || String(review.patient) !== String(req.user._id)) {
    res.status(404).json({ error: 'Not Found', message: 'Review not found for this patient.' });
    return;
  }

  const doctorId = review.doctor;
  await review.deleteOne();
  await recomputeDoctorRating(doctorId);
  res.json({ message: 'Review deleted.' });
});

module.exports = { listReviewsByDoctor, createReview, updateReview, deleteReview };
