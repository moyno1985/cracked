const https = require('https');

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const data = JSON.stringify(req.body);

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const request = https.request(options, (response) => {
      let body = '';
      response.on('data', chunk => body += chunk);
      response.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          res.status(response.statusCode).json(parsed);
        } catch(e) {
          res.status(500).json({ error: 'Invalid response from API' });
        }
        resolve();
      });
    });

    request.on('error', (e) => {
      res.status(500).json({ error: e.message });
      resolve();
    });

    request.write(data);
    request.end();
  });
};
