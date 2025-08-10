# SHMMy Forum Enhancements

Modernized academic helper site with announcements, past exam paper discovery, community quality signals, offline support, and a lightweight local sign-in.

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
- Helper Chatbot (client-only) with persisted conversation history & clear history button
- Simple local sign-in (email must end with `@ece.ntua.gr`) stored in `localStorage`
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
| `chatbot.html / chatbot.js` | Local helper chatbot w/ persisted history |

## Running Locally

```bash
npm install
node server.js
# then open http://localhost:3000
```

## Sign-In Model

Pure client-side localStorage token:
```json
{ "email": "user@ece.ntua.gr", "studentId": "ID123456" }
```
Sent to the server via custom header `X-Student-ID` by frontend scripts for rating/comment routes.

## API Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/announcements` | Recent announcements (last 30 days) |
| GET | `/api/past-papers` | List with optional `course`, `semester`, `year` filters; returns rating summary and userValue |
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
- Network-first for `/api/past-papers*` then fallback to cache.
- Cache-first for static assets with background fill.
- To invalidate, bump `CACHE_NAME` in `sw.js`.

## Data Persistence Caveat
All community data stored in `past_papers_meta.json`. This is NOT concurrency-safe for production—multiple processes could clobber writes.

## Accessibility & Preferences
- User theme (light/dark) & high contrast preference are persisted in `localStorage` and restored on load.
- Reduced motion respected: animations simplified when user has `prefers-reduced-motion` set.

## PWA Notes
- `manifest.webmanifest` included and basic icons provided (placeholders). Replace contents of `icons/icon-192.png` and `icons/icon-512.png` with real PNG assets.
- Service worker enables offline usage of core screens; install prompt may appear on supported devices.

### Production Suggestions
- Replace JSON file with SQLite / Postgres.
- Add authentication & session tokens instead of trusting client header.
- Add rate limiting & CSRF protection.

## Development Tips
- Kill/reset meta by deleting `past_papers_meta.json` (recreated automatically).
- Modify seed data in `past_papers.json` then restart server to reload.

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
