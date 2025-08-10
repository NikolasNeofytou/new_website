// Minimal smoke test for API endpoints (run with `npm test`)
const http = require('http');

function request(path) {
  return new Promise((resolve, reject) => {
    http.get({ hostname: 'localhost', port: 3000, path }, res => {
      let data='';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

(async () => {
  try {
    const ann = await request('/api/announcements');
    console.log('Announcements status', ann.status);
    const papers = await request('/api/past-papers');
    console.log('Past papers status', papers.status);
    process.exit(0);
  } catch (e) {
    console.error('Test error', e);
    process.exit(1);
  }
})();
