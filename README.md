# SHMMy Academic Platform

Modernized academic helper site with announcements, past exam paper discovery, community quality signals, offline support, secure session-based authentication (local + NTUA CAS SSO), and accessibility-first UI.

## Core Features

- Responsive layout (Bootstrap 5 + custom modern Renaissance + electrical engineering themed design, dark mode via CSS variables)
- High contrast accessibility mode & reduced-motion support
- Animated theme toggle with persistent preference (theme & contrast stored in localStorage)
- Live announcements scraping from official ECE site
- Past Exam Papers explorer with filters (course, semester, year)
- Paper viewer with embedded PDF, star ratings (per user, editable), rating breakdown bars
- Comments on papers: add, delete own, vote (▲/▼), report (auto-hide after threshold)
- Comment moderation: hidden after 3 reports (reveal on demand)
- Per-user rating replacement (can remove rating)
- Sorting (Newest / Oldest / Highest Rated)
- Skeleton loaders for smoother perceived performance
- Offline-first caching (service worker) for core assets + cached API fallback
- Secure local sign-in (email must end with `@ece.ntua.gr`) persisted via HTTP-only session cookie + CSRF token
- NTUA CAS (login.ntua.gr) Single Sign-On flow with automatic session + CSRF provisioning
- PWA manifest (installable) with icons

## Tech Stack

- Node.js + Express (no DB yet; JSON file persistence)
- Cheerio for HTML scraping
- Static JSON data for past papers + metadata file for community signals
- Service Worker for caching

## File Overview

| File | Purpose |
|------|---------|
| `server.js` | Express server, announcements scraping, past paper API, ratings/comments logic |
| `past_papers.json` | Seed dataset of past papers |
| `past_papers_meta.json` | Generated runtime metadata (ratings, comments, votes, reports) |
| `past_papers.html / .js` | Search UI, filtering, sorting, skeletons |
| `past_paper_view.html / _view.js` | Detailed viewer (rating, comments, moderation) |
| `sw.js` | Service worker for offline caching |
| `styles.css` | Theme, animations, dark mode, skeleton, cards |
| `manifest.webmanifest` | PWA metadata (name, theme color, icons) |
| `icons/` | PWA icons (192x192, 512x512 placeholders) |

## Running Locally

```bash
npm install
node server.js
# then open http://localhost:3000
```

## Authentication Model

The app now uses server-side sessions stored in SQLite (see `auth.js`). Flow:

1. User signs up or logs in (`/auth/signup` or `/auth/login`).
2. Server sets `sid` HTTP-only cookie + returns a per-session CSRF token.
3. Frontend stores CSRF token in memory (not localStorage) and sends it as `X-CSRF-Token` for state-changing requests (POST/DELETE).
4. CAS SSO path: user initiates `/auth/sso/login` (with optional `?redirect=/target`). After successful CAS validation at `/auth/sso/callback`, user is redirected to the original path with `#csrf=<token>` fragment which the client captures.
5. Logout clears session and (optionally) can propagate to CAS with `/auth/sso/logout`.

Old client-only `localStorage` identity has been removed. README and code updated accordingly.

## API Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/announcements` | Recent announcements (last 30 days) |
| GET | `/api/past-papers` | List with optional `course`, `semester`, `year` filters; returns rating summary, comment count, and userValue |
| GET | `/api/past-papers/:id` | Single paper detail + rating breakdown + comments |
| POST | `/api/past-papers/:id/rate` | Body `{ value:1-5 }` (requires header `X-Student-ID`) |
| DELETE | `/api/past-papers/:id/rate` | Remove user rating |
| POST | `/api/past-papers/:id/comment` | Body `{ text }` add comment (30s throttle) |
| DELETE | `/api/past-papers/:id/comment/:commentId` | Delete own comment |
| POST | `/api/past-papers/:id/comment/:commentId/vote` | Body `{ value: 1|-1 }` toggle vote |
| POST | `/api/past-papers/:id/comment/:commentId/report` | Report comment (increments reports; hidden at 3+) |

### Responses & Fields
- Rating stats: `{ average, count, breakdown: {1..5} }`
- Comments: `{ id, text, ts, studentId, score, reports, hidden }`

## Moderation Logic
- Each report increments `reports` on a comment.
- A comment is marked hidden (masked client-side with reveal button) when `reports >= 3`.
- Expand threshold easily in `server.js` (search for `reports >= 3`).

## Offline Caching
- Versioned service worker (`sw.js`) with `CACHE_VERSION` bump for invalidation.
- Network-first strategy for `/api/` endpoints; cache-first for static assets.
- Auth and metadata endpoints intentionally excluded from cache.

## Data Persistence Caveat
All community data stored in `past_papers_meta.json`. This is NOT concurrency-safe for production—multiple processes could clobber writes.

## Accessibility & Preferences
- User theme (light/dark) & high contrast preference are persisted in `localStorage` and restored on load.
- Reduced motion respected: animations simplified when user has `prefers-reduced-motion` set.

## PWA Notes
- `manifest.webmanifest` included and basic icons provided (placeholders). Replace contents of `icons/icon-192.png` and `icons/icon-512.png` with real PNG assets.
- Service worker enables offline usage of core screens; install prompt may appear on supported devices.

### Production Suggestions
- Harden session storage (rotate session IDs on privilege change, persistent session store cluster-ready).
- Enforce HTTPS (set `NODE_ENV=production` and proxy headers; app trusts first proxy).
- Implement long-term audit logging and abuse monitoring.
- Add configurable comment/report thresholds & admin moderation UI.

## Development Tips
- Kill/reset meta by deleting `past_papers_meta.json` (recreated automatically).
- Modify seed data in `past_papers.json` then restart server to reload.
- Force service worker update: bump `CACHE_VERSION` in `sw.js`.

## Roadmap Ideas
- Admin dashboard: review reported comments, adjust thresholds.
- Tagging / categorizing papers by topic or difficulty.
- Bulk import script for large paper sets.
- PDF preview thumbnails & OCR text search.
- User profiles with aggregate contributions.
- Internationalization.

## License
ISC (default). Adjust as needed.

---
Contributions & improvements welcome.
