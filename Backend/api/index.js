const app = require('../server');
const connectDB = require('../config/db');
const { initFirebase } = require('../config/firebase');

let initialized = false;

const initializeServices = async () => {
  if (initialized) return;

  await connectDB();
  initFirebase();

  initialized = true;
};

module.exports = async (req, res) => {
  try {
    await initializeServices();
    return app(req, res);
  } catch (error) {
    console.error('Initialization error:', error);

    return res.status(500).json({
      error: 'Server initialization failed',
      message: error.message,
    });
  }
};