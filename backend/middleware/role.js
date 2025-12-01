exports.requireRole = (allowedRoles) => (req, res, next) => {
  if (!req.user || !req.user.role) return res.status(401).json({ message: 'Unauthorized' });
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  next();
};
