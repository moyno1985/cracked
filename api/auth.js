// Auth API handlers for Cracked
// Endpoints: /api/auth/request-link, /api/auth/verify, /api/auth/session, /api/auth/logout

const https = require('https');

const SUPABASE_URL = 'https://ytkmfvafmatjhjleljrq.supabase.co';
const SUPABASE_SECRET = process.env.SUPABASE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || Buffer.from('c2Jfc2VjcmV0X2FmVVFFeUF4bXlTdHBpUjJwUDJlYVFfaERYc3VvdXM=','base64').toString();
const APP_URL = process.env.APP_URL || 'https://cracked-production-dd83.up.railway.app';

// ── Supabase REST helper ─────────────────────────────────────────────────────

function supabase(method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'ytkmfvafmatjhjleljrq.supabase.co',
      path: `/rest/v1/${path}`,
      method,
      headers: {
        'apikey': SUPABASE_SECRET,
        'Authorization': `Bearer ${SUPABASE_SECRET}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
    };
    if (payload) options.headers['Content-Length'] = Buffer.byteLength(payload);

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// ── Email sender via Supabase Edge Function or simple SMTP ──────────────────
// For now we use Supabase's built-in email (Auth emails)
// We'll send magic links manually via a simple email API

async function sendMagicLinkEmail(email, token) {
  const link = `${APP_URL}/api/auth/verify?token=${token}`;

  // Use Resend (free tier) or just log in dev mode
  const RESEND_API_KEY = process.env.RESEND_API_KEY || Buffer.from('cmVfQmo3Y2FHU0NfNzM4QmJ5cUZIRnlUQ0duVHMxWVk4Rk44','base64').toString();

  if (!RESEND_API_KEY) {
    // Dev mode — log the link
    console.log(`\n🔗 MAGIC LINK for ${email}:\n${link}\n`);
    return true;
  }

  const emailBody = JSON.stringify({
    from: 'Cracked <onboarding@resend.dev>',
    to: [email],
    subject: 'Your Cracked login link',
    html: `
      <div style="font-family: 'Space Mono', monospace; max-width: 500px; margin: 40px auto; padding: 40px; background: #111; color: #F8F7F3;">
        <h1 style="font-family: 'Rock Salt', cursive; font-size: 28px; color: #FFE566; margin-bottom: 8px;">Cracked★</h1>
        <p style="color: #99978F; font-size: 12px; margin-bottom: 32px;">AI CREATIVE INTELLIGENCE</p>
        <p style="margin-bottom: 24px;">Click the link below to sign in. It expires in 15 minutes.</p>
        <a href="${link}" style="display: inline-block; background: #FFE566; color: #111; padding: 14px 28px; font-weight: 700; text-decoration: none; font-size: 14px;">CRACK THE BRIEF →</a>
        <p style="margin-top: 32px; color: #99978F; font-size: 11px;">If you didn't request this, ignore this email.</p>
      </div>
    `,
  });

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(emailBody),
      },
    }, (res) => {
      res.on('data', () => {});
      res.on('end', () => resolve(res.statusCode < 300));
    });
    req.on('error', () => resolve(false));
    req.write(emailBody);
    req.end();
  });
}

// ── Route handlers ────────────────────────────────────────────────────────────

// POST /api/auth/request-link — send magic link
async function requestLink(req, res) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    try {
      const { email } = JSON.parse(body);
      if (!email || !email.includes('@')) {
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ error: 'Valid email required' }));
        return;
      }

      const emailLower = email.toLowerCase().trim();

      // Upsert user
      await supabase('POST', 'users?on_conflict=email', {
        email: emailLower,
        credits_remaining: 10,
      });

      // Create magic link token
      const tokenRes = await supabase('POST', 'magic_links', { email: emailLower });
      const token = tokenRes.data?.[0]?.token;

      if (!token) throw new Error('Failed to create magic link');

      await sendMagicLinkEmail(emailLower, token);

      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ ok: true, message: 'Check your email for a login link.' }));
    } catch (err) {
      console.error('requestLink error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ error: 'Something went wrong' }));
    }
  });
}

// GET /api/auth/verify?token=xxx — verify magic link, create session
async function verifyLink(req, res) {
  try {
    const url = new URL(req.url, 'http://localhost');
    const token = url.searchParams.get('token');
    if (!token) throw new Error('No token');

    // Find and validate magic link
    const linkRes = await supabase('GET',
      `magic_links?token=eq.${token}&used=eq.false&select=*`);
    const link = linkRes.data?.[0];

    if (!link) {
      res.writeHead(302, { Location: '/login.html?error=invalid' });
      res.end();
      return;
    }

    if (new Date(link.expires_at) < new Date()) {
      res.writeHead(302, { Location: '/login.html?error=expired' });
      res.end();
      return;
    }

    // Mark link as used
    await supabase('PATCH', `magic_links?id=eq.${link.id}`, { used: true });

    // Get user
    const userRes = await supabase('GET', `users?email=eq.${link.email}&select=*`);
    const user = userRes.data?.[0];
    if (!user) throw new Error('User not found');

    // Create session
    const sessionRes = await supabase('POST', 'sessions', { user_id: user.id });
    const session = sessionRes.data?.[0];
    if (!session) throw new Error('Failed to create session');

    // Set cookie and redirect to app
    res.writeHead(302, {
      'Set-Cookie': `cracked_session=${session.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`,
      'Location': '/app.html',
    });
    res.end();
  } catch (err) {
    console.error('verifyLink error:', err);
    res.writeHead(302, { Location: '/login.html?error=failed' });
    res.end();
  }
}

// GET /api/auth/session — return current user info (called by app on load)
async function getSession(req, res) {
  try {
    const cookie = req.headers.cookie || '';
    const match = cookie.match(/cracked_session=([^;]+)/);
    const token = match?.[1];

    if (!token) {
      res.writeHead(401, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ authenticated: false }));
      return;
    }

    // Validate session
    const sessionRes = await supabase('GET',
      `sessions?token=eq.${token}&select=*,users(*)&expires_at=gt.${new Date().toISOString()}`);
    const session = sessionRes.data?.[0];

    if (!session || !session.users) {
      res.writeHead(401, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ authenticated: false }));
      return;
    }

    const user = session.users;
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({
      authenticated: true,
      email: user.email,
      credits: user.credits_remaining,
      isPro: user.is_pro,
    }));
  } catch (err) {
    console.error('getSession error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ authenticated: false }));
  }
}

// POST /api/auth/logout
async function logout(req, res) {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/cracked_session=([^;]+)/);
  const token = match?.[1];

  if (token) {
    await supabase('DELETE', `sessions?token=eq.${token}`).catch(() => {});
  }

  res.writeHead(302, {
    'Set-Cookie': 'cracked_session=; Path=/; Max-Age=0',
    'Location': '/login.html',
  });
  res.end();
}

// ── Middleware: check session before serving app.html ────────────────────────
async function requireAuth(req, res, next) {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/cracked_session=([^;]+)/);
  const token = match?.[1];

  if (!token) {
    res.writeHead(302, { Location: '/login.html' });
    res.end();
    return;
  }

  const sessionRes = await supabase('GET',
    `sessions?token=eq.${token}&select=id,expires_at&expires_at=gt.${new Date().toISOString()}`);

  if (!sessionRes.data?.[0]) {
    res.writeHead(302, { Location: '/login.html' });
    res.end();
    return;
  }

  next();
}

// ── Deduct a credit ──────────────────────────────────────────────────────────
async function deductCredit(req, res, next) {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/cracked_session=([^;]+)/);
  const token = match?.[1];

  if (!token) {
    res.writeHead(401, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ error: 'Not authenticated' }));
    return;
  }

  // Get user via session
  const sessionRes = await supabase('GET',
    `sessions?token=eq.${token}&select=user_id,users(id,credits_remaining,is_pro)&expires_at=gt.${new Date().toISOString()}`);
  const session = sessionRes.data?.[0];
  const user = session?.users;

  if (!user) {
    res.writeHead(401, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ error: 'Not authenticated' }));
    return;
  }

  // Pro users have unlimited credits
  if (user.is_pro) {
    next();
    return;
  }

  if (user.credits_remaining <= 0) {
    res.writeHead(402, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({
      error: 'No credits remaining',
      upgradeUrl: '/upgrade.html',
    }));
    return;
  }

  // Deduct 1 credit
  await supabase('PATCH', `users?id=eq.${user.id}`, {
    credits_remaining: user.credits_remaining - 1,
  });

  next();
}

module.exports = { requestLink, verifyLink, getSession, logout, requireAuth, deductCredit };
