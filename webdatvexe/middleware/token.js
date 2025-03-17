const jwt = require('jsonwebtoken');
require('dotenv').config();

// JWT Secret (from environment variables)
const JWT_SECRET = process.env.JWT_SECRET;

// Verify JWT token middleware
const verifyToken = (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.tokenUser = decoded; // Store decoded user in request
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: error.message
    });
  }
};

// Verify admin token
const verifyAdminToken = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.tokenUser && req.tokenUser.isAdmin) {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Admin privileges required'
      });
    }
  });
};

// Verify super admin token
const verifySuperAdminToken = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.tokenUser && req.tokenUser.isAdmin && req.tokenUser.isSuperAdmin) {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Super admin privileges required'
      });
    }
  });
};

module.exports = {
  verifyToken,
  verifyAdminToken,
  verifySuperAdminToken
}; 