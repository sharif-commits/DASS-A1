const validator = require("validator");
const User = require("../models/User");
const { signToken, hashPassword, verifyPassword } = require("../utils/auth");

const iiitDomains = (process.env.IIIT_EMAIL_DOMAINS || "iiit.ac.in,students.iiit.ac.in,research.iiit.ac.in")
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

function isAllowedIiitEmail(email) {
  return iiitDomains.some((domain) => email.endsWith(`@${domain}`));
}

async function ensureAdminSeeded() {
  const existingAdmin = await User.findOne({ role: "admin" });
  if (existingAdmin) {
    return;
  }
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    return;
  }
  const passwordHash = await hashPassword(process.env.ADMIN_PASSWORD);
  await User.create({
    role: "admin",
    email: process.env.ADMIN_EMAIL.toLowerCase(),
    passwordHash,
    firstName: "System",
    lastName: "Admin",
  });
  console.log("Seeded initial admin user");
}

async function participantSignup(req, res) {
  const {
    firstName,
    lastName,
    email,
    password,
    participantType,
    collegeOrOrgName,
    contactNumber,
  } = req.body;

  if (!firstName || !lastName || !email || !password || !participantType) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  if (!validator.isEmail(normalizedEmail)) {
    return res.status(400).json({ message: "Invalid email" });
  }

  if (participantType === "IIIT" && !isAllowedIiitEmail(normalizedEmail)) {
    return res.status(400).json({
      message: `IIIT participants must use one of: ${iiitDomains.map((d) => `@${d}`).join(", ")}`,
    });
  }

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    return res.status(409).json({ message: "Email already registered" });
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    role: "participant",
    firstName,
    lastName,
    email: normalizedEmail,
    participantType,
    collegeOrOrgName,
    contactNumber,
    passwordHash,
  });

  const token = signToken(user);
  res.status(201).json({ token, user });
}

async function login(req, res) {
  const { email, password } = req.body;
  const normalizedEmail = String(email || "").toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user || user.disabled) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const ok = await verifyPassword(password || "", user.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = signToken(user);
  res.json({ token, user });
}

async function me(req, res) {
  res.json({ user: req.user });
}

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: "New password must be at least 6 characters" });
  }

  if (req.user.role === "participant") {
    const ok = await verifyPassword(currentPassword || "", req.user.passwordHash);
    if (!ok) {
      return res.status(400).json({ message: "Current password incorrect" });
    }
  }

  req.user.passwordHash = await hashPassword(newPassword);
  await req.user.save();
  res.json({ message: "Password changed" });
}

module.exports = {
  ensureAdminSeeded,
  participantSignup,
  login,
  me,
  changePassword,
};
