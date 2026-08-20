// Must run after authMiddleware. Restricts access to ADMIN role users only.
function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }
  next();
}

module.exports = adminMiddleware;
