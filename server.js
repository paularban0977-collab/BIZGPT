// BizGPT backend with Facebook Login verification and API auth (JWT + server API key)
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const OpenAI = require('openai');
const fetch = (...args) => import('node-fetch').then(m => m.default(...args));
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// secrets from .env
const BIZGPT_API_KEY = process.env.BIZGPT_API_KEY || 'dev_key';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';
const FB_APP_ID = process.env.FACEBOOK_APP_ID;
const FB_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

app.use(cors());
app.use(bodyParser.json());

// Middleware: allow if valid JWT OR x-api-key header matches server key
function authMiddleware(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (apiKey && apiKey === BIZGPT_API_KEY) return next();

  const auth = req.headers['authorization'];
  if (!auth) return res.status(401).json({ error: 'Missing credentials' });
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Invalid auth format' });

  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // optional: attach user info
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Endpoint: verify FB token and issue JWT
// Client sends { access_token }
app.post('/api/auth/facebook', async (req, res) => {
  const { access_token } = req.body;
  if (!access_token) return res.status(400).json({ error: 'Missing access_token' });
  if (!FB_APP_ID || !FB_APP_SECRET) return res.status(500).json({ error: 'FB app credentials not configured on server' });

  try {
    // Verify token via Facebook debug_token endpoint using app access token
    const appAccessToken = `${FB_APP_ID}|${FB_APP_SECRET}`;
    const debugUrl = `https://graph.facebook.com/debug_token?input_token=${access_token}&access_token=${appAccessToken}`;
    const debugResp = await fetch(debugUrl);
    const debugJson = await debugResp.json();
    if (!debugJson.data || !debugJson.data.is_valid) {
      return res.status(401).json({ error: 'Invalid Facebook token', details: debugJson });
    }

    // Optionally fetch user info (name, email)
    const meUrl = `https://graph.facebook.com/me?fields=id,name,email&access_token=${access_token}`;
    const meResp = await fetch(meUrl);
    const meJson = await meResp.json();

    // Issue our own JWT (short-lived)
    const payload = { provider: 'facebook', id: meJson.id, name: meJson.name, email: meJson.email };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '6h' });

    return res.json({ token, user: payload });
  } catch (err) {
    console.error('FB verify error', err);
    return res.status(500).json({ error: 'Facebook verification failed' });
  }
});

// Protected endpoint: generate content (requires authMiddleware)
app.post('/api/generate', authMiddleware, async (req, res) => {
  const { mode, prompt } = req.body;
  try {
    const system = `You are BizGPT, an assistant that ONLY provides business, research and feasibility outputs. Mode: ${mode}`;
    const chat = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt }
      ],
      max_tokens: 900
    });
    const text = chat.choices?.[0]?.message?.content || 'No response from model';
    res.json({ output: text });
  } catch (err) {
    console.error('OpenAI error', err);
    res.status(500).json({ output: 'Error generating content.' });
  }
});

app.get('/', (req, res) => res.send('BizGPT backend is running'));

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
