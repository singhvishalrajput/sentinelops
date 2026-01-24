# SentinelOps Node.js Backend

This backend handles authentication, user management, AWS account storage, and scan history using MongoDB.

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (running on localhost:27017)
- npm or yarn

## Installation

1. Navigate to the nodejs directory:
```bash
cd backend/nodejs
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
- Copy `.env` and update values if needed
- Default MongoDB URI: `mongodb://localhost:27017/sentinelops`
- Change JWT_SECRET in production!

## Running the Server

### Development mode (with auto-reload):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

Server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

### AWS Management
- `POST /api/aws/connect` - Connect AWS account (requires auth)
- `GET /api/aws/accounts` - Get all AWS accounts (requires auth)
- `DELETE /api/aws/accounts/:id` - Remove AWS account (requires auth)

### Scan History
- `GET /api/scan/history` - Get scan history (requires auth)
- `POST /api/scan/start` - Start new scan (requires auth)
- `GET /api/scan/:id` - Get scan details (requires auth)

### Health Check
- `GET /api/health` - Server health check

## Database Models

### User
- name, email, password (hashed)
- organization, role
- awsAccounts array
- notificationEmail

### ScanHistory
- userId, scanType, status
- results (findings, risk scores)
- timestamps

## Authentication

All protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Security Notes

⚠️ **Important**: In production:
1. Change JWT_SECRET to a strong random value
2. Encrypt AWS credentials before storing
3. Use environment variables for all secrets
4. Enable HTTPS
5. Implement rate limiting
6. Add input sanitization
