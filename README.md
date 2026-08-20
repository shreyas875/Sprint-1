# Smart Event Finder

A full-stack event discovery and management platform. Users can search, filter, and discover events near them, bookmark and register for events, and get personalized recommendations. Admins can manage events, users, and registrations from a dedicated dashboard.

Built with **vanilla HTML/CSS/JS** on the frontend and **Node.js + Express + MySQL** on the backend — no frontend or backend frameworks.

---

## Features

**For everyone**
- Browse, search, and filter events by category, city, date, price, and type
- "Near Me" event discovery using the browser Geolocation API + Haversine distance
- Detailed event pages with venue, organizer, seat availability, and an embedded map
- Responsive, mobile-friendly UI with a hamburger nav

**For registered users**
- Register / login with JWT-based authentication (passwords hashed with bcrypt)
- Bookmark / save events
- Register for events with a transaction-safe seat-booking system (seats never go negative)
- Cancel registrations (seats are released back to the pool)
- Personalized recommendations based on interests, city, popularity, and event date
- Dashboard with stats, upcoming events, saved events, and recommendations
- Profile management: personal info, interests, and password updates

**For admins**
- Dashboard with total users, events, registrations, popular categories, and upcoming events
- Full event CRUD (create, edit, delete) with a modal form
- User management (promote/demote roles, delete users)
- View all registrations across the platform

---

## Tech Stack

| Layer     | Technology                                      |
|-----------|--------------------------------------------------|
| Frontend  | HTML5, CSS3, Vanilla JavaScript, Fetch API        |
| Backend   | Node.js, Express.js, REST APIs                    |
| Database  | MySQL (via `mysql2`)                              |
| Auth      | JWT (`jsonwebtoken`) + `bcrypt` password hashing  |
| Other     | `cors`, `dotenv`, `express-validator`, `nodemon`  |

---

## Architecture

```
Browser (HTML/CSS/JS)
   │  fetch() → JSON
   ▼
Express REST API  (backend/server.js)
   │  routes → controllers → MySQL (mysql2 pool)
   ▼
MySQL: smart_event_finder database
```

- **Routes** define endpoints and apply `authMiddleware` / `adminMiddleware` where needed.
- **Controllers** contain business logic and parameterized SQL queries.
- **Middleware** handles JWT verification, admin-role checks, and centralized error handling.
- **Utils** hold the Haversine distance helper and the rule-based recommendation engine.
- Seat booking and registration cancellation run inside **MySQL transactions** with row locking (`FOR UPDATE`) so concurrent bookings can never oversell an event.

---

## Database Schema

Six normalized tables: `users`, `categories`, `events`, `registrations`, `bookmarks`, `user_interests`.

```
users ──< registrations >── events
users ──< bookmarks     >── events
users ──< user_interests >── categories
categories ──< events
```

Key constraints:
- `users.email` — UNIQUE
- `registrations(user_id, event_id)` — UNIQUE
- `bookmarks(user_id, event_id)` — UNIQUE
- `user_interests(user_id, category_id)` — UNIQUE
- Foreign keys on all relationship columns, with indexes on `events.city`, `events.event_date`, `events.category_id`, `events.status`, and `events.price`.

See [`database/schema.sql`](database/schema.sql) for the full DDL.

---

## API Documentation

All responses follow a consistent JSON envelope:

```json
{ "success": true, "message": "...", "data": {} }
```

List endpoints also include a `pagination` object.

### Auth
| Method | Endpoint             | Auth | Description              |
|--------|-----------------------|------|---------------------------|
| POST   | /api/auth/register    | —    | Create an account         |
| POST   | /api/auth/login       | —    | Login, returns JWT        |
| POST   | /api/auth/logout      | —    | Stateless logout          |
| GET    | /api/auth/me          | ✅   | Current user               |

### Events
| Method | Endpoint                 | Auth   | Description                          |
|--------|---------------------------|--------|----------------------------------------|
| GET    | /api/events                | —      | List with filters, sort, pagination   |
| GET    | /api/events/search?q=      | —      | Full-text style search                |
| GET    | /api/events/nearby          | —      | Haversine-based nearby search         |
| GET    | /api/events/:id             | —      | Event details + related events        |
| POST   | /api/events                 | Admin  | Create event                          |
| PUT    | /api/events/:id             | Admin  | Update event                          |
| DELETE | /api/events/:id             | Admin  | Delete event                          |

Filter query params for `GET /api/events`: `category`, `city`, `date` (`today`/`tomorrow`/`this_weekend`/`this_week`/`this_month`/`custom` + `start_date`/`end_date`), `price` (`free`/`under_500`/`500_1000`/`1000_plus`), `event_type`, `sort` (`newest`/`date_asc`/`price_low`/`price_high`/`popular`), `page`, `limit`.

### Categories
`GET /api/categories` (public) · `POST` / `PUT /:id` / `DELETE /:id` (admin)

### Registrations
| Method | Endpoint                | Auth | Description                       |
|--------|---------------------------|------|-------------------------------------|
| POST   | /api/registrations         | ✅   | Register for an event (transaction) |
| GET    | /api/registrations         | ✅   | Current user's registrations        |
| GET    | /api/registrations/:id     | ✅   | Single registration                 |
| DELETE | /api/registrations/:id     | ✅   | Cancel registration                 |

### Bookmarks
`GET /api/bookmarks` · `POST /api/bookmarks/:eventId` · `DELETE /api/bookmarks/:eventId` (all require auth)

### Recommendations
`GET /api/recommendations` (auth) — rule-based scoring using interests, city, popularity, and event date.

### Users
`GET/PUT /api/users/profile` · `PUT /api/users/password` (auth)
`GET /api/users/admin/all` · `DELETE /api/users/admin/:id` · `PUT /api/users/admin/:id/role` (admin)

### Admin
`GET /api/admin/dashboard` · `GET /api/admin/registrations` · `GET /api/admin/users`

---

## Installation & Setup

### Prerequisites
- Node.js 18+
- MySQL 8+ (or compatible, e.g. MariaDB)

### 1. Install dependencies
```bash
git clone <repository>
cd smart-event-finder
npm install
```

### 2. Configure environment variables
```bash
cp .env.example .env
```
Edit `.env` with your MySQL credentials and a strong `JWT_SECRET`:
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=smart_event_finder
DB_PORT=3306
JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5000
```

### 3. Create the database and load data
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

### 4. Run the app
```bash
npm run dev      # nodemon, auto-restarts on changes
# or
npm start        # plain node
```

Open **http://localhost:5000**

---

## Demo / Test Credentials

| Role  | Email                        | Password   |
|-------|-------------------------------|------------|
| Admin | admin@eventfinder.com          | Admin@123  |
| Admin | admin2@eventfinder.com         | Admin@123  |
| User  | rohan.mehta@example.com        | User@123   |
| User  | (any other seeded user email)  | User@123   |

All 10 seeded normal users share the password `User@123` (see `database/seed.sql` for the full email list).

---

## Project Structure

```
smart-event-finder/
├── frontend/            # Static HTML/CSS/JS (served by Express)
│   ├── *.html            # Public + user pages
│   ├── admin/             # Admin pages
│   ├── css/                # Stylesheets
│   └── js/                  # Page logic + shared helpers (api.js, common.js)
├── backend/
│   ├── server.js
│   ├── config/db.js        # MySQL pool
│   ├── controllers/          # Business logic + SQL
│   ├── routes/                 # Express routers
│   ├── middleware/               # auth, admin, error handling
│   └── utils/                      # Haversine + recommendation engine
├── database/
│   ├── schema.sql
│   └── seed.sql
├── .env.example
└── package.json
```

---

## Security Notes

- Passwords are hashed with `bcrypt` (10 salt rounds) — never stored or returned in plain text.
- All SQL queries use parameterized placeholders (`?`) to prevent SQL injection.
- JWT-based auth with role-based (`USER` / `ADMIN`) route protection via middleware.
- Seat booking uses `SELECT ... FOR UPDATE` inside a transaction to prevent race conditions and negative seat counts.
- CORS is configured via `CLIENT_ORIGIN`; secrets live in `.env` (excluded via `.gitignore`).

---

## Future Improvements

- Payment gateway integration for paid events
- Email notifications / reminders for upcoming registered events
- Image upload (instead of image URL) for event banners
- Server-side rendered charts on the admin dashboard
- Refresh-token rotation and rate limiting on auth endpoints
- Automated test suite (Jest/Supertest) for API routes

---

## Screenshots

_Add screenshots of the homepage, event listing, event details, dashboard, and admin panel here once the app is running locally._
