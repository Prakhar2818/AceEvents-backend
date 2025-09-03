const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/database"); // path updated
const serverless = require("serverless-http");

const authRoutes = require("./routes/auth");
const eventRoutes = require("./routes/events");

dotenv.config();

const app = express();

// Connect DB (lazy connection)
connectDB();

// Middleware
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Backend is running 🚀",
    routes: ["/api/auth/signup", "/api/auth/login", "/api/auth/me"],
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/event", eventRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
  });
});

app.use("/*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

module.exports = serverless(app);
