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

app.get('/api/pastpapers', async (_req, res) => {
  try {
    const response = await fetch('https://shmmy.ntua.gr/forum/viewforum.php?f=411');
    const html = await response.text();
    const $ = cheerio.load(html);
    const papers = [];
    $('a.forumtitle').each((_, el) => {
      const title = $(el).text().trim();
      let url = $(el).attr('href');
      if (url && !url.startsWith('http')) {
        url = 'https://shmmy.ntua.gr/forum/' + url.replace(/^\.\//, '');
      }
      papers.push({ title, url });
    });
    res.json(papers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch past papers' });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
