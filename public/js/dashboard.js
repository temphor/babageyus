(function() {
  function animCount(el, target, ms) {
    var v = 0;
    var step = target / (ms / 16);
    var t = setInterval(function() {
      v = Math.min(v + step, target);
      el.textContent = Math.round(v).toLocaleString();
      if (v >= target) clearInterval(t);
    }, 16);
  }

  function avatarUrl(discordId, avatarHash) {
    if (!avatarHash) return 'https://cdn.discordapp.com/embed/avatars/0.png';
    return 'https://cdn.discordapp.com/avatars/' + discordId + '/' + avatarHash + '.png?size=128';
  }

  function showSaveMsg(text, type) {
    var el = document.getElementById('saveMsg');
    if (!el) return;
    el.textContent = text;
    el.className = 'save-msg ' + type;
    el.style.display = 'block';
    setTimeout(function() { el.style.display = 'none'; }, 3000);
  }

  function saveField(field, value) {
    var body = {};
    body[field] = value;
    return fetch('/api/me/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body)
    }).then(function(r) { return r.json(); });
  }

  fetch('/auth/me', { credentials: 'same-origin' })
    .then(function(r) {
      if (!r.ok) { window.location.href = '/'; return null; }
      return r.json();
    })
    .then(function(session) {
      if (!session) return;

      var greeting = document.getElementById('dashGreeting');
      var navUsername = document.getElementById('navUsername');
      var navAvatar = document.getElementById('navAvatar');

      if (greeting) greeting.textContent = 'hey, ' + session.username;
      if (navUsername) navUsername.textContent = session.username;

      return fetch('/api/me', { credentials: 'same-origin' })
        .then(function(r) { return r.json(); })
        .then(function(user) {
          var url = avatarUrl(user.discord_id, user.avatar);

          if (navAvatar) navAvatar.src = url;

          var pcAvatar = document.getElementById('pcAvatar');
          var pcName = document.getElementById('pcName');
          var pcId = document.getElementById('pcId');
          if (pcAvatar) pcAvatar.src = url;
          if (pcName) pcName.textContent = user.username;
          if (pcId) pcId.textContent = user.discord_id;

          var icDiscordId = document.getElementById('icDiscordId');
          var icUsername = document.getElementById('icUsername');
          var icRoblox = document.getElementById('icRoblox');
          var icWebhook = document.getElementById('icWebhook');
          if (icDiscordId) icDiscordId.textContent = user.discord_id;
          if (icUsername) icUsername.textContent = user.username;
          if (icRoblox) icRoblox.textContent = user.roblox_username || 'not set';
          if (icWebhook) icWebhook.textContent = user.webhook_url ? user.webhook_url.slice(0, 40) + '...' : 'not set';

          var robloxInput = document.getElementById('robloxInput');
          var webhookInput = document.getElementById('webhookInput');
          if (robloxInput && user.roblox_username) robloxInput.value = user.roblox_username;
          if (webhookInput && user.webhook_url) webhookInput.value = user.webhook_url;

          var joined = document.getElementById('dJoined');
          if (joined && user.created_at) {
            joined.textContent = new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          }

          var saveRoblox = document.getElementById('saveRoblox');
          if (saveRoblox) {
            saveRoblox.addEventListener('click', function() {
              var val = robloxInput ? robloxInput.value.trim() : '';
              saveField('roblox_username', val)
                .then(function(res) {
                  if (res.success) {
                    if (icRoblox) icRoblox.textContent = val || 'not set';
                    showSaveMsg('Roblox username saved.', 'ok');
                  } else {
                    showSaveMsg('Failed to save.', 'err');
                  }
                })
                .catch(function() { showSaveMsg('Network error.', 'err'); });
            });
          }

          var saveWebhook = document.getElementById('saveWebhook');
          if (saveWebhook) {
            saveWebhook.addEventListener('click', function() {
              var val = webhookInput ? webhookInput.value.trim() : '';
              if (val && !val.startsWith('https://discord.com/api/webhooks/')) {
                showSaveMsg('Webhook must be a Discord webhook URL.', 'err');
                return;
              }
              saveField('webhook_url', val)
                .then(function(res) {
                  if (res.success) {
                    if (icWebhook) icWebhook.textContent = val ? val.slice(0, 40) + '...' : 'not set';
                    showSaveMsg('Webhook saved.', 'ok');
                  } else {
                    showSaveMsg('Failed to save.', 'err');
                  }
                })
                .catch(function() { showSaveMsg('Network error.', 'err'); });
            });
          }
        });
    })
    .catch(function() { window.location.href = '/'; });

  fetch('/api/stats')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var h = document.getElementById('dHits');
      var u = document.getElementById('dUsers');
      if (h) animCount(h, data.total_hits || 0, 1400);
      if (u) animCount(u, data.total_users || 0, 1100);
    })
    .catch(function() {});
})();
