const express = require('express');
const supabase = require('../lib/supabase');
const { requireAuth } = require('../middleware/security');
const router = express.Router();

router.get('/stats', async (req, res) => {
  const { data, error } = await supabase
    .from('site_stats')
    .select('total_hits, total_users')
    .single();
  if (error) return res.status(500).json({ error: 'Failed to fetch stats' });
  res.json(data);
});

router.get('/me', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, discord_id, username, avatar, roblox_username, webhook_url, created_at')
    .eq('id', req.session.user.id)
    .single();
  if (error) return res.status(500).json({ error: 'Failed to fetch user' });
  res.json(data);
});

router.post('/me/update', requireAuth, async (req, res) => {
  const allowed = ['roblox_username', 'webhook_url'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Nothing to update' });
  }
  updates.updated_at = new Date().toISOString();
  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', req.session.user.id);
  if (error) return res.status(500).json({ error: 'Update failed' });
  res.json({ success: true });
});

module.exports = router;
