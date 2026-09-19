# Last Year Single

Last Year Single (LYS) is a full-stack Ruby on Rails capstone project built for Altcademy. It is a friendship and dating community designed around thoughtful profiles, clear connection intent, shared interests, community, and private messaging.

## Live Project

- **Web app:** https://brians-lys-capstone-78bc06e3c82a.herokuapp.com
- **GitHub repository:** https://github.com/CoopersCoding/LYS-datingApp
- **API:** hosted with the Rails application under the `/api` routes

## App Screenshot

![Last Year Single app screenshot](https://s.wordpress.com/mshots/v1/https%3A%2F%2Fbrians-lys-capstone-78bc06e3c82a.herokuapp.com/?w=1200)

## Technologies Used

- Ruby 3.1.2
- Ruby on Rails 6.1
- ERB
- JavaScript
- CSS
- ActiveRecord
- SQLite for development and test
- PostgreSQL in production
- Webpacker 5
- Heroku for production hosting
- Rails session authentication with `has_secure_password`

## General Approach

I approached Last Year Single as a true full-stack application rather than a static front-end prototype. I first established the domain model around users, interests, connections, conversations, and messages, then exposed those behaviors through Rails JSON endpoints. The front end uses Rails-rendered HTML with JavaScript enhancement so the main experiences can update without full-page reloads while still relying on the Rails backend as the source of truth.

As the project developed, I focused on making the major user flows persistent and testable: creating an account, signing in, editing a profile, uploading a profile photo, selecting interests and relationship intent, discovering people, adding or removing connections, and exchanging messages. I also deployed the application to Heroku with PostgreSQL so both the front end and API could be tested in a real production environment.

## Core Features

- account creation and secure password authentication
- sign in and sign out
- persistent user profiles
- profile photo upload
- friendship and dating preferences
- selectable interests
- Discover experience for browsing profiles
- connections and community management
- private conversations
- persistent messages
- responsive mobile and desktop layouts
- Rails JSON API powering the application

## Main API Routes

- `POST /api/signup`
- `POST /api/session`
- `GET /api/session`
- `DELETE /api/session`
- `GET /api/me`
- `GET /api/users`
- `GET /api/interests`
- `GET /api/connections`
- `POST /api/connections`
- `GET /api/connections/pending`
- `GET /api/connections/accepted`
- `PATCH /api/connections/:id`
- `DELETE /api/connections/:id`
- `GET /api/conversations`
- `GET /api/conversations/:id`
- `GET /api/conversations/:conversation_id/messages`
- `POST /api/conversations/:conversation_id/messages`

## Installation Instructions

### Requirements

- Ruby 3.1.2
- Bundler
- Node.js and Yarn
- SQLite3
- PostgreSQL if you want to mirror the production database locally

### Local Setup

```bash
git clone https://github.com/CoopersCoding/LYS-datingApp.git
cd LYS-datingApp
git checkout master
bundle install
yarn install
bin/rails db:setup
bin/rails server
```

Then open:

```text
http://localhost:3000
```

The default development database uses SQLite.

## User Stories

The project user stories are documented here:

[View User Stories](docs/user-stories.md)

## Wireframes

The major application views and interface sketches are documented here:

[View Wireframes](docs/wireframes.md)

## Video Demo

**Loom demo:** _Add final Loom link here before submission._

A prepared 1–3 minute walkthrough script is included here:

[Video Demo Script](docs/video-demo-script.md)

## Demo Account

A seeded course-demo account is available after the production seed runs:

- **Email:** `demo@lastyearsingle.test`
- **Password:** `password123`

## Major Hurdles and Current Limitations

### Production deployment

One of the larger deployment hurdles was moving the project from an older repository structure to the actual Rails application branch used in production. Heroku also required a production PostgreSQL database and the correct deployment branch before releases could run migrations successfully.

### Authentication and profile state

Rails session authentication required careful handling of CSRF tokens after sign in and sign out. I also had to make sure a user's complete profile, including the uploaded photo, was returned immediately after authentication instead of only appearing after a browser refresh.

### Persistent messaging and connections

The original interface included front-end-only behavior. I replaced that with backend-driven conversations and messages so messages persist across navigation and refreshes. Connection removal also required handling related messages and conversations safely before deleting the connection.

### Current limitations

This is a course capstone rather than a production dating platform. Profile images are stored as compressed data URLs in the database for simplicity; a production version should use object storage such as S3 or Cloudinary. The current course-demo connection flow accepts a new connection immediately so the community and messaging features can be demonstrated; a production version would use a full recipient request/approval workflow. The Discover interface also uses a curated set of seeded profiles rather than a production-scale matching or recommendation system.

## Deployment

The application is deployed to Heroku. Production uses PostgreSQL. The `Procfile` runs database migrations and seed data during the release phase before starting the Puma web server.
