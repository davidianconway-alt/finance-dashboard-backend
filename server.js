const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();

// Enable CORS so your GitHub Pages frontend can talk to this backend 
app.use(cors()); 
app.use(express.json());

// These will be securely loaded from Render's environment variables
const CLIENT_ID = process.env.XERO_CLIENT_ID;
const CLIENT_SECRET = process.env.XERO_CLIENT_SECRET;

// ROUTE 1: SECURE TOKEN EXCHANGE
app.post('/api/token', async (req, res) => {
  const { code, verifier, redirect_uri } = req.body;

  try {
    const response = await fetch('https://identity.xero.com/connect/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirect_uri,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET, // Hidden safely on the server
        code_verifier: verifier
      })
    });
    
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ROUTE 2: THE API CORS PROXY
app.post('/api/xero-proxy', async (req, res) => {
  const { url, token, tenantId } = req.body;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Xero-tenant-id': tenantId || '',
        'Accept': 'application/json'
      }
    });
    
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start the server on whatever port Render provides, or 3000 locally
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
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
