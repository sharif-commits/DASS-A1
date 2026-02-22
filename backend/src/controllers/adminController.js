const { customAlphabet } = require("nanoid");
const User = require("../models/User");
const PasswordResetRequest = require("../models/PasswordResetRequest");
const { hashPassword } = require("../utils/auth");

const makePass = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789", 10);

async function createOrganizer(req, res) {
  const { organizerName, category, description, contactEmail, contactPhone } = req.body;

  if (!organizerName || !category) {
    return res.status(400).json({ message: "organizerName and category are required" });
  }

  const slug = organizerName.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 20);
  const loginEmail = `${slug}.${Date.now()}@felicity-organizer.local`;
  const rawPassword = makePass();

  const user = await User.create({
    role: "organizer",
    email: loginEmail,
    loginEmail,
    organizerName,
    category,
    description,
    contactEmail,
    contactPhone,
    passwordHash: await hashPassword(rawPassword),
  });

  res.status(201).json({
    message: "Organizer created",
    organizer: user,
    credentials: { email: loginEmail, password: rawPassword },
  });
}

async function listOrganizersAdmin(req, res) {
  const organizers = await User.find({ role: "organizer" }).sort({ createdAt: -1 });
  res.json({ organizers });
}

async function disableOrganizer(req, res) {
  const { action } = req.body;
  const organizer = await User.findOne({ _id: req.params.organizerId, role: "organizer" });
  if (!organizer) {
    return res.status(404).json({ message: "Organizer not found" });
  }

  if (action === "archive") {
    organizer.archived = true;
    organizer.disabled = true;
    await organizer.save();
    return res.json({ message: "Organizer archived" });
  }

  if (action === "delete") {
    await organizer.deleteOne();
    return res.json({ message: "Organizer permanently deleted" });
  }

  organizer.disabled = true;
  await organizer.save();
  res.json({ message: "Organizer disabled" });
}

async function listResetRequests(req, res) {
  const requests = await PasswordResetRequest.find().sort({ createdAt: -1 });
  res.json({ requests });
}

async function handleResetRequest(req, res) {
  const { status, adminComment } = req.body;
  const request = await PasswordResetRequest.findById(req.params.requestId);
  if (!request) {
    return res.status(404).json({ message: "Request not found" });
  }
  if (request.status !== "PENDING") {
    return res.status(400).json({ message: "Request already handled" });
  }

  request.status = status;
  request.adminComment = adminComment;
  request.handledByAdminId = req.user._id;
  request.handledAt = new Date();

  if (status === "APPROVED") {
    const organizer = await User.findById(request.organizerId);
    const rawPassword = makePass();
    organizer.passwordHash = await hashPassword(rawPassword);
    await organizer.save();
    request.generatedPassword = rawPassword;
  }

  await request.save();
  res.json({ request });
}

module.exports = {
  createOrganizer,
  listOrganizersAdmin,
  disableOrganizer,
  listResetRequests,
  handleResetRequest,
};
