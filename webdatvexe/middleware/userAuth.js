// Middleware to check if user is logged in
const isUser = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

// Middleware to check if user is guest (not logged in)
const isGuest = (req, res, next) => {
  if (req.session.user) {
    return res.redirect('/user/profile');
  }
  next();
};

module.exports = {
  isUser,
  isGuest
}; 