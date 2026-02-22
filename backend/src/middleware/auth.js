const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user || user.disabled) {
      return res.status(401).json({ message: "Invalid user" });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
