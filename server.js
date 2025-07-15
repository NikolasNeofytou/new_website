const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { run: syncPapers } = require('./fetchPapers');

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

const PAPERS_DIR = path.join(__dirname, 'papers');
// fetch latest PDFs from the forum on startup
syncPapers().catch(err => console.error('Failed to sync papers:', err));

app.get('/api/pastpapers', async (_req, res) => {
  try {
    const files = await fs.promises.readdir(PAPERS_DIR);
    const papers = files
      .filter(f => f.toLowerCase().endsWith('.pdf'))
      .map(f => ({
        title: f.replace(/_/g, ' ').replace(/\.pdf$/i, ''),
        url: `/papers/${encodeURIComponent(f)}`,
      }));
    res.json(papers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load past papers' });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
