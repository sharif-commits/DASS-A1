const fs = require("fs");
const path = require("path");
const { stringify } = require("csv-stringify/sync");
const Event = require("../models/Event");
const Registration = require("../models/Registration");
const User = require("../models/User");
const ForumMessage = require("../models/ForumMessage");
const PasswordResetRequest = require("../models/PasswordResetRequest");
const { generateTicketId, generateQrData } = require("../utils/ticket");
const { sendMail } = require("../utils/mailer");

async function createEvent(req, res) {
  const payload = req.body;
  const event = await Event.create({ ...payload, organizerId: req.user._id, status: "DRAFT" });
  res.status(201).json({ event });
}

function canEdit(event, roleUserId, body) {
  if (event.organizerId.toString() !== roleUserId.toString()) {
    return "Not your event";
  }

  if (event.status === "DRAFT") return null;

  if (event.status === "PUBLISHED") {
    const allowed = ["description", "registrationDeadline", "registrationLimit", "status"];
    for (const key of Object.keys(body)) {
      if (!allowed.includes(key)) return `Cannot edit field ${key} in published state`;
    }
    return null;
  }

  if (event.status === "ONGOING" || event.status === "COMPLETED") {
    const keys = Object.keys(body);
    if (keys.some((k) => k !== "status")) return "Only status can be changed";
  }

  return null;
}

async function updateEvent(req, res) {
  const event = await Event.findById(req.params.eventId);
  if (!event) return res.status(404).json({ message: "Event not found" });

  const error = canEdit(event, req.user._id, req.body);
  if (error) return res.status(400).json({ message: error });

  if (event.formLocked && req.body.customForm) {
    return res.status(400).json({ message: "Form is locked after first registration" });
  }

  Object.assign(event, req.body);
  await event.save();

  if (event.status === "PUBLISHED" && req.user.discordWebhookUrl) {
    console.log("Simulated Discord webhook post for event", event.name);
  }

  res.json({ event });
}

async function getOrganizerEvents(req, res) {
  const events = await Event.find({ organizerId: req.user._id }).sort({ createdAt: -1 });
  res.json({ events });
}

function normalizeSearchValue(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function subsequenceScore(text, term) {
  let textIdx = 0;
  let termIdx = 0;
  let lastMatch = -1;
  let gaps = 0;

  while (textIdx < text.length && termIdx < term.length) {
    if (text[textIdx] === term[termIdx]) {
      if (lastMatch !== -1) {
        gaps += Math.max(0, textIdx - lastMatch - 1);
      }
      lastMatch = textIdx;
      termIdx += 1;
    }
    textIdx += 1;
  }

  if (termIdx !== term.length) return 0;
  return Math.max(1, 60 - gaps);
}

function fuzzyMatchScore(text, term) {
  const normalizedText = normalizeSearchValue(text);
  const normalizedTerm = normalizeSearchValue(term);
  if (!normalizedText || !normalizedTerm) return 0;

  const exactIndex = normalizedText.indexOf(normalizedTerm);
  if (exactIndex >= 0) {
    return Math.max(1, 100 - exactIndex);
  }

  const textWords = normalizedText.split(" ");
  const termWords = normalizedTerm.split(" ");
  const tokenHits = termWords.filter((word) => textWords.some((item) => item.includes(word))).length;
  if (tokenHits > 0) {
    return tokenHits * 20;
  }

  return subsequenceScore(normalizedText, normalizedTerm);
}

async function browseEvents(req, res) {
  const {
    search,
    eventType,
    eligibility,
    fromDate,
    toDate,
    followedOnly,
    participantId,
  } = req.query;

  const query = { status: { $in: ["PUBLISHED", "ONGOING"] } };

  if (eventType) query.eventType = eventType;
  if (eligibility) query.eligibility = eligibility;

  if (fromDate || toDate) {
    query.eventStartDate = {};
    if (fromDate) query.eventStartDate.$gte = new Date(fromDate);
    if (toDate) query.eventStartDate.$lte = new Date(toDate);
  }

  let events = await Event.find(query).populate("organizerId", "organizerName category");

  const searchScores = new Map();
  if (search) {
    events = events
      .map((event) => {
        const nameScore = fuzzyMatchScore(event.name, search);
        const organizerScore = fuzzyMatchScore(event.organizerId?.organizerName || "", search);
        const score = Math.max(nameScore, organizerScore);
        searchScores.set(event._id.toString(), score);
        return event;
      })
      .filter((event) => (searchScores.get(event._id.toString()) || 0) > 0)
      .sort((a, b) => (searchScores.get(b._id.toString()) || 0) - (searchScores.get(a._id.toString()) || 0));
  }

  if (followedOnly === "true" && participantId) {
    const participant = await User.findById(participantId).select("followedOrganizers");
    const followedSet = new Set((participant?.followedOrganizers || []).map((id) => id.toString()));
    events = events.filter((event) => followedSet.has(event.organizerId?._id?.toString()));
  }

  if (participantId) {
    const participant = await User.findById(participantId).select("interests followedOrganizers");
    const interests = new Set((participant?.interests || []).map((it) => it.toLowerCase()));
    const followed = new Set((participant?.followedOrganizers || []).map((id) => id.toString()));

    events = events.sort((a, b) => {
      const score = (event) => {
        let points = 0;
        for (const tag of event.tags || []) {
          if (interests.has(tag.toLowerCase())) points += 2;
        }
        if (followed.has(event.organizerId?._id?.toString())) points += 3;
        points += event.registrationsLast24h || 0;
        if (search) {
          points += (searchScores.get(event._id.toString()) || 0) / 100;
        }
        return points;
      };
      return score(b) - score(a);
    });
  }

  const trending = [...events]
    .sort((a, b) => (b.registrationsLast24h || 0) - (a.registrationsLast24h || 0))
    .slice(0, 5);

  res.json({ events, trending });
}

async function getEventById(req, res) {
  const event = await Event.findById(req.params.eventId).populate("organizerId", "organizerName category description contactEmail");
  if (!event) return res.status(404).json({ message: "Event not found" });
  res.json({ event });
}

async function registerNormalEvent(req, res) {
  const event = await Event.findById(req.params.eventId);
  if (!event) return res.status(404).json({ message: "Event not found" });
  if (event.eventType !== "NORMAL") return res.status(400).json({ message: "Not a normal event" });

  const now = new Date();
  if (now > new Date(event.registrationDeadline)) {
    return res.status(400).json({ message: "Registration deadline passed" });
  }

  const currentCount = await Registration.countDocuments({ eventId: event._id, status: { $in: ["REGISTERED", "SUCCESSFUL"] } });
  if (event.registrationLimit > 0 && currentCount >= event.registrationLimit) {
    return res.status(400).json({ message: "Registration limit reached" });
  }

  const existing = await Registration.findOne({ eventId: event._id, participantId: req.user._id });
  if (existing) return res.status(409).json({ message: "Already registered" });

  const ticketId = generateTicketId();
  const qr = await generateQrData(ticketId, event._id.toString(), req.user._id.toString());

  const registration = await Registration.create({
    eventId: event._id,
    participantId: req.user._id,
    organizerId: event.organizerId,
    eventType: "NORMAL",
    status: "REGISTERED",
    dynamicAnswers: req.body.answers || {},
    ticketId,
    qrPayload: qr.payload,
    qrImageDataUrl: qr.qrImageDataUrl,
  });

  event.formLocked = true;
  event.registrationsLast24h += 1;
  await event.save();

  await sendMail({
    to: req.user.email,
    subject: `Ticket for ${event.name}`,
    text: `Ticket ID: ${ticketId}`,
  });

  res.status(201).json({ registration });
}

async function registerMerchEvent(req, res) {
  const event = await Event.findById(req.params.eventId);
  if (!event) return res.status(404).json({ message: "Event not found" });
  if (event.eventType !== "MERCHANDISE") return res.status(400).json({ message: "Not a merchandise event" });

  const { size, color, quantity = 1 } = req.body;
  if (quantity > event.purchaseLimitPerParticipant) {
    return res.status(400).json({ message: "Purchase limit exceeded" });
  }

  const existing = await Registration.findOne({ eventId: event._id, participantId: req.user._id });
  if (existing) return res.status(409).json({ message: "Already purchased/ordered" });

  if (!req.file) {
    return res.status(400).json({ message: "Payment proof image is required" });
  }

  const registration = await Registration.create({
    eventId: event._id,
    participantId: req.user._id,
    organizerId: event.organizerId,
    eventType: "MERCHANDISE",
    status: "PENDING_APPROVAL",
    merchSelection: {
      size,
      color,
      quantity,
      proofImageUrl: `/uploads/${req.file.filename}`,
    },
  });

  res.status(201).json({ registration });
}

async function decideMerchOrder(req, res) {
  const registration = await Registration.findById(req.params.registrationId).populate("eventId");
  if (!registration) return res.status(404).json({ message: "Order not found" });

  if (registration.organizerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { decision, comment } = req.body;
  if (registration.status !== "PENDING_APPROVAL") {
    return res.status(400).json({ message: "Order already decided" });
  }

  registration.paymentApprovalComment = comment;
  registration.paymentApprovedBy = req.user._id;

  if (decision === "APPROVE") {
    const qty = registration.merchSelection.quantity || 1;
    if (registration.eventId.merchStock < qty) {
      return res.status(400).json({ message: "Out of stock" });
    }

    registration.eventId.merchStock -= qty;
    registration.eventId.registrationsLast24h += 1;
    await registration.eventId.save();

    const ticketId = generateTicketId();
    const qr = await generateQrData(
      ticketId,
      registration.eventId._id.toString(),
      registration.participantId.toString()
    );

    registration.status = "SUCCESSFUL";
    registration.ticketId = ticketId;
    registration.qrPayload = qr.payload;
    registration.qrImageDataUrl = qr.qrImageDataUrl;

    const participant = await User.findById(registration.participantId);
    await sendMail({
      to: participant.email,
      subject: `Merch purchase confirmed for ${registration.eventId.name}`,
      text: `Ticket ID: ${ticketId}`,
    });
  } else {
    registration.status = "REJECTED";
  }

  await registration.save();
  res.json({ registration });
}

async function myRegistrations(req, res) {
  const registrations = await Registration.find({ participantId: req.user._id })
    .populate("eventId", "name eventType eventStartDate eventEndDate organizerId")
    .populate("organizerId", "organizerName")
    .sort({ createdAt: -1 });

  res.json({ registrations });
}

async function organizerEventAnalytics(req, res) {
  const event = await Event.findById(req.params.eventId);
  if (!event) return res.status(404).json({ message: "Event not found" });
  if (event.organizerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const regs = await Registration.find({ eventId: event._id });
  const successful = regs.filter((r) => ["REGISTERED", "SUCCESSFUL"].includes(r.status));
  const attendance = regs.filter((r) => !!r.attendanceScannedAt).length;
  const revenue = successful.length * (event.registrationFee || 0);

  res.json({
    registrations: regs.length,
    successful: successful.length,
    attendance,
    revenue,
  });
}

async function organizerParticipants(req, res) {
  const event = await Event.findById(req.params.eventId);
  if (!event) return res.status(404).json({ message: "Event not found" });
  if (event.organizerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { q = "", status } = req.query;
  let regs = await Registration.find({ eventId: event._id })
    .populate("participantId", "firstName lastName email")
    .sort({ createdAt: -1 });

  if (status) regs = regs.filter((r) => r.status === status);
  if (q) {
    const needle = q.toLowerCase();
    regs = regs.filter((r) => {
      const fullName = `${r.participantId?.firstName || ""} ${r.participantId?.lastName || ""}`.toLowerCase();
      const email = (r.participantId?.email || "").toLowerCase();
      return fullName.includes(needle) || email.includes(needle);
    });
  }

  res.json({ registrations: regs });
}

async function exportParticipantsCsv(req, res) {
  const event = await Event.findById(req.params.eventId);
  if (!event) return res.status(404).json({ message: "Event not found" });
  if (event.organizerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const regs = await Registration.find({ eventId: event._id }).populate("participantId", "firstName lastName email");

  const rows = regs.map((reg) => ({
    name: `${reg.participantId?.firstName || ""} ${reg.participantId?.lastName || ""}`.trim(),
    email: reg.participantId?.email || "",
    registrationDate: reg.createdAt?.toISOString(),
    paymentStatus: reg.status,
    attendance: reg.attendanceScannedAt ? "Present" : "Absent",
    ticketId: reg.ticketId || "",
  }));

  const csv = stringify(rows, { header: true });
  res.header("Content-Type", "text/csv");
  res.attachment(`event-${event._id}-participants.csv`);
  return res.send(csv);
}

async function scanAttendance(req, res) {
  const { ticketId } = req.body;
  const registration = await Registration.findOne({ ticketId, organizerId: req.user._id }).populate("participantId", "email firstName");

  if (!registration) {
    return res.status(404).json({ message: "Invalid ticket" });
  }

  if (registration.attendanceScannedAt) {
    return res.status(409).json({ message: "Duplicate scan", scannedAt: registration.attendanceScannedAt });
  }

  registration.attendanceScannedAt = new Date();
  await registration.save();

  res.json({ message: "Attendance marked", registration });
}

async function attendanceDashboard(req, res) {
  const event = await Event.findOne({ _id: req.params.eventId, organizerId: req.user._id });
  if (!event) return res.status(404).json({ message: "Event not found" });

  const regs = await Registration.find({ eventId: event._id }).populate("participantId", "firstName lastName email");
  const scanned = regs.filter((r) => !!r.attendanceScannedAt);
  const pending = regs.filter((r) => !r.attendanceScannedAt);

  res.json({ scannedCount: scanned.length, pendingCount: pending.length, scanned, pending });
}

async function attendanceCsv(req, res) {
  const event = await Event.findOne({ _id: req.params.eventId, organizerId: req.user._id });
  if (!event) return res.status(404).json({ message: "Event not found" });

  const regs = await Registration.find({ eventId: event._id }).populate("participantId", "firstName lastName email");
  const rows = regs.map((reg) => ({
    name: `${reg.participantId?.firstName || ""} ${reg.participantId?.lastName || ""}`.trim(),
    email: reg.participantId?.email || "",
    ticketId: reg.ticketId || "",
    attendance: reg.attendanceScannedAt ? "Present" : "Absent",
    scannedAt: reg.attendanceScannedAt ? reg.attendanceScannedAt.toISOString() : "",
  }));

  const csv = stringify(rows, { header: true });
  res.header("Content-Type", "text/csv");
  res.attachment(`event-${event._id}-attendance.csv`);
  return res.send(csv);
}

async function createResetRequest(req, res) {
  if (req.user.role !== "organizer") {
    return res.status(403).json({ message: "Only organizers can request reset" });
  }

  const { reason } = req.body;
  if (!reason) return res.status(400).json({ message: "Reason required" });

  const request = await PasswordResetRequest.create({
    organizerId: req.user._id,
    organizerName: req.user.organizerName,
    reason,
  });

  res.status(201).json({ request });
}

async function myResetRequests(req, res) {
  const requests = await PasswordResetRequest.find({ organizerId: req.user._id }).sort({ createdAt: -1 });
  res.json({ requests });
}

async function listForumMessages(req, res) {
  const messages = await ForumMessage.find({ eventId: req.params.eventId })
    .populate("authorId", "firstName lastName organizerName")
    .sort({ pinned: -1, createdAt: 1 });
  res.json({ messages });
}

async function postForumMessage(req, res) {
  const registration = await Registration.findOne({
    eventId: req.params.eventId,
    participantId: req.user._id,
    status: { $in: ["REGISTERED", "SUCCESSFUL"] },
  });

  const event = await Event.findById(req.params.eventId);
  const isOrganizer = event?.organizerId?.toString() === req.user._id.toString();

  if (req.user.role === "participant" && !registration) {
    return res.status(403).json({ message: "Only registered participants can post" });
  }

  if (req.user.role === "organizer" && !isOrganizer) {
    return res.status(403).json({ message: "Only event organizer can moderate/post" });
  }

  const msg = await ForumMessage.create({
    eventId: req.params.eventId,
    authorId: req.user._id,
    role: req.user.role,
    content: req.body.content,
    parentMessageId: req.body.parentMessageId || null,
  });

  req.io.to(`event:${req.params.eventId}`).emit("forum:new", msg);
  res.status(201).json({ message: msg });
}

async function moderateForumMessage(req, res) {
  const { action, reaction } = req.body;
  const message = await ForumMessage.findById(req.params.messageId);
  if (!message) return res.status(404).json({ message: "Message not found" });

  if (action === "react") {
    if (!["like", "celebrate", "question"].includes(reaction)) {
      return res.status(400).json({ message: "Invalid reaction" });
    }
    message.reactions[reaction] += 1;
    await message.save();
    req.io.to(`event:${req.params.eventId}`).emit("forum:update", message);
    return res.json({ message });
  }

  const event = await Event.findById(req.params.eventId);
  if (!event || event.organizerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (action === "delete") message.deleted = true;
  if (action === "pin") message.pinned = true;
  if (action === "unpin") message.pinned = false;

  await message.save();
  req.io.to(`event:${req.params.eventId}`).emit("forum:update", message);
  res.json({ message });
}

async function calendarIcs(req, res) {
  const event = await Event.findById(req.params.eventId);
  if (!event) return res.status(404).json({ message: "Event not found" });

  const formatDate = (date) =>
    new Date(date)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Felicity EMS//EN",
    "BEGIN:VEVENT",
    `UID:${event._id}@felicity-ems`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(event.eventStartDate)}`,
    `DTEND:${formatDate(event.eventEndDate)}`,
    `SUMMARY:${event.name}`,
    `DESCRIPTION:${(event.description || "").replace(/\n/g, "\\n")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const googleLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    event.name
  )}&dates=${encodeURIComponent(`${formatDate(event.eventStartDate)}/${formatDate(event.eventEndDate)}`)}&details=${encodeURIComponent(
    event.description || ""
  )}`;

  const outlookLink = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(
    event.name
  )}&startdt=${encodeURIComponent(new Date(event.eventStartDate).toISOString())}&enddt=${encodeURIComponent(
    new Date(event.eventEndDate).toISOString()
  )}&body=${encodeURIComponent(event.description || "")}`;

  res.header("Content-Type", "text/calendar");
  res.header("X-Google-Calendar-Link", googleLink);
  res.header("X-Outlook-Calendar-Link", outlookLink);
  res.attachment(`${event.name.replace(/\s+/g, "-").toLowerCase()}.ics`);
  res.send(ics);
}

async function listMerchOrders(req, res) {
  const orders = await Registration.find({
    organizerId: req.user._id,
    eventType: "MERCHANDISE",
  })
    .populate("participantId", "firstName lastName email")
    .populate("eventId", "name")
    .sort({ createdAt: -1 });

  res.json({ orders });
}

module.exports = {
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
};
