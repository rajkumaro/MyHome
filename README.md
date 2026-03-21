# MyHome

Service Provider Marketplace - A platform where clients and service providers can interact, book services, communicate in real-time, and leave reviews.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + bcryptjs
- **Real-time**: Socket.IO
- **Payment**: Stripe (structure ready)
- **Development**: Nodemon

## Project Structure

```
MyHome/
├── server.js                 # Express + Socket.IO setup
├── package.json             # All dependencies
├── .env.example             # Configuration template
├── .gitignore              # Version control
├── middleware/
│   └── auth.js             # JWT & role-based auth
├── models/
│   ├── User.js             # Client & Service Provider model
│   ├── Service.js          # Service listings model
│   ├── Booking.js          # Booking management model
│   ├── Message.js          # Real-time messaging model
│   └── Review.js           # Rating & review model
└── routes/
    ├── auth.js             # Register, Login, Profile
    ├── services.js         # CRUD for services
    ├── bookings.js         # Booking management
    ├── messages.js         # Messaging
    └── reviews.js          # Reviews & ratings
```

## Installation

### Prerequisites

- Node.js (v14+)
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free tier)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/rajkumaro/MyHome.git
   cd MyHome
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and fill in your values:
   - `MONGODB_URI` – your MongoDB connection string
   - `JWT_SECRET` – a long random string for signing tokens
   - `STRIPE_SECRET_KEY` / `STRIPE_PUBLIC_KEY` – your Stripe keys (optional)

4. **Start development server**
   ```bash
   npm run dev
   ```
   The server runs on `http://localhost:5000` by default.

## API Documentation

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register a new user | No |
| POST | `/api/auth/login` | Login and receive JWT token | No |
| GET | `/api/auth/profile` | Get current user profile | Yes |

**Register body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "userType": "client"
}
```

### Services

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/services` | Create a service | Yes (service_provider) |
| GET | `/api/services` | Get all services (pagination/filtering) | No |
| GET | `/api/services/:id` | Get service details | No |

**Query params for GET /api/services:** `category`, `page`, `limit`

### Bookings

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/bookings` | Create a booking | Yes (client) |
| GET | `/api/bookings` | Get user's bookings | Yes |
| PATCH | `/api/bookings/:id` | Update booking status | Yes |

### Messages

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/messages` | Send a message | Yes |
| GET | `/api/messages/:userId` | Get conversation with user | Yes |

### Reviews

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/reviews` | Create a review | Yes (client) |
| GET | `/api/reviews/service/:serviceId` | Get reviews for a service | No |

## Real-time Messaging (Socket.IO)

Connect to the Socket.IO server and use these events:

| Event | Direction | Payload |
|-------|-----------|---------|
| `join_room` | Client → Server | `roomId` (string) |
| `send_message` | Client → Server | `{ roomId, sender, message }` |
| `receive_message` | Server → Client | `{ sender, message, timestamp }` |

## Authentication Header

All protected routes require a Bearer token:
```
Authorization: Bearer <your_jwt_token>
```
