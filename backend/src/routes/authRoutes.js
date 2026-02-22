const express = require("express");
const {
  ensureAdminSeeded,
  participantSignup,
  login,
  me,
  changePassword,
} = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/participant-signup", participantSignup);
router.post("/login", login);
router.get("/me", requireAuth, me);
router.post("/change-password", requireAuth, changePassword);
router.post("/seed-admin", async (req, res) => {
  await ensureAdminSeeded();
  res.json({ message: "Seed check done" });
});

module.exports = router;
