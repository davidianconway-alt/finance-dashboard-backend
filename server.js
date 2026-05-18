const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const CLIENT_ID = process.env.XERO_CLIENT_ID;
const CLIENT_SECRET = process.env.XERO_CLIENT_SECRET;
const REDIRECT_URI = process.env.XERO_REDIRECT_URI;
const FRONTEND_URI = '[https://davidianconway-alt.github.io/finance-dashboard/](https://davidianconway-alt.github.io/finance-dashboard/)';

// Step A: Kick off the login flow securely from the server side
app.get('/login', (req, res) => {
    const clientId = process.env.XERO_CLIENT_ID;
    // Your exact GitHub Pages URL goes here as the redirect URI
    const redirectUri = 'https://davidianconway-alt.github.io/finance-dashboard/'; 
    const scope = 'openid profile email accounting.transactions accounting.settings accounting.contacts';

    const authorizationUrl = `https://identity.xero.com/connect/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
    
    res.redirect(authorizationUrl);
});
    
    res.redirect(authorizationUrl);
});

// Step B: Xero talks directly back to your server here
app.get('/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) return res.redirect(`${FRONTEND_URI}?error=no_code`);

    try {
        // Exchange code for tokens using standard Server Basic Auth
        const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
        const tokenResponse = await fetch('[https://identity.xero.com/connect/token](https://identity.xero.com/connect/token)', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI
            })
        });

        const tokens = await tokenResponse.json();
        
        if (tokens.error) {
            return res.redirect(`${FRONTEND_URI}?error=${tokens.error}`);
        }

        // Optional: Fetch the organization name here if desired, 
        // then route back to frontend with the access key securely in tow.
        const orgName = "Connected Organisation"; 
        res.redirect(`${FRONTEND_URI}?token=${tokens.access_token}&orgName=${encodeURIComponent(orgName)}`);

    } catch (err) {
        console.error('Server callback error:', err);
        res.redirect(`${FRONTEND_URI}?error=server_fault`);
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
