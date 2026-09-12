import { drawKnowledgeArchive } from './knowledge-archive.mjs';

// Only visible art runs; reduced motion starts with the complete static SVG.
const canvas = document.querySelector('[data-knowledge-archive]');
if (canvas && !document.documentElement.classList.contains('motion-preview-enabled')) {
  const field = canvas.closest('.hero-flow');
  const opening = field.closest('.home-opening');
  const ctx = canvas.getContext('2d', { alpha: false });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 600px)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let playing = !reduced.matches, useCanvas = playing;
  let width = 0, height = 0, visible = false, time = 4, frame = 0, last = 0;
  const pointer = { x: 360, y: 230, strength: 0 };
  const target = { ...pointer };

  function draw() {
    if (!ctx || !width || !height || !useCanvas) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#092f35';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const scale = Math.min(canvas.width / 720, canvas.height / 460);
    ctx.setTransform(scale, 0, 0, scale, (canvas.width - 720 * scale) / 2, (canvas.height - 460 * scale) / 2);
    drawKnowledgeArchive(ctx, time, { compact: compact.matches, pointer });
    field.classList.add('is-ready');
  }

  function schedule() {
    const run = ctx && playing && !document.hidden && visible;
    if (run && !frame) frame = requestAnimationFrame(tick);
    if (!run && frame) { cancelAnimationFrame(frame); frame = 0; }
    if (!run) last = 0;
  }

  function tick(now) {
    frame = 0;
    if (!last) last = now;
    const delta = now - last;
    if (delta >= 1000 / 30 - 1) {
      const step = Math.min(delta, 80);
      time += step / 1000;
      const follow = 1 - Math.exp(-step / 110);
      for (const key of ['x', 'y', 'strength']) pointer[key] += (target[key] - pointer[key]) * follow;
      last = now;
      draw();
    }
    schedule();
  }

  function clearPointer() { target.strength = 0; }

  function setPlaying(value) {
    playing = value;
    clearPointer();
    if (playing) {
      useCanvas = true;
      pointer.strength = 0;
      draw();
    }
    schedule();
  }

  function movePointer(event) {
    if (!playing || reduced.matches || !finePointer.matches || event.pointerType === 'touch' || event.target.closest('a, button, .hero-copy, .home-affiliation')) {
      clearPointer();
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / 720, rect.height / 460);
    if (!scale) return;
    target.x = (event.clientX - rect.left - (rect.width - 720 * scale) / 2) / scale;
    target.y = (event.clientY - rect.top - (rect.height - 460 * scale) / 2) / scale;
    target.strength = target.x > 80 && target.x < 700 && target.y > 0 && target.y < 460 ? 1 : 0;
    if (pointer.strength < 0.01) { pointer.x = target.x; pointer.y = target.y; }
  }

  if (ctx) {
    new ResizeObserver(entries => {
      ({ width, height } = entries[0].contentRect);
      const ratio = Math.min(devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(width * ratio)) canvas.width = Math.round(width * ratio);
      if (canvas.height !== Math.round(height * ratio)) canvas.height = Math.round(height * ratio);
      draw();
      schedule();
    }).observe(canvas);
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      schedule();
    }, { threshold: 0.01 }).observe(field);
    document.addEventListener('visibilitychange', () => {
      clearPointer();
      schedule();
    });
    reduced.addEventListener('change', () => setPlaying(!reduced.matches));
    compact.addEventListener('change', draw);
    finePointer.addEventListener('change', clearPointer);
    opening.addEventListener('pointermove', movePointer, { passive: true });
    opening.addEventListener('pointerleave', clearPointer);
    window.addEventListener('blur', clearPointer);
  }
}
