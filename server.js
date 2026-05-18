const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors()); 
app.use(express.json());

const CLIENT_ID = process.env.XERO_CLIENT_ID;
const CLIENT_SECRET = process.env.XERO_CLIENT_SECRET;

// 1. Exchange Authorization Code for Tokens
app.post('/api/token', async (req, res) => {
  const { code, verifier, redirect_uri } = req.body;
  try {
    const response = await fetch('https://identity.xero.com/connect/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code', code, redirect_uri,
        client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code_verifier: verifier
      })
    });
    res.json(await response.json());
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. Refresh Token Route
app.post('/api/refresh', async (req, res) => {
  const { refresh_token } = req.body;
  try {
    const response = await fetch('https://identity.xero.com/connect/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'refresh_token', client_id: CLIENT_ID, client_secret: CLIENT_SECRET, refresh_token })
    });
    res.json(await response.json());
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. Secure Data Proxy
app.post('/api/xero-proxy', async (req, res) => {
  const { url, token, tenantId } = req.body;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}`, 'Xero-tenant-id': tenantId || '', 'Accept': 'application/json' }
    });
    res.json(await response.json());
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
