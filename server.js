const express  = require('express');
const cors     = require('cors');
const fetch    = require('node-fetch');

const app = express();
app.use(express.json());

// Allow requests from GitHub Pages frontend
app.use(cors({
  origin: 'https://davidianconway-alt.github.io',
  credentials: true
}));

// ── CONFIG ────────────────────────────────────────────────────
const CLIENT_ID     = '5E197D833633444883E0B870D34C01C6';
const CLIENT_SECRET = 'hNI0DlIPK4z1Fc0aipAB9VpNIOAQnwbmvrD24LYrAUfmzAuh';
const REDIRECT_URI  = 'https://davidianconway-alt.github.io/finance-dashboard/';

// ── TOKEN EXCHANGE ────────────────────────────────────────────
// Frontend sends the auth code and PKCE verifier
// We exchange for tokens server-side (secret never exposed to browser)

app.post('/auth/token', async (req, res) => {
  try {
    const { code, code_verifier } = req.body;

    if (!code) return res.status(400).json({ error: 'Missing code' });

    const params = new URLSearchParams({
  grant_type:    'authorization_code',
  code:           code,
  redirect_uri:   REDIRECT_URI,
  client_id:      CLIENT_ID,
  code_verifier:  code_verifier || ''
});

    const response = await fetch('https://identity.xero.com/connect/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    params.toString()
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Token exchange error:', data);
      return res.status(response.status).json(data);
    }

    res.json(data);

  } catch (err) {
    console.error('Token exchange failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── XERO API PROXY ────────────────────────────────────────────
// Frontend sends the target URL, token and tenantId
// We make the actual Xero API call and return the result

app.post('/api/xero-proxy', async (req, res) => {
  try {
    const { url, token, tenantId } = req.body;

    if (!url || !token) return res.status(400).json({ error: 'Missing url or token' });

    const headers = {
      'Authorization':  'Bearer ' + token,
      'Accept':         'application/json',
      'Content-Type':   'application/json'
    };

    if (tenantId) headers['Xero-tenant-id'] = tenantId;

    const response = await fetch(url, { headers });

    if (!response.ok) {
      const text = await response.text();
      console.error('Xero API error:', response.status, text.substring(0, 200));
      return res.status(response.status).json({ error: text });
    }

    const data = await response.json();
    res.json(data);

  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET TENANTS ───────────────────────────────────────────────
// Connections endpoint uses a different base URL

app.post('/api/connections', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) return res.status(400).json({ error: 'Missing token' });

    const response = await fetch('https://api.xero.com/connections', {
      headers: {
        'Authorization': 'Bearer ' + token,
        'Accept':        'application/json'
      }
    });

    const data = await response.json();
    res.json(data);

  } catch (err) {
    console.error('Connections error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── HEALTH CHECK ──────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Finance Dashboard Backend' });
});

// ── START ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});
