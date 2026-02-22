const express = require("express");
const multer = require("multer");
const path = require("path");
const {
  createEvent,
  updateEvent,
  getOrganizerEvents,
  browseEvents,
  getEventById,
  registerNormalEvent,
  registerMerchEvent,
  decideMerchOrder,
  myRegistrations,
  organizerEventAnalytics,
  organizerParticipants,
  exportParticipantsCsv,
  scanAttendance,
  attendanceDashboard,
  attendanceCsv,
  createResetRequest,
  myResetRequests,
  listForumMessages,
  postForumMessage,
  moderateForumMessage,
  calendarIcs,
  listMerchOrders,
} = require("../controllers/eventController");
const { requireAuth, requireRole } = require("../middleware/auth");

const upload = multer({
  storage: multer.diskStorage({
    destination: (_, __, cb) => cb(null, path.join(process.cwd(), "uploads")),
    filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`),
  }),
});

const router = express.Router();

router.get("/browse", requireAuth, browseEvents);
router.get("/:eventId", requireAuth, getEventById);
router.get("/:eventId/calendar.ics", calendarIcs);

router.post("/organizer", requireAuth, requireRole("organizer"), createEvent);
router.patch("/organizer/:eventId", requireAuth, requireRole("organizer"), updateEvent);
router.get("/organizer/mine/list", requireAuth, requireRole("organizer"), getOrganizerEvents);
router.get("/organizer/merch-orders/list", requireAuth, requireRole("organizer"), listMerchOrders);
router.patch(
  "/organizer/merch-orders/:registrationId/decision",
  requireAuth,
  requireRole("organizer"),
  decideMerchOrder
);

router.get("/organizer/:eventId/analytics", requireAuth, requireRole("organizer"), organizerEventAnalytics);
router.get("/organizer/:eventId/participants", requireAuth, requireRole("organizer"), organizerParticipants);
router.get("/organizer/:eventId/participants.csv", requireAuth, requireRole("organizer"), exportParticipantsCsv);

router.post("/organizer/:eventId/attendance/scan", requireAuth, requireRole("organizer"), scanAttendance);
router.get("/organizer/:eventId/attendance/dashboard", requireAuth, requireRole("organizer"), attendanceDashboard);
router.get("/organizer/:eventId/attendance.csv", requireAuth, requireRole("organizer"), attendanceCsv);

router.post("/:eventId/register", requireAuth, requireRole("participant"), registerNormalEvent);
router.post(
  "/:eventId/purchase",
  requireAuth,
  requireRole("participant"),
  upload.single("paymentProof"),
  registerMerchEvent
);
router.get("/participant/my-registrations", requireAuth, requireRole("participant"), myRegistrations);

router.post("/organizer/reset-request", requireAuth, requireRole("organizer"), createResetRequest);
router.get("/organizer/reset-request/mine", requireAuth, requireRole("organizer"), myResetRequests);

router.get("/:eventId/forum", requireAuth, listForumMessages);
router.post("/:eventId/forum", requireAuth, postForumMessage);
router.patch(
  "/:eventId/forum/:messageId/moderate",
  requireAuth,
  moderateForumMessage
);

module.exports = router;
