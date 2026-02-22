const mongoose = require("mongoose");

const formFieldSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    key: { type: String, required: true },
    type: { type: String, enum: ["text", "dropdown", "checkbox", "file", "number"], required: true },
    required: { type: Boolean, default: false },
    options: [{ type: String }],
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const merchVariantSchema = new mongoose.Schema(
  {
    size: String,
    color: String,
    sku: String,
    stock: { type: Number, default: 0 },
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    eventType: { type: String, enum: ["NORMAL", "MERCHANDISE"], required: true },
    eligibility: { type: String, default: "ALL" },
    registrationDeadline: { type: Date, required: true },
    eventStartDate: { type: Date, required: true },
    eventEndDate: { type: Date, required: true },
    registrationLimit: { type: Number, default: 0 },
    registrationFee: { type: Number, default: 0 },
    organizerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tags: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "ONGOING", "COMPLETED", "CLOSED"],
      default: "DRAFT",
    },

    customForm: [formFieldSchema],
    formLocked: { type: Boolean, default: false },

    merchItemName: { type: String, trim: true },
    merchVariants: [merchVariantSchema],
    purchaseLimitPerParticipant: { type: Number, default: 1 },
    merchStock: { type: Number, default: 0 },

    registrationsLast24h: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);
