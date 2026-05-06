# Multicrosser

Multiplayer crossword — multiple people solve the same puzzle in real time.

## Stack

- **Frontend**: Vue 3 + TypeScript + SASS + Vite (served via nginx)
- **Backend**: Node.js + TypeScript + Express + WebSocket (`ws`)
- **DB**: SQLite via `better-sqlite3` (two databases: crossword cache + game state)

## Architecture

```dir
frontend/   Vue SPA
backend/    Express API + WebSocket server
  src/
    providers/        CrosswordProvider interface + Guardian implementation
      guardian/       GuardianHost → QuickProvider, CrypticProvider
    db/               crosswords.db (cache) + games.db (state)
    routes/           REST: /api/crosswords, /api/games
    websocket/        WS: /ws/games/:crosswordId/:guid
```

### Provider pattern

Add new sources by implementing `CrosswordProvider` and registering a `CrosswordHost` in `backend/src/providers/registry.ts`. Guardian is the reference implementation with Quick and Cryptic types.

Crosswords are cached in SQLite keyed by `(providerId, date)` — the provider is only called once per day per crossword type.

### Game lifecycle

- `POST /api/games { crosswordId }` → creates game, returns `guid`
- URL: `/game/:crosswordId/:guid`
- Games expire after **36 hours** and are cleaned up hourly
- Expired game URL → auto-redirects to a new game

### Real-time sync

WebSocket per game room. Last-write-wins: client debounces keystrokes (50 ms) before sending `cell_update`. Server broadcasts to all room members including sender.

## Dev

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend (separate terminal)
cd frontend && npm install && npm run dev
```

Frontend dev server proxies `/api` and `/ws` to `localhost:3001`.

## Docker

```bash
# Build & run everything
docker compose up --build

# Build individual images
docker build -t registry.illuminat3.xyz/multicrosser ./frontend
docker build -t registry.illuminat3.xyz/multicrosser-backend ./backend
```
