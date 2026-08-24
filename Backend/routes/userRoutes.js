const express = require('express');
const { getMe, updateMe } = require('../controllers/userController');
const { verifyFirebaseToken, requireUser } = require('../middleware/auth');

const router = express.Router();

router.use(verifyFirebaseToken, requireUser);

router.get('/me', getMe);
router.put('/me', updateMe);

module.exports = router;
