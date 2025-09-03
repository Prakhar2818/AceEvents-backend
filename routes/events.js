const express = require("express");
const {
  validateEvent,
  handleValidationErrors,
} = require("../middleware/validation");
const auth = require("../middleware/auth");
const {
  createEvent,
  getUserEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  inviteUser,
  voteOnPoll,
  getPollResults,
  closePoll,
} = require("../controller/eventController");

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// @route   GET /api/events
router.get("/", getUserEvents);

// @route   POST /api/events
router.post("/", validateEvent, handleValidationErrors, createEvent);

// @route   GET /api/events/:id
router.get("/:id", getEvent);

// @route   PUT /api/events/:id
router.put("/:id", updateEvent);

// @route   DELETE /api/events/:id
router.delete("/:id", deleteEvent);

// @route   POST /api/events/:id/invite
router.post("/:id/invite", inviteUser);

router.post("/:id/vote", voteOnPoll);
router.get("/:id/poll", getPollResults);
router.post("/:id/poll/close", closePoll);

module.exports = router;
