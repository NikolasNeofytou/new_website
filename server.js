const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname)));

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

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
