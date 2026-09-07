# Semina API

REST API for event management and ticket checkout. Semina provides public event discovery, participant authentication and checkout, plus a role-protected CMS for managing event-related data.

## Features

- Participant registration, OTP activation, and JWT authentication
- Public event listing and event details
- Role-based CMS authentication and authorization
- Management of organizers, users, categories, talents, events, images, and payment methods
- Transactional checkout with ticket stock validation
- Participant order history
- Checkout confirmation email through Gmail SMTP
- Local image upload with file type and size validation

## Tech Stack

- Node.js
- Express.js
- MongoDB and Mongoose
- JSON Web Token
- Nodemailer and Mustache
- Multer

## Requirements

- Node.js and npm
- MongoDB with replica set support
- Gmail account with an App Password

MongoDB replica set support is required because checkout uses database transactions.

## Setup

Install dependencies:

```bash
npm install
```

Create `.env` from `.env.example`:

```env
PORT=3000
URL_MONGODB_DEV=mongodb://127.0.0.1:27017/semina?replicaSet=rs0
JWT_SECRET=your-jwt-secret
GMAIL=your-email@gmail.com
PASSWORD=your-gmail-app-password
```

Never commit `.env` or expose its credentials.

Run in development mode:

```bash
npm run dev
```

Run normally:

```bash
npm start
```

Default server URL:

```text
http://localhost:3000
```

## API Overview

Participant API uses `/api/v1`. It provides participant authentication, published events, order history, and checkout.

CMS API uses `/api/v1/cms`. It provides authenticated management of organizers, users, categories, talents, events, images, payments, and orders.

Protected endpoints require a Bearer token:

```http
Authorization: Bearer <token>
```

CMS user and participant tokens are separated and cannot be used interchangeably.

## Checkout

Checkout validates event availability, payment ownership, ticket status, quantity, and stock. Ticket prices and order totals are calculated by the server.

Ticket stock updates and order creation run inside one MongoDB transaction. After a successful transaction, a pending checkout confirmation is sent to the participant account email.

If email delivery fails, the order remains successful and the API reports the email result separately.

## File Uploads

Image uploads accept JPEG and PNG files up to 3 MB. Files are stored locally in `public/uploads`.

## Development Status

This project is under active development and is not intended for production use yet.

Current limitations include local file storage, synchronous email delivery, no automatic email retry, and no automated test suite.
