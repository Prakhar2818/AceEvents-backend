# AceEvents Backend

AceEvents is a backend API for managing collaborative events, invitations, and polls. Built with Node.js, Express, and MongoDB, it supports user authentication, event creation, invitations, and advanced polling features.

## Features

- User registration and login (JWT authentication)
- Create, update, delete events
- Invite users to events
- Notification on dashboard for events
- Poll system for event decisions (single/multiple choice, close poll)
- View poll results
- MongoDB integration via Mongoose
- Input validation and error handling
- Ready for deployment on Vercel

## 🛠 Tech Stack

- **Backend:** Node.js, Express.js  
- **Database:** MongoDB (Atlas / local)  
- **Authentication:** JWT (JSON Web Tokens)  
- **Deployment:** Render  
- **Validation & Middleware:** Express Validator, Custom Middleware  
- **Other Tools:** Nodemon, dotenv, Mongoose


## Project Structure

```
.env
.gitignore
package.json
server.js
config/
  database.js
controller/
  authController.js
  eventController.js
middleware/
  auth.js
  validation.js
model/
  Event.js
  User.js
routes/
  auth.js
  events.js
```

## Getting Started

### Prerequisites

- Node.js v22
- MongoDB (local or Atlas)

### Installation

```sh
npm install
```

### Environment Variables

Create a `.env` file:

```
NODE_ENV=development
MONGODB_URI= mongodb+srv://AceEvents:2818@cluster0.v4rfykz.mongodb.net/
JWT_SECRET=your-super-secret-jwt-key
PORT=5000
```

### Running Locally

```sh
nodemon server.js
```

### API Endpoints

#### Auth

- `POST /api/auth/signup` — Register new user
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Get current user info

#### Events

- `GET /api/event` — List user’s events
- `POST /api/event` — Create event (with poll)
- `GET /api/event/:id` — Get event details
- `PUT /api/event/:id` — Update event
- `DELETE /api/event/:id` — Delete event
- `POST /api/event/:id/invite` — Invite user
- `POST /api/event/:id/vote` — Vote on poll
- `GET /api/event/:id/poll` — Poll results
- `POST /api/event/:id/poll/close` — Close poll

// ...existing code...

## Architecture Decisions

### Project Structure Rationale

- **MVC Pattern**: Adopted Model-View-Controller architecture for clear separation of concerns
- **Modular Routes**: Separate route files for auth and events to improve maintainability
- **Middleware Layer**: Dedicated middleware for auth and validation to ensure code reusability
- **Controller Logic**: Business logic isolated in controllers for better testing and maintenance
- **Config Separation**: Environment and database configurations kept separate for security

### Data Modeling

```javascript
// User Model
{
  name: String,
  email: String,
  password: String,
  events: [EventId],
  createdAt: Date
}

// Event Model
{
  title: String,
  description: String,
  date: Date,
  creator: UserId,
  participants: [UserId],
  poll: {
    question: String,
    options: [String],
    votes: [{user: UserId, choice: Number}],
    isActive: Boolean
  }
}
```

Key decisions:
- Used reference-based relationships between Users and Events
- Embedded poll data within Events for atomic operations
- Implemented soft deletion for events
- Indexed frequently queried fields

### Authentication Implementation

1. **JWT-Based Auth Flow**:
   - Token generation on login/signup
   - Token verification middleware
   - Refresh token mechanism
   - Secure password hashing using bcrypt

2. **Security Measures**:
   - Rate limiting on auth routes
   - JWT expiration
   - Sanitized user inputs
   - Protected routes middleware

## Challenges Faced & Solutions

1. **Race Conditions in Polling**
   - Challenge: Multiple users voting simultaneously caused data inconsistency
   - Solution: Implemented MongoDB transactions for atomic vote operations

2. **Real-time Updates**
   - Challenge: Keeping event data synchronized across users
   - Solution: Implemented polling mechanism with plans to upgrade to WebSocket

3. **Performance Optimization**
   - Challenge: Slow queries with large datasets
   - Solution: 
     - Added database indexes
     - Implemented pagination
     - Optimized MongoDB queries

4. **Security Concerns**
   - Challenge: Protecting against common web vulnerabilities
   - Solution:
     - Added rate limiting
     - Implemented input validation
     - Set up CORS policies
     - Used helmet middleware

5. **Deployment Issues**
   - Challenge: Environment-specific configurations
   - Solution: 
     - Implemented configuration management
     - Created separate development/production configs
     - Added comprehensive error logging


### Repository Link
Github Repo link [Github](https://github.com/Prakhar2818/AceEvents-backend)

### Deployment

Ready for [Render](https://aceevents-backend.onrender.com) deployment.

---

**AceEvents