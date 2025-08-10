const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs');

const cookie = require('cookie');
const { createUser, authenticate, createSession, getSession, getUserById, invalidateSession, validateCsrf, findOrCreateSsoUser } = require('./auth');
// Optional xml2js for safer CAS parsing (fallback to regex if not installed)
let parseStringPromise = null; try { ({ parseStringPromise } = require('xml2js')); } catch { /* optional */ }

const app = express();
// Trust first proxy for correct proto (needed behind reverse proxy for secure cookies)
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;
const META_FILE = path.join(__dirname, 'past_papers_meta.json');

app.use(express.static(path.join(__dirname)));
app.use(express.json()); // for rating/comment POST bodies
// Disable cache for auth pages to reflect updates quickly
app.get(['/signup.html','/signup'], (req,res,next)=>{
  res.setHeader('Cache-Control','no-store');
  res.sendFile(path.join(__dirname,'signup.html'));
});

// Security headers
app.use((req,res,next)=>{
  res.setHeader('X-Frame-Options','DENY');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','same-origin');
  res.setHeader('Permissions-Policy','geolocation=(), microphone=(), camera=()');
  next();
});

// Basic IP rate limiting (reset each minute) - lightweight in-memory
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX = 120; // max requests per IP per window
const RATE_BUCKET = new Map();
app.use((req,res,next)=>{
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const rec = RATE_BUCKET.get(ip) || { start: now, count: 0 };
  if(now - rec.start > RATE_WINDOW_MS){ rec.start = now; rec.count = 0; }
  rec.count++;
  RATE_BUCKET.set(ip, rec);
  if(rec.count > RATE_MAX) return res.status(429).json({ error: 'Rate limit exceeded' });
  next();
});

// Parse session from cookie
app.use(async (req,res,next)=>{
  const header = req.headers.cookie;
  if(header){
    const parsed = cookie.parse(header);
    if(parsed.sid){
      try {
        const s = await getSession(parsed.sid);
        if(s){
          req.userSession = s;
          req.user = await getUserById(s.user_id);
        }
      } catch(e){ /* ignore */ }
    }
  }
  next();
});

function requireAuth(req,res,next){ if(!req.user) return res.status(401).json({ error: 'Auth required'}); next(); }

// AUTH ROUTES
// Global diagnostic for unexpected errors
process.on('unhandledRejection', (reason,p)=>{ console.error('UnhandledRejection:', reason); });
process.on('uncaughtException', err=>{ console.error('UncaughtException:', err); });

// Helper: safe base64 url encode/decode (avoid relying on Node version's base64url variant)
function encodeState(obj){
  try { return Buffer.from(JSON.stringify(obj)).toString('base64').replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_'); } catch { return ''; }
}
function decodeState(str){
  if(!str || typeof str !== 'string') return null;
  try {
    const pad = str.length % 4 === 2 ? '==' : str.length % 4 === 3 ? '=' : '';
    const b64 = str.replace(/-/g,'+').replace(/_/g,'/') + pad;
    return JSON.parse(Buffer.from(b64,'base64').toString('utf8'));
  } catch { return null; }
}
app.post('/auth/signup', async (req,res)=>{
  const { email, password } = req.body || {};
  if(!email || !password) return res.status(400).json({ error: 'Email and password required' });
  if(!/^[^@]+@ece\.ntua\.gr$/i.test(email)) return res.status(400).json({ error: 'Must use @ece.ntua.gr email' });
  try {
    const user = await createUser(email.toLowerCase(), password);
  const { id: sid, csrf } = await createSession(user.id);
  const secure = (req.secure || req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production');
  const sameSite = secure ? 'Strict' : 'Lax';
  res.setHeader('Set-Cookie', cookie.serialize('sid', sid, { httpOnly: true, sameSite, path: '/', maxAge: 60*60*24*7, secure }));
    res.json({ ok:true, user, csrf });
  } catch (e) {
    res.status(400).json({ error: e.message.includes('SQLITE_CONSTRAINT') ? 'Email already registered' : e.message });
  }
});

app.post('/auth/login', async (req,res)=>{
  const { email, password } = req.body || {};
  if(!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const result = await authenticate(email.toLowerCase(), password);
  if(!result.ok) return res.status(401).json({ error: result.locked ? 'Account temporarily locked' : 'Invalid credentials' });
  const { id: sid, csrf } = await createSession(result.user.id);
  const secure = (req.secure || req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production');
  const sameSite = secure ? 'Strict' : 'Lax';
  res.setHeader('Set-Cookie', cookie.serialize('sid', sid, { httpOnly: true, sameSite, path: '/', maxAge: 60*60*24*7, secure }));
  res.json({ ok:true, user: result.user, csrf });
});

app.post('/auth/logout', async (req,res)=>{
  const header = req.headers.cookie;
  if(header){ const parsed = cookie.parse(header); if(parsed.sid) invalidateSession(parsed.sid); }
  res.setHeader('Set-Cookie', cookie.serialize('sid','',{ path:'/', maxAge:0 }));
  res.json({ ok:true });
});

app.get('/auth/me', (req,res)=>{
  if(!req.user) return res.status(401).json({ error: 'Not logged in' });
  res.json({ user: req.user });
});

// CAS SSO endpoints (stub integration) - user chooses institutional login
// Initiates CAS login by redirecting to CAS server with service callback
app.get(['/auth/sso/login','/auth/sso/login/'], (req,res)=>{
  const redirect = req.query.redirect && typeof req.query.redirect === 'string' && req.query.redirect.startsWith('/') ? req.query.redirect : '/index.html';
  const state = encodeState({ r: redirect });
  const callbackUrl = `${req.protocol}://${req.get('host')}/auth/sso/callback?state=${state}`;
  const service = encodeURIComponent(callbackUrl);
  const casBase = process.env.CAS_BASE || 'https://login.ntua.gr/cas';
  console.log('[SSO] Initiating CAS login', { redirect, callbackUrl });
  res.redirect(`${casBase}/login?service=${service}`);
});

// CAS callback: validate ticket, extract user principal -> email
app.get('/auth/sso/callback', async (req,res)=>{
  const { ticket, state } = req.query;
  if(!ticket) return res.status(400).send('Missing ticket');
  try {
    const casBase = process.env.CAS_BASE || 'https://login.ntua.gr/cas';
    const serviceUrl = `${req.protocol}://${req.get('host')}/auth/sso/callback`;
    const validateUrl = `${casBase}/serviceValidate?service=${encodeURIComponent(serviceUrl)}&ticket=${encodeURIComponent(ticket)}`;
    const r = await fetch(validateUrl);
    const txt = await r.text();
    let username = null;
    if(parseStringPromise){
      try {
        const parsed = await parseStringPromise(txt);
        // Typical CAS XML: serviceResponse.authenticationSuccess.user[0]
        username = parsed?.['cas:serviceResponse']?.['cas:authenticationSuccess']?.[0]?.['cas:user']?.[0]
          || parsed?.serviceResponse?.authenticationSuccess?.[0]?.user?.[0];
      } catch { /* ignore XML parse error fallback to regex */ }
    }
    if(!username){
      const userMatch = txt.match(/<cas:user>([^<]+)<\/cas:user>/);
      if(userMatch) username = userMatch[1];
    }
    if(!username) {
      console.warn('CAS validation failed response snippet:', txt.slice(0,400));
      return res.status(401).send('CAS validation failed');
    }
    // Build institutional email (assuming username@ece.ntua.gr)
    const email = `${username}@ece.ntua.gr`.toLowerCase();
    if(!/^[^@]+@ece\.ntua\.gr$/.test(email)) return res.status(403).send('Not an ECE account');
    const user = await findOrCreateSsoUser(email);
    const { id: sid, csrf } = await createSession(user.id);
    const secure = (req.secure || req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production');
    const sameSite = secure ? 'Strict' : 'Lax';
    res.setHeader('Set-Cookie', cookie.serialize('sid', sid, { httpOnly:true, sameSite, path:'/', maxAge:60*60*24*7, secure }));
    // Redirect back to homepage with CSRF token as fragment (JS will pick and store)
    let redirectPath = '/index.html';
    if(state){
      const parsed = decodeState(state);
      if(parsed && typeof parsed.r === 'string' && parsed.r.startsWith('/')) redirectPath = parsed.r;
    }
    // Append csrf token as fragment so client can store it
    res.redirect(`${redirectPath}#csrf=${csrf}`);
  } catch(e){
    console.error('CAS SSO error', e);
    res.status(500).send('SSO error');
  }
});

// CAS global logout convenience (ends local session then optionally redirect to CAS logout)
app.get('/auth/sso/logout', (req,res)=>{
  const header = req.headers.cookie;
  if(header){ const parsed = cookie.parse(header); if(parsed.sid) invalidateSession(parsed.sid); }
  res.setHeader('Set-Cookie', cookie.serialize('sid','',{ path:'/', maxAge:0 }));
  const casBase = process.env.CAS_BASE || 'https://login.ntua.gr/cas';
  const service = encodeURIComponent(`${req.protocol}://${req.get('host')}/index.html`);
  return res.redirect(`${casBase}/logout?service=${service}`);
});

// Diagnostic route for SSO (shows if session + csrf token present) - disable in production if desired
app.get('/auth/debug', (req,res)=>{
  res.json({ hasSession: !!req.userSession, user: req.user||null });
});

// Route diagnostics (development only) - lists registered GET paths
app.get('/__routes', (req,res)=>{
  const routes = [];
  app._router.stack.forEach(l=>{ if(l.route && l.route.path){ routes.push({ path: l.route.path, methods: Object.keys(l.route.methods) }); } });
  res.json(routes);
});

// CSRF middleware for state-changing JSON POST/DELETE
async function ensureCsrf(req,res,next){
  if(!req.userSession) return res.status(401).json({ error: 'Auth required'});
  const header = req.headers['x-csrf-token'];
  if(!header) return res.status(403).json({ error: 'Missing CSRF token'});
  const ok = await validateCsrf(req.userSession.id, header);
  if(!ok) return res.status(403).json({ error: 'Invalid CSRF token'});
  next();
}

// Simple in-memory load of past papers JSON once at startup
let pastPapers = [];
try {
  pastPapers = require('./past_papers.json');
} catch (e) {
  console.warn('past_papers.json not found or invalid, endpoint will return empty list');
}

// Load meta (ratings/comments)
let meta = {};
function loadMeta() {
  try {
    if (fs.existsSync(META_FILE)) {
      const raw = fs.readFileSync(META_FILE, 'utf8');
      meta = JSON.parse(raw || '{}');
      // Normalize legacy entries to ensure required sub-objects exist
      Object.entries(meta).forEach(([pid, entry]) => {
        if(!entry || typeof entry !== 'object') { meta[pid] = { ratings:{}, comments:[], studentRatings:{}, lastCommentTs:{}, commentVotes:{} }; return; }
        entry.ratings = entry.ratings || {};
        entry.comments = Array.isArray(entry.comments) ? entry.comments : [];
        entry.studentRatings = entry.studentRatings || {};
        entry.lastCommentTs = entry.lastCommentTs || {};
        entry.commentVotes = entry.commentVotes || {};
        // Ensure each comment has id/text/ts and studentId (nullable)
        entry.comments = entry.comments.map(c => ({
          id: c.id || Date.now().toString(36),
            text: typeof c.text === 'string' ? c.text : '',
            ts: c.ts || Date.now(),
            studentId: c.studentId || null,
            reports: c.reports || 0
        })).slice(-200);
      });
    }
  } catch (e) {
    console.warn('Failed to read meta file, starting empty', e.message);
    meta = {};
  }
}
function saveMeta() {
  try {
  fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write meta file', e);
  }
}
loadMeta();

function computeRatingStats(entry) {
  if (!entry || !entry.ratings) return { average: 0, count: 0, breakdown: {1:0,2:0,3:0,4:0,5:0} };
  const breakdown = {1:0,2:0,3:0,4:0,5:0, ...entry.ratings};
  let total = 0; let sum = 0;
  Object.entries(breakdown).forEach(([k,v]) => { const star = parseInt(k,10); const c = parseInt(v,10)||0; total += c; sum += star * c; });
  const average = total ? +(sum / total).toFixed(2) : 0;
  return { average, count: total, breakdown };
}

function computeCommentCount(entry){
  if(!entry || !Array.isArray(entry.comments)) return 0;
  return entry.comments.length; // hidden logic applied client-side; we count all stored comments
}

app.get('/api/announcements', async (_req, res) => {
  try {
    const response = await fetch('https://www.ece.ntua.gr/gr/announcements');
    const html = await response.text();
    const $ = cheerio.load(html);
    const announcements = [];
    const now = Date.now();
    const monthMs = 30 * 24 * 60 * 60 * 1000;
    $('#announcementsTable tbody tr').each((_, row) => {
      const cols = $(row).find('td');
      const dateText = $(cols[0]).text().trim();
      const [d, m, y] = dateText.split(/[-/]/).map(n => parseInt(n, 10));
      const parsed = new Date(y, m - 1, d);
      if (now - parsed.getTime() <= monthMs) {
        const title = $(cols[1]).text().trim();
        const category = $(cols[2]).text().trim();
        const link = $(cols[1]).find('a').attr('href');
        announcements.push({ date: dateText, title, category, link });
      }
    });
    res.json(announcements);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// GET /api/past-papers?course=ECE101&semester=3&year=2024
// Adds rating summary fields: averageRating, ratingCount
app.get('/api/past-papers', (req, res) => {
  const { course, semester, year } = req.query;
  const studentId = req.user?.id; // header fallback removed
  let results = pastPapers.slice();
  if (course) {
    const c = String(course).toLowerCase();
    results = results.filter(p => p.courseCode.toLowerCase() === c || p.courseName.toLowerCase().includes(c));
  }
  if (semester) {
    const sem = parseInt(semester, 10);
    if (!isNaN(sem)) {
      results = results.filter(p => p.semester === sem);
    }
  }
  if (year) {
    const y = parseInt(year, 10);
    if (!isNaN(y)) {
      results = results.filter(p => p.year === y);
    }
  }
  const augmented = results.map(p => {
    const entry = meta[p.id];
    const stats = computeRatingStats(entry);
    const userValue = studentId && entry && entry.studentRatings ? entry.studentRatings[studentId] : undefined;
  const commentCount = computeCommentCount(entry);
  return { ...p, averageRating: stats.average, ratingCount: stats.count, commentCount, userValue };
  });
  res.json(augmented);
});

// GET single past paper details + meta
app.get('/api/past-papers/:id', (req, res) => {
  const id = req.params.id;
  const studentId = req.user?.id;
  const paper = pastPapers.find(p => String(p.id) === id);
  if (!paper) return res.status(404).json({ error: 'Not found' });
  const entry = meta[paper.id];
  const stats = computeRatingStats(entry);
  const comments = (entry?.comments || []).slice(-100).map(c => withCommentScore(c, entry));
  const userValue = studentId && entry && entry.studentRatings ? entry.studentRatings[studentId] : undefined;
  const commentCount = computeCommentCount(entry);
  res.json({ ...paper, rating: stats, comments, commentCount, userValue });
});

// POST rate { value: 1-5 }
app.post('/api/past-papers/:id/rate', ensureCsrf, (req, res) => {
  const id = req.params.id;
  const { value } = req.body || {};
  const v = parseInt(value, 10);
  const studentId = req.user?.id;
  if (!studentId) return res.status(401).json({ error: 'Login required' });
  if (![1,2,3,4,5].includes(v)) return res.status(400).json({ error: 'Invalid rating value' });
  if (!pastPapers.find(p => String(p.id) === id)) return res.status(404).json({ error: 'Paper not found' });
  meta[id] = meta[id] || { ratings: {}, comments: [], studentRatings: {}, lastCommentTs: {} };
  const entry = meta[id];
  // adjust counts if previously rated
  const prev = entry.studentRatings[studentId];
  if (prev && entry.ratings[prev]) {
    entry.ratings[prev] -= 1;
    if (entry.ratings[prev] < 0) entry.ratings[prev] = 0;
  }
  entry.ratings[v] = (entry.ratings[v] || 0) + 1;
  entry.studentRatings[studentId] = v;
  saveMeta();
  const stats = computeRatingStats(entry);
  res.json({ ok: true, rating: stats, userValue: v });
});

// DELETE rating (remove user's rating)
app.delete('/api/past-papers/:id/rate', ensureCsrf, (req, res) => {
  const id = req.params.id;
  const studentId = req.user?.id;
  if (!studentId) return res.status(401).json({ error: 'Login required' });
  if (!pastPapers.find(p => String(p.id) === id)) return res.status(404).json({ error: 'Paper not found' });
  const entry = meta[id];
  if (!entry || !entry.studentRatings || !entry.studentRatings[studentId]) return res.json({ ok: true, removed: false });
  const prev = entry.studentRatings[studentId];
  if (entry.ratings && entry.ratings[prev]) {
    entry.ratings[prev] -= 1;
    if (entry.ratings[prev] < 0) entry.ratings[prev] = 0;
  }
  delete entry.studentRatings[studentId];
  saveMeta();
  const stats = computeRatingStats(entry);
  res.json({ ok: true, removed: true, rating: stats });
});

// POST comment { text: string }
app.post('/api/past-papers/:id/comment', ensureCsrf, (req, res) => {
  const id = req.params.id;
  const text = (req.body && req.body.text || '').trim();
  const studentId = req.user?.id;
  if (!studentId) return res.status(401).json({ error: 'Login required' });
  if (!text) return res.status(400).json({ error: 'Empty comment' });
  if (text.length > 500) return res.status(400).json({ error: 'Comment too long' });
  if (!pastPapers.find(p => String(p.id) === id)) return res.status(404).json({ error: 'Paper not found' });
  meta[id] = meta[id] || { ratings: {}, comments: [], studentRatings: {}, lastCommentTs: {} };
  const entry = meta[id];
  const now = Date.now();
  entry.lastCommentTs = entry.lastCommentTs || {};
  const lastTs = entry.lastCommentTs[studentId] || 0;
  if ((now - lastTs) < 30_000) {
    return res.status(429).json({ error: 'You are commenting too fast. Please wait a bit.' });
  }
  entry.lastCommentTs[studentId] = now;
  entry.comments.push({ id: now.toString(36), text, ts: now, studentId });
  if (entry.comments.length > 200) entry.comments = entry.comments.slice(-200);
  saveMeta();
  res.json({ ok: true, comments: entry.comments.slice(-100).map(c => withCommentScore(c, entry)) });
});

// DELETE comment
app.delete('/api/past-papers/:id/comment/:commentId', ensureCsrf, (req, res) => {
  const { id, commentId } = req.params;
  const studentId = req.user?.id;
  if (!studentId) return res.status(401).json({ error: 'Login required' });
  if (!pastPapers.find(p => String(p.id) === id)) return res.status(404).json({ error: 'Paper not found' });
  const entry = meta[id];
  if (!entry || !entry.comments) return res.status(404).json({ error: 'Comment not found' });
  const idx = entry.comments.findIndex(c => c.id === commentId && c.studentId === studentId);
  if (idx === -1) return res.status(404).json({ error: 'Comment not found' });
  entry.comments.splice(idx,1);
  saveMeta();
  res.json({ ok: true });
});

// POST vote on comment { value: 1 | -1 }
app.post('/api/past-papers/:id/comment/:commentId/vote', ensureCsrf, (req, res) => {
  const { id, commentId } = req.params;
  const { value } = req.body || {};
  const v = parseInt(value, 10);
  const studentId = req.user?.id;
  if (!studentId) return res.status(401).json({ error: 'Login required' });
  if (![1, -1].includes(v)) return res.status(400).json({ error: 'Invalid vote' });
  const entry = meta[id];
  if (!entry) return res.status(404).json({ error: 'Paper not found' });
  const comment = entry.comments?.find(c => c.id === commentId);
  if (!comment) return res.status(404).json({ error: 'Comment not found' });
  entry.commentVotes = entry.commentVotes || {}; // { commentId: { studentId: value } }
  entry.commentVotes[commentId] = entry.commentVotes[commentId] || {};
  const prev = entry.commentVotes[commentId][studentId];
  if (prev === v) {
    delete entry.commentVotes[commentId][studentId]; // toggle off
  } else {
    entry.commentVotes[commentId][studentId] = v;
  }
  saveMeta();
  res.json({ ok: true, score: computeCommentScore(commentId, entry), value: entry.commentVotes[commentId][studentId] || 0 });
});

// POST report comment (increments report counter)
app.post('/api/past-papers/:id/comment/:commentId/report', ensureCsrf, (req, res) => {
  const { id, commentId } = req.params;
  const studentId = req.user?.id;
  if (!studentId) return res.status(401).json({ error: 'Login required' });
  const entry = meta[id];
  if (!entry) return res.status(404).json({ error: 'Paper not found' });
  const comment = entry.comments?.find(c => c.id === commentId);
  if (!comment) return res.status(404).json({ error: 'Comment not found' });
  comment.reports = (comment.reports || 0) + 1;
  saveMeta();
  res.json({ ok: true, reports: comment.reports });
});

function computeCommentScore(commentId, entry) {
  if (!entry || !entry.commentVotes || !entry.commentVotes[commentId]) return 0;
  return Object.values(entry.commentVotes[commentId]).reduce((a,b)=>a+b,0);
}

function withCommentScore(c, entry) {
  const score = computeCommentScore(c.id, entry);
  const reports = c.reports || 0;
  const hidden = reports >= 3; // threshold
  return { ...c, score, reports, hidden };
}

// Helper to compile a user profile snapshot from meta
function buildUserProfile(studentId) {
  const ratings = [];
  const comments = [];
  Object.entries(meta).forEach(([paperId, entry]) => {
    const paper = pastPapers.find(p => String(p.id) === String(paperId));
    if (!paper) return;
    // Ratings
    if (entry.studentRatings && entry.studentRatings[studentId]) {
      ratings.push({
        paperId: paper.id,
        courseCode: paper.courseCode,
        courseName: paper.courseName,
        year: paper.year,
        semester: paper.semester,
        value: entry.studentRatings[studentId]
      });
    }
    // Comments
    if (entry.comments && entry.comments.length) {
      entry.comments.forEach(c => {
        if (c.studentId === studentId) {
          comments.push({
            paperId: paper.id,
            courseCode: paper.courseCode,
            courseName: paper.courseName,
            year: paper.year,
            semester: paper.semester,
            id: c.id,
            text: c.text,
            ts: c.ts,
            reports: c.reports || 0
          });
        }
      });
    }
  });
  ratings.sort((a,b)=> a.courseCode.localeCompare(b.courseCode));
  comments.sort((a,b)=> b.ts - a.ts);
  return {
    studentId,
    ratingsCount: ratings.length,
    commentsCount: comments.length,
    ratings,
    comments
  };
}

// GET authenticated user's profile summary
app.get('/api/me', (req,res) => {
  const studentId = req.user?.id;
  if (!studentId) return res.status(401).json({ error: 'Login required' });
  const profile = buildUserProfile(studentId);
  res.json(profile);
});

// Bulk delete user ratings
app.delete('/api/me/ratings', ensureCsrf, (req,res) => {
  const studentId = req.user?.id;
  if (!studentId) return res.status(401).json({ error: 'Login required' });
  let removed = 0;
  Object.entries(meta).forEach(([paperId, entry]) => {
    if (entry.studentRatings && entry.studentRatings[studentId]) {
      const prev = entry.studentRatings[studentId];
      if (entry.ratings && entry.ratings[prev]) {
        entry.ratings[prev] -= 1;
        if (entry.ratings[prev] < 0) entry.ratings[prev] = 0;
      }
      delete entry.studentRatings[studentId];
      removed++;
    }
  });
  if (removed) saveMeta();
  res.json({ ok: true, removed });
});

// Bulk delete user comments
app.delete('/api/me/comments', ensureCsrf, (req,res) => {
  const studentId = req.user?.id;
  if (!studentId) return res.status(401).json({ error: 'Login required' });
  let removed = 0;
  Object.values(meta).forEach(entry => {
    if (entry.comments && entry.comments.length) {
      const before = entry.comments.length;
      entry.comments = entry.comments.filter(c => c.studentId !== studentId);
      const diff = before - entry.comments.length;
      if (diff > 0) removed += diff;
    }
    if (entry.commentVotes) {
      // Remove any votes the user cast (privacy cleanup)
      Object.values(entry.commentVotes).forEach(vMap => { if (vMap[studentId]) delete vMap[studentId]; });
    }
  });
  if (removed) saveMeta();
  res.json({ ok: true, removed });
});

// Export profile data JSON
app.get('/api/me/export', (req,res) => {
  const studentId = req.user?.id;
  if (!studentId) return res.status(401).json({ error: 'Login required' });
  const profile = buildUserProfile(studentId);
  res.setHeader('Content-Type','application/json');
  res.setHeader('Content-Disposition', `attachment; filename="shmmy_profile_${studentId}.json"`);
  res.send(JSON.stringify({ exportedAt: new Date().toISOString(), profile }, null, 2));
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
