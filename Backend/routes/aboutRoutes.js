const express = require('express');

const {
  getAbout,
} = require('../controllers/aboutController');

const router = express.Router();

/*
 * Public About API.
 * No authentication required.
 */
router.get('/', getAbout);

module.exports = router;