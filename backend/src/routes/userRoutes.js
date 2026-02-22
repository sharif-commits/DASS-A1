const express = require("express");
const {
  updateParticipantProfile,
  updateOrganizerProfile,
  listOrganizers,
  organizerDetails,
} = require("../controllers/userController");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/organizers", requireAuth, listOrganizers);
router.get("/organizers/:organizerId", requireAuth, organizerDetails);
router.patch("/participant/profile", requireAuth, requireRole("participant"), updateParticipantProfile);
router.patch("/organizer/profile", requireAuth, requireRole("organizer"), updateOrganizerProfile);

module.exports = router;
