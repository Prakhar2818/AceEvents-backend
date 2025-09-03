const Event = require("../model/Event");
const User = require("../model/User");

// @desc    Create a new event
// @route   POST /api/events
// @access  Private

const createEvent = async (req, res) => {
  try {
    const { title, description, dateOptions, poll } = req.body; 

    const event = new Event({
      title,
      description,
      creator: req.user.userId,
      dateOptions: dateOptions.map((option) => ({
        date: new Date(option.date),
        time: option.time,
        votes: [],
      })),
      // ✅ ADDED: Poll field handling
      poll: {
        question: poll.question,
        options: poll.options.map((optionText) => ({
          text: optionText,
          votes: []
        })),
        allowMultiple: poll.allowMultiple || false,
        isActive: true
      }
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
    const isParticipant = event.participants.some((p) =>
      p.user._id.equals(req.user.userId)
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

// @desc    Vote on poll
// @route   POST /api/event/:id/vote
// @access  Private
const voteOnPoll = async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const eventId = req.params.id;

    console.log("🗳️ Vote request:", {
      eventId,
      optionIndex,
      userId: req.user.userId,
    });

    if (optionIndex === undefined || optionIndex === null) {
      return res.status(400).json({
        success: false,
        message: "optionIndex is required"
      });
    }

    if (typeof optionIndex !== 'number' || !Number.isInteger(optionIndex)) {
      return res.status(400).json({
        success: false,
        message: "optionIndex must be a valid integer"
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    if (!event.poll || !event.poll.options) {
      return res.status(400).json({
        success: false,
        message: "This event does not have a valid poll"
      });
    }

    // Check if poll is active
    if (!event.poll.isActive) {
      return res.status(400).json({
        success: false,
        message: "This poll has been closed",
      });
    }

    // Check if user has access to vote
    const isCreator = event.creator._id.equals(req.user.userId);
    const isParticipant = event.participants.some(
      (p) => p.user._id.equals(req.user.userId)
    );

    if (!isCreator && !isParticipant) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to vote on this poll",
      });
    }
    if (optionIndex < 0 || optionIndex >= event.poll.options.length) {
      return res.status(400).json({
        success: false,
        message: `Invalid poll option. Must be between 0 and ${event.poll.options.length - 1}`
      });
    }

    if (!event.poll.options[optionIndex]) {
      return res.status(400).json({
        success: false,
        message: "Selected poll option does not exist"
      });
    }

    // Remove existing votes if not allowing multiple
    if (!event.poll.allowMultiple) {
      event.poll.options.forEach((option) => {
        option.votes = option.votes.filter(
          (vote) => vote.user.toString() !== req.user.userId
        );
      });
    }

    // Check if user already voted for this option
    const existingVote = event.poll.options[optionIndex].votes.find(
      (vote) => vote.user.toString() === req.user.userId
    );

    if (existingVote) {
      // Remove vote (toggle functionality)
      event.poll.options[optionIndex].votes = event.poll.options[
        optionIndex
      ].votes.filter((vote) => vote.user.toString() !== req.user.userId);
    } else {
      // Add new vote
      event.poll.options[optionIndex].votes.push({
        user: req.user.userId,
      });
    }

    await event.save();

    // Get updated poll data with populated user info
    await event.populate("poll.options.votes.user", "username");

    console.log("✅ Vote processed successfully");

    res.json({
      success: true,
      message: existingVote
        ? "Vote removed successfully"
        : "Vote submitted successfully",
      poll: event.poll,
    });
  } catch (error) {
    console.error("❌ Vote error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while submitting vote",
    });
  }
};


// @desc    Get poll results
// @route   GET /api/event/:id/poll
// @access  Private
const getPollResults = async (req, res) => {
  try {
    const eventId = req.params.id;

    const event = await Event.findById(eventId)
      .populate("poll.options.votes.user", "username")
      .select("poll title creator participants");

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check if user has access
    const isCreator = event.creator._id.equals(req.user.userId);
    const isParticipant = event.participants.some(
      (p) => p.user._id.equals(req.user.userId)
    );

    if (!isCreator && !isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Calculate poll statistics
    const totalVotes = event.poll.options.reduce(
      (total, option) => total + option.votes.length,
      0
    );

    const pollResults = {
      question: event.poll.question,
      totalVotes,
      isActive: event.poll.isActive,
      allowMultiple: event.poll.allowMultiple,
      options: event.poll.options.map((option) => ({
        text: option.text,
        voteCount: option.votes.length,
        percentage:
          totalVotes > 0
            ? Math.round((option.votes.length / totalVotes) * 100)
            : 0,
        voters: option.votes.map((vote) => vote.user.username),
      })),
      userVotes: event.poll.options.map((option, index) => ({
        optionIndex: index,
        hasVoted: option.votes.some(
          (vote) => vote.user._id.toString() === req.user.userId
        ),
      })),
    };

    res.json({
      success: true,
      results: pollResults,
    });
  } catch (error) {
    console.error("Get poll results error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching poll results",
    });
  }
};

// @desc    Close poll
// @route   POST /api/event/:id/poll/close
// @access  Private (Creator only)
const closePoll = async (req, res) => {
  try {
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
        message: "Only event creator can close the poll",
      });
    }

    event.poll.isActive = false;
    event.poll.closedAt = new Date();
    await event.save();

    res.json({
      success: true,
      message: "Poll closed successfully",
    });
  } catch (error) {
    console.error("Close poll error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while closing poll",
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
  voteOnPoll,
  getPollResults,
  closePoll,
};
