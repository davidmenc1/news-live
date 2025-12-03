# NewsLive - Real-Time News Portal

A full-stack web application simulating a news portal with real-time notifications using Redis Pub/Sub. Articles appear instantly across all connected browsers when published.

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

- **Backend**: Node.js/Bun, Express.js, Socket.io
- **Frontend**: Next.js 16, React 19, Tailwind CSS 4, shadcn/ui
- **Database**: Redis Stack (JSON storage + Pub/Sub)
- **Real-time**: Socket.io with Redis Pub/Sub
- **Containerization**: Docker + Docker Compose

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

### 3. Demo the real-time functionality

1. Open **Browser 1** at http://localhost:3000
2. Open **Browser 2** at http://localhost:3000
3. In Browser 2, click "Write Article" and create a new article
4. Watch the instant notification appear in Browser 1!

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

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/articles` | Get all articles (optional: `?category=Politics\|Sport\|Tech`) |
| GET | `/articles/:id` | Get single article by ID |
| POST | `/articles` | Create new article |
| PUT | `/articles/:id` | Update existing article |

### Create Article Example

```bash
curl -X POST http://localhost:8080/articles \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Breaking News",
    "content": "This is the article content...",
    "category": "Politics",
    "author": "John Doe"
  }'
```

## WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `new_article` | Server → Client | Broadcast when new article is published |

## Project Structure

```
news-live/
├── apps/
│   ├── api/                  # Backend (Express + Socket.io)
│   │   ├── routes/           # REST API routes
│   │   ├── services/         # Redis client & Pub/Sub
│   │   ├── sockets.ts        # Socket.io handlers
│   │   ├── index.ts          # Server entry point
│   │   └── Dockerfile
│   └── web/                  # Frontend (Next.js)
│       ├── app/              # Next.js App Router pages
│       ├── components/       # React components
│       ├── lib/              # Utilities & API client
│       └── Dockerfile
├── docker-compose.yml        # Container orchestration
├── redis-data/               # Redis persistence (gitignored)
└── README.md
```

## Categories

Articles can be assigned to one of three categories:
- **Politics** - Political news and updates
- **Sport** - Sports news and events
- **Tech** - Technology and innovation

## License

MIT
