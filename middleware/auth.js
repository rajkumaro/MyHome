const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const isServiceProvider = (req, res, next) => {
  if (req.user.userType !== 'service_provider') {
    return res.status(403).json({ message: 'Access denied. Service providers only.' });
  }
  next();
};

const isClient = (req, res, next) => {
  if (req.user.userType !== 'client') {
    return res.status(403).json({ message: 'Access denied. Clients only.' });
  }
  next();
};

module.exports = { auth, isServiceProvider, isClient };
