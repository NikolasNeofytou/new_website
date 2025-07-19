const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://shmmy.ntua.gr/forum';
const FORUM_BOARD = '/viewforum.php?f=411'; // board that lists past papers
const PAPERS_DIR = path.join(__dirname, 'papers');

async function fetchPdfLinks() {
  const res = await fetch(BASE_URL + FORUM_BOARD);
  const html = await res.text();
  const $ = cheerio.load(html);
  const links = new Set();

  $('a[href$=".pdf"], a[href*="download/file.php"]').each((_, el) => {
    let href = $(el).attr('href');
    if (!href) return;
    if (!href.startsWith('http')) {
      href = BASE_URL + (href.startsWith('/') ? '' : '/') + href;
    }
    links.add(href);
  });

  return Array.from(links);
}

function sanitize(filename) {
  return filename.replace(/[^a-zA-Z0-9_.-]+/g, '_');
}

async function download(link) {
  const url = new URL(link);
  const filename = sanitize(path.basename(url.pathname));
  const dest = path.join(PAPERS_DIR, filename);
  if (fs.existsSync(dest)) return;
  const res = await fetch(link);
  if (!res.ok) throw new Error(`Failed to fetch ${link}: ${res.status}`);
  const buffer = await res.buffer();
  await fs.promises.writeFile(dest, buffer);
  console.log('Saved', filename);
}

async function run() {
  await fs.promises.mkdir(PAPERS_DIR, { recursive: true });
  const links = await fetchPdfLinks();
  for (const link of links) {
    try {
      await download(link);
    } catch (err) {
      console.error(err.message);
    }
  }
}

module.exports = { run, fetchPdfLinks };

if (require.main === module) {
  run().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
