const mongoose = require("mongoose");

const forumMessageSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["participant", "organizer", "admin"], required: true },
    content: { type: String, required: true },
    parentMessageId: { type: mongoose.Schema.Types.ObjectId, ref: "ForumMessage", default: null },
    pinned: { type: Boolean, default: false },
    reactions: {
      like: { type: Number, default: 0 },
      celebrate: { type: Number, default: 0 },
      question: { type: Number, default: 0 },
    },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ForumMessage", forumMessageSchema);
