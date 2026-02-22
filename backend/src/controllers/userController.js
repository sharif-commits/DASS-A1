const User = require("../models/User");

async function updateParticipantProfile(req, res) {
  const allowed = [
    "firstName",
    "lastName",
    "contactNumber",
    "collegeOrOrgName",
    "interests",
    "followedOrganizers",
  ];

  for (const key of allowed) {
    if (key in req.body) {
      req.user[key] = req.body[key];
    }
  }

  await req.user.save();
  res.json({ user: req.user });
}

async function updateOrganizerProfile(req, res) {
  const allowed = [
    "organizerName",
    "category",
    "description",
    "contactEmail",
    "contactPhone",
    "discordWebhookUrl",
  ];

  for (const key of allowed) {
    if (key in req.body) {
      req.user[key] = req.body[key];
    }
  }

  await req.user.save();
  res.json({ user: req.user });
}

async function listOrganizers(req, res) {
  const organizers = await User.find({ role: "organizer", disabled: false })
    .select("organizerName category description contactEmail")
    .sort({ organizerName: 1 });
  res.json({ organizers });
}

async function organizerDetails(req, res) {
  const organizer = await User.findOne({ _id: req.params.organizerId, role: "organizer" }).select(
    "organizerName category description contactEmail"
  );
  if (!organizer) {
    return res.status(404).json({ message: "Organizer not found" });
  }
  res.json({ organizer });
}

module.exports = {
  updateParticipantProfile,
  updateOrganizerProfile,
  listOrganizers,
  organizerDetails,
};
