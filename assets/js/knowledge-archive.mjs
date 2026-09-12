// Shared ASCII geometry for the selected homepage archive and its portfolio variants.
// Draws in a 720 × 460 space; the SVG exporter uses these same drawing commands.
const mint = '#aff1dd', apricot = '#ffc195', muted = '#c1d4cf';
const TAU = Math.PI * 2;
const fract = x => x - Math.floor(x);
const lerp = (a, b, t) => a + (b - a) * t;
const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const hash = n => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453);
const smooth = x => x * x * (3 - 2 * x);

function line(ctx, points, color = mint, alpha = 0.5, width = 0.9, closed = false) {
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(...points[i]);
  if (closed) ctx.closePath();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.globalAlpha = alpha;
  ctx.stroke();
  ctx.globalAlpha = 1;
}
function dot(ctx, p, r = 2, color = mint, alpha = 1) {
  ctx.beginPath();
  ctx.arc(p[0], p[1], r, 0, TAU);
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  ctx.fill();
  ctx.globalAlpha = 1;
}
function label(ctx, value, x, y, color = muted, size = 12, alpha = 0.85, align = 'center') {
  ctx.font = `${size}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  ctx.fillText(value, x, y);
  ctx.globalAlpha = 1;
}
function cubic(a, b, c, d, u) {
  const v = 1 - u;
  return [v ** 3 * a[0] + 3 * v * v * u * b[0] + 3 * v * u * u * c[0] + u ** 3 * d[0], v ** 3 * a[1] + 3 * v * v * u * b[1] + 3 * v * u * u * c[1] + u ** 3 * d[1]];
}
function sampled(fn, count = 80) { return Array.from({ length: count + 1 }, (_, i) => fn(i / count)); }
function trace(ctx, fn, progress, color, span = 0.075, alpha = 0.95) {
  const points = Array.from({ length: 17 }, (_, i) => fn(fract(progress - span + i / 16 * span)));
  // Never draw a straight line across the seam of a wrapping trace.
  for (let i = 1; i < points.length; i++) {
    if (Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]) < 55) line(ctx, [points[i - 1], points[i]], color, alpha * i / 16, 1.65);
  }
  dot(ctx, fn(fract(progress)), 2.3, color, alpha);
}
function project(x, y, z, cx = 360, cy = 245, scale = 1) {
  return [cx + (x - z) * 0.87 * scale, cy + (x + z) * 0.36 * scale - y * scale];
}
export const archivePoints = [];
for (let row = 0; row <= 20; row++) {
  for (let column = 0; column <= 34; column++) {
    const x = (column - 17) * 8.3, y = row * 8.2;
    const structure = row % 5 === 0 || column % 7 === 0;
    if (structure || hash(row * 43 + column) > 0.25) archivePoints.push({ x, y, z: -66, char: structure ? (row % 5 === 0 ? '=' : '|') : [':', ';', 'i', '.', '|'][Math.floor(hash(column * 19 + row) * 5)], edge: structure });
  }
  for (let column = 1; column <= 16; column++) {
    const structure = row % 5 === 0 || column % 4 === 0;
    if (structure || hash(row * 33 + column) > 0.3) archivePoints.push({ x: 141, y: row * 8.2, z: -66 + column * 8.3, char: structure ? (row % 5 === 0 ? '-' : '|') : ':', edge: structure });
  }
}
for (let row = 0; row < 12; row++) for (let column = 0; column < 25; column++) {
  if ((row + column) % 2 === 0) archivePoints.push({ x: (column - 12) * 11.5, y: 173, z: (row - 6) * 11, char: '+', edge: true });
}

// A visual record has actual image-like contents rather than a generic media icon.
// Its oblique plane matches the ASCII shelves; as it opens, the plane straightens.
function imageContent(ctx, p, seed, color, alpha, time = 0, animated = false, compact = false) {
  const chars = ['.', ':', '-', '=', '+', '*', '#'];
  const cols = compact ? 16 : 20, rows = compact ? 11 : 13;
  const panelWidth = Math.hypot(p(1, 0)[0] - p(0, 0)[0], p(1, 0)[1] - p(0, 0)[1]);
  const fontSize = Math.max(3.7, panelWidth / (cols + 2));
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const u = x / (cols - 1), v = y / (rows - 1);
    let intensity = 0;
    if (animated) {
      const centerX = 0.5 + Math.sin(time * 0.53 + seed) * 0.16;
      const centerY = 0.47 + Math.cos(time * 0.41 + seed) * 0.1;
      const r = Math.hypot((u - centerX) * 1.2, v - centerY);
      intensity = Math.max(0, Math.cos(r * 20 - time * 0.5)) * Math.max(0, 1 - r * 1.7);
    } else if (seed % 3 === 0) {
      const mountain = 0.38 + Math.abs(u - 0.35) * 0.62 + 0.08 * Math.sin(u * 14);
      const hill = 0.55 + Math.abs(u - 0.76) * 0.45;
      intensity = v > mountain ? 0.62 + 0.25 * Math.sin(v * 16 + u * 7) : v > hill ? 0.44 : 0.06;
      if (Math.hypot(u - 0.79, (v - 0.22) * 0.73) < 0.09) intensity = 0.9;
    } else if (seed % 3 === 1) {
      const stem = 0.48 + Math.sin(v * 3.5) * 0.07;
      intensity = Math.abs(u - stem) < 0.032 ? 0.9 : 0;
      for (let leaf = 0; leaf < 5; leaf++) {
        const side = leaf % 2 ? 1 : -1;
        const lx = stem + side * 0.15, ly = 0.2 + leaf * 0.135;
        const leafR = ((u - lx) / 0.17) ** 2 + ((v - ly + side * (u - lx) * 0.7) / 0.09) ** 2;
        if (leafR < 1) intensity = Math.max(intensity, 0.4 + (1 - leafR) * 0.6);
      }
    } else {
      for (let cell = 0; cell < 6; cell++) {
        const cx = 0.15 + hash(cell + 80) * 0.7, cy = 0.18 + hash(cell + 30) * 0.65;
        const r = Math.hypot((u - cx) * 0.8, v - cy);
        const size = 0.08 + hash(cell) * 0.07;
        intensity = Math.max(intensity, Math.max(0, 1 - Math.abs(r - size) * 27) * 0.85);
        if (r < size * 0.3) intensity = 0.8;
      }
    }
    if (intensity > 0.13) {
      const a = p(0.08 + u * 0.84, 0.09 + v * 0.82);
      const char = chars[Math.min(chars.length - 1, Math.floor(intensity * chars.length))];
      label(ctx, char, ...a, color, fontSize, alpha * (0.55 + intensity * 0.45));
    }
  }
  if (compact && seed % 3 === 0) {
    line(ctx, [p(0.08, 0.8), p(0.35, 0.32), p(0.64, 0.8)], color, alpha * 0.72, 1.2);
    line(ctx, [p(0.49, 0.74), p(0.7, 0.46), p(0.93, 0.82)], color, alpha * 0.6, 1);
    line(ctx, sampled(u => p(0.78 + Math.cos(u * TAU) * 0.055, 0.23 + Math.sin(u * TAU) * 0.08), 24), color, alpha * 0.75, 1);
  } else if (compact && seed % 3 === 1) {
    line(ctx, sampled(u => p(0.5 + Math.sin(u * 3.5) * 0.04, 0.12 + u * 0.78), 24), color, alpha * 0.85, 1.1);
    for (let leaf = 0; leaf < 5; leaf++) {
      const side = leaf % 2 ? 1 : -1, y = 0.2 + leaf * 0.135;
      line(ctx, sampled(u => p(0.53 + side * Math.sin(u * Math.PI) * 0.26, y + u * 0.11), 20), color, alpha * 0.7, 1.1);
    }
  }
}

function mediaRecord(ctx, { x, y, width, height, tilt = 0, kind, seed = 0, color = mint, alpha = 1, compact = false, emphasis = 0 }, time) {
  const p = (u, v) => [x + u * width, y + v * height + u * tilt];
  line(ctx, [p(0, 0), p(1, 0), p(1, 1), p(0, 1)], color, alpha * (0.65 + emphasis * 0.2), 0.75, true);
  if (kind === 'image') {
    imageContent(ctx, p, seed, color, alpha, time, false, compact);
  } else if (kind === 'film') {
    const frameCount = width > 145 ? 3 : 2;
    for (let slot = 0; slot < Math.floor(width / 10); slot++) {
      for (const edge of [0.025, 0.94]) line(ctx, [p(slot * 10 / width + 0.02, edge), p(slot * 10 / width + 0.06, edge)], color, alpha * 0.8, 1.8);
    }
    for (let frame = 0; frame < frameCount; frame++) {
      const left = (frame + 0.07) / frameCount;
      const right = (frame + 0.93) / frameCount;
      const fp = (u, v) => p(lerp(left, right, u), 0.13 + v * 0.74);
      line(ctx, [fp(0, 0), fp(1, 0), fp(1, 1), fp(0, 1)], color, alpha * 0.24, 0.6, true);
      // A continuous contour evolving through successive temporal samples.
      for (let curve = 0; curve < 6; curve++) {
        const radius = 0.07 + curve * 0.059;
        const phase = time * 0.37 - frame * 0.55 + seed;
        line(ctx, sampled(u => {
          const angle = u * TAU;
          const distortion = 1 + Math.sin(angle * 3 + phase) * 0.17;
          return fp(0.5 + Math.cos(angle) * radius * distortion, 0.5 + Math.sin(angle) * radius * distortion * 1.07);
        }, 30), color, alpha * (0.35 + curve * 0.08), 0.7);
      }
    }
  } else if (kind === 'sound') {
    line(ctx, [p(0.06, 0.5), p(0.94, 0.5)], color, alpha * 0.25, 0.6);
    for (let i = 0; i < 42; i++) {
      const u = i / 41;
      const envelope = Math.sin(u * Math.PI) * (0.35 + 0.65 * Math.sin(u * 5.4 - time * 0.6) ** 2);
      const amplitude = envelope * (0.09 + hash(i) * 0.31);
      line(ctx, [p(0.07 + u * 0.86, 0.5 - amplitude), p(0.07 + u * 0.86, 0.5 + amplitude)], color, alpha * 0.8, 0.9);
    }
  } else {
    const nodes = Array.from({ length: 12 }, (_, i) => p(0.13 + hash(i + 41) * 0.74, 0.16 + hash(i + 71) * 0.68));
    for (let i = 0; i < nodes.length; i++) {
      const neighbor = nodes[(i + 5) % nodes.length];
      line(ctx, [nodes[i], neighbor], color, alpha * 0.42, 0.65);
      dot(ctx, nodes[i], 1.4 + (i % 3) * 0.4, color, alpha * 0.85);
    }
  }
}

const mediaLayouts = {
  images: [
    { x: -132, y: 157, w: 88, h: 61, kind: 'image', seed: 0, to: [429, 59] },
    { x: -27, y: 157, w: 84, h: 61, kind: 'image', seed: 1, to: [559, 154] },
    { x: 75, y: 129, w: 63, h: 52, kind: 'image', seed: 2, to: [575, 270] },
    { x: -120, y: 72, w: 121, h: 61, kind: 'image', seed: 2, to: [351, 274] },
    { x: 22, y: 68, w: 100, h: 62, kind: 'image', seed: 0, to: [473, 357] }
  ],
  moving: [
    { x: -132, y: 150, w: 266, h: 66, kind: 'film', seed: 0, to: [367, 72] },
    { x: -124, y: 65, w: 119, h: 55, kind: 'film', seed: 1, to: [400, 242] },
    { x: 18, y: 67, w: 117, h: 57, kind: 'film', seed: 2, to: [536, 337] }
  ],
  mixed: [
    { x: -132, y: 151, w: 98, h: 71, kind: 'image', seed: 1, to: [403, 68] },
    { x: -12, y: 151, w: 147, h: 71, kind: 'film', seed: 0, to: [533, 157] },
    { x: -120, y: 60, w: 116, h: 43, kind: 'sound', seed: 0, to: [375, 284] },
    { x: 20, y: 65, w: 110, h: 55, kind: 'diagram', seed: 0, to: [537, 332] }
  ]
};

function mediaArchive(ctx, t, variant, options = {}) {
  const compact = options.compact || false;
  const pointer = options.pointer;
  const attention = (x, y, radius) => pointer?.strength > 0.001 ? pointer.strength * smooth(Math.max(0, 1 - Math.hypot(x - pointer.x, y - pointer.y) / radius)) : 0;
  const open = variant === 'open';
  const config = mediaLayouts[open ? 'mixed' : variant];
  const opening = (open ? 0.64 : 0.19) + (open ? 0.2 : 0.54) * (0.5 + 0.5 * Math.sin(t * 0.2 - 0.15));
  const cx = open ? 215 : 245, cy = 305, scale = 1.04;
  const projectPoint = (x, y, z) => project(x, y, z, cx, cy, scale);
  for (let i = 0; i < archivePoints.length; i++) {
    const point = archivePoints[i];
    // Leave quiet windows for visual records in the face of the archive.
    if (point.z === -66 && config.some(m => point.x > m.x - 5 && point.x < m.x + m.w + 5 && point.y < m.y + 5 && point.y > m.y - m.h - 5)) continue;
    const base = projectPoint(point.x, point.y, point.z);
    const loosen = smooth(Math.max(0, (point.x + 80) / 221)) * opening;
    const amount = loosen * (point.edge ? 0.34 : 1);
    const drift = [base[0] + 108 + hash(i + 500) * 160, base[1] + Math.sin(i * 0.6 + t * 0.22) * 58 - 15];
    const at = mix(base, drift, amount);
    const nearby = attention(at[0], at[1], 95);
    if (nearby) {
      at[0] += (pointer.x - at[0]) * nearby * 0.045;
      at[1] += (pointer.y - at[1]) * nearby * 0.045;
    }
    const character = amount > 0.48 ? ['.', ':', '+', '/', '*', '{', '}'][Math.floor(hash(i * 3 + Math.floor(t * 0.5)) * 7)] : point.char;
    label(ctx, character, ...at, amount > 0.48 ? apricot : mint, point.edge ? 9.5 : 9, (point.edge ? 0.59 : 0.25 + hash(i) * 0.29) + nearby * 0.22);
  }
  config.forEach((media, index) => {
    // Three larger, distinct image subjects are clearer than five miniature ones on phones.
    if (compact && variant === 'images' && index > 2) return;
    const base = projectPoint(media.x, media.y, -66);
    const amount = Math.min(1, opening * (0.63 + index * 0.08));
    const target = [media.to[0] + Math.sin(t * 0.17 + index) * 8, media.to[1] + Math.cos(t * 0.21 + index) * 6];
    let at = mix(base, target, amount);
    let width = media.w * 0.87 * scale;
    let height = media.h * scale;
    let tilt = media.w * 0.36 * scale * (1 - amount);
    if (compact) {
      const layouts = variant === 'images' ? [[228, 48, 176, 119], [458, 180, 169, 119], [269, 307, 184, 120]] : variant === 'moving' ? [[256, 69, 348, 110], [202, 246, 218, 112], [448, 326, 213, 106]] : [[233, 46, 184, 130], [427, 179, 236, 104], [212, 286, 194, 96], [479, 324, 166, 106]];
      const layout = layouts[index];
      at = [layout[0] + Math.sin(t * 0.18 + index) * 7, layout[1] + Math.cos(t * 0.16 + index) * 5];
      width = layout[2];
      height = layout[3];
      tilt = open ? 0 : 9;
    }
    // Individual records respond to attention; the archive's overall scale stays fixed.
    const center = [at[0] + width / 2, at[1] + height / 2 + tilt / 2];
    const emphasis = attention(...center, 110);
    if (emphasis) {
      at[0] += Math.max(-6, Math.min(6, (pointer.x - center[0]) * 0.12)) * emphasis;
      at[1] += Math.max(-5, Math.min(5, (pointer.y - center[1]) * 0.12)) * emphasis;
      tilt *= 1 - emphasis * 0.18;
    }
    if (open) {
      const path = u => cubic([base[0] + width / 2, base[1] + height / 2], [base[0] + width / 2 + 50, base[1] + height / 2], [at[0] - 30, at[1] + height / 2], [at[0], at[1] + height / 2], u);
      line(ctx, sampled(path, 30), mint, 0.24, 0.7);
      trace(ctx, path, fract(t / 24 + index * 0.23), apricot, 0.06, 0.6);
    }
    mediaRecord(ctx, { x: at[0], y: at[1], width, height, tilt, kind: media.kind, seed: media.seed, color: index % 2 || open ? apricot : mint, alpha: compact ? 1 : 0.92 + emphasis * 0.08, compact, emphasis }, t + index * 0.6);
  });
}

export function drawKnowledgeArchive(ctx, time = 4, options = {}) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  mediaArchive(ctx, time, options.variant || 'images', options);
  ctx.globalAlpha = 1;
}
