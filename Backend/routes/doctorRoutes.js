const express = require('express');
const {
  listDoctors,
  getDoctorById,
  updateMyDoctor,
  deleteMyDoctor,
} = require('../controllers/doctorController');
const { verifyFirebaseToken, requireUser, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', listDoctors);
router.get('/:id', getDoctorById);

router.put('/me', verifyFirebaseToken, requireUser, requireRole('doctor'), updateMyDoctor);
router.delete('/me', verifyFirebaseToken, requireUser, requireRole('doctor'), deleteMyDoctor);

module.exports = router;
