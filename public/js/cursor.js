(function() {
  const cursor = document.getElementById('cursor');
  const ring = document.getElementById('cursorRing');
  if (!cursor || !ring) return;

  let rx = 0, ry = 0;

  document.addEventListener('mousemove', function(e) {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
  });

  document.querySelectorAll('a, button, input, .d-card, .stat-box').forEach(function(el) {
    el.addEventListener('mouseenter', function() {
      cursor.style.width = '16px';
      cursor.style.height = '16px';
      ring.style.width = '46px';
      ring.style.height = '46px';
      ring.style.opacity = '0.75';
    });
    el.addEventListener('mouseleave', function() {
      cursor.style.width = '10px';
      cursor.style.height = '10px';
      ring.style.width = '34px';
      ring.style.height = '34px';
      ring.style.opacity = '0.45';
    });
  });

  function animRing() {
    const cx = parseFloat(cursor.style.left) || 0;
    const cy = parseFloat(cursor.style.top) || 0;
    rx += (cx - rx) * 0.1;
    ry += (cy - ry) * 0.1;
    ring.style.left = rx + 'px';
    ring.style.top = ry + 'px';
    requestAnimationFrame(animRing);
  }
  animRing();
})();
