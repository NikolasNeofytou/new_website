const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const users = [];

app.use(express.static(path.join(__dirname)));
app.use(express.json());

app.get('/api/announcements', async (_req, res) => {
  try {
    const response = await fetch('https://www.ece.ntua.gr/gr/announcements');
    const html = await response.text();
    const $ = cheerio.load(html);
    const announcements = [];
    $('#announcementsTable tbody tr').each((_, row) => {
      const cols = $(row).find('td');
      const date = $(cols[0]).text().trim();
      const title = $(cols[1]).text().trim();
      const category = $(cols[2]).text().trim();
      const link = $(cols[1]).find('a').attr('href');
      announcements.push({ date, title, category, link });
    });
    res.json(announcements);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

app.post('/api/users', (req, res) => {
  const { univid, name } = req.body;

  if (!univid) {
    return res.status(400).json({ error: 'University ID (univid) is required' });
  }

  const existing = users.find(u => u.univid === univid);
  if (existing) {
    return res
      .status(409)
      .json({ error: 'A user with this university ID already exists.' });
  }

  const user = { univid, name };
  users.push(user);
  res.status(201).json(user);
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
