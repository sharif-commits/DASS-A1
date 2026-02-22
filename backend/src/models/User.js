const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["participant", "organizer", "admin"],
      required: true,
      immutable: true,
    },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },

    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    participantType: { type: String, enum: ["IIIT", "NON_IIIT"] },
    collegeOrOrgName: { type: String, trim: true },
    contactNumber: { type: String, trim: true },

    organizerName: { type: String, trim: true },
    category: { type: String, trim: true },
    description: { type: String, trim: true },
    contactEmail: { type: String, trim: true },
    contactPhone: { type: String, trim: true },
    loginEmail: { type: String, trim: true },
    disabled: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },
    discordWebhookUrl: { type: String, trim: true },

    interests: [{ type: String, trim: true }],
    followedOrganizers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
