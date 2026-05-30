/* Qiymat — Confetti
 * Lightweight, dependency-free, GPU-friendly confetti effect.
 */
(function (global) {
  'use strict';

  let canvas, ctx, raf, particles = [];
  const COLORS = ['#10a35b', '#2563eb', '#7c3aed', '#ea580c', '#e11d48', '#f59e0b', '#06b6d4'];

  function ensureCanvas() {
    if (canvas) return;
    canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  }

  function resize() {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.scale(dpr, dpr);
  }

  function spawn(count, originX, originY) {
    const w = window.innerWidth;
    const ox = originX != null ? originX : w / 2;
    const oy = originY != null ? originY : window.innerHeight / 3;
    for (let i = 0; i < count; i++) {
      const angle = (Math.random() * Math.PI * 2);
      const speed = 8 + Math.random() * 10;
      particles.push({
        x: ox,
        y: oy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 6,
        g: 0.32 + Math.random() * 0.12,
        size: 4 + Math.random() * 6,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        life: 0,
        ttl: 90 + Math.random() * 50,
        shape: Math.random() < 0.5 ? 'rect' : 'circ',
      });
    }
  }

  function tick() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life++;
      p.vy += p.g;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      const alpha = Math.max(0, 1 - p.life / p.ttl);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      if (p.life > p.ttl || p.y > window.innerHeight + 40) particles.splice(i, 1);
    }
    if (particles.length > 0) raf = requestAnimationFrame(tick);
    else stop();
  }

  function stop() {
    cancelAnimationFrame(raf);
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function fire(opts = {}) {
    ensureCanvas();
    const count = opts.count || 90;
    spawn(count, opts.x, opts.y);
    if (!raf || particles.length === count) {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    }
  }

  // School of fish — fire from a button click position
  function fireFromEvent(ev, opts = {}) {
    fire({ ...opts, x: ev.clientX, y: ev.clientY });
  }

  global.Confetti = { fire, fireFromEvent };
})(window);
