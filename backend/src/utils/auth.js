const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

function signToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

module.exports = { signToken, hashPassword, verifyPassword };
