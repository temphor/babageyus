(function() {
  var params = new URLSearchParams(window.location.search);
  var err = params.get('error');
  if (err) {
    var msg = document.getElementById('errorMsg');
    if (msg) {
      var text = {
        no_code: 'Discord did not return a code. Try again.',
        oauth_failed: 'Discord login failed. Try again.',
        db_error: 'Something went wrong saving your account.'
      }[err] || 'An error occurred. Please try again.';
      msg.textContent = text;
      msg.style.display = 'block';
    }
    window.history.replaceState({}, '', '/');
  }

  function animCount(el, target, ms) {
    var start = 0;
    var step = target / (ms / 16);
    var t = setInterval(function() {
      start = Math.min(start + step, target);
      el.textContent = Math.round(start).toLocaleString();
      if (start >= target) clearInterval(t);
    }, 16);
  }

  fetch('/api/stats')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var h = document.getElementById('statHits');
      var u = document.getElementById('statUsers');
      if (h) animCount(h, data.total_hits || 0, 1400);
      if (u) animCount(u, data.total_users || 0, 1100);
    })
    .catch(function() {});
})();
