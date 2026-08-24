const express = require('express');
const { register } = require('../controllers/authController');
const { verifyFirebaseToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', verifyFirebaseToken, register);

module.exports = router;
