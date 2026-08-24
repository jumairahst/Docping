const { getAuth } = require('../config/firebase');
const User = require('../models/User');
const asyncHandler = require('./asyncHandler');

const verifyFirebaseToken = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    res.status(401).json({ error: 'Unauthorized', message: 'Missing Bearer token.' });
    return;
  }

  try {
    const decoded = await getAuth().verifyIdToken(token);
    req.firebaseUid = decoded.uid;
    req.firebaseEmail = decoded.email || '';
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token.' });
  }
});

const requireUser = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ firebaseUid: req.firebaseUid });
  if (!user) {
    res.status(404).json({
      error: 'Not Found',
      message: 'No DocPing account linked to this Firebase user. Register first.',
    });
    return;
  }
  req.user = user;
  next();
});

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
    return;
  }
  if (!roles.includes(req.user.role)) {
    res.status(403).json({
      error: 'Forbidden',
      message: `This action requires role: ${roles.join(' or ')}.`,
    });
    return;
  }
  next();
};

module.exports = { verifyFirebaseToken, requireUser, requireRole };
