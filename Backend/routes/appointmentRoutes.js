const express = require('express');
const {
  createAppointment,
  getMyAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  cancelMyAppointment,
} = require('../controllers/appointmentController');
const { verifyFirebaseToken, requireUser, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post('/', verifyFirebaseToken, requireUser, requireRole('patient'), createAppointment);
router.get('/my', verifyFirebaseToken, requireUser, requireRole('patient'), getMyAppointments);

router.get(
  '/doctor',
  verifyFirebaseToken,
  requireUser,
  requireRole('doctor'),
  getDoctorAppointments
);
router.put(
  '/:id/status',
  verifyFirebaseToken,
  requireUser,
  requireRole('doctor'),
  updateAppointmentStatus
);
router.put(
  '/:id/cancel',
  verifyFirebaseToken,
  requireUser,
  requireRole('patient'),
  cancelMyAppointment
);

module.exports = router;
