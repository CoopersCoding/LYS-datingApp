# Last Year Single

Last Year Single is a full-stack Ruby on Rails capstone project built for Altcademy.

The product is a friendship and dating community focused on thoughtful profiles, clear connection intent, shared interests, connection requests, accepted communities, and private messaging.

## Stack

- Ruby 3.1.2
- Rails 6.1
- ERB / CSS / JavaScript
- ActiveRecord
- SQLite in development/test
- PostgreSQL in production on Heroku
- Webpacker 5

## Backend checkpoint

The backend includes:

- account creation with secure passwords
- session-based sign in and sign out
- user profiles
- interests and user-interest relationships
- friendship and romantic connection requests
- pending, accepted, and rejected connection states
- authorization for accepting/rejecting requests
- conversations created for accepted connections
- private messages restricted to conversation participants
- database uniqueness constraints
- idempotent seed data for checkpoint review

## Demo account

After the production seed runs:

- Email: `demo@lastyearsingle.test`
- Password: `password123`

This is a course-demo account only.

## Main API routes

- `POST /api/signup`
- `POST /api/session`
- `GET /api/session`
- `DELETE /api/session`
- `GET /api/me`
- `GET /api/users`
- `GET /api/interests`
- `GET/POST /api/connections`
- `GET /api/connections/pending`
- `GET /api/connections/accepted`
- `PATCH /api/connections/:id`
- `GET /api/conversations`
- `GET /api/conversations/:id`
- `GET/POST /api/conversations/:conversation_id/messages`

## Deployment

Heroku runs database migrations and seed data from the `release` process in the Procfile before starting the web process.
