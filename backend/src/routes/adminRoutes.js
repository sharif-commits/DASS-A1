const express = require("express");
const {
  createOrganizer,
  listOrganizersAdmin,
  disableOrganizer,
  listResetRequests,
  handleResetRequest,
} = require("../controllers/adminController");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, requireRole("admin"));

router.post("/organizers", createOrganizer);
router.get("/organizers", listOrganizersAdmin);
router.patch("/organizers/:organizerId/disable", disableOrganizer);
router.get("/reset-requests", listResetRequests);
router.patch("/reset-requests/:requestId", handleResetRequest);

module.exports = router;
