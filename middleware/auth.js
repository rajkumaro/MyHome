const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verify JWT and attach user to req.user.
 */
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Restrict access to clients only.
 */
const isClient = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (req.user.userType !== 'client') {
    return res.status(403).json({ error: 'Access restricted to clients' });
  }
  next();
};

/**
 * Restrict access to service providers only.
 */
const isServiceProvider = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (req.user.userType !== 'service_provider') {
    return res.status(403).json({ error: 'Access restricted to service providers' });
  }
  next();
};

module.exports = { auth, isClient, isServiceProvider };
