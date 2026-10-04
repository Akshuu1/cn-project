const http = require('http');
const crypto = require('crypto');

const ID = process.env.BACKEND_ID || 'A';
const PORT = Number(process.env.PORT || 3001);

http.createServer((req, res) => {
  // every response says which backend served it
  res.setHeader('X-Backend', ID);
  console.log(new Date().toISOString(), req.method, req.url, 'from', req.socket.remoteAddress);

  if (req.url === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify({ backend: ID, status: 'ok', time: new Date().toISOString() }));
  }

  // caching demo endpoint - SAME body on A and B so the ETag matches on both
  if (req.url === '/api/cached') {
    const body = JSON.stringify({ message: 'cacheable data', version: 1 });
    const etag = '"' + crypto.createHash('md5').update(body).digest('hex') + '"';
    res.setHeader('Cache-Control', 'max-age=60');
    res.setHeader('ETag', etag);
    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304);
      return res.end();
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(body);
  }

  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end('<h1>Backend ' + ID + ' is running</h1><p><a href="/api/status">/api/status</a> | <a href="/api/cached">/api/cached</a></p>');
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'not found' }));
}).listen(PORT, '0.0.0.0', () => console.log('Backend ' + ID + ' listening on 0.0.0.0:' + PORT));