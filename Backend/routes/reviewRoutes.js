const express = require('express');
const {
  listReviewsByDoctor,
  createReview,
  updateReview,
  deleteReview,
} = require('../controllers/reviewController');
const { verifyFirebaseToken, requireUser, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/doctor/:doctorId', listReviewsByDoctor);

router.post('/', verifyFirebaseToken, requireUser, requireRole('patient'), createReview);
router.put('/:id', verifyFirebaseToken, requireUser, requireRole('patient'), updateReview);
router.delete('/:id', verifyFirebaseToken, requireUser, requireRole('patient'), deleteReview);

module.exports = router;
