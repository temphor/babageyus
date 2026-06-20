require('dotenv').config();
const express = require('express');
const axios = require('axios');
const supabase = require('../lib/supabase');
const { authLimiter } = require('../middleware/security');
const router = express.Router();

const DISCORD_API = 'https://discord.com/api/v10';

router.get('/discord', authLimiter, (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    redirect_uri: process.env.DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: 'identify email guilds.join',
  });
  res.redirect(`https://discord.com/oauth2/authorize?${params}`);
});

router.get('/discord/callback', authLimiter, async (req, res) => {
  const { code } = req.query;
  if (!code) return res.redirect('/?error=no_code');

  try {
    const tokenRes = await axios.post(
      `${DISCORD_API}/oauth2/token`,
      new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token, refresh_token, expires_in } = tokenRes.data;

    const userRes = await axios.get(`${DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const d = userRes.data;

    const { data: user, error } = await supabase
      .from('users')
      .upsert({
        discord_id: d.id,
        username: d.username,
        avatar: d.avatar,
        email: d.email || null,
        discord_access_token: access_token,
        discord_refresh_token: refresh_token,
        token_expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'discord_id' })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error.message);
      return res.redirect('/?error=db_error');
    }

    try {
      await axios.put(
        `${DISCORD_API}/guilds/${process.env.DISCORD_GUILD_ID}/members/${d.id}`,
        { access_token },
        { headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` } }
      );
    } catch (_) {}

    await supabase.rpc('increment_hits');

    req.session.user = {
      id: user.id,
      discord_id: user.discord_id,
      username: user.username,
      avatar: user.avatar,
    };

    res.redirect('/dashboard');
  } catch (err) {
    console.error('OAuth error:', err?.response?.data || err.message);
    res.redirect('/?error=oauth_failed');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

router.get('/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  res.json(req.session.user);
});

module.exports = router;
