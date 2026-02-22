const fs = require("fs");
const path = require("path");
const http = require("http");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const eventRoutes = require("./routes/eventRoutes");
const { ensureAdminSeeded } = require("./controllers/authController");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  },
});

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "5mb" }));
app.use(morgan("dev"));

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use("/uploads", express.static(uploadDir));

app.use((req, _, next) => {
  req.io = io;
  next();
});

app.get("/api/health", (_, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/events", eventRoutes);

io.on("connection", (socket) => {
  socket.on("forum:join", ({ eventId }) => {
    socket.join(`event:${eventId}`);
  });
});

const PORT = process.env.PORT || 10000;

(async function start() {
  try {
    await connectDB(process.env.MONGO_URI);
    await ensureAdminSeeded();
    server.listen(PORT, "0.0.0.0", () => console.log(`Backend running on port ${PORT}`));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
