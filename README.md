# ChessMaster

Play chess online, challenge adaptive bots, train with puzzles, review every
game with Stockfish, and hang out in clubs, forums and tournaments.

Built with **Next.js 16** (App Router, TypeScript), **Tailwind CSS v4**,
**Firebase** (Auth, Firestore, Realtime Database, Storage, Cloud Functions)
and **Stockfish 18** running fully client-side in a Web Worker.

## Quick start

```bash
npm install          # install web dependencies
cp .env.local.example .env.local   # then fill in your Firebase keys
npm run dev          # http://localhost:3000
```

### Firebase setup

1. Create a project at <https://console.firebase.google.com> and enable
   **Authentication** (Email/Password, Google, Anonymous),
   **Firestore Database**, **Realtime Database** and **Cloud Functions**.
2. Paste the web-app config into `.env.local` (`NEXT_PUBLIC_FIREBASE_*`).
3. Generate a service-account key (Project settings -> Service accounts)
   for the Admin SDK (`FIREBASE_ADMIN_*`).

```bash
firebase deploy --only firestore:rules,firestore:indexes,database
```

### Cloud Functions

```bash
cd functions
npm install
npm run build        # tsc -> lib/
firebase deploy --only functions
```

### Local development without the Blaze plan

Cloud Functions (2nd gen) need the **Blaze** plan, so on a Spark project the
rating/result functions cannot be deployed. You can still test them locally:

```bash
firebase emulators:start --only auth,firestore,database,functions
# in another terminal, with NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true in .env.local
npm run dev
```

`src/lib/firebase/config.ts` connects every SDK to the emulators when
`NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true` (ports come from `firebase.json`).

## Server-side features

| Function | What it does |
|---|---|
| `rateCompletedGame` | Elo for rated finished games (idempotent, transactional) |
| `submitGameResult` | trusted writer for online game results |
| `syncPublicProfile` | mirrors public fields into `/publicProfiles` |
| `onUserProfileCreated` | welcome notification |
| `deleteAccount` | full account wipe (data + auth) |
| `cleanupLiveGames` | scheduled Realtime Database housekeeping (every 30 min) |

If the functions are not deployed, online games still play fine — they just
cannot be finished into Firestore, and the UI says so.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` / `build` / `start` / `lint` | standard Next.js workflow |
| `npm test` | Vitest unit tests (chess libs, puzzles, Elo) |
| `npm run test:watch` | watch mode |
| `npm run verify:content` | validates every bundled puzzle, opening line and lesson line with chess.js |

## Project map

```
src/app/                  routes (file-system routing)
  play/online/[gameId]    realtime online game room (Realtime Database)
  play/computer/[botId]   Stockfish bots + a real game clock
  game/[gameId]           replay a finished game
  analysis/[gameId]       game review (eval, accuracy, best moves)
  analysis/editor         free analysis board (PGN/FEN import + export)
  puzzles/{daily,rush,dashboard}
  learn/[lessonId]        lessons with playable positions
  learn/articles/[id]     improvement articles
  openings                opening explorer with a line player
  forums | clubs | tournaments | friends | messages
  leaderboard | search | watch | settings | notifications | profile/[username]
src/components/board/ChessBoard.tsx   the shared board (premove, arrows,
                        themes, sounds, history, replay, puzzle mode)
src/components/analysis/  EnginePanel, EvalBar, GameReviewPanel
src/components/game/      GameViewer, GameChat, ClockBadge, PlayerInfoBar
src/components/puzzles/   PuzzleBoard
src/components/learn/     LinePlayer
src/lib/chess/            clock, analysis, pgn, uci, material, bots,
                          stockfishEngine (single Worker, serialised queue)
src/lib/online/liveGames.ts   Realtime Database layer (games, queue,
                              pairings, presence, chat)
src/lib/firebase/         auth, games, users, social, config
src/lib/hooks/            useAuth, useChessClock, useLiveClock, useMatchmaking,
                          useLiveGame, useGameReview, useBoardWidth, usePresence
src/types/user.ts         UserProfile + PublicProfile
functions/                Cloud Functions (TypeScript, 2nd gen)
scripts/verify-content.mjs  chess.js validation of all bundled content
```

## Data model

### Firestore

| Collection | Notes |
|---|---|
| `users/{uid}` | private profile, ratings, stats; clients cannot write ratings or stats |
| `publicProfiles/{uid}` | read-only mirror written by `syncPublicProfile`; feeds the leaderboard, search and public pages |
| `games/{id}` | finished games; `result` is written by `submitGameResult` only (bot games finish on creation) |
| `notifications/{id}` | written by functions; owners may mark them read |
| `forumCategories` | seeded server-side, read-only |
| `forumTopics/{id}/replies/{id}` | players create topics and replies |
| `clubs/{id}/posts/{id}` | player-created clubs with member lists |
| `tournaments/{id}` | arena events with player registration |
| `puzzles/{id}`, `puzzleDaily/{key}` | read-only, seeded server-side; a verified set ships in the app |
| `users/{uid}/puzzleProgress/{id}` | owner-only tactic attempts |
| `conversations/{id}/messages/{id}` | exactly two members, enforced by rules |

Required composite indexes live in `firestore.indexes.json`.

### Realtime Database

| Path | Notes |
|---|---|
| `liveGames/{id}` | game state, clocks (ms as of `lastMoveAt`), move list, chat |
| `matchmakingQueue/{uid}` | lobby entries keyed by uid (indexed on `joinedAt`) |
| `pairings/{uid}` | "your game is ready" hand-off from the matchmaker |
| `presence/{uid}` | online indicator, refreshed by `usePresence` |

## Security model

- **Emails stay private**: `users/*` is owner-only; the public reads only
  `/publicProfiles`. Ratings and stats are protected on the client path and
  written only by Cloud Functions.
- **Results are server-owned**: `games.result` cannot be written directly by
  clients. Online games finish through `submitGameResult`, which verifies the
  caller is a participant. Bot games carry their result on creation.
- **Puzzle progress is client-written on purpose** (`ratingPuzzle`,
  `puzzleStats`): single-player data with low abuse value; documented in
  `firestore.rules`.
- Next.js 16 uses `src/proxy.ts` for the (non-authoritative) auth redirects;
  the real checks live in components via `useAuth()`.

## Known limitations

- Online clocks are **client-derived** from Realtime Database timestamps: both
  clients compute the same tick-down, but a malicious client could lie about
  its own remaining time. A trusted clock needs a backend tick.
- Puzzle hints and analysis run entirely in the browser and depend on the
  WebAssembly build in `public/stockfish/` (ignored by ESLint on purpose).
- `socket.io-client` is currently an unused dependency (online play uses
  Firebase Realtime Database); remove it with `npm remove socket.io-client`
  for a smaller bundle.

