# AceEvents Backend

AceEvents is a backend API for managing collaborative events, invitations, and polls. Built with Node.js, Express, and MongoDB, it supports user authentication, event creation, invitations, and advanced polling features.

## Features

- User registration and login (JWT authentication)
- Create, update, delete events
- Invite users to events
- Poll system for event decisions (single/multiple choice, close poll)
- View poll results
- MongoDB integration via Mongoose
- Input validation and error handling
- Ready for deployment on Vercel

## Project Structure

```
.env
.gitignore
package.json
server.js
vercel.json
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
MONGODB_URI=mongodb://localhost:27017/aceevents
JWT_SECRET=your-super-secret-jwt-key
PORT=5000
```

### Running Locally

```sh
node server.js
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

### Deployment

Ready for [Vercel](vercel.com) deployment. See [`vercel.json`](vercel.json) for configuration.

---

**AceEvents