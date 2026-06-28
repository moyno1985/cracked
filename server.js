const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX_HOST = process.env.PINECONE_INDEX_HOST || "cracked-archive-1lf9x0p.svc.aped-4627-b74a.pinecone.io"; // host only, not a secret

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

function serveFile(res, filePath) {
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'text/plain';
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

function proxyRequest(options, body, res) {
  return new Promise((resolve) => {
    const req = https.request(options, (apiRes) => {
      let responseBody = '';
      apiRes.on('data', chunk => responseBody += chunk);
      apiRes.on('end', () => {
        res.writeHead(apiRes.statusCode, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        });
        res.end(responseBody);
        resolve();
      });
    });
    req.on('error', (e) => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
      resolve();
    });
    req.write(body);
    req.end();
  });
}

function handleCors(res) {
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end();
}

const jobs = {};

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') { handleCors(res); return; }

  if (req.url === '/api/claude' || req.url === '/.netlify/functions/claude') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Length': Buffer.byteLength(body),
        },
      };
      proxyRequest(options, body, res);
    });
    return;
  }

  // Job queue for image generation
  if (req.url === '/api/image') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      let parsed;
      try { parsed = JSON.parse(body); } catch(e) {
        res.writeHead(400); res.end(JSON.stringify({ error: 'Invalid JSON' })); return;
      }
      const jobId = Date.now().toString(36) + Math.random().toString(36).slice(2);
      jobs[jobId] = { status: 'pending' };
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ jobId }));

      // Run image generation in background
      const imagePrompt = `Advertising agency concept scamp. Rough sharpie marker pen sketch on white paper. Hand-drawn art directors rough. Black ink gestural strokes, very loose and expressive, minimal colour wash in yellow and grey. Shows the concept: ${parsed.concept}.${parsed.brand ? ' Include the ' + parsed.brand + ' brand name hand-lettered or roughly sketched in the composition — drawn by hand, not a clean logo, just scrawled text or a loose sketch of the mark.' : ''} Style: professional ad agency notepad sketch, not finished artwork, thumbnail composition. Everything must look hand-drawn — no clean graphics, no polished logos, no photographic elements.`;
      const imageBody = JSON.stringify({ model: 'gpt-image-2', prompt: imagePrompt, n: 1, size: '1024x1024', quality: 'low' });
      const options = {
        hostname: 'api.openai.com',
        path: '/v1/images/generations',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Length': Buffer.byteLength(imageBody) },
      };
      const apiReq = https.request(options, (apiRes) => {
        let responseBody = '';
        apiRes.on('data', chunk => responseBody += chunk);
        apiRes.on('end', () => {
          jobs[jobId] = { status: 'done', result: responseBody };
          setTimeout(() => { delete jobs[jobId]; }, 300000); // cleanup after 5min
        });
      });
      apiReq.on('error', (e) => { jobs[jobId] = { status: 'error', error: e.message }; });
      apiReq.write(imageBody);
      apiReq.end();
    });
    return;
  }

  // Poll for image job result
  if (req.url.startsWith('/api/image-status/')) {
    const jobId = req.url.split('/').pop();
    const job = jobs[jobId];
    if (!job) {
      res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ status: 'not_found' }));
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify(job));
    }
    return;
  }

  // Temp debug endpoint
  if (req.url === '/api/debug-env') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({
      hasPineconeKey: !!process.env.PINECONE_API_KEY,
      hasPineconeHost: !!process.env.PINECONE_INDEX_HOST,
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      pineconeKeyPrefix: (process.env.PINECONE_API_KEY || '').slice(0, 8),
    }));
    return;
  }

  // ── Semantic search via Pinecone ──────────────────────────────────────────
  if (req.url === '/api/search') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { query } = JSON.parse(body);

        // 1. Embed the query with OpenAI
        const embedBody = JSON.stringify({ model: 'text-embedding-3-small', input: query });
        const embedOpts = {
          hostname: 'api.openai.com',
          path: '/v1/embeddings',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Length': Buffer.byteLength(embedBody),
          },
        };

        const embedRes = await new Promise((resolve, reject) => {
          let data = '';
          const r = https.request(embedOpts, apiRes => {
            apiRes.on('data', c => data += c);
            apiRes.on('end', () => resolve(JSON.parse(data)));
          });
          r.on('error', reject);
          r.write(embedBody);
          r.end();
        });

        const vector = embedRes.data[0].embedding;

        // 2. Query Pinecone — need the index host URL
        // Get host from env or discover it
        let indexHost = PINECONE_INDEX_HOST;
        if (!indexHost) {
          // Fallback: query Pinecone control plane for index host
          const listRes = await new Promise((resolve, reject) => {
            let data = '';
            const r = https.request({
              hostname: 'api.pinecone.io',
              path: '/indexes/cracked-archive',
              method: 'GET',
              headers: { 'Api-Key': PINECONE_API_KEY, 'X-Pinecone-API-Version': '2025-04' },
            }, apiRes => {
              apiRes.on('data', c => data += c);
              apiRes.on('end', () => resolve(JSON.parse(data)));
            });
            r.on('error', reject);
            r.end();
          });
          indexHost = listRes.host;
        }

        const queryBody = JSON.stringify({
          vector,
          topK: 15,
          includeMetadata: true,
        });

        const pineconeRes = await new Promise((resolve, reject) => {
          let data = '';
          const r = https.request({
            hostname: indexHost,
            path: '/query',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Api-Key': PINECONE_API_KEY,
              'X-Pinecone-API-Version': '2025-04',
              'Content-Length': Buffer.byteLength(queryBody),
            },
          }, apiRes => {
            apiRes.on('data', c => data += c);
            apiRes.on('end', () => resolve(JSON.parse(data)));
          });
          r.on('error', reject);
          r.write(queryBody);
          r.end();
        });

        const results = (pineconeRes.matches || []).map(m => ({
          c: m.metadata.c,
          b: m.metadata.b,
          a: m.metadata.a,
          y: m.metadata.y,
          cat: m.metadata.cat,
          award: m.metadata.award,
          src: m.metadata.src,
          desc: m.metadata.desc,
          score: m.score,
        }));

        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ results }));
      } catch (err) {
        console.error('Search error:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ error: err.message, results: [] }));
      }
    });
    return;
  }

  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(__dirname, filePath);
  serveFile(res, filePath);
});

server.timeout = 120000; // 2 minutes
server.listen(PORT, () => {
  console.log(`Cracked running on port ${PORT}`);
});
