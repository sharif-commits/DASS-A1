const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    participantId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    organizerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    eventType: { type: String, enum: ["NORMAL", "MERCHANDISE"], required: true },

    status: {
      type: String,
      enum: [
        "REGISTERED",
        "CANCELLED",
        "REJECTED",
        "PENDING_APPROVAL",
        "SUCCESSFUL",
      ],
      default: "REGISTERED",
    },

    dynamicAnswers: { type: mongoose.Schema.Types.Mixed, default: {} },
    merchSelection: {
      size: String,
      color: String,
      quantity: { type: Number, default: 1 },
      proofImageUrl: String,
    },

    ticketId: { type: String, unique: true, sparse: true },
    qrPayload: String,
    qrImageDataUrl: String,
    attendanceScannedAt: Date,

    paymentApprovalComment: String,
    paymentApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

registrationSchema.index({ eventId: 1, participantId: 1 }, { unique: true });

module.exports = mongoose.model("Registration", registrationSchema);
