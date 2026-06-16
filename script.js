/**
 * Desktop Shredder — script.js
 * ─────────────────────────────────────────────────────────────────────
 * Physics Engine : Matter.js 0.19 (engine + world only, no Render)
 * Renderer       : Custom Canvas2D with per-fragment texture clipping
 * Interactions   : Left-hold → Gravity Vortex | Right-click → Pulse
 * ─────────────────────────────────────────────────────────────────────
 */

'use strict';

/* ─── MATTER.JS ALIASES ────────────────────────────────────────────── */
const { Engine, Bodies, Body, Composite, Vector } = Matter;

/* ─── DOM REFERENCES ──────────────────────────────────────────────── */
const canvasContainer = document.getElementById('canvas-container');
const idleOverlay     = document.getElementById('idle-overlay');
const fileInput       = document.getElementById('file-input');
const btnUpload       = document.getElementById('btn-upload');
const btnReshatter    = document.getElementById('btn-reshatter');
const btnReset        = document.getElementById('btn-reset');
const statStatus      = document.getElementById('stat-status');
const statFragments   = document.getElementById('stat-fragments');
const statBodies      = document.getElementById('stat-bodies');

/* ─── CONFIGURATION ───────────────────────────────────────────────── */
const CFG = {
  NUM_FRAGMENTS:      88,     // Bodies created per shatter pass
  IMAGE_SCALE:        0.70,   // Max fraction of canvas the image may occupy
  IMAGE_VERT_BIAS:    0.36,   // Vertical center position (0 = top, 1 = bottom)

  VORTEX_STRENGTH:    5e-4,   // Gravitational pull coefficient
  PULSE_STRENGTH:     0.052,  // Explosive force coefficient
  PULSE_RADIUS:       680,    // Max effective pulse distance (px)

  GRAVITY_Y:          1.4,    // World gravity Y scale
  GRAVITY_SCALE:      0.001,  // Matter.js gravity multiplier

  FRAG_RESTITUTION:   0.28,
  FRAG_FRICTION:      0.10,
  FRAG_FRICTION_AIR:  0.007,
  FRAG_DENSITY:       0.0025,

  BURST_SPEED_MIN:    1.5,
  BURST_SPEED_MAX:    5.5,
  BURST_ANGULAR_MAX:  0.35,

  WALL_THICKNESS:     80,
  PHYSICS_STEP_MS:    1000 / 60,
  TELEMETRY_FREQ:     30,     // frames between status-bar refreshes
};

/* ─── APPLICATION STATE ───────────────────────────────────────────── */
const State = {
  engine:       null,   // Matter.Engine
  canvas:       null,   // <canvas> element (our renderer)
  ctx:          null,   // CanvasRenderingContext2D
  sourceCanvas: null,   // Offscreen <canvas> holding scaled image pixels
  imageBounds:  null,   // { x, y, w, h } — world-space image rect
  fragments:    [],     // Array of instrumented Matter.js Body objects
  walls:        [],     // Static boundary bodies
  rafId:        null,
  lastTime:     0,
  telemetryTick: 0,
  mouse:        { x: 0, y: 0 },
  leftHeld:     false,
  currentFile:  null,   // Held for Reshatter
};

/* ═══════════════════════════════════════════════════════════════════
   1. STATUS BAR
   ═══════════════════════════════════════════════════════════════════ */

function setStatus(el, text) {
  el.textContent = text;
  el.classList.add('updated');
  setTimeout(() => el.classList.remove('updated'), 700);
}

/* ═══════════════════════════════════════════════════════════════════
   2. ENGINE & CANVAS BOOTSTRAP
   ═══════════════════════════════════════════════════════════════════ */

function initEngine() {
  /* Physics world — no built-in renderer */
  State.engine = Engine.create({
    gravity: { x: 0, y: CFG.GRAVITY_Y, scale: CFG.GRAVITY_SCALE },
    positionIterations: 5,
    velocityIterations: 4,
    constraintIterations: 2,
  });

  /* Create and inject canvas */
  const canvas = document.createElement('canvas');
  canvas.id = 'sim-canvas';
  /*
   * position:absolute + inset:0 → fills the container (including its
   * padding regions) without fighting the CSS width/height:100% rule.
   * z-index:1 keeps it below the idle-overlay (z-index:10).
   */
  canvas.style.cssText = 'position:absolute;inset:0;z-index:1;cursor:crosshair;';
  canvasContainer.insertBefore(canvas, idleOverlay);

  State.canvas = canvas;
  State.ctx    = canvas.getContext('2d', { alpha: true });

  resizeCanvas();
  setupWalls();
  bindMouseEvents();
  startRenderLoop();

  /* Debounced resize handler */
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { resizeCanvas(); setupWalls(); }, 80);
  });
}

function resizeCanvas() {
  /* Use offsetWidth/Height — includes padding, matches visible area */
  State.canvas.width  = canvasContainer.offsetWidth  || window.innerWidth;
  State.canvas.height = canvasContainer.offsetHeight || window.innerHeight;
}

function setupWalls() {
  if (!State.engine) return;

  /* Remove previous walls */
  if (State.walls.length) {
    for (const w of State.walls) Composite.remove(State.engine.world, w);
    State.walls = [];
  }

  const W = State.canvas.width;
  const H = State.canvas.height;
  const T = CFG.WALL_THICKNESS;
  const opts = { isStatic: true, friction: 0.5, restitution: 0.3 };

  State.walls = [
    Bodies.rectangle(W / 2, H + T / 2,   W + 200, T,     opts), // floor
    Bodies.rectangle(-T / 2,    H / 2,   T,       H * 3, opts), // left wall
    Bodies.rectangle(W + T / 2, H / 2,   T,       H * 3, opts), // right wall
  ];

  Composite.add(State.engine.world, State.walls);
}

/* ═══════════════════════════════════════════════════════════════════
   3. MOUSE INTERACTIONS
   ═══════════════════════════════════════════════════════════════════ */

function bindMouseEvents() {
  const c = State.canvas;

  c.addEventListener('mousemove', (e) => {
    const r = c.getBoundingClientRect();
    State.mouse.x = e.clientX - r.left;
    State.mouse.y = e.clientY - r.top;
  });

  /* Left-hold: arm the continuous vortex */
  c.addEventListener('mousedown',  (e) => { if (e.button === 0) State.leftHeld = true;  });
  c.addEventListener('mouseup',    (e) => { if (e.button === 0) State.leftHeld = false; });
  c.addEventListener('mouseleave', ()  => { State.leftHeld = false; });

  /* Right-click: one-shot pulse */
  c.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    applyPulse(State.mouse.x, State.mouse.y);
  });
}

/**
 * Gravity Vortex — applied every frame while left button is held.
 * Force scales with 1/distance, pulling bodies toward the cursor.
 */
function applyVortex(mx, my) {
  const bodies = Composite.allBodies(State.engine.world);
  for (const b of bodies) {
    if (b.isStatic) continue;
    const dx   = mx - b.position.x;
    const dy   = my - b.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const f    = (CFG.VORTEX_STRENGTH * b.mass) / dist;
    Body.applyForce(b, b.position, { x: dx * f, y: dy * f });
  }
}

/**
 * Anti-Gravity Pulse — one-shot explosive push from the cursor.
 * Force falls off quadratically with distance within PULSE_RADIUS.
 */
function applyPulse(mx, my) {
  const R = CFG.PULSE_RADIUS;
  const S = CFG.PULSE_STRENGTH;
  for (const b of Composite.allBodies(State.engine.world)) {
    if (b.isStatic) continue;
    const dx   = b.position.x - mx;
    const dy   = b.position.y - my;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    if (dist > R) continue;
    const falloff = 1 - dist / R;           // 1 at cursor → 0 at radius edge
    const force   = S * falloff * falloff * b.mass;
    Body.applyForce(b, b.position, { x: (dx / dist) * force, y: (dy / dist) * force });
  }
}

/* ═══════════════════════════════════════════════════════════════════
   4. IMAGE INGESTION & SHARDING
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Public entry point called by both upload and drag-drop handlers.
 * Reads the File, decodes the image, then calls shatterImage().
 */
function handleImageUpload(file) {
  State.currentFile = file;
  setStatus(statStatus, 'Loading…');

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload  = () => shatterImage(img);
    img.onerror = () => setStatus(statStatus, 'Error');
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

/**
 * Core shatter function.
 * 1. Fits the image inside the canvas.
 * 2. Draws it to an offscreen source canvas for later per-fragment sampling.
 * 3. Creates NUM_FRAGMENTS irregular convex polygon bodies.
 * 4. Applies a random burst velocity to each fragment.
 */
function shatterImage(img) {
  clearSimulation();
  setStatus(statStatus, 'Shattering…');

  const cw = State.canvas.width;
  const ch = State.canvas.height;

  /* Fit image to canvas with padding */
  const fitScale = Math.min(cw / img.naturalWidth, ch / img.naturalHeight) * CFG.IMAGE_SCALE;
  const imgW     = Math.round(img.naturalWidth  * fitScale);
  const imgH     = Math.round(img.naturalHeight * fitScale);
  const ox       = (cw - imgW) / 2;
  const oy       = (ch - imgH) * CFG.IMAGE_VERT_BIAS;

  State.imageBounds = { x: ox, y: oy, w: imgW, h: imgH };

  /* Bake the (scaled) image into an offscreen canvas for texture sampling */
  const src = document.createElement('canvas');
  src.width  = imgW;
  src.height = imgH;
  src.getContext('2d').drawImage(img, 0, 0, imgW, imgH);
  State.sourceCanvas = src;

  /* --- Fragment generation ----------------------------------------- */
  const bodies = [];
  const N      = CFG.NUM_FRAGMENTS;
  const insetX = imgW * 0.04;
  const insetY = imgH * 0.04;

  for (let i = 0; i < N; i++) {
    const cx = ox + insetX + Math.random() * (imgW - 2 * insetX);
    const cy = oy + insetY + Math.random() * (imgH - 2 * insetY);
    const b  = buildFragment(cx, cy, fitScale);
    if (b) bodies.push(b);
  }

  Composite.add(State.engine.world, bodies);
  State.fragments = bodies;

  /* --- Initial burst kinematics ------------------------------------ */
  for (const b of bodies) {
    const angle = Math.random() * Math.PI * 2;
    const speed = CFG.BURST_SPEED_MIN + Math.random() * (CFG.BURST_SPEED_MAX - CFG.BURST_SPEED_MIN);
    Body.setVelocity(b, {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed * 0.65 - 1.8,   // slight upward bias
    });
    Body.setAngularVelocity(b, (Math.random() - 0.5) * CFG.BURST_ANGULAR_MAX * 2);
  }

  /* --- Activate UI ------------------------------------------------- */
  document.body.classList.add('sim-active');
  btnReshatter.disabled = false;
  btnReset.disabled     = false;
  setStatus(statStatus,    'Active');
  setStatus(statFragments, String(bodies.length));
  setStatus(statBodies,    String(Composite.allBodies(State.engine.world).length));
}

/**
 * Builds a single irregular convex polygon body centered at (cx, cy).
 *
 * Approach: evenly-spaced angles + small angular jitter → guaranteed convex
 * (angle array is monotonically increasing, so the vertex sequence is
 * counter-clockwise without self-intersections). Each radius is independently
 * randomised to produce the jagged "shard" silhouette.
 *
 * After creation, we instrument the body with:
 *   body.initX/Y      — centroid position at creation (for texture offset)
 *   body.localVerts   — vertices in body-local space (for clip path)
 */
function buildFragment(cx, cy, imageScale) {
  const numV  = 5 + Math.floor(Math.random() * 4);           // 5–8 sides
  const size  = imageScale * 58 * (0.50 + Math.random() * 0.95); // random scale

  const step  = (Math.PI * 2) / numV;
  const base  = Math.random() * Math.PI * 2;

  const verts = Array.from({ length: numV }, (_, i) => {
    const angle = base + i * step + (Math.random() - 0.5) * step * 0.55;
    const r     = size * (0.45 + Math.random() * 0.85);
    return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
  });

  const bodyOpts = {
    restitution: CFG.FRAG_RESTITUTION,
    friction:    CFG.FRAG_FRICTION,
    frictionAir: CFG.FRAG_FRICTION_AIR,
    density:     CFG.FRAG_DENSITY,
  };

  let body = null;
  try {
    body = Bodies.fromVertices(cx, cy, verts, bodyOpts);
  } catch (_) { /* decomp unavailable for this shape */ }

  /* Fallback: regular polygon (keeps simulation running if decomp fails) */
  if (!body) {
    try { body = Bodies.polygon(cx, cy, numV, size * 0.72, bodyOpts); }
    catch (_) { return null; }
  }

  /* Instrument the body for custom texture rendering */
  const px = body.position.x;
  const py = body.position.y;
  body.initX      = px;
  body.initY      = py;
  /*
   * Local vertices = world vertices minus centroid, captured at angle=0.
   * These are reused every frame as the clip path; they don't change
   * (the canvas transform handles position + rotation).
   */
  body.localVerts = body.vertices.map(v => ({
    x: v.x - px,
    y: v.y - py,
  }));

  return body;
}

/* ═══════════════════════════════════════════════════════════════════
   5. CUSTOM CANVAS RENDERER
   ═══════════════════════════════════════════════════════════════════ */

function startRenderLoop() {
  function frame(now) {
    State.rafId = requestAnimationFrame(frame);

    /* Delta-cap prevents the spiral-of-death on tab-blur/resume */
    const delta = Math.min(now - (State.lastTime || now), 34);
    State.lastTime = now;

    /* Apply continuous vortex force if left button held */
    if (State.leftHeld && State.fragments.length) {
      applyVortex(State.mouse.x, State.mouse.y);
    }

    /* Step the physics world */
    Engine.update(State.engine, delta);

    /* Clear and redraw */
    const { ctx, canvas } = State;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (State.sourceCanvas && State.fragments.length) {
      drawFragments(ctx);
    }

    /* Throttled telemetry update */
    if (++State.telemetryTick % CFG.TELEMETRY_FREQ === 0 && State.fragments.length) {
      const dynamic = Composite.allBodies(State.engine.world).filter(b => !b.isStatic);
      setStatus(statBodies, String(dynamic.length));
    }
  }

  requestAnimationFrame(frame);
}

/**
 * Renders all texture-mapped fragment bodies.
 *
 * Per-fragment algorithm:
 *   1. Translate + rotate canvas transform to body's current pose.
 *   2. Clip to the body's convex polygon (local-space vertices).
 *   3. Draw the source image offset so the fragment's original pixel
 *      region appears exactly within the clip boundary.
 *   4. Stroke a hair-thin dark edge to suggest a crack seam.
 *
 * Because we use canvas transforms rather than recomputing world-space
 * vertices each frame, this scales to 500+ fragments without rebuffering.
 */
function drawFragments(ctx) {
  const { sourceCanvas: src, imageBounds: ib, fragments } = State;
  if (!ib || !src) return;

  for (const b of fragments) {
    const lv = b.localVerts;
    if (!lv || lv.length < 3) continue;

    ctx.save();

    /* Move origin to body's current centroid, oriented by body's angle */
    ctx.translate(b.position.x, b.position.y);
    ctx.rotate(b.angle);

    /* Build clip path from local (body-space) vertices */
    ctx.beginPath();
    ctx.moveTo(lv[0].x, lv[0].y);
    for (let i = 1; i < lv.length; i++) ctx.lineTo(lv[i].x, lv[i].y);
    ctx.closePath();
    ctx.clip();

    /*
     * Draw the source canvas so that the pixel that was originally at
     * (b.initX − ib.x, b.initY − ib.y) in image coordinates lands
     * exactly at local-space origin (0, 0) — the body's centroid.
     *
     * Texture rotates rigidly with the fragment because we're already
     * inside the rotated transform; no per-frame recomputation needed.
     */
    ctx.drawImage(src, -(b.initX - ib.x), -(b.initY - ib.y));

    /* Crack seam — thin dark stroke on the polygon perimeter */
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.60)';
    ctx.lineWidth   = 1.2;
    ctx.stroke();

    ctx.restore();
  }
}

/* ═══════════════════════════════════════════════════════════════════
   6. WORLD MANAGEMENT
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Remove all dynamic (non-static) bodies from the world.
 * Walls are kept in place (they are static).
 */
function clearSimulation() {
  if (!State.engine) return;
  /*
   * Composite.clear(world, keepStatic=true) removes all non-static
   * bodies and constraints while leaving our boundary walls intact.
   */
  Composite.clear(State.engine.world, true);
  State.fragments    = [];
  State.sourceCanvas = null;
  State.imageBounds  = null;
}

function resetAll() {
  clearSimulation();
  document.body.classList.remove('sim-active');
  State.currentFile     = null;
  btnReshatter.disabled = true;
  btnReset.disabled     = true;
  fileInput.value       = '';
  setStatus(statStatus,    'Idle');
  setStatus(statFragments, '0');
  setStatus(statBodies,    '0');
}

/* ═══════════════════════════════════════════════════════════════════
   7. BUTTON HANDLERS
   ═══════════════════════════════════════════════════════════════════ */

btnUpload.addEventListener('click', () => fileInput.click());

btnReshatter.addEventListener('click', () => {
  if (!State.currentFile) return;
  /* Re-decode the stored file and re-shatter with a new random seed */
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => shatterImage(img);
    img.src = e.target.result;
  };
  reader.readAsDataURL(State.currentFile);
});

btnReset.addEventListener('click', resetAll);

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) handleImageUpload(file);
  /* Clear value so re-selecting the same file fires 'change' again */
  fileInput.value = '';
});

/* ═══════════════════════════════════════════════════════════════════
   8. DRAG & DROP
   ═══════════════════════════════════════════════════════════════════ */

document.addEventListener('dragover', (e) => {
  e.preventDefault();
  document.body.classList.add('drag-active');
});

document.addEventListener('dragleave', (e) => {
  /* relatedTarget is null when pointer leaves the window entirely */
  if (!e.relatedTarget) document.body.classList.remove('drag-active');
});

document.addEventListener('drop', (e) => {
  e.preventDefault();
  document.body.classList.remove('drag-active');
  const file = e.dataTransfer?.files[0];
  if (file && file.type.startsWith('image/')) handleImageUpload(file);
});

/* ═══════════════════════════════════════════════════════════════════
   9. BOOTSTRAP
   ═══════════════════════════════════════════════════════════════════ */
initEngine();
