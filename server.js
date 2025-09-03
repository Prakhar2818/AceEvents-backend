const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/database");
const serverless = require("serverless-http"); // ✅ Add this

const authRoutes = require("./routes/auth");
const eventRoutes = require("./routes/events")

const PORT = process.env.PORT || 5000

dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Backend is running 🚀",
    routes: ["/api/auth/signup", "/api/auth/login", "/api/auth/me"],
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/event", eventRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

app.use("/*path", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

module.exports.handler = serverless(app);
