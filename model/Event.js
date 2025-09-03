const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dateOptions: [{
    date: {
      type: Date,
      required: true
    },
    time: {
      type: String,
      required: true
    },
    votes: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      votedAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['invited', 'accepted', 'declined'],
      default: 'invited'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // ✅ NEW: Enhanced Poll System
  poll: {
    question: {
      type: String,
      required: [true, 'Poll question is required'],
      maxlength: [200, 'Poll question cannot exceed 200 characters']
    },
    options: [{
      text: {
        type: String,
        required: true,
        maxlength: [100, 'Poll option cannot exceed 100 characters']
      },
      votes: [{
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        votedAt: {
          type: Date,
          default: Date.now
        }
      }]
    }],
    allowMultiple: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    closedAt: {
      type: Date,
      default: null
    }
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Index for better query performance
eventSchema.index({ creator: 1, createdAt: -1 });
eventSchema.index({ 'participants.user': 1 });
eventSchema.index({ 'poll.options.votes.user': 1 });

module.exports = mongoose.model('Event', eventSchema);
