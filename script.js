/* ── Wheel of Fortune ────────────────────────────────────────────── */

const SEGMENT_COLORS = [
  '#e94560', '#0f3460', '#27ae60', '#f39c12',
  '#8e44ad', '#2980b9', '#d35400', '#1abc9c',
  '#c0392b', '#2c3e50', '#16a085', '#e67e22',
];

const MIN_SPIN_SECONDS = 2;
const MAX_SPIN_SECONDS = 10;

/* ── State ───────────────────────────────────────────────────────── */

let fields = ['Pizza', 'Sushi', 'Tacos', 'Burger', 'Pasta', 'Salad'];
let spinning = false;
let currentAngle = 0;

/* ── DOM refs ────────────────────────────────────────────────────── */

const canvas = document.getElementById('wheel-canvas');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spin-btn');
const resultEl = document.getElementById('result');
const fieldList = document.getElementById('field-list');
const addBtn = document.getElementById('add-btn');

/* ── Drawing ─────────────────────────────────────────────────────── */

function drawWheel() {
  const size = canvas.width;
  const center = size / 2;
  const radius = center - 4;
  const count = fields.length;

  ctx.clearRect(0, 0, size, size);

  if (count === 0) {
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#888';
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Add items to spin!', center, center);
    return;
  }

  const sliceAngle = (Math.PI * 2) / count;

  for (let i = 0; i < count; i++) {
    const start = currentAngle + i * sliceAngle;
    const end = start + sliceAngle;

    // Draw slice
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw label
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(start + sliceAngle / 2);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.min(16, 200 / count)}px sans-serif`;
    const label = fields[i].length > 18 ? fields[i].slice(0, 16) + '…' : fields[i];
    ctx.fillText(label, radius - 14, 0);
    ctx.restore();
  }

  // Center circle
  ctx.beginPath();
  ctx.arc(center, center, 22, 0, Math.PI * 2);
  ctx.fillStyle = '#1a1a2e';
  ctx.fill();
  ctx.strokeStyle = '#e94560';
  ctx.lineWidth = 3;
  ctx.stroke();
}

/* ── Spinning ────────────────────────────────────────────────────── */

function spin() {
  if (spinning || fields.length < 2) return;

  spinning = true;
  spinBtn.disabled = true;
  resultEl.textContent = '';

  const duration = (MIN_SPIN_SECONDS + Math.random() * (MAX_SPIN_SECONDS - MIN_SPIN_SECONDS)) * 1000;
  // Spin at least 5 full rotations plus a random offset
  const totalRotation = Math.PI * 2 * (5 + Math.random() * 5);
  const startAngle = currentAngle;
  const startTime = performance.now();

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function animate(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);

    currentAngle = startAngle + totalRotation * eased;
    drawWheel();

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      spinning = false;
      spinBtn.disabled = false;
      announceWinner();
    }
  }

  requestAnimationFrame(animate);
}

function announceWinner() {
  const count = fields.length;
  if (count === 0) return;

  const sliceAngle = (Math.PI * 2) / count;
  // The pointer is at the top of the canvas, which is angle -π/2 (i.e. 3π/2).
  // Segment i spans from (currentAngle + i*sliceAngle) to (currentAngle + (i+1)*sliceAngle).
  // We need to find which segment contains the pointer angle.
  const pointerAngle = -Math.PI / 2;
  const normalized = ((pointerAngle - currentAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
  const winnerIndex = Math.floor(normalized / sliceAngle) % count;

  resultEl.innerHTML = `<span class="winner-label">Winner:</span> 🎉 ${escapeHTML(fields[winnerIndex])}`;
}

/* ── Field management ────────────────────────────────────────────── */

function renderFields() {
  fieldList.innerHTML = '';
  fields.forEach((value, i) => {
    const li = document.createElement('li');
    li.className = 'field-item';

    const dot = document.createElement('span');
    dot.className = 'color-dot';
    dot.style.backgroundColor = SEGMENT_COLORS[i % SEGMENT_COLORS.length];

    const input = document.createElement('input');
    input.type = 'text';
    input.value = value;
    input.placeholder = 'Enter label…';
    input.setAttribute('aria-label', `Segment ${i + 1}`);
    input.addEventListener('input', () => {
      fields[i] = input.value;
      drawWheel();
    });

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.title = 'Remove';
    removeBtn.textContent = '×';
    removeBtn.setAttribute('aria-label', `Remove segment ${i + 1}`);
    removeBtn.addEventListener('click', () => {
      fields.splice(i, 1);
      renderFields();
      drawWheel();
      updateSpinButton();
    });

    li.append(dot, input, removeBtn);
    fieldList.appendChild(li);
  });
}

function addField() {
  fields.push('');
  renderFields();
  drawWheel();
  updateSpinButton();
  // Focus the new input
  const inputs = fieldList.querySelectorAll('input');
  if (inputs.length > 0) {
    inputs[inputs.length - 1].focus();
  }
}

function updateSpinButton() {
  spinBtn.disabled = spinning || fields.length < 2;
  spinBtn.title = fields.length < 2 ? 'Add at least 2 items to spin' : '';
}

/* ── Helpers ──────────────────────────────────────────────────────── */

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ── Canvas DPI scaling ──────────────────────────────────────────── */

function setupCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  // Reset the CSS size so layout doesn't change
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
}

/* ── Init ─────────────────────────────────────────────────────────── */

function init() {
  setupCanvas();
  renderFields();
  drawWheel();
  updateSpinButton();

  spinBtn.addEventListener('click', spin);
  addBtn.addEventListener('click', addField);

  window.addEventListener('resize', () => {
    setupCanvas();
    drawWheel();
  });
}

document.addEventListener('DOMContentLoaded', init);
