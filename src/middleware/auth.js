// ===================================
// IHSAN — Middleware d'authentification
// ===================================
const jwt = require('jsonwebtoken');

/**
 * Vérifie que l'utilisateur est connecté (token JWT valide)
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token manquant. Connectez-vous.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role, name }
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Token invalide ou expiré.' });
  }
}

/**
 * Vérifie que l'utilisateur a le bon rôle
 * Usage: roleMiddleware('validator') ou roleMiddleware('donor', 'validator')
 */
function roleMiddleware(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Accès refusé. Rôle requis: ${roles.join(' ou ')}.`,
      });
    }
    next();
  };
}

module.exports = { authMiddleware, roleMiddleware };
