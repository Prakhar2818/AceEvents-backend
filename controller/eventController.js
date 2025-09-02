const Event = require("../model/Event");
const User = require("../model/User");

// @desc    Create a new event
// @route   POST /api/events
// @access  Private
const createEvent = async (req, res) => {
  try {
    const { title, description, dateOptions } = req.body;

    const event = new Event({
      title,
      description,
      creator: req.user.userId,
      dateOptions: dateOptions.map((option) => ({
        date: new Date(option.date),
        time: option.time,
        votes: [],
      })),
    });

    await event.save();
    await event.populate("creator", "username email");

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      event,
    });
  } catch (error) {
    console.error("Create event error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating event",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get user's events (created and invited)
// @route   GET /api/events
// @access  Private
const getUserEvents = async (req, res) => {
  try {
    // Get events created by user
    const createdEvents = await Event.find({ creator: req.user.userId })
      .populate("creator", "username email")
      .populate("participants.user", "username email")
      .sort({ createdAt: -1 });

    // Get events user is invited to
    const invitedEvents = await Event.find({
      "participants.user": req.user.userId,
    })
      .populate("creator", "username email")
      .populate("participants.user", "username email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        createdEvents,
        invitedEvents,
      },
    });
  } catch (error) {
    console.error("Get events error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching events",
    });
  }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Private
const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("creator", "username email")
      .populate("participants.user", "username email")
      .populate("dateOptions.votes.user", "username");

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check if user has access to this event
    const isCreator = event.creator._id.equals(req.user.userId);
    const isParticipant = event.participants.some(
      (p) => p.user._id.toString() === req.user.userId
    );

    if (!isCreator && !isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({
      success: true,
      event,
      userRole: isCreator ? "creator" : "participant",
    });
  } catch (error) {
    console.error("Get event error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching event",
    });
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (Creator only)
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check if user is the creator
    if (!event.creator._id.equals(req.user.userId)) {
      return res.status(403).json({
        success: false,
        message: "Only event creator can update the event",
      });
    }

    const { title, description, status } = req.body;

    // Update only allowed fields
    if (title) event.title = title;
    if (description) event.description = description;
    if (status) event.status = status;

    await event.save();
    await event.populate("creator", "username email");

    res.json({
      success: true,
      message: "Event updated successfully",
      event,
    });
  } catch (error) {
    console.error("Update event error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating event",
    });
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Creator only)
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check if user is the creator
    if (!event.creator._id.equals(req.user.userId)) {
      return res.status(403).json({
        success: false,
        message: "Only event creator can delete the event",
      });
    }

    await Event.findByIdAndDelete(req.params.id);

    // Remove event from users' invitations
    await User.updateMany(
      { "invitations.eventId": req.params.id },
      { $pull: { invitations: { eventId: req.params.id } } }
    );

    res.json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Delete event error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting event",
    });
  }
};

// @desc    Invite user to event
// @route   POST /api/events/:id/invite
// @access  Private (Creator only)
const inviteUser = async (req, res) => {
  try {
    const { userEmail } = req.body;
    const eventId = req.params.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check if user is the creator
    if (!event.creator._id.equals(req.user.userId)) {
      return res.status(403).json({
        success: false,
        message: "Only event creator can invite users",
      });
    }

    const userToInvite = await User.findOne({ email: userEmail });
    if (!userToInvite) {
      return res.status(404).json({
        success: false,
        message: "User not found with this email",
      });
    }

    // Check if user is already invited
    const alreadyInvited = event.participants.some(
      (p) => p.user.toString() === userToInvite._id.toString()
    );

    if (alreadyInvited) {
      return res.status(400).json({
        success: false,
        message: "User is already invited to this event",
      });
    }

    // Check if user is the creator
    if (userToInvite._id.toString() === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot invite yourself",
      });
    }

    // Add to event participants
    event.participants.push({
      user: userToInvite._id,
      status: "invited",
    });

    // Add to user invitations
    userToInvite.invitations.push({
      eventId: event._id,
      status: "pending",
    });

    await Promise.all([event.save(), userToInvite.save()]);

    res.json({
      success: true,
      message: `Invitation sent to ${userToInvite.username} successfully`,
    });
  } catch (error) {
    console.error("Invite user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while sending invitation",
    });
  }
};

module.exports = {
  createEvent,
  getUserEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  inviteUser,
};
