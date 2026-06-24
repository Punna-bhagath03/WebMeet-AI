# WebMeet AI - Secure Video Conferencing with AI Integration

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)
![Node.js](https://img.shields.io/badge/Node.js-ES%20Modules-brightgreen)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB)

A modern, secure video conferencing application with built-in AI assistance, real-time communication, and meeting history tracking. WebMeet AI enables users to conduct professional video meetings with integrated AI chat support powered by Google's Gemini API.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [Cloning the Repository](#cloning-the-repository)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
  - [Environment Variables](#environment-variables)
  - [Backend Environment Setup](#backend-environment-setup)
- [API Endpoints](#api-endpoints)
  - [User Routes](#user-routes)
  - [AI Routes](#ai-routes)
- [Real-Time Socket Events](#real-time-socket-events)
- [Features & Functionality](#features--functionality)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## Features

### Core Functionality
- **User Authentication**: Secure JWT-based authentication with refresh token mechanism
- **Video Conferencing**: Real-time peer-to-peer video conferencing with WebSocket support
- **AI Chat Assistant**: Integrated AI assistant powered by Google Gemini API for real-time help during meetings
- **Meeting History**: Track and manage all past meetings with detailed history
- **Security Features**:
  - CSRF protection on sensitive endpoints
  - Rate limiting on authentication routes
  - Password hashing with bcryptjs
  - Helmet.js for HTTP security headers
  - CORS protection with strict configuration
- **Real-Time Communication**: Socket.io-based real-time messaging and connection management
- **Protected Routes**: JWT-protected API endpoints
- **Responsive UI**: Material-UI based responsive interface

---

## System Architecture & Engineering Highlights

## Tech Stack

### Backend
- **Runtime**: Node.js with ES Modules
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-Time**: Socket.io
- **Authentication**: JWT (JSON Web Tokens)
- **Encryption**: bcryptjs
- **AI Integration**: Google Generative AI (Gemini)
- **Security**: 
  - Helmet.js (HTTP headers)
  - Express Rate Limit
  - CORS
  - Custom CSRF protection
- **Development**: Nodemon for hot reload
- **Process Management**: PM2 for production

### Frontend
- **Framework**: React 18.3.1
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios
- **UI Library**: Material-UI (@mui/material)
- **State Management**: React Context API
- **Real-Time**: Socket.io Client
- **Utilities**: date-fns for date formatting
- **Build Tool**: Create React App

---

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (v16.0.0 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** (comes with Node.js)
- **Git** (for cloning the repository) - [Download](https://git-scm.com/)
- **MongoDB** (local or MongoDB Atlas cloud account) - [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Google API Key** (for Gemini AI) - [Get API Key](https://ai.google.dev/)

### Verify Installation
```bash
node --version      # Should be v16+
npm --version       # Should be v7+
git --version       # Should be v2.0+
```

---

## Getting Started

### Important: Use the Stabilized Branch

> **DO NOT use the `master` or `main` branch for running the application.**
> 
> Always switch to the **`steblized-project`** branch after cloning. This branch contains the stable, tested version of the application.

### Cloning the Repository

```bash
# Clone the repository
git clone https://github.com/your-username/WebMeet-AI.git

# Navigate to the project directory
cd WebMeet-AI

# CRITICAL: Switch to the stabilized branch
git checkout steblized-project

# Verify you're on the correct branch
git branch
# You should see: * steblized-project
```

### Backend Setup

Navigate to the backend directory and install dependencies:

```bash
cd backend

# Install dependencies
npm install

# Create environment configuration file
cp .env.example .env
```

#### Configure Backend Environment Variables

Edit the `.env` file and add your configuration:

```env
# Node environment
NODE_ENV=development

# Server port
PORT=8000

# MongoDB connection URI
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/webmeet-ai?retryWrites=true&w=majority

# Google Gemini API key
GEMINI_API_KEY=your_gemini_api_key_here

# JWT Secrets (generate strong random strings)
JWT_ACCESS_SECRET=your_super_secret_access_token_key_change_this_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_token_key_change_this_in_production

# Token expiry times
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# JWT configuration
JWT_ISSUER=webmeet-ai
JWT_AUDIENCE=webmeet-ai-client

# CORS origin (frontend URL)
CORS_ORIGIN=http://localhost:3000
```

**Environment Variable Details:**

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `GEMINI_API_KEY` | Google AI API key | Get from [Google AI Studio](https://ai.google.dev/) |
| `JWT_ACCESS_SECRET` | Secret for access token signing | Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `JWT_REFRESH_SECRET` | Secret for refresh token signing | Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `CORS_ORIGIN` | Frontend URL for CORS | `http://localhost:3000` (dev), `https://yourdomain.com` (prod) |

### Frontend Setup

Navigate to the frontend directory and install dependencies:

```bash
# From the root directory
cd frontend

# Install dependencies
npm install
```

The frontend is configured to use `http://localhost:8000` as the backend API URL by default (see `src/environment.js`).

---

## Running the Application

### Running in Development Mode

#### Terminal 1 - Start Backend Server

```bash
cd backend

# Install dependencies (if not done already)
npm install

# Start the backend with hot reload (using nodemon)
npm run dev

# Expected output:
# MONGO connected: cluster.mongodb.net
# Server listening on port 8000
```

#### Terminal 2 - Start Frontend Development Server

```bash
cd frontend

# Install dependencies (if not done already)
npm install

# Start React development server
npm start

# The app will automatically open at http://localhost:3000
# React will show "Compiled successfully" when ready
```

### Accessing the Application

Once both servers are running:

1. **Frontend**: Open http://localhost:3000 in your browser
2. **Backend API**: Available at http://localhost:8000
3. **API Documentation Endpoint**: http://localhost:8000/api/v1/users (health check)

### Running in Production Mode

```bash
# Backend - Build and run for production
cd backend
npm run start

# Frontend - Build for production
cd frontend
npm run build
npm install -g serve
serve -s build -l 3000
```

---

## Project Structure

### Backend Structure

```
backend/
├── src/
│   ├── app.js                          # Express app configuration
│   ├── server.js                       # Server startup and MongoDB connection
│   ├── config/
│   │   └── env.js                      # Environment variables and validation
│   ├── controllers/
│   │   ├── user.controller.js          # User auth and history logic
│   │   └── ai.controller.js            # AI chat logic
│   ├── middlewares/
│   │   ├── auth.middleware.js          # JWT authentication
│   │   ├── csrf.middleware.js          # CSRF protection
│   │   └── rateLimit.middleware.js     # Rate limiting
│   ├── models/
│   │   ├── user.model.js               # User schema
│   │   └── meeting.Model.js            # Meeting schema
│   ├── routes/
│   │   ├── users.routes.js             # User endpoints
│   │   └── ai.routes.js                # AI endpoints
│   ├── sockets/
│   │   └── socketManager.js            # Socket.io configuration
│   └── utils/
│       └── token.js                    # JWT token generation/verification
├── .env.example                        # Environment template
├── .env                                # Environment config (not in git)
└── package.json                        # Dependencies

Key Directories:
- controllers/  → Business logic for requests
- models/       → Database schemas
- routes/       → API endpoint definitions
- middlewares/  → Request interceptors
- sockets/      → Real-time communication
```

### Frontend Structure

```
frontend/
├── src/
│   ├── App.js                          # Main app component with routing
│   ├── App.css                         # Global styles
│   ├── index.js                        # React entry point
│   ├── environment.js                  # API server URL configuration
│   ├── contexts/
│   │   └── AuthContext.jsx             # Authentication context and axios interceptors
│   ├── pages/
│   │   ├── landing.jsx                 # Landing/home page
│   │   ├── authentication.jsx          # Login/signup page
│   │   ├── home.jsx                    # User home page
│   │   ├── VideoMeet.jsx               # Main video conference component
│   │   ├── VideoConference.jsx         # Video rendering logic
│   │   ├── VideoGrid.jsx               # Video grid layout
│   │   ├── ChatPanel.jsx               # Meeting chat UI
│   │   ├── AIChatPanel.jsx             # AI assistant panel
│   │   ├── ParticipantsPanel.jsx       # Participants list
│   │   ├── LobbyPreview.jsx            # Pre-meeting preview
│   │   └── history.jsx                 # Meeting history page
│   ├── shared/
│   │   ├── hooks/                      # Custom React hooks
│   │   ├── lib/                        # Utility libraries
│   │   ├── types/                      # Type definitions
│   │   └── ui/                         # Reusable UI components
│   ├── styles/
│   │   └── videoComponent.module.css   # Video component styles
│   ├── utils/
│   │   └── withAuth.jsx                # Authentication HOC
│   ├── app/
│   │   ├── layout/                     # Layout components
│   │   └── providers/                  # Context providers
│   └── public/
│       └── index.html                  # HTML entry point
├── build/                              # Production build (generated)
├── package.json                        # Dependencies
└── public/
    └── index.html                      # Template HTML
```

---

## Configuration

### Environment Variables

#### Backend Configuration (.env)

The backend requires the following environment variables:

```env
# Application
NODE_ENV=development|production
PORT=8000

# Database
MONGODB_URI=<mongodb_connection_string>

# AI
GEMINI_API_KEY=<google_gemini_api_key>

# JWT
JWT_ACCESS_SECRET=<random_secret>
JWT_REFRESH_SECRET=<random_secret>
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
JWT_ISSUER=webmeet-ai
JWT_AUDIENCE=webmeet-ai-client

# Security
CORS_ORIGIN=http://localhost:3000
```

#### Frontend Configuration (src/environment.js)

```javascript
const SERVER_URL = 'http://localhost:8000';  // Change for production
export default SERVER_URL;
```

### Generating JWT Secrets

```bash
# Generate secure random strings for JWT secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## API Endpoints

### User Routes (`/api/v1/users`)

#### Authentication Endpoints

| Method | Endpoint | Authentication | Description |
|--------|----------|-----------------|-------------|
| POST | `/register` | No | Create a new user account |
| POST | `/login` | No | Login with username and password |
| POST | `/refresh` | CSRF Token | Refresh access token |
| POST | `/logout` | CSRF Token | Logout user |

#### Meeting History Endpoints

| Method | Endpoint | Authentication | Description |
|--------|----------|-----------------|-------------|
| POST | `/add_to_activity` | JWT | Add meeting to history |
| GET | `/get_all_activity` | JWT | Retrieve user's meeting history |

#### Request/Response Examples

**Register User**
```bash
POST /api/v1/users/register
Content-Type: application/json

{
  "name": "John Doe",
  "username": "johndoe",
  "password": "securePassword123"
}

Response:
{
  "message": "User created successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "userId": "507f1f77bcf86cd799439011"
}
```

**Login User**
```bash
POST /api/v1/users/login
Content-Type: application/json

{
  "username": "johndoe",
  "password": "securePassword123"
}

Response:
{
  "message": "Logged in successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "userId": "507f1f77bcf86cd799439011"
}
```

### AI Routes (`/api/v1/ai`)

#### Chat Endpoint

| Method | Endpoint | Authentication | Description |
|--------|----------|-----------------|-------------|
| POST | `/chat` | JWT | Send message to AI assistant |

#### Request/Response Example

**Chat with AI**
```bash
POST /api/v1/ai/chat
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "message": "What are the best practices for effective meetings?"
}

Response:
{
  "response": "Here are key meeting best practices:\n\n• Set clear agenda\n• Start and end on time\n• Minimize distractions\n• Engage all participants\n• Document decisions and action items\n\nEffective meetings drive productivity and team alignment."
}
```

---

## Real-Time Socket Events

Socket.io events for real-time communication during video meetings:

### Connection Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `connect` | Server → Client | - | Initial socket connection |
| `connection` | Client → Server | - | Socket connected to room |
| `userJoined` | Server → Client | `{userId, username, timestamp}` | User joined meeting |
| `userLeft` | Server → Client | `{userId, username, timestamp}` | User left meeting |

### Video Call Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `offer` | Client → Client (via Server) | `{from, to, offer}` | WebRTC SDP offer |
| `answer` | Client → Client (via Server) | `{from, to, answer}` | WebRTC SDP answer |
| `ice-candidate` | Client → Client (via Server) | `{from, to, candidate}` | ICE candidate for NAT traversal |

### Chat Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `message` | Client → Server | `{text, timestamp}` | Chat message |
| `messageReceived` | Server → Client | `{from, text, timestamp}` | Incoming message |

### Meeting Management

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `joinRoom` | Client → Server | `{roomId, userId, username}` | Join a meeting room |
| `leaveRoom` | Client → Server | `{roomId, userId}` | Leave a meeting room |
| `getOnlineUsers` | Client → Server | `{roomId}` | Request list of online users |
| `onlineUsers` | Server → Client | `[{userId, username}]` | List of connected users |

---

## Features & Functionality

### 1. User Authentication & Authorization
- **Registration**: Users can create new accounts with username and password
- **Login**: Secure login with JWT tokens
- **Token Refresh**: Automatic token refresh mechanism to maintain session
- **Logout**: Secure logout with token invalidation
- **Protected Routes**: API routes protected with JWT middleware

### 2. Video Conferencing
- **Peer-to-Peer Video**: Real-time video communication using WebRTC
- **Multiple Participants**: Support for up to 10 participants per meeting
- **Video Grid**: Responsive grid layout for multiple video streams
- **Room Management**: Dynamic room creation and management

### 3. Real-Time Chat
- **Meeting Chat**: Live text chat with all participants
- **Message History**: Store up to 100 messages per room
- **Timestamps**: All messages include timestamps
- **User Attribution**: Know who sent each message

### 4. AI Assistant Integration
- **Gemini Integration**: Google's Generative AI for intelligent responses
- **Context-Aware Responses**: AI provides meeting-relevant assistance
- **Quick Help**: Get instant answers without leaving the meeting
- **Concise Answers**: AI keeps responses under 120 words for clarity

### 5. Meeting History
- **Activity Tracking**: Automatic recording of all meetings
- **Meeting Details**: Store meeting code, date, and participant info
- **History Retrieval**: View past meetings and analyze patterns
- **User-Specific History**: Each user sees only their own meeting history

### 6. Security Features
- **CSRF Protection**: Protection against cross-site request forgery
- **Rate Limiting**: Prevent brute force attacks on auth endpoints
- **Password Hashing**: Bcryptjs for secure password storage
- **Security Headers**: Helmet.js implements security headers
- **CORS Protection**: Strict cross-origin resource sharing policies
- **Token Expiration**: Access tokens expire after 15 minutes
- **Refresh Tokens**: 7-day refresh token for session management

---

## Development Workflow

### Setting Up Development Environment

1. **Fork and Clone** (if contributing):
```bash
git clone https://github.com/your-username/WebMeet-AI.git
cd WebMeet-AI
git checkout steblized-project
```

2. **Create Feature Branch**:
```bash
git checkout -b feature/your-feature-name
```

3. **Make Changes** and test locally

4. **Commit Changes**:
```bash
git add .
git commit -m "feat: description of your changes"
```

5. **Push to Remote**:
```bash
git push origin feature/your-feature-name
```

### Development Commands

#### Backend
```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Start production server
npm run start

# Start with PM2 (production process manager)
npm run prod
```

#### Frontend
```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

### Code Structure Best Practices

- **Controllers**: Keep business logic separate from routing
- **Models**: Use Mongoose schemas for consistent data validation
- **Middleware**: Reuse middleware for common operations
- **Error Handling**: Always use try-catch and proper error responses
- **Security**: Never hardcode secrets; use environment variables
- **Comments**: Document complex logic with clear comments

---

## Troubleshooting

### Common Issues and Solutions

#### MongoDB Connection Errors

**Error**: `MONGODB_URI is not configured`
```
Solution:
1. Check if .env file exists in backend/
2. Verify MONGODB_URI is set correctly
3. Ensure MongoDB server is running
4. For MongoDB Atlas, check IP whitelist and credentials
```

#### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::8000`
```bash
# Find and kill process using port 8000
lsof -i :8000
kill -9 <PID>

# Or change port in .env: PORT=8001
```

#### CORS Errors

**Error**: `Access to XMLHttpRequest blocked by CORS policy`
```
Solution:
1. Check CORS_ORIGIN in .env matches frontend URL
2. Verify credentials: true in CORS config
3. Check withCredentials: true in axios config
4. Clear browser cache and try again
```

#### Module Not Found Errors

**Error**: `Cannot find module '@google/generative-ai'`
```bash
# Reinstall dependencies
cd backend
rm -rf node_modules package-lock.json
npm install
```

#### Socket.io Connection Issues

**Error**: `WebSocket is closed before the connection is established`
```
Solution:
1. Verify backend is running
2. Check SERVER_URL in frontend/src/environment.js
3. Ensure CORS_ORIGIN in backend .env matches frontend URL
4. Check browser console for specific errors
```

#### JWT Token Errors

**Error**: `Invalid access token` or `Token expired`
```
Solution:
1. Verify JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are set
2. Check token expiry times match your requirements
3. Ensure client stores refreshToken as httpOnly cookie
4. Clear cookies and try logging in again
```

#### Gemini API Not Working

**Error**: `GEMINI_API_KEY is not configured`
```
Solution:
1. Get API key from https://ai.google.dev/
2. Add to .env: GEMINI_API_KEY=your_key
3. Verify key is valid and has API enabled
4. Check Google Cloud Console quota limits
```

### Debug Mode

Enable detailed logging for troubleshooting:

```bash
# Backend - Set debug environment
DEBUG=* npm run dev

# Frontend - Open browser DevTools (F12)
# Check Console tab for errors
# Check Network tab for API calls
```

---

## Additional Resources

### API Testing
- **Postman**: Import API collection for testing
- **cURL**: Example requests provided in API section
- **REST Client**: VS Code REST Client extension

### Documentation
- [Express.js Docs](https://expressjs.com/)
- [React Docs](https://react.dev/)
- [MongoDB Docs](https://docs.mongodb.com/)
- [Socket.io Docs](https://socket.io/docs/)
- [JWT.io](https://jwt.io/)
- [Google Generative AI](https://ai.google.dev/)

### Security Resources
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [CORS Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

---

## Contributing

We welcome contributions! Here's how to get involved:

1. **Fork the repository**
2. **Clone your fork**: `git clone https://github.com/your-username/WebMeet-AI.git`
3. **Switch to stable branch**: `git checkout steblized-project`
4. **Create a feature branch**: `git checkout -b feature/amazing-feature`
5. **Commit your changes**: `git commit -m 'feat: add amazing feature'`
6. **Push to your branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request** against the `steblized-project` branch

### Contribution Guidelines
- Follow existing code style
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation as needed
- Keep commits atomic and meaningful

---

## License

This project is licensed under the ISC License - see the LICENSE file for details.

---

## Author

**Punna Bhagath**

---

## Support

For issues, questions, or suggestions:
- Open an [Issue](https://github.com/your-username/WebMeet-AI/issues)
- Check existing documentation
- Review troubleshooting section

---

## Roadmap

Future enhancements planned:

- [ ] Screen sharing capability
- [ ] Recording meetings
- [ ] Meeting transcription
- [ ] Advanced AI features (meeting summaries, action items)
- [ ] Mobile app version
- [ ] End-to-end encryption
- [ ] Meeting scheduling
- [ ] Custom backgrounds for video
- [ ] Meeting analytics and insights
- [ ] Multi-language support

---

## Checklist for First-Time Setup

- [ ] Clone repository and switch to `steblized-project` branch
- [ ] Install Node.js (v16+)
- [ ] Create MongoDB database (local or MongoDB Atlas)
- [ ] Get Google Gemini API key
- [ ] Setup backend .env file with all required variables
- [ ] Install backend dependencies (`npm install`)
- [ ] Install frontend dependencies (`npm install`)
- [ ] Start backend server (`npm run dev`)
- [ ] Start frontend server (`npm start`)
- [ ] Access application at http://localhost:3000
- [ ] Test registration and login
- [ ] Test video conferencing with multiple users
- [ ] Test AI chat functionality

---

**Last Updated**: May 2026  
**Status**: Active Development  
**Stable Branch**: steblized-project
