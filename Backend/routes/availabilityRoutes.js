const express = require('express');
const {
  getByDoctor,
  upsertAvailability,
  updateAvailability,
  deleteAvailability,
} = require('../controllers/availabilityController');
const { verifyFirebaseToken, requireUser, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/doctor/:doctorId', getByDoctor);

router.post('/', verifyFirebaseToken, requireUser, requireRole('doctor'), upsertAvailability);
router.put('/:id', verifyFirebaseToken, requireUser, requireRole('doctor'), updateAvailability);
router.delete('/:id', verifyFirebaseToken, requireUser, requireRole('doctor'), deleteAvailability);

module.exports = router;
