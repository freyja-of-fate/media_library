# Media Library Backend

A REST API for managing media, characters, user libraries, ratings, reviews, and authentication.

Built with:

* Node.js
* Express
* TypeScript
* MariaDB
* Knex.js
* JWT Authentication
* TOTP Two-Factor Authentication

---

# Features

* User registration and authentication
* JWT-based authorization
* TOTP two-factor authentication (2FA)
* Media management
* Character management
* Media-character relationships
* Personal media libraries
* Ratings and reviews
* Search and autocomplete endpoints
* Image uploads
* MariaDB database with migrations and seeds

---

# Documentation

## API Documentation

Complete API documentation is available in:

```text
docs/api.md
```

This includes:

* Authentication flows
* Request/response examples
* Endpoint reference
* Filtering and sorting options
* Error responses

---

# Requirements

* Node.js 16+
* MariaDB 10.5+
* npm or yarn

---

# Installation

## 1. Install Dependencies

```bash
npm install
```

## 2. Configure Environment

```bash
cp .env.example .env
```

Example configuration:

```dotenv
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_NAME=media_library
DB_USER=root
DB_PASS=your_password

JWT_SECRET=change-me
JWT_EXPIRES_IN=604800
```

Generate a secure JWT secret:

```bash
openssl rand -base64 32
```

or

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 3. Setup Database

```bash
npm run setup
```

Or reset everything:

```bash
npm run setup:reset
```

---

# Running the Application

## Development

```bash
npm run dev
```

Default:

```text
http://localhost:3000
```

## Production

```bash
npm run build
npm start
```

---

# Database Management

## Migrations

Run pending migrations:

```bash
npm run migrate
```

Create a migration:

```bash
npm run migrate:make migration_name
```

Rollback latest migration batch:

```bash
npm run migrate:rollback
```

Check migration status:

```bash
npm run migrate:status
```

## Seeds

Run seeds:

```bash
npm run seed
```

Create a seed:

```bash
npm run seed:make seed_name
```

---

# Available Scripts

| Script                   | Description                        |
| ------------------------ | ---------------------------------- |
| npm run dev              | Start development server           |
| npm run build            | Compile TypeScript                 |
| npm start                | Start production server            |
| npm run setup            | Create database, migrate, and seed |
| npm run setup:reset      | Recreate database from scratch     |
| npm run migrate          | Run pending migrations             |
| npm run migrate:make     | Create migration                   |
| npm run migrate:rollback | Rollback migrations                |
| npm run migrate:status   | Show migration status              |
| npm run seed             | Run seed files                     |
| npm run seed:make        | Create seed                        |

---

# Environment Configuration

The application supports multiple environments through `NODE_ENV`.

## Development

```bash
NODE_ENV=development
```

## Staging

```bash
NODE_ENV=staging
```

## Production

```bash
NODE_ENV=production
```

Knex configuration is managed through:

```text
knexfile.js
```

---

# Project Structure

```text
backend/
├── docs/
│   └── api.md
│
├── src/
│   ├── routes/
│   ├── middleware/
│   ├── utils/
│   ├── db.ts
│   └── index.ts
│
├── migrations/
├── seeds/
├── dist/
│
├── knexfile.js
├── setup-db.ts
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

---

# Database Overview

The database is structured around:

* Users
* Media
* Characters
* Tags
* User Libraries
* Ratings & Reviews
* Media Character Relationships

Schema changes are managed through Knex migrations.

---

# Security

## Production Checklist

* Use a strong JWT secret
* Enable HTTPS
* Configure CORS properly
* Keep secrets in environment variables
* Never commit `.env`
* Implement rate limiting
* Validate user input
* Keep dependencies updated

## Authentication

* Passwords are hashed using bcrypt
* JWT access tokens are used for authentication
* Optional TOTP-based two-factor authentication is supported

---

# Contributing

When adding new functionality:

1. Create migrations for schema changes
2. Update seed data if required
3. Add authentication where appropriate
4. Update API documentation
5. Test before merging

---

# License

MIT
