// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.session.admin) {
    return res.redirect('/login');
  }
  next();
};

// Middleware to check if user is super admin
const isSuperAdmin = (req, res, next) => {
  if (!req.session.admin || !req.session.admin.isSuperAdmin) {
    return res.redirect('/admin/dashboard');
  }
  next();
};

// Middleware to check if user is admin guest (not logged in)
const isAdminGuest = (req, res, next) => {
  if (req.session.admin) {
    return res.redirect('/admin/dashboard');
  }
  next();
};

module.exports = {
  isAdmin,
  isSuperAdmin,
  isAdminGuest
}; 