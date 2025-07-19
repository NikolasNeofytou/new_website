const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { run: fetchPapersRun } = require('./fetchPapers');
const PAPERS_DIR = path.join(__dirname, 'papers');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname)));
app.use(express.json());

app.get('/api/announcements', async (_req, res) => {
  try {
    const response = await fetch('https://www.ece.ntua.gr/gr/announcements');
    const html = await response.text();
    const $ = cheerio.load(html);
    const announcements = [];
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    $('#announcementsTable tbody tr').each((_, row) => {
      const cols = $(row).find('td');
      const dateText = $(cols[0]).text().trim();
      const [d, m, y] = dateText.split(/[\/\-]/);
      const jsDate = new Date(`${y}-${m}-${d}`);
      if (jsDate >= oneMonthAgo) {
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

const LAB_FILE = path.join(__dirname, 'labpartners.json');
const USERS_FILE = path.join(__dirname, 'users.json');

async function readLabFile() {
  try {
    const data = await fs.promises.readFile(LAB_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeLabFile(data) {
  await fs.promises.writeFile(LAB_FILE, JSON.stringify(data, null, 2));
}

async function readUsers() {
  try {
    const data = await fs.promises.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeUsers(data) {
  await fs.promises.writeFile(USERS_FILE, JSON.stringify(data, null, 2));
}

app.get('/api/pastpapers', async (_req, res) => {
  try {
    await fs.promises.mkdir(PAPERS_DIR, { recursive: true });
    let files = await fs.promises.readdir(PAPERS_DIR);
    files = files.filter(f => f.toLowerCase().endsWith('.pdf'));
    const papers = files.map(f => ({
      title: f.replace(/_/g, ' ').replace(/\.pdf$/i, ''),
      url: '/papers/' + encodeURIComponent(f)
    }));
    res.json(papers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load past papers' });
  }
});

app.get('/api/labpartners', async (_req, res) => {
  const posts = await readLabFile();
  res.json(posts);
});

app.post('/api/labpartners', async (req, res) => {
  try {
    const posts = await readLabFile();
    posts.push({
      course: req.body.course,
      teamSize: req.body.teamSize,
      type: req.body.type,
      contact: req.body.contact
    });
    await writeLabFile(posts);
    res.status(201).json({ status: 'ok' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save post' });
  }
});

app.get('/api/users', async (_req, res) => {
  const users = await readUsers();
  res.json(users);
});

app.post('/api/users', async (req, res) => {
  try {
    const users = await readUsers();
    const hashed = await bcrypt.hash(req.body.password, 10);
    users.push({
      name: req.body.name,
      univid: req.body.univid,
      year: req.body.year,
      spec: req.body.spec,
      photo: req.body.photo,
      password: hashed
    });
    await writeUsers(users);
    res.status(201).json({ status: 'ok' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save user' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const users = await readUsers();
    const user = users.find(u => u.univid === req.body.univid);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const ok = await bcrypt.compare(req.body.password || '', user.password);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const { password, ...clean } = user;
    res.json({ status: 'ok', user: clean });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to log in' });
  }
});

app.get('/auth/linkedin', (_req, res) => {
  res.send('LinkedIn login not implemented. This placeholder represents where an OAuth flow would begin.');
});

app.get('/auth/ieee', (_req, res) => {
  res.send('IEEE login not implemented. This placeholder represents where an OAuth flow would begin.');
});


app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  try {
    await fetchPapersRun();
  } catch (err) {
    console.error('Failed to sync past papers:', err.message);
  }
});
