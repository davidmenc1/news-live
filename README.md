# NewsLive - Real-Time News Portal

A full-stack web application simulating a news portal with real-time notifications using Redis Pub/Sub and user authentication. Articles appear instantly across all connected browsers when published.

## ✨ Key Features

- 🔐 **User Authentication** - Register, login, and manage your own articles
- 🚀 **Real-Time Updates** - Instant notifications when new articles are published
- 📊 **Redis-Native Architecture** - Individual documents, sorted sets, and efficient filtering
- 🎯 **Article Ownership** - Users can only edit/delete their own articles
- 🔍 **Search & Filter** - Category filtering and title search
- 💨 **High Performance** - Redis handles sorting and filtering natively

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              NewsLive Architecture                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────┐         ┌──────────────┐         ┌──────────────────┐   │
│   │   Browser 1  │         │   Browser 2  │         │   Browser N...   │   │
│   │  (Reader)    │         │  (Editor)    │         │  (Reader)        │   │
│   └──────┬───────┘         └──────┬───────┘         └────────┬─────────┘   │
│          │                        │                          │             │
│          │ WebSocket              │ HTTP POST                │ WebSocket   │
│          │                        │ /articles                │             │
│          ▼                        ▼                          ▼             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                     Frontend (Next.js :3000)                        │  │
│   │   - Article List with Category Filtering                            │  │
│   │   - Real-time Toast Notifications                                   │  │
│   │   - Notification Panel                                              │  │
│   │   - Article Detail & Editor Pages                                   │  │
│   └──────────────────────────────┬──────────────────────────────────────┘  │
│                                  │                                         │
│                     REST API + WebSocket (Socket.io)                       │
│                                  │                                         │
│                                  ▼                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                    Backend (Express :8080)                          │  │
│   │   - REST API: GET/POST/PUT /articles                                │  │
│   │   - Socket.io Server for WebSocket connections                      │  │
│   │   - Redis Pub/Sub Integration                                       │  │
│   └───────────────┬─────────────────────────────────┬───────────────────┘  │
│                   │                                 │                      │
│         JSON Storage                         Pub/Sub Channel               │
│         (Redis JSON)                        "news_updates"                 │
│                   │                                 │                      │
│                   ▼                                 ▼                      │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                    Redis Stack (:6379)                              │  │
│   │   - JSON Document Storage for Articles                              │  │
│   │   - Pub/Sub Channel for Broadcasting                                │  │
│   │   - RedisInsight UI (:8001)                                         │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

                              Pub/Sub Flow
                              ────────────

    1. Editor creates article via POST /articles
    2. Backend saves to Redis JSON
    3. Backend publishes to "news_updates" channel
    4. Redis broadcasts to all subscribers
    5. Backend receives message, emits via Socket.io
    6. All connected frontends receive "new_article" event
    7. Toast notification + UI update in real-time
```

## Technologies

- **Backend**: Bun, Express.js, Socket.io
- **Frontend**: Next.js 15, React 19, Tailwind CSS 4, shadcn/ui
- **Database**: Redis Stack (JSON documents, sorted sets, Pub/Sub)
- **Authentication**: Bcrypt password hashing, session tokens with TTL
- **Real-time**: Socket.io with Redis Pub/Sub
- **Containerization**: Docker + Docker Compose

## 📚 Documentation

- **[REDIS_ARCHITECTURE.md](./REDIS_ARCHITECTURE.md)** - Detailed Redis data structures and patterns
- **[CHANGES_SUMMARY.md](./CHANGES_SUMMARY.md)** - Complete list of changes and migration guide

## Requirements

- Docker
- Docker Compose

## Quick Start

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd news-live
```

### 2. Start all services

```bash
docker-compose up --build -d
```

This starts:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **RedisInsight**: http://localhost:8001

### 3. Demo the functionality

1. Open **Browser 1** at http://localhost:3000
2. **Register an account**: Click "Login / Register" → Create Account
3. **Create an article**: Click "Write Article" → Fill form → Publish
4. Open **Browser 2** at http://localhost:3000
5. Watch the instant notification appear in Browser 2!
6. Try filtering by category and searching articles

### 4. Monitor Redis Pub/Sub

Visit http://localhost:8001 (RedisInsight) to:

- View stored articles in Redis JSON
- Monitor Pub/Sub channel activity
- Inspect data structure

### 5. Stop services

```bash
docker-compose down
```

To also remove the Redis data volume:

```bash
docker-compose down -v
```

## Development (without Docker)

### Prerequisites

- Node.js 18+ or Bun
- Redis Stack running locally

### Backend

```bash
cd apps/api
bun install
bun run dev
```

### Frontend

```bash
cd apps/web
bun install
bun run dev
```

## API Endpoints

### Authentication (Public)

| Method | Endpoint         | Description                   |
| ------ | ---------------- | ----------------------------- |
| POST   | `/auth/register` | Register new user account     |
| POST   | `/auth/login`    | Login and get session token   |
| POST   | `/auth/logout`   | Logout and invalidate session |

### Articles

| Method | Endpoint        | Auth Required   | Description                                             |
| ------ | --------------- | --------------- | ------------------------------------------------------- |
| GET    | `/articles`     | No              | Get all articles (supports `?category=` and `?search=`) |
| GET    | `/articles/:id` | No              | Get single article by ID                                |
| POST   | `/articles`     | **Yes**         | Create new article                                      |
| PUT    | `/articles/:id` | **Yes** (Owner) | Update existing article                                 |
| DELETE | `/articles/:id` | **Yes** (Owner) | Delete article                                          |

### Examples

**Register:**

```bash
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "johndoe",
    "password": "password123"
  }'
# Returns: { "user": {...}, "token": "uuid-token" }
```

**Create Article (Authenticated):**

```bash
curl -X POST http://localhost:8080/articles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Breaking News",
    "content": "This is the article content...",
    "category": "Politics"
  }'
```

## WebSocket Events

| Event         | Direction       | Description                             |
| ------------- | --------------- | --------------------------------------- |
| `new_article` | Server → Client | Broadcast when new article is published |

## Project Structure

```
news-live/
├── apps/
│   ├── api/                  # Backend (Express + Socket.io)
│   │   ├── routes/
│   │   │   ├── articles.ts   # Article CRUD with auth
│   │   │   └── auth.ts       # Authentication routes
│   │   ├── middleware/
│   │   │   └── auth.ts       # Auth middleware (requireAuth, optionalAuth)
│   │   ├── services/
│   │   │   └── redis.ts      # Redis-native operations
│   │   ├── sockets.ts        # Socket.io handlers
│   │   ├── types.ts          # TypeScript types
│   │   ├── index.ts          # Server entry point
│   │   └── Dockerfile
│   └── web/                  # Frontend (Next.js)
│       ├── app/              # Next.js App Router pages
│       ├── components/       # React components
│       │   ├── auth-context.tsx      # Auth state management
│       │   ├── auth-dialog.tsx       # Login/Register UI
│       │   └── article-dialog.tsx    # Create article form
│       ├── lib/
│       │   ├── api.ts        # API client with auth
│       │   └── types.ts      # TypeScript types
│       └── Dockerfile
├── docker-compose.yml        # Container orchestration
├── redis-data/               # Redis persistence (gitignored)
├── REDIS_ARCHITECTURE.md     # Redis data structure docs
├── CHANGES_SUMMARY.md        # Complete changelog
└── README.md
```

## Categories

Articles can be assigned to one of three categories:

- **Politics** - Political news and updates
- **Sport** - Sports news and events
- **Tech** - Technology and innovation

## Redis Data Structures

The application uses Redis-native patterns for optimal performance:

### Articles

- **Individual documents**: `article:{id}` (Redis JSON)
- **Sorted set**: `articles:by_date` (sorted by timestamp, newest first)
- **Category sets**: `articles:category:Politics`, `articles:category:Sport`, `articles:category:Tech`

### Users

- **User documents**: `user:{id}` (Redis JSON)
- **Email lookup**: `user:email:{email}` → user_id
- **Users set**: `users:all`

### Sessions

- **Session tokens**: `session:{token}` → user_id (24h TTL, auto-expire)

See [REDIS_ARCHITECTURE.md](./REDIS_ARCHITECTURE.md) for detailed information.

## Security Features

- ✅ Password hashing with bcrypt (via Bun.password.hash)
- ✅ Session-based authentication with automatic expiration
- ✅ Article ownership verification
- ✅ Email validation on registration
- ✅ Minimum password requirements (8 characters)
- ✅ Bearer token authentication for API

## Performance Optimizations

- ✅ Individual article documents (load only what you need)
- ✅ Redis sorted sets for efficient sorting (O(log N))
- ✅ Redis sets for category filtering (O(1) membership)
- ✅ Pipelined operations to reduce round trips
- ✅ No full table scans - all queries use indexes

## License

MIT
